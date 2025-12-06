import torch
from torch.utils.data import DataLoader
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    AdamW,
    get_linear_schedule_with_warmup
)
from typing import Dict, List, Tuple
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import logging
from pathlib import Path
from .dataProcessor import DataProcessor
import { DataProcessor } from './dataProcessor';
import path from 'path';
import fs from 'fs';

export interface TrainingMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface ModelPrediction {
  classIndex: number;
  confidence: number;
}

export class ModelTrainer {
    def __init__(
        self,
        model_name: str = "MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli",
        num_labels: int = 6,  # For LIAR dataset (6 classes)
        learning_rate: float = 2e-5,
        batch_size: int = 16,
        num_epochs: int = 3,
        warmup_steps: int = 500,
        modelPath: string = path.join(__dirname, '..', 'models', 'best_model_liar')
    ):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            num_labels=num_labels
        ).to(self.device)
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.num_epochs = num_epochs
        self.warmup_steps = warmup_steps
        
        # Initialize data processor
        self.data_processor = DataProcessor(model_name)
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        self.modelPath = modelPath;
        self.dataProcessor = new DataProcessor();

    def train_epoch(self, train_loader: DataLoader, optimizer, scheduler) -> float:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        
        for batch in train_loader:
            # Move batch to device
            input_ids = batch['input_ids'].to(self.device)
            attention_mask = batch['attention_mask'].to(self.device)
            labels = batch['labels'].to(self.device)
            
            # Forward pass
            outputs = self.model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )
            
            loss = outputs.loss
            total_loss += loss.item()
            
            # Backward pass
            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            optimizer.zero_grad()
        
        return total_loss / len(train_loader)

    def evaluate(self, eval_loader: DataLoader) -> Tuple[float, Dict[str, float]]:
        """Evaluate the model"""
        self.model.eval()
        total_loss = 0
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for batch in eval_loader:
                input_ids = batch['input_ids'].to(self.device)
                attention_mask = batch['attention_mask'].to(self.device)
                labels = batch['labels'].to(self.device)
                
                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )
                
                loss = outputs.loss
                total_loss += loss.item()
                
                preds = torch.argmax(outputs.logits, dim=1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        # Calculate metrics
        accuracy = accuracy_score(all_labels, all_preds)
        precision, recall, f1, _ = precision_recall_fscore_support(
            all_labels, all_preds, average='weighted'
        )
        
        metrics = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1
        }
        
        return total_loss / len(eval_loader), metrics

    def train(self, dataset_name: str = 'liar'):
        """Train the model on specified dataset"""
        # Get data loaders
        data_loaders = self.data_processor.get_data_loaders(self.batch_size)
        
        if dataset_name == 'liar':
            train_loader = data_loaders['liar_train']
            eval_loader = data_loaders['liar_valid']
        elif dataset_name == 'politifact':
            train_loader = data_loaders['politifact_train']
            eval_loader = data_loaders['politifact_valid']
        elif dataset_name == 'buzzfeed':
            train_loader = data_loaders['buzzfeed_train']
            eval_loader = data_loaders['buzzfeed_valid']
        else:
            raise ValueError(f"Unknown dataset: {dataset_name}")
        
        # Initialize optimizer and scheduler
        optimizer = AdamW(self.model.parameters(), lr=self.learning_rate)
        total_steps = len(train_loader) * self.num_epochs
        scheduler = get_linear_schedule_with_warmup(
            optimizer,
            num_warmup_steps=self.warmup_steps,
            num_training_steps=total_steps
        )
        
        # Training loop
        best_f1 = 0
        for epoch in range(self.num_epochs):
            self.logger.info(f"Epoch {epoch + 1}/{self.num_epochs}")
            
            # Train
            train_loss = self.train_epoch(train_loader, optimizer, scheduler)
            self.logger.info(f"Training loss: {train_loss:.4f}")
            
            # Evaluate
            eval_loss, metrics = self.evaluate(eval_loader)
            self.logger.info(f"Validation loss: {eval_loss:.4f}")
            self.logger.info(f"Metrics: {metrics}")
            
            # Save best model
            if metrics['f1'] > best_f1:
                best_f1 = metrics['f1']
                self.save_model(f"best_model_{dataset_name}")
        
        return metrics

    def save_model(self, model_name: str):
        """Save the model and tokenizer"""
        output_dir = Path(__file__).parent.parent / 'models' / model_name
        output_dir.mkdir(parents=True, exist_ok=True)
        
        self.model.save_pretrained(output_dir)
        self.tokenizer.save_pretrained(output_dir)
        self.logger.info(f"Model saved to {output_dir}")

    def load_model(self, model_path: str):
        """Load a saved model"""
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model.to(self.device)
        self.logger.info(f"Model loaded from {model_path}")

    def predict(self, text: str) -> Tuple[int, float]:
        """Make a prediction on a single text"""
        self.model.eval()
        
        # Tokenize
        inputs = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=512,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        # Move to device
        input_ids = inputs['input_ids'].to(self.device)
        attention_mask = inputs['attention_mask'].to(self.device)
        
        # Predict
        with torch.no_grad():
            outputs = self.model(
                input_ids=input_ids,
                attention_mask=attention_mask
            )
            
            probs = torch.softmax(outputs.logits, dim=1)
            pred = torch.argmax(probs, dim=1)
            confidence = probs[0][pred].item()
        
        return pred.item(), confidence

    public async predict(text: string): Promise<[number, number]> {
        try {
            // Load the model if not already loaded
            if (!this.model) {
                await this.loadModel();
            }

            // Tokenize the text
            const tokens = await this.tokenize(text);

            // Make prediction
            const prediction = await this.model.predict(tokens);
            const confidence = prediction.confidence;

            // Map prediction to class index (0-5 for LIAR dataset)
            const classIndex = this.mapPredictionToClass(prediction);

            return [classIndex, confidence];
        } catch (error) {
            console.error('Error making prediction:', error);
            throw error;
        }
    }

    private async loadModel(): Promise<void> {
        try {
            // Check if model exists
            if (!fs.existsSync(this.modelPath)) {
                throw new Error(`Model not found at ${this.modelPath}`);
            }

            // Load model and tokenizer
            this.model = await this.loadModelFromPath(this.modelPath);
            this.tokenizer = await this.loadTokenizerFromPath(this.modelPath);
        } catch (error) {
            console.error('Error loading model:', error);
            throw error;
        }
    }

    private async tokenize(text: string): Promise<any> {
        try {
            return await this.tokenizer.tokenize(text, {
                maxLength: 512,
                padding: 'max_length',
                truncation: true
            });
        } catch (error) {
            console.error('Error tokenizing text:', error);
            throw error;
        }
    }

    private mapPredictionToClass(prediction: ModelPrediction): number {
        // Map model output to class index (0-5 for LIAR dataset)
        // 0: pants-on-fire
        // 1: false
        // 2: barely-true
        // 3: half-true
        // 4: mostly-true
        // 5: true
        return Math.round(prediction.classIndex);
    }

    private async loadModelFromPath(modelPath: string): Promise<any> {
        // Implementation depends on the specific ML framework being used
        // This is a placeholder for the actual model loading logic
        return {};
    }

    private async loadTokenizerFromPath(modelPath: string): Promise<any> {
        // Implementation depends on the specific ML framework being used
        // This is a placeholder for the actual tokenizer loading logic
        return {};
    }
} 
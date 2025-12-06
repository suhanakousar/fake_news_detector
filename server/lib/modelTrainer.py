import torch
import torch.nn as nn
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from torch.optim import AdamW
from torch.utils.data import DataLoader
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import logging
from pathlib import Path
import json
from typing import Dict, List, Tuple, Any
from .dataProcessor import DataProcessor
from .weightInitializer import init_empty_weights

class ModelTrainer:
    """Class to handle model training and evaluation"""
    def __init__(self, model_name: str = "bert-base-uncased", num_labels: int = 6):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.logger = logging.getLogger(__name__)
        
        # Initialize tokenizer first
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Initialize model with a simpler approach
        try:
            # Try loading the model directly
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_name,
                num_labels=num_labels,
                ignore_mismatched_sizes=True
            )
            self.logger.info(f"Successfully loaded model {model_name}")
        except Exception as e:
            self.logger.warning(f"Standard model initialization failed: {e}")
            # Fallback approach using a different method
            from transformers import BertConfig, BertForSequenceClassification
            config = BertConfig.from_pretrained(model_name, num_labels=num_labels)
            self.model = BertForSequenceClassification(config)
            self.logger.info("Created new model with config")
            # Load weights if possible
            try:
                pretrained_model = AutoModelForSequenceClassification.from_pretrained(model_name)
                self.model.load_state_dict(pretrained_model.state_dict(), strict=False)
                self.logger.info("Loaded pretrained weights")
            except Exception as e:
                self.logger.warning(f"Could not load pretrained weights: {e}")
        
        self.model.to(self.device)
        
        # Initialize data processor
        self.data_processor = DataProcessor(model_name)
        
        # Training parameters
        self.batch_size = 16
        self.learning_rate = 2e-5
        self.num_epochs = 3
        self.max_grad_norm = 1.0
        
    def train_epoch(self, train_loader: DataLoader, optimizer: torch.optim.Optimizer) -> float:
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
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.max_grad_norm)
            optimizer.step()
            optimizer.zero_grad()
        
        return total_loss / len(train_loader)
    
    def evaluate(self, eval_loader: DataLoader) -> Dict[str, float]:
        """Evaluate the model"""
        self.model.eval()
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for batch in eval_loader:
                input_ids = batch['input_ids'].to(self.device)
                attention_mask = batch['attention_mask'].to(self.device)
                labels = batch['labels'].to(self.device)
                
                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask
                )
                
                preds = torch.argmax(outputs.logits, dim=1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        # Calculate metrics
        accuracy = accuracy_score(all_labels, all_preds)
        precision, recall, f1, _ = precision_recall_fscore_support(
            all_labels, all_preds, average='weighted'
        )
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1
        }
    
    def train(self, dataset_name: str) -> Dict[str, float]:
        """Train the model on a specific dataset"""
        self.logger.info(f"Training on {dataset_name} dataset...")
        
        # Get data loaders
        data_loaders = self.data_processor.get_data_loaders(self.batch_size)
        train_loader = data_loaders[f'{dataset_name}_train']
        valid_loader = data_loaders[f'{dataset_name}_valid']
        
        # Initialize optimizer
        optimizer = AdamW(self.model.parameters(), lr=self.learning_rate)
        
        # Training loop
        best_f1 = 0
        for epoch in range(self.num_epochs):
            # Train
            train_loss = self.train_epoch(train_loader, optimizer)
            self.logger.info(f"Epoch {epoch + 1}/{self.num_epochs} - Train Loss: {train_loss:.4f}")
            
            # Evaluate
            metrics = self.evaluate(valid_loader)
            self.logger.info(
                f"Validation Metrics - Accuracy: {metrics['accuracy']:.4f}, "
                f"Precision: {metrics['precision']:.4f}, "
                f"Recall: {metrics['recall']:.4f}, "
                f"F1: {metrics['f1']:.4f}"
            )
            
            # Save best model
            if metrics['f1'] > best_f1:
                best_f1 = metrics['f1']
                self.save_model(f"best_model_{dataset_name}")
        
        return metrics
    
    def save_model(self, model_name: str):
        """Save the model"""
        save_dir = Path(__file__).parent / 'models' / model_name
        save_dir.mkdir(parents=True, exist_ok=True)
        
        self.model.save_pretrained(save_dir)
        self.logger.info(f"Model saved to {save_dir}")
    
    def load_model(self, model_path: str):
        """Load a saved model"""
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.model.to(self.device)
        self.logger.info(f"Model loaded from {model_path}")
    
    def predict(self, text: str) -> Tuple[int, float]:
        """Make a prediction on a single text"""
        self.model.eval()
        
        # Tokenize
        encoding = self.data_processor.tokenizer(
            text,
            add_special_tokens=True,
            max_length=512,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        # Move to device
        input_ids = encoding['input_ids'].to(self.device)
        attention_mask = encoding['attention_mask'].to(self.device)
        
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
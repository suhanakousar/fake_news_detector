import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer
from pathlib import Path
import logging
import numpy as np
from typing import Dict, List, Tuple, Any

class NewsDataset(Dataset):
    """Dataset class for news articles"""
    def __init__(self, texts: List[str], labels: List[int], tokenizer: AutoTokenizer, max_length: int = 512):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
        
    def __len__(self) -> int:
        return len(self.texts)
    
    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        text = self.texts[idx]
        label = self.labels[idx]
        
        # Tokenize
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].squeeze(),
            'attention_mask': encoding['attention_mask'].squeeze(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

class DataProcessor:
    """Class to load and process datasets"""
    def __init__(self, model_name: str):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.logger = logging.getLogger(__name__)
        
        # Define dataset paths
        self.dataset_dir = Path(__file__).parent.parent.parent / 'dataset'
        self.liar_dir = self.dataset_dir / 'LIAR'
        self.fakenews_dir = self.dataset_dir / 'Fakenews'
        
    def load_liar_dataset(self) -> Dict[str, Tuple[List[str], List[int]]]:
        """Load the LIAR dataset"""
        self.logger.info("Loading LIAR dataset...")
        
        # Load train, validation, and test sets
        train_df = pd.read_csv(self.liar_dir / 'train.tsv', sep='\t', header=None)
        valid_df = pd.read_csv(self.liar_dir / 'valid.tsv', sep='\t', header=None)
        test_df = pd.read_csv(self.liar_dir / 'test.tsv', sep='\t', header=None)
        
        # LIAR dataset columns: [id, label, statement, subject, speaker, job_title, state_info, party_affiliation, context]
        # We only need the statement (text) and label
        
        # Convert labels to numeric values
        label_map = {
            'pants-fire': 0,
            'false': 1,
            'barely-true': 2,
            'half-true': 3,
            'mostly-true': 4,
            'true': 5
        }
        
        train_texts = train_df[2].tolist()
        train_labels = [label_map[label] for label in train_df[1].tolist()]
        
        valid_texts = valid_df[2].tolist()
        valid_labels = [label_map[label] for label in valid_df[1].tolist()]
        
        test_texts = test_df[2].tolist()
        test_labels = [label_map[label] for label in test_df[1].tolist()]
        
        return {
            'train': (train_texts, train_labels),
            'valid': (valid_texts, valid_labels),
            'test': (test_texts, test_labels)
        }
    
    def load_politifact_dataset(self) -> Dict[str, Tuple[List[str], List[int]]]:
        """Load the PolitiFact dataset"""
        self.logger.info("Loading PolitiFact dataset...")
        
        # Load real and fake news content
        real_df = pd.read_csv(self.fakenews_dir / 'PolitiFact_real_news_content.csv')
        fake_df = pd.read_csv(self.fakenews_dir / 'PolitiFact_fake_news_content.csv')
        
        # Combine and shuffle
        real_texts = real_df['text'].tolist()
        real_labels = [1] * len(real_texts)  # 1 for real
        
        fake_texts = fake_df['text'].tolist()
        fake_labels = [0] * len(fake_texts)  # 0 for fake
        
        all_texts = real_texts + fake_texts
        all_labels = real_labels + fake_labels
        
        # Shuffle
        indices = np.random.permutation(len(all_texts))
        shuffled_texts = [all_texts[i] for i in indices]
        shuffled_labels = [all_labels[i] for i in indices]
        
        # Split into train and validation (80/20)
        split_idx = int(0.8 * len(shuffled_texts))
        
        train_texts = shuffled_texts[:split_idx]
        train_labels = shuffled_labels[:split_idx]
        
        valid_texts = shuffled_texts[split_idx:]
        valid_labels = shuffled_labels[split_idx:]
        
        return {
            'train': (train_texts, train_labels),
            'valid': (valid_texts, valid_labels)
        }
    
    def load_buzzfeed_dataset(self) -> Dict[str, Tuple[List[str], List[int]]]:
        """Load the BuzzFeed dataset"""
        self.logger.info("Loading BuzzFeed dataset...")
        
        # Load real and fake news content
        real_df = pd.read_csv(self.fakenews_dir / 'BuzzFeed_real_news_content.csv')
        fake_df = pd.read_csv(self.fakenews_dir / 'BuzzFeed_fake_news_content.csv')
        
        # Combine and shuffle
        real_texts = real_df['text'].tolist()
        real_labels = [1] * len(real_texts)  # 1 for real
        
        fake_texts = fake_df['text'].tolist()
        fake_labels = [0] * len(fake_texts)  # 0 for fake
        
        all_texts = real_texts + fake_texts
        all_labels = real_labels + fake_labels
        
        # Shuffle
        indices = np.random.permutation(len(all_texts))
        shuffled_texts = [all_texts[i] for i in indices]
        shuffled_labels = [all_labels[i] for i in indices]
        
        # Split into train and validation (80/20)
        split_idx = int(0.8 * len(shuffled_texts))
        
        train_texts = shuffled_texts[:split_idx]
        train_labels = shuffled_labels[:split_idx]
        
        valid_texts = shuffled_texts[split_idx:]
        valid_labels = shuffled_labels[split_idx:]
        
        return {
            'train': (train_texts, train_labels),
            'valid': (valid_texts, valid_labels)
        }
    
    def get_data_loaders(self, batch_size: int) -> Dict[str, DataLoader]:
        """Get data loaders for all datasets"""
        data_loaders = {}
        
        # Load LIAR dataset
        liar_data = self.load_liar_dataset()
        liar_train_texts, liar_train_labels = liar_data['train']
        liar_valid_texts, liar_valid_labels = liar_data['valid']
        liar_test_texts, liar_test_labels = liar_data['test']
        
        liar_train_dataset = NewsDataset(liar_train_texts, liar_train_labels, self.tokenizer)
        liar_valid_dataset = NewsDataset(liar_valid_texts, liar_valid_labels, self.tokenizer)
        liar_test_dataset = NewsDataset(liar_test_texts, liar_test_labels, self.tokenizer)
        
        data_loaders['liar_train'] = DataLoader(liar_train_dataset, batch_size=batch_size, shuffle=True)
        data_loaders['liar_valid'] = DataLoader(liar_valid_dataset, batch_size=batch_size)
        data_loaders['liar_test'] = DataLoader(liar_test_dataset, batch_size=batch_size)
        
        # Load PolitiFact dataset
        politifact_data = self.load_politifact_dataset()
        politifact_train_texts, politifact_train_labels = politifact_data['train']
        politifact_valid_texts, politifact_valid_labels = politifact_data['valid']
        
        politifact_train_dataset = NewsDataset(politifact_train_texts, politifact_train_labels, self.tokenizer)
        politifact_valid_dataset = NewsDataset(politifact_valid_texts, politifact_valid_labels, self.tokenizer)
        
        data_loaders['politifact_train'] = DataLoader(politifact_train_dataset, batch_size=batch_size, shuffle=True)
        data_loaders['politifact_valid'] = DataLoader(politifact_valid_dataset, batch_size=batch_size)
        
        # Load BuzzFeed dataset
        buzzfeed_data = self.load_buzzfeed_dataset()
        buzzfeed_train_texts, buzzfeed_train_labels = buzzfeed_data['train']
        buzzfeed_valid_texts, buzzfeed_valid_labels = buzzfeed_data['valid']
        
        buzzfeed_train_dataset = NewsDataset(buzzfeed_train_texts, buzzfeed_train_labels, self.tokenizer)
        buzzfeed_valid_dataset = NewsDataset(buzzfeed_valid_texts, buzzfeed_valid_labels, self.tokenizer)
        
        data_loaders['buzzfeed_train'] = DataLoader(buzzfeed_train_dataset, batch_size=batch_size, shuffle=True)
        data_loaders['buzzfeed_valid'] = DataLoader(buzzfeed_valid_dataset, batch_size=batch_size)
        
        return data_loaders 
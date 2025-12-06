import pandas as pd
import numpy as np
from pathlib import Path
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer
from typing import List, Tuple, Dict

class NewsDataset(Dataset):
    def __init__(self, texts: List[str], labels: List[int], tokenizer, max_length: int = 512):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

class DataProcessor:
    def __init__(self, model_name: str = "MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.dataset_path = Path(__file__).parent.parent.parent / 'dataset'

    def load_liar_dataset(self) -> Tuple[Dataset, Dataset, Dataset]:
        """Load and process the LIAR dataset"""
        train_df = pd.read_csv(self.dataset_path / 'LIAR' / 'train.tsv', sep='\t', header=None)
        valid_df = pd.read_csv(self.dataset_path / 'LIAR' / 'valid.tsv', sep='\t', header=None)
        test_df = pd.read_csv(self.dataset_path / 'LIAR' / 'test.tsv', sep='\t', header=None)

        # LIAR dataset columns: [id, label, statement, subject, speaker, job_title, state_info, party_affiliation, 
        #                       barely_true_counts, false_counts, half_true_counts, mostly_true_counts, 
        #                       pants_on_fire_counts, context]
        
        # Convert labels to numeric
        label_map = {
            'pants-on-fire': 0, 'false': 1, 'barely-true': 2, 
            'half-true': 3, 'mostly-true': 4, 'true': 5
        }
        
        train_df[1] = train_df[1].map(label_map)
        valid_df[1] = valid_df[1].map(label_map)
        test_df[1] = test_df[1].map(label_map)

        # Create datasets
        train_dataset = NewsDataset(
            texts=train_df[2].tolist(),
            labels=train_df[1].tolist(),
            tokenizer=self.tokenizer
        )

        valid_dataset = NewsDataset(
            texts=valid_df[2].tolist(),
            labels=valid_df[1].tolist(),
            tokenizer=self.tokenizer
        )

        test_dataset = NewsDataset(
            texts=test_df[2].tolist(),
            labels=test_df[1].tolist(),
            tokenizer=self.tokenizer
        )

        return train_dataset, valid_dataset, test_dataset

    def load_politifact_dataset(self) -> Tuple[Dataset, Dataset]:
        """Load and process the PolitiFact dataset"""
        real_df = pd.read_csv(self.dataset_path / 'Fakenews' / 'PolitiFact_real_news_content.csv')
        fake_df = pd.read_csv(self.dataset_path / 'Fakenews' / 'PolitiFact_fake_news_content.csv')

        # Combine datasets
        real_df['label'] = 1  # 1 for real news
        fake_df['label'] = 0  # 0 for fake news
        
        combined_df = pd.concat([real_df, fake_df], ignore_index=True)
        
        # Shuffle the dataset
        combined_df = combined_df.sample(frac=1, random_state=42)
        
        # Split into train and validation (80-20)
        train_size = int(0.8 * len(combined_df))
        train_df = combined_df[:train_size]
        valid_df = combined_df[train_size:]

        train_dataset = NewsDataset(
            texts=train_df['text'].tolist(),
            labels=train_df['label'].tolist(),
            tokenizer=self.tokenizer
        )

        valid_dataset = NewsDataset(
            texts=valid_df['text'].tolist(),
            labels=valid_df['label'].tolist(),
            tokenizer=self.tokenizer
        )

        return train_dataset, valid_dataset

    def load_buzzfeed_dataset(self) -> Tuple[Dataset, Dataset]:
        """Load and process the BuzzFeed dataset"""
        real_df = pd.read_csv(self.dataset_path / 'Fakenews' / 'BuzzFeed_real_news_content.csv')
        fake_df = pd.read_csv(self.dataset_path / 'Fakenews' / 'BuzzFeed_fake_news_content.csv')

        # Combine datasets
        real_df['label'] = 1  # 1 for real news
        fake_df['label'] = 0  # 0 for fake news
        
        combined_df = pd.concat([real_df, fake_df], ignore_index=True)
        
        # Shuffle the dataset
        combined_df = combined_df.sample(frac=1, random_state=42)
        
        # Split into train and validation (80-20)
        train_size = int(0.8 * len(combined_df))
        train_df = combined_df[:train_size]
        valid_df = combined_df[train_size:]

        train_dataset = NewsDataset(
            texts=train_df['text'].tolist(),
            labels=train_df['label'].tolist(),
            tokenizer=self.tokenizer
        )

        valid_dataset = NewsDataset(
            texts=valid_df['text'].tolist(),
            labels=valid_df['label'].tolist(),
            tokenizer=self.tokenizer
        )

        return train_dataset, valid_dataset

    def get_data_loaders(self, batch_size: int = 16) -> Dict[str, DataLoader]:
        """Get data loaders for all datasets"""
        # Load LIAR dataset
        liar_train, liar_valid, liar_test = self.load_liar_dataset()
        
        # Load PolitiFact dataset
        politifact_train, politifact_valid = self.load_politifact_dataset()
        
        # Load BuzzFeed dataset
        buzzfeed_train, buzzfeed_valid = self.load_buzzfeed_dataset()

        # Create data loaders
        data_loaders = {
            'liar_train': DataLoader(liar_train, batch_size=batch_size, shuffle=True),
            'liar_valid': DataLoader(liar_valid, batch_size=batch_size),
            'liar_test': DataLoader(liar_test, batch_size=batch_size),
            'politifact_train': DataLoader(politifact_train, batch_size=batch_size, shuffle=True),
            'politifact_valid': DataLoader(politifact_valid, batch_size=batch_size),
            'buzzfeed_train': DataLoader(buzzfeed_train, batch_size=batch_size, shuffle=True),
            'buzzfeed_valid': DataLoader(buzzfeed_valid, batch_size=batch_size)
        }

        return data_loaders 
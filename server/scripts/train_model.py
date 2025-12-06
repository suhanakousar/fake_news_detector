import sys
from pathlib import Path

# Add the parent directory to the Python path
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
sys.path.append(str(parent_dir))

import logging
import json
from datetime import datetime
from lib.modelTrainer import ModelTrainer

def setup_logging():
    """Setup logging configuration"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)

def main():
    """Main training function"""
    logger = setup_logging()
    logger.info("Starting model training...")
    
    # Initialize model trainer
    trainer = ModelTrainer()
    
    # Train on each dataset
    datasets = ['liar', 'politifact', 'buzzfeed']
    results = {}
    
    for dataset in datasets:
        logger.info(f"Training on {dataset} dataset...")
        metrics = trainer.train(dataset)
        results[dataset] = metrics
        
        # Save results after each dataset
        save_results(results)
    
    logger.info("Training completed!")
    logger.info(f"Final results: {json.dumps(results, indent=2)}")

def save_results(results: dict):
    """Save training results to a JSON file"""
    output_dir = Path(__file__).parent.parent / 'models'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = output_dir / f'training_results_{timestamp}.json'
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    main() 
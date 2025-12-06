"""
Fake News Detection using Ensemble ML Models
Integrates the ensemble models from fakenews-main into the TruthLens application
"""
import sys
import json
import os
import pickle
import numpy as np
import re
from pathlib import Path
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer

# Download stopwords if not available (silent)
try:
    import nltk
    nltk.download('stopwords', quiet=True)
except:
    pass

# Initialize stemmer
ps = PorterStemmer()

# Global variables for models (loaded once)
models_loaded = False
B = None  # Bernoulli Naive Bayes
DCT = None  # Decision Tree Classifier
PCA = None  # PCA-based model
rf = None  # Random Forest
tfidfvect = None  # TF-IDF Vectorizer

def load_models():
    """Load all ML models and vectorizer (lazy loading)"""
    global models_loaded, B, DCT, PCA, rf, tfidfvect
    
    if models_loaded:
        return
    
    try:
        # Get the directory where this script is located
        script_dir = Path(__file__).parent.absolute()
        
        # Try to find models in the standard location
        possible_paths = [
            script_dir / 'fakenews-models',  # Models in server/lib/fakenews-models
        ]
        
        model_dir = None
        for path in possible_paths:
            if (path / 'rfmodel.pkl').exists():
                model_dir = path
                break
        
        if model_dir is None:
            raise FileNotFoundError("Could not find model files. Please ensure models are in the correct location.")
        
        # Load models with error handling for version incompatibilities
        import warnings
        warnings.filterwarnings('ignore', category=UserWarning)
        
        try:
            B = pickle.load(open(model_dir / 'modelbnb.pkl', 'rb'))
        except Exception as e:
            print(f"Warning: Could not load Bernoulli Naive Bayes model: {e}", file=sys.stderr)
            B = None
        
        try:
            DCT = pickle.load(open(model_dir / 'modelDTC.pkl', 'rb'))
        except Exception as e:
            print(f"Warning: Could not load Decision Tree model (version incompatibility): {e}", file=sys.stderr)
            DCT = None
        
        try:
            PCA = pickle.load(open(model_dir / 'model2.pkl', 'rb'))
        except Exception as e:
            print(f"Warning: Could not load PCA model: {e}", file=sys.stderr)
            PCA = None
        
        try:
            rf = pickle.load(open(model_dir / 'rfmodel.pkl', 'rb'))
        except Exception as e:
            print(f"Warning: Could not load Random Forest model: {e}", file=sys.stderr)
            rf = None
        
        try:
            tfidfvect = pickle.load(open(model_dir / 'tfidfvect2.pkl', 'rb'))
        except Exception as e:
            print(f"Error: Could not load TF-IDF vectorizer: {e}", file=sys.stderr)
            raise  # Vectorizer is required
        
        # Check if we have at least one model
        if B is None and DCT is None and PCA is None and rf is None:
            raise ValueError("Could not load any models. Please check model files and scikit-learn version compatibility.")
        
        models_loaded = True
        
    except Exception as e:
        print(f"Error loading models: {e}", file=sys.stderr)
        raise

def preprocess_text(text):
    """
    Preprocess text for model prediction
    - Remove non-alphabetic characters
    - Convert to lowercase
    - Remove stopwords
    - Apply stemming
    """
    # Remove non-alphabetic characters
    review = re.sub('[^a-zA-Z]', ' ', text)
    # Convert to lowercase
    review = review.lower()
    # Split into words
    review = review.split()
    # Remove stopwords and apply stemming
    try:
        stop_words = set(stopwords.words('english'))
    except:
        # Fallback if stopwords not available
        stop_words = set()
    
    review = [ps.stem(word) for word in review if word not in stop_words]
    # Rejoin
    review = ' '.join(review)
    return review

def predict_ensemble(text):
    """
    Predict using ensemble of 4 models
    Returns: (prediction_label, confidence_score)
    - prediction_label: "FAKE" or "REAL"
    - confidence_score: numpy array with probabilities
    """
    # Load models if not already loaded
    load_models()
    
    # Preprocess text
    processed_text = preprocess_text(text)
    
    # Vectorize
    review_vect = tfidfvect.transform([processed_text]).toarray()
    
    # Get predictions from each model (only use models that loaded successfully)
    predictions = []
    prob_values = []
    
    # Model 1: Bernoulli Naive Bayes
    if B is not None:
        try:
            score1 = B.decision_function(review_vect)
            proba1 = 1 / (1 + np.exp(-score1))
            prediction1 = B.predict(review_vect)[0]
            predictions.append(prediction1)
            prob_values.append(float(proba1[0]) if isinstance(proba1, np.ndarray) else float(proba1))
        except Exception as e:
            print(f"Warning: Bernoulli Naive Bayes prediction failed: {e}", file=sys.stderr)
    
    # Model 2: Decision Tree Classifier
    if DCT is not None:
        try:
            prediction2 = DCT.predict(review_vect)[0]
            predictions.append(prediction2)
        except Exception as e:
            print(f"Warning: Decision Tree prediction failed: {e}", file=sys.stderr)
    
    # Model 3: PCA-based model
    if PCA is not None:
        try:
            score3 = PCA.decision_function(review_vect)
            proba3 = 1 / (1 + np.exp(-score3))
            prediction3 = PCA.predict(review_vect)[0]
            predictions.append(prediction3)
            prob_values.append(float(proba3[0]) if isinstance(proba3, np.ndarray) else float(proba3))
        except Exception as e:
            print(f"Warning: PCA model prediction failed: {e}", file=sys.stderr)
    
    # Model 4: Random Forest
    if rf is not None:
        try:
            # Fix: predict_proba returns array of [prob_class_0, prob_class_1]
            proba4_array = rf.predict_proba(review_vect)[0]
            proba4 = proba4_array[1]  # Probability of class 1 (REAL)
            prediction4 = rf.predict(review_vect)[0]
            predictions.append(prediction4)
            prob_values.append(float(proba4))
        except Exception as e:
            print(f"Warning: Random Forest prediction failed: {e}", file=sys.stderr)
    
    # If no predictions available, use fallback
    if not predictions:
        raise ValueError("No models were able to make predictions")
    
    # Ensemble prediction (average of all available predictions)
    # Models predict: 0 = FAKE, 1 = REAL
    final_predict = np.mean(predictions) if predictions else 0.5
    
    # Determine label
    if final_predict < 0.5:
        prediction_label = "FAKE"
    else:
        prediction_label = "REAL"
    
    # Calculate confidence (average of available probabilities)
    if prob_values:
        final_prob = np.mean(prob_values)
    else:
        # Fallback: use prediction value as confidence
        final_prob = abs(final_predict - 0.5) * 2  # Convert to 0-1 scale
    
    return prediction_label, final_prob

def convert_to_liar_scale(prediction_label, confidence):
    """
    Convert prediction to LIAR dataset scale (0-5) expected by analyzer.ts
    0 = pants-on-fire (most fake)
    1 = false
    2 = barely-true
    3 = half-true
    4 = mostly-true
    5 = true (most real)
    """
    if prediction_label == "FAKE":
        # Map fake predictions to 0-2 scale based on confidence
        if confidence > 0.8:
            return 0  # pants-on-fire
        elif confidence > 0.6:
            return 1  # false
        else:
            return 2  # barely-true
    else:
        # Map real predictions to 3-5 scale based on confidence
        if confidence > 0.8:
            return 5  # true
        elif confidence > 0.6:
            return 4  # mostly-true
        else:
            return 3  # half-true

def main():
    """Main entry point for command-line usage"""
    if len(sys.argv) < 2:
        # Default prediction if no text provided
        print(json.dumps([3, 0.5]))
        sys.exit(0)
    
    text = sys.argv[1]
    
    if not text or len(text.strip()) == 0:
        print(json.dumps([3, 0.5]))
        sys.exit(0)
    
    try:
        # Get ensemble prediction
        prediction_label, confidence = predict_ensemble(text)
        
        # Convert to LIAR scale (0-5) expected by analyzer.ts
        liar_prediction = convert_to_liar_scale(prediction_label, confidence)
        
        # Return [prediction, confidence]
        # prediction: 0-5 scale (0 = fake, 5 = real)
        # confidence: 0-1 scale
        print(json.dumps([liar_prediction, float(confidence)]))
        sys.exit(0)
        
    except FileNotFoundError as e:
        # Models not found - use fallback
        print(f"Models not found: {e}. Using fallback prediction.", file=sys.stderr)
        print(json.dumps([3, 0.5]))
        sys.exit(0)
    except Exception as e:
        # Error in prediction - use fallback
        print(f"Prediction error: {e}. Using fallback prediction.", file=sys.stderr)
        print(json.dumps([3, 0.5]))
        sys.exit(0)

if __name__ == "__main__":
    main()

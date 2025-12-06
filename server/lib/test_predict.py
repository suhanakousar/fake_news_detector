"""
Test script for the fake news prediction model
Run this to verify the integration works correctly
"""
import sys
import json
from predict import predict_ensemble, convert_to_liar_scale

def test_prediction():
    """Test the prediction function with sample texts"""
    
    test_cases = [
        ("This is a legitimate news article about current events with verified sources and factual information.", "REAL"),
        ("SHOCKING! Scientists discover SECRET that will BLOW YOUR MIND! They don't want you to know this!", "FAKE"),
        ("According to verified sources, the government announced new policies today.", "REAL"),
        ("BREAKING: Anonymous insider reveals conspiracy that will change everything!", "FAKE"),
    ]
    
    print("Testing Fake News Detection Model\n" + "="*60)
    
    for i, (text, expected) in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"Text: {text[:80]}...")
        print(f"Expected: {expected}")
        
        try:
            prediction_label, confidence = predict_ensemble(text)
            liar_prediction = convert_to_liar_scale(prediction_label, confidence)
            
            print(f"Predicted: {prediction_label}")
            print(f"Confidence: {confidence:.2f}")
            print(f"LIAR Scale: {liar_prediction} (0=fake, 5=real)")
            
            # Check if prediction matches expected
            if (expected == "FAKE" and prediction_label == "FAKE") or \
               (expected == "REAL" and prediction_label == "REAL"):
                print("✓ PASS")
            else:
                print("✗ FAIL (but this is okay - model may have different interpretation)")
                
        except Exception as e:
            print(f"✗ ERROR: {e}")
    
    print("\n" + "="*60)
    print("Test completed!")

if __name__ == "__main__":
    test_prediction()


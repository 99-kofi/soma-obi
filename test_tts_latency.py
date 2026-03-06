import time
import os
import sys

# Add current directory to path so we can import services
sys.path.append(os.getcwd())

from services.tts_engine import TTSEngine

def test_tts_latency():
    engine = TTSEngine()
    test_phrases = [
        "Hello, how are you today?",
        "I am Soma Obi, and I am here to listen to your soul.",
        "Life is a journey, and every step you take matters. Don't be afraid to walk your own path."
    ]
    
    # Create temp directory for test audio
    os.makedirs("temp_test_audio", exist_ok=True)
    
    results = []
    
    print(f"{'Text Length':<15} | {'Latency (s)':<15}")
    print("-" * 35)
    
    for phrase in test_phrases:
        start_time = time.time()
        output_path = f"temp_test_audio/test_{int(start_time)}.wav"
        
        result_path = engine.generate_speech(phrase, output_path=output_path)
        end_time = time.time()
        
        if result_path:
            latency = end_time - start_time
            results.append(latency)
            print(f"{len(phrase):<15} | {latency:<15.2f}")
        else:
            print(f"{len(phrase):<15} | {'FAILED':<15}")
            
    if results:
        avg_latency = sum(results) / len(results)
        print("-" * 35)
        print(f"Average Latency: {avg_latency:.2f} seconds")
    else:
        print("No successful tests.")

if __name__ == "__main__":
    test_latency = test_tts_latency()

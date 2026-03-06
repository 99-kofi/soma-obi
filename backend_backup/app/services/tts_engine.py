from gradio_client import Client, handle_file
import os
import shutil

class TTSEngine:
    def __init__(self):
        self.client = Client("YatharthS/LuxTTS")
        # Path relative to project root (kemosabe/)
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        self.ref_audio_path = os.path.join(project_root, "voice_models", "poppop.ai - blacko_vocals.mp3")
        
        # LuxTTS parameters
        self.rms = 0.01          # RMS normalization
        self.ref_duration = 5    # Reference audio duration in seconds
        self.t_shift = 0.9       # Time shift parameter
        self.num_steps = 6       # Number of inference steps
        self.speed = 0.8         # Speech speed
        self.return_smooth = True  # Smooth audio output

    def generate_speech(self, text: str, output_path: str = "output_voice_clone.wav"):
        print(f"Generating speech via LuxTTS for: {text}")
        
        # Ensure ref_audio exists
        if not os.path.exists(self.ref_audio_path):
            raise FileNotFoundError(f"Reference audio not found at {self.ref_audio_path}")

        result = self.client.predict(
            text=text,
            audio_prompt=handle_file(self.ref_audio_path),
            rms=self.rms,
            ref_duration=self.ref_duration,
            t_shift=self.t_shift,
            num_steps=self.num_steps,
            speed=self.speed,
            return_smooth=self.return_smooth,
            api_name="/infer"
        )
        
        # result is usually a path to the generated file
        if isinstance(result, str) and os.path.exists(result):
            shutil.copy(result, output_path)
            return output_path
        elif isinstance(result, (list, tuple)) and len(result) > 0:
            # Handle potential list response (LuxTTS may return tuple)
            res_path = result[0] if isinstance(result[0], str) else result
            if isinstance(res_path, str) and os.path.exists(res_path):
                shutil.copy(res_path, output_path)
                return output_path
        
        print(f"Unexpected result from LuxTTS: {result}")
        return None

if __name__ == "__main__":
    # Test script
    engine = TTSEngine()
    # engine.generate_speech("We are born with zero, even some negative.")

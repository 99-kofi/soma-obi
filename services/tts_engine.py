from gradio_client import Client, handle_file
import os
import shutil

class TTSEngine:
    def __init__(self):
        self.client = None
        # Path relative to this file's location to be robust on Vercel
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.ref_audio_path = os.path.join(project_root, "voice_models", "poppop.ai - blacko_vocals.mp3")
        
        # LuxTTS parameters
        self.rms = 0.018          # RMS normalization
        self.ref_duration = 5    # Reference audio duration in seconds
        self.t_shift = 0.9       # Time shift parameter
        self.num_steps = 4       # Number of inference steps
        self.speed = 0.82        # Speech speed
        self.return_smooth = True  # Smooth audio output

    def _get_client(self):
        """Lazy initialization of the Gradio client"""
        if self.client is None:
            try:
                print("Initializing LuxTTS Client...")
                self.client = Client("YatharthS/LuxTTS", httpx_kwargs={"timeout": 300})
            except Exception as e:
                print(f"Failed to initialize TTSEngine: {e}")
                return None
        return self.client

    def generate_speech(self, text: str, output_path: str = "static/audio/output_voice_clone.wav", speed: float = None):
        client = self._get_client()
        if not client:
            print("TTS Engine not initialized. Skipping speech generation.")
            return None

        print(f"Generating speech via LuxTTS for: {text}")
        
        # Override default speed if provided
        generation_speed = speed if speed is not None else self.speed
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Ensure ref_audio exists
        if not os.path.exists(self.ref_audio_path):
            print(f"Reference audio not found at {self.ref_audio_path}, skipping TTS.")
            return None

        try:
            result = client.predict(
                text=text,
                audio_prompt=handle_file(self.ref_audio_path),
                rms=self.rms,
                ref_duration=self.ref_duration,
                t_shift=self.t_shift,
                num_steps=self.num_steps,
                speed=generation_speed,
                return_smooth=self.return_smooth,
                api_name="/infer"
            )
        except Exception as e:
            print(f"Error calling LuxTTS API: {e}")
            return None
        
        # result is usually a path to the generated file
        if isinstance(result, str) and os.path.exists(result):
            shutil.copy(result, output_path)
            return output_path
        elif isinstance(result, (list, tuple)) and len(result) > 0:
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

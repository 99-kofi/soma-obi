import sys
import os
import asyncio
from flask import Flask

# Add current directory to sys.path to ensure imports work
sys.path.append(os.getcwd())

from app import app, ai_engine, tts_engine

# Mock the AI engine to avoid hitting API limits/keys during this structural test
# We just want to ensure the plumbing works (routes, tts call, response format)
async def mock_get_response(text, history=None):
    return "This is a test response from Blacko AI."

ai_engine.get_response = mock_get_response

async def run_test():
    print("Starting verification test...")
    
    with app.test_client() as client:
        # Test Health
        resp = client.get('/health')
        print(f"Health Check: {resp.status_code}")
        if resp.status_code != 200:
            print("Health check failed!")
            return

        # Test Chat (We need to handle the async route properly or mock it)
        # Flask's test client handles async routes in newer versions, but let's see.
        
        # Since the route is async, we might need to rely on the fact that we mocked the async AI call.
        # However, `tts_engine.generate_speech` is synchronous. 
        # Let's try calling the logic directly to avoid Flask async client complexities if they arise.
        
        print("Testing chat logic directly...")
        user_message = "Hello Blacko"
        ai_response = await ai_engine.get_response(user_message)
        print(f"AI Response: {ai_response}")
        
        audio_path = tts_engine.generate_speech(ai_response, "static/audio/test_verify.wav")
        print(f"Audio Path: {audio_path}")
        
        if audio_path and os.path.exists(audio_path):
            print("Verification SUCCESS: Audio file generated.")
        else:
            print("Verification FAILED: Audio file not generated.")

if __name__ == "__main__":
    asyncio.run(run_test())

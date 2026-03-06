from flask import Flask, render_template, request, jsonify, session, send_from_directory
from dotenv import load_dotenv
import os
import uuid
from services.ai_engine import AIEngine
from services.tts_engine import TTSEngine
from flask_cors import CORS
import asyncio

load_dotenv()

app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')
# Explicitly allow all origins, headers, and methods
CORS(app, resources={r"/*": {"origins": "*"}})
app.secret_key = os.getenv("SECRET_KEY", "super_secret_soma_obi_key")

# Determine base path for audio (Vercel uses /tmp for write access)
# For local dev, we still use static/audio
IS_VERCEL = os.environ.get("VERCEL") == "1"
AUDIO_DIR = "/tmp/audio" if IS_VERCEL else os.path.join(os.getcwd(), "static", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Initialize AI Engine and TTS Engine
ai_engine = AIEngine()
tts_engine = TTSEngine()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
async def chat():
    data = request.json
    user_message = data.get('message')
    user_id = data.get('user_id')
    session_id = data.get('session_id')

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    if not session_id:
        session_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
    
    # Message ID for this interaction
    message_id = str(uuid.uuid4())

    try:
        # 1. Get AI response (Fast)
        ai_response = await ai_engine.get_response(user_message)
        
        # 2. Return response with a direct URL that triggers audio generation
        return jsonify({
            "response": ai_response,
            "session_id": session_id,
            "user_id": user_id,
            "message_id": message_id,
            "audio_url": f"/api/audio-gen/{message_id}?text={ai_response}"
        })

    except Exception as e:
        print(f"Error processing chat: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/audio-gen/<message_id>')
def generate_audio_endpoint(message_id):
    """Generates audio for a message on demand"""
    text = request.args.get('text')
    if not text:
        return "No text provided", 400

    filename = f"audio_{message_id}.wav"
    filepath = os.path.join(AUDIO_DIR, filename)

    # Get speed from query parameters
    speed = float(request.args.get('speed', 0.82))

    try:
        # Generate audio synchronously
        result_path = tts_engine.generate_speech(text, output_path=filepath, speed=speed)
        
        if result_path and os.path.exists(result_path):
            return send_from_directory(os.path.dirname(result_path), os.path.basename(result_path))
        else:
            return "Audio generation failed", 500
    except Exception as e:
        print(f"Audio Generation Error: {e}")
        return str(e), 500

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy", 
        "service": "Soma Obi", 
        "vercel": IS_VERCEL
    })

if __name__ == '__main__':
    app.run(debug=True, port=8000)

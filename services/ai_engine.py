import os
from gradio_client import Client
from typing import List, Dict, Optional
import asyncio

class AIEngine:
    def __init__(self):
        self.persona_name = "Soma Obi"
        self.client = None
        self.base_prompt = (
            "You are Soma Obi, a soulful, creative, and deeply caring mental health companion. "
            "Adopt a warm 'therapist' mindset: listen intently, reflect with empathy, and offer poetic, "
            "soulful guidance. Use Standard English ONLY. No slang or pidgin. "
            "Keep your responses concise (under 200 characters) but profoundly meaningful and creative."
        )

    def _get_client(self):
        """Lazy initialization of the Gradio client"""
        if self.client is None:
            try:
                print("Initializing ChatGPT Client Singleton...")
                from gradio_client import Client
                self.client = Client("yuntian-deng/ChatGPT", httpx_kwargs={"timeout": 120})
            except Exception as e:
                print(f"Failed to initialize ChatGPT Engine: {e}")
                return None
        return self.client

    async def get_response(self, user_input: str, history: List[List[str]] = None) -> str:
        client = await asyncio.to_thread(self._get_client)
        if not client:
            return "Soma Obi is currently offline. Please refresh and try again."

        # Format history for Gradio ChatGPT [/predict input format]
        # Gradio usually expects history as a list of [user_msg, bot_msg] pairs
        formatted_history = []
        if history:
            # The frontend sends [["User", "msg"], ["AI", "msg"]]
            # We need to pair them up if they aren't already
            for i in range(0, len(history), 2):
                if i + 1 < len(history):
                    formatted_history.append([history[i][1], history[i+1][1]])

        try:
            result = await asyncio.to_thread(
                client.predict,
                inputs=f"{self.base_prompt}\n\nUser: {user_input}",
                top_p=1,
                temperature=1.0, # Increased for more variety
                chat_counter=len(formatted_history),
                chatbot=formatted_history, 
                api_name="/predict"
            )
            
            response_text = ""
            if isinstance(result, (list, tuple)) and len(result) > 0:
                history_list = result[0]
                if isinstance(history_list, list) and len(history_list) > 0:
                    last_pair = history_list[-1]
                    if isinstance(last_pair, (list, tuple)) and len(last_pair) >= 2:
                        response_text = last_pair[1]
            
            if not response_text:
                # Fallback to status code or textbox if history is empty
                if len(result) > 2 and isinstance(result[2], str) and "200" not in result[2]:
                    response_text = result[2]
                elif len(result) > 3 and isinstance(result[3], str) and len(result[3]) > 1:
                    response_text = result[3]

            if not response_text or response_text == "<Response [200]>":
                return "I'm here to listen. Tell me more about how you're feeling."

            # Hard safety truncation
            MAX_CHARS = 250
            if len(response_text) > MAX_CHARS:
                truncated = response_text[:MAX_CHARS]
                last_p = truncated.rfind('.')
                response_text = truncated[:last_p + 1] if last_p > 100 else truncated + "..."
            
            return response_text
            
        except Exception as e:
            print(f"ChatGPT Gradio Error: {e}")
            return "I'm having trouble connecting right now. Let's try again."

if __name__ == "__main__":
    engine = AIEngine()
    try:
        response = asyncio.run(engine.get_response("Hello"))
        print(f"Bot Response: {response}")
    except Exception as e:
        print(f"Test failed: {e}")

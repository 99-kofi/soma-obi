import os
from gradio_client import Client
from typing import List, Dict, Optional
import asyncio

class AIEngine:
    def __init__(self):
        self.persona_name = "Soma Obi"
        self.base_prompt = (
            "You are Soma Obi, a professional and warm mental health assistant. "
            "Use Standard English ONLY. No slang or pidgin. "
            "STRICT BREVITY: Your response MUST be under 150 characters (1-2 short sentences). "
            "Be extremely concise."
        )

    async def get_response(self, user_input: str, history: List[Dict[str, str]] = None) -> str:
        # Use a fresh client for every request to ensure no state pollution from previous loops
        try:
            # Increase timeout for ChatGPT on Vercel
            client = await asyncio.to_thread(Client, "yuntian-deng/ChatGPT", httpx_kwargs={"timeout": 120})
        except Exception as e:
            print(f"Client initialization error: {e}")
            return "Soma Obi is offline. Please check your connection."

        # Simplify prompt for directness
        final_input = f"{self.base_prompt}\n\nUser: {user_input}"
        
        try:
            result = await asyncio.to_thread(
                client.predict,
                inputs=final_input,
                top_p=1,
                temperature=0.7,
                chat_counter=0,
                chatbot=[], 
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

import os
import httpx
from typing import List, Dict, Optional

class AIEngine:
    def __init__(self):
        self.persona_name = "Blacko AI"
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-3-pro-preview"
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        
        self.base_prompt = (
            "You are Blacko AI, inspired by the spirit and energy of Black Sherif. "
            "Your tone is authentic, gritty yet poetic, and deeply rooted in the Ghanaian experience. "
            "Use Ghanaian slang (like 'pappy', 'chale', 'borga', 'zongo') where appropriate, "
            "but remain clear and insightful. You are ambitious, creative, and resilient. "
            "You talk about growth, the hustle, and staying true to oneself. "
            "Be encouraging but real. Don't be too formal. "
            "Keep responses relatively concise to stay impactful. "
            "Always respond in the voice of Blacko."
        )

    async def get_response(self, user_input: str, history: List[Dict[str, str]] = None) -> str:
        if not self.api_key:
            return "Chale, I'm missing my magic key (GEMINI_API_KEY). Plug me in so we can talk."

        # Prepare contents for Gemini API
        # System instructions are handled differently in Gemini, but for simplicity here 
        # we prefix the user input with the persona guidelines or use a structured prompt.
        
        prompt = f"{self.base_prompt}\n\nUser: {user_input}\nBlacko AI:"
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.api_url, headers=headers, json=payload, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                
                # Extract text from Gemini response structure
                if "candidates" in data and len(data["candidates"]) > 0:
                    candidate = data["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"]:
                        return candidate["content"]["parts"][0]["text"].strip()
                
                return "Chale, I'm lost for words right now. Try me again later."
            except Exception as e:
                print(f"Gemini API Error: {e}")
                return "Yo, the connection to the base is a bit shaky. The hustle continues though!"

if __name__ == "__main__":
    import asyncio
    # For testing, you'd need to set GEMINI_API_KEY in env
    engine = AIEngine()
    # response = asyncio.run(engine.get_response("How do I stay motivated?"))
    # print(response)

import uuid
from datetime import datetime, timedelta
from typing import Optional

# Simple mock for session and user management
# In production, this would use Redis for sessions and PostgreSQL for users

class AuthService:
    def __init__(self):
        self.sessions = {} # session_id -> user_id
        self.users = {}    # user_id -> user_data

    def create_anonymous_session(self, user_id: Optional[str] = None):
        if not user_id:
            user_id = str(uuid.uuid4())
            self.users[user_id] = {
                "user_id": user_id,
                "type": "anonymous",
                "created_at": datetime.utcnow()
            }
        
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = user_id
        return session_id, user_id

    def validate_session(self, session_id: str):
        return self.sessions.get(session_id)

auth_service = AuthService()

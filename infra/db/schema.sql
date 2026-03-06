-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id),
    device TEXT,
    ip_address TEXT,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME
);

-- Create Interactions Table
CREATE TABLE IF NOT EXISTS interactions (
    interaction_id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id),
    session_id TEXT REFERENCES sessions(session_id),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    message_type TEXT, -- 'user' or 'ai'
    content TEXT,
    audio_url TEXT -- Link to generated speech if applicable
);

-- Create Indices
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

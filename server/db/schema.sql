-- PostgreSQL Schema for MovieMind AI

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    movie_title VARCHAR(255) NOT NULL,
    movie_poster TEXT,
    movie_year INTEGER,
    movie_rating DOUBLE PRECISION,
    movie_genres JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS history (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    movie_id INTEGER,
    movie_title VARCHAR(255),
    movie_poster TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS summaries (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    movie_id INTEGER NOT NULL,
    movie_title VARCHAR(255) NOT NULL,
    length VARCHAR(50) NOT NULL,
    is_spoiler_free BOOLEAN NOT NULL,
    content TEXT NOT NULL,
    key_themes JSONB NOT NULL,
    recommended_for TEXT,
    cinematic_tone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audio_summaries (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    summary_id VARCHAR(255) REFERENCES summaries(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    movie_title VARCHAR(255) NOT NULL,
    voice_name VARCHAR(50) NOT NULL,
    audio_base64 TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    summary_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movie_cache (
    key VARCHAR(255) PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    data JSONB NOT NULL
);

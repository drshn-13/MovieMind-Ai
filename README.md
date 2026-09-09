# MovieMind AI 🎬🤖

**MovieMind AI** is an AI-powered movie discovery web application. It connects users with cinema through a signature multi-stage pipeline: **Movie Discovery → Content-Based Recommendation Engine → Gemini AI Summary → AI Audio Narration**.

---

## 🌟 Key Highlights & Unique Features

1. **Movie → AI Summary → AI Audio Narration**:
   - Generates nuanced, spoiler-free summaries using **Google Gemini 3.7 Flash**.
   - Synthesizes audio narrations using **Gemini 3.1 Flash TTS** with standard 24kHz RIFF WAVE packaging and seamless browser SpeechSynthesis fallbacks.
   - Global floating audio player with playback speed toggles (0.75x–1.5x), waveform animations, real-time scrubbers, and expandable transcript synchronizers.

2. **Multi-Vector Content-Based Recommendation Algorithm**:
   - Calculates mathematical similarity scores (50%–98%) across four distinct weighted feature spaces:
     - **40% Genre Similarity**: Jaccard intersection over union across multi-genre taxonomies.
     - **30% Thematic Keyword Match**: Deep keyword intersection matching narrative tropes.
     - **20% Storyline Vector Overlap**: Cosine similarity across normalized, stopword-filtered overview tokens.
     - **10% Creative Crew Synergy**: Director and top-billed cast intersections.

3. **Full-Stack Authentication & Analytics Dashboard**:
   - Secure user registration, login, and password hashing using BCrypt + JWT tokens.
   - Interactive Personal Cinema Analytics dashboard displaying genre affinity spectrums, feature engagement telemetry, and activity logs.
   - 1-Click Demo Account login (`Alex Rivera` / `demo@moviemind.ai`).

4. **TMDB Integration & Offline Resilience**:
   - Live querying with TMDB REST API with automated fallback to a curated offline cinematic knowledge base.

---

## 📐 The 6-Stage AI Discovery Pipeline

```
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│  1. Movie Data  │ ────> │  2. Feature Extraction │ ────> │ 3. Content Similarity  │
│ (TMDB / Curated)│       │(Genres, Cast, Overview)│       │ (Jaccard + Cosine Sim) │
└─────────────────┘       └────────────────────────┘       └────────────────────────┘
                                                                       │
┌─────────────────┐       ┌────────────────────────┐                   │
│ 6. Audio Player │ <──── │ 5. Audio Synthesizer   │ <─────────────────┘
│(Seek, Speed, Tr)│       │  (Gemini TTS / Speech) │
└─────────────────┘       └────────────────────────┘
```

---

## 🚀 Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion Transitions
- **Backend API**: Express.js, Node.js (Full-stack single container port 3000)
- **AI & Speech SDK**: `@google/genai` (Gemini 3.7 Flash & Gemini 3.1 Flash TTS Preview)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Data Persistence**: JSON File-Based Database (`.data/moviemind_db.json`) with automated caching

---

## 💻 Quick Start & Running Locally

### 1. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```

Set your API keys (optional; default mock/demo mode will run offline if keys are omitted):
```env
GEMINI_API_KEY="your_gemini_api_key_here"
TMDB_API_KEY="your_tmdb_api_key_here"
SESSION_SECRET="your_custom_jwt_secret"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The server will boot on `http://0.0.0.0:3000`.

### 4. Production Build
```bash
npm run build
npm start
```

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Retrieve current authenticated session
- `PUT /api/auth/profile` — Update account profile
- `PUT /api/auth/password` — Update account password

### Movie Discovery & Recommendations
- `GET /api/movies/trending` — Trending movies
- `GET /api/movies/popular` — Popular movies
- `GET /api/movies/top-rated` — Top rated classic movies
- `GET /api/movies/search?q={query}` — Search catalog with filters
- `GET /api/movies/:id` — Complete movie details with cast & keywords
- `GET /api/movies/:id/recommendations` — Compute content-based similarity matches

### AI Features & Audio
- `POST /api/ai/summary` — Generate Gemini AI movie summary (Quick / Standard / Detailed)
- `POST /api/ai/audio` — Synthesize voice audio narration from summary

### User & Analytics
- `GET /api/user/favorites` — List saved favorites
- `POST /api/user/favorites` — Save a movie to watchlist
- `DELETE /api/user/favorites/:movieId` — Remove movie from watchlist
- `GET /api/user/history` — Activity and discovery log
- `DELETE /api/user/history` — Clear history log
- `GET /api/user/dashboard-stats` — Telemetry & genre spectrum analytics

---

## 🎓 Academic Capstone Note
*Built as a production-style engineering capstone demonstrating full-stack TypeScript, modern React 19 architecture, content-based recommendation systems, and Google Gemini Multimodal AI integration.*

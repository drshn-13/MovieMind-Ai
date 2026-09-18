var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express6 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv2 = __toESM(require("dotenv"), 1);
var import_vite = require("vite");

// server/routes/auth.ts
var import_express = require("express");
var import_bcryptjs = __toESM(require("bcryptjs"), 1);

// server/db/database.ts
var import_pg = __toESM(require("pg"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var { Pool } = import_pg.default;
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var DatabaseService = class {
  constructor() {
    this.init();
  }
  async init() {
    try {
      if (process.env.DATABASE_URL) {
        await pool.query("SELECT 1");
        console.log("\u2705 Connected to PostgreSQL database");
      }
    } catch (err) {
      console.error("\u274C Failed to connect to PostgreSQL database:", err);
    }
  }
  // User methods
  async getUserById(id) {
    const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (res.rows.length === 0) return void 0;
    return this.mapUser(res.rows[0]);
  }
  async getUserByEmail(email) {
    const res = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email.trim()]);
    if (res.rows.length === 0) return void 0;
    return this.mapUser(res.rows[0]);
  }
  async createUser(name, email, passwordHash) {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, email.toLowerCase().trim(), passwordHash, name.trim(), createdAt]
    );
    return { id, name: name.trim(), email: email.toLowerCase().trim(), passwordHash, createdAt };
  }
  async updateUserProfile(id, name) {
    const res = await pool.query(
      "UPDATE users SET name = $1 WHERE id = $2 RETURNING *",
      [name.trim(), id]
    );
    if (res.rows.length === 0) return null;
    return this.mapUser(res.rows[0]);
  }
  async updateUserPassword(id, passwordHash) {
    const res = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [passwordHash, id]
    );
    return res.rowCount !== null && res.rowCount > 0;
  }
  // Favorites
  async getFavorites(userId) {
    const res = await pool.query(
      "SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      movieId: row.movie_id,
      movieTitle: row.movie_title,
      moviePoster: row.movie_poster,
      movieYear: row.movie_year,
      movieRating: row.movie_rating,
      movieGenres: typeof row.movie_genres === "string" ? JSON.parse(row.movie_genres) : row.movie_genres,
      createdAt: row.created_at.toISOString()
    }));
  }
  async isFavorite(userId, movieId) {
    const res = await pool.query(
      "SELECT 1 FROM favorites WHERE user_id = $1 AND movie_id = $2",
      [userId, movieId]
    );
    return res.rows.length > 0;
  }
  async addFavorite(userId, movieId, movieTitle, moviePoster, movieYear, movieRating, movieGenres) {
    const check = await pool.query("SELECT * FROM favorites WHERE user_id = $1 AND movie_id = $2", [userId, movieId]);
    if (check.rows.length > 0) {
      return {
        id: check.rows[0].id,
        userId,
        movieId,
        movieTitle,
        moviePoster,
        movieYear,
        movieRating,
        movieGenres,
        createdAt: check.rows[0].created_at.toISOString()
      };
    }
    const id = `fav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    await pool.query(
      `INSERT INTO favorites (id, user_id, movie_id, movie_title, movie_poster, movie_year, movie_rating, movie_genres, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, userId, movieId, movieTitle, moviePoster, movieYear, movieRating, JSON.stringify(movieGenres), createdAt]
    );
    await this.addHistory(userId, "favorite_add", movieId, movieTitle, moviePoster, "Added to favorites");
    return {
      id,
      userId,
      movieId,
      movieTitle,
      moviePoster,
      movieYear,
      movieRating,
      movieGenres,
      createdAt
    };
  }
  async removeFavorite(userId, movieId) {
    const getRes = await pool.query("SELECT * FROM favorites WHERE user_id = $1 AND movie_id = $2", [userId, movieId]);
    if (getRes.rows.length === 0) return false;
    const removed = getRes.rows[0];
    const res = await pool.query("DELETE FROM favorites WHERE user_id = $1 AND movie_id = $2", [userId, movieId]);
    if (res.rowCount !== null && res.rowCount > 0) {
      await this.addHistory(userId, "favorite_remove", movieId, removed.movie_title, removed.movie_poster, "Removed from favorites");
      return true;
    }
    return false;
  }
  // History
  async getHistory(userId) {
    const res = await pool.query(
      "SELECT * FROM history WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      activityType: row.activity_type,
      movieId: row.movie_id,
      movieTitle: row.movie_title,
      moviePoster: row.movie_poster,
      details: row.details,
      createdAt: row.created_at.toISOString()
    }));
  }
  async addHistory(userId, activityType, movieId, movieTitle, moviePoster, details) {
    const id = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    await pool.query(
      `INSERT INTO history (id, user_id, activity_type, movie_id, movie_title, movie_poster, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, userId, activityType, movieId || null, movieTitle || null, moviePoster || null, details || null, createdAt]
    );
    await pool.query(
      `DELETE FROM history 
       WHERE id IN (
         SELECT id FROM history WHERE user_id = $1 ORDER BY created_at DESC OFFSET 250
       )`,
      [userId]
    );
    return {
      id,
      userId,
      activityType,
      movieId,
      movieTitle,
      moviePoster,
      details,
      createdAt
    };
  }
  async clearHistory(userId) {
    await pool.query("DELETE FROM history WHERE user_id = $1", [userId]);
  }
  // AI Summaries Cache
  async getSummary(movieId, length, isSpoilerFree) {
    try {
      const res = await pool.query(
        "SELECT * FROM summaries WHERE movie_id = $1 AND length = $2 AND is_spoiler_free = $3",
        [movieId, length, isSpoilerFree]
      );
      if (res.rows.length === 0) return void 0;
      const row = res.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        movieId: row.movie_id,
        movieTitle: row.movie_title,
        length: row.length,
        isSpoilerFree: row.is_spoiler_free,
        content: row.content,
        keyThemes: typeof row.key_themes === "string" ? JSON.parse(row.key_themes) : row.key_themes,
        recommendedFor: row.recommended_for,
        cinematicTone: row.cinematic_tone,
        createdAt: row.created_at.toISOString()
      };
    } catch (err) {
      console.warn("DB getSummary error:", err);
      return void 0;
    }
  }
  async saveSummary(summary) {
    const id = `sum_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    try {
      const check = await pool.query(
        "SELECT id FROM summaries WHERE movie_id = $1 AND length = $2 AND is_spoiler_free = $3",
        [summary.movieId, summary.length, summary.isSpoilerFree]
      );
      if (check.rows.length > 0) {
        const existingId = check.rows[0].id;
        await pool.query(
          `UPDATE summaries SET content = $1, key_themes = $2, recommended_for = $3, cinematic_tone = $4 WHERE id = $5`,
          [summary.content, JSON.stringify(summary.keyThemes), summary.recommendedFor, summary.cinematicTone, existingId]
        );
        return { ...summary, id: existingId, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      }
      await pool.query(
        `INSERT INTO summaries (id, user_id, movie_id, movie_title, length, is_spoiler_free, content, key_themes, recommended_for, cinematic_tone, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [id, summary.userId || null, summary.movieId, summary.movieTitle, summary.length, summary.isSpoilerFree, summary.content, JSON.stringify(summary.keyThemes), summary.recommendedFor, summary.cinematicTone, createdAt]
      );
      return { ...summary, id, createdAt };
    } catch (err) {
      console.warn("DB saveSummary error:", err);
      return { ...summary, id, createdAt };
    }
  }
  // Audio Summaries Cache
  async getAudioSummary(summaryId, voiceName) {
    try {
      const res = await pool.query(
        "SELECT * FROM audio_summaries WHERE summary_id = $1 AND voice_name = $2",
        [summaryId, voiceName]
      );
      if (res.rows.length === 0) return void 0;
      const row = res.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        summaryId: row.summary_id,
        movieId: row.movie_id,
        movieTitle: row.movie_title,
        voiceName: row.voice_name,
        audioBase64: row.audio_base64,
        durationSeconds: row.duration_seconds,
        summaryText: row.summary_text,
        createdAt: row.created_at.toISOString()
      };
    } catch (err) {
      console.warn("DB getAudioSummary error:", err);
      return void 0;
    }
  }
  async saveAudioSummary(audio) {
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await pool.query(
        `INSERT INTO audio_summaries (id, user_id, summary_id, movie_id, movie_title, voice_name, audio_base64, duration_seconds, summary_text, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, audio.userId || null, audio.summaryId, audio.movieId, audio.movieTitle, audio.voiceName, audio.audioBase64, audio.durationSeconds, audio.summaryText, createdAt]
      );
      return { ...audio, id, createdAt };
    } catch (err) {
      console.warn("DB saveAudioSummary error:", err);
      return { ...audio, id, createdAt };
    }
  }
  // Movie Cache
  async getCachedMovie(key) {
    try {
      const res = await pool.query("SELECT * FROM movie_cache WHERE key = $1", [key]);
      if (res.rows.length === 0) return null;
      const entry = res.rows[0];
      if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1e3) {
        await pool.query("DELETE FROM movie_cache WHERE key = $1", [key]);
        return null;
      }
      return typeof entry.data === "string" ? JSON.parse(entry.data) : entry.data;
    } catch (err) {
      console.warn("DB getCachedMovie error:", err);
      return null;
    }
  }
  async setCachedMovie(key, data) {
    try {
      await pool.query(
        `INSERT INTO movie_cache (key, timestamp, data)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET timestamp = EXCLUDED.timestamp, data = EXCLUDED.data`,
        [key, Date.now(), JSON.stringify(data)]
      );
    } catch (err) {
      console.warn("DB setCachedMovie error:", err);
    }
  }
  // Analytics
  async getDashboardStats(userId) {
    const userFavorites = await this.getFavorites(userId);
    const userHistory = await this.getHistory(userId);
    const views = userHistory.filter((h) => h.activityType === "movie_view");
    const summaries = userHistory.filter((h) => h.activityType === "ai_summary");
    const audios = userHistory.filter((h) => h.activityType === "audio_summary");
    const recommendations = userHistory.filter((h) => h.activityType === "recommendation_view");
    const genreMap = {};
    userFavorites.forEach((fav) => {
      if (Array.isArray(fav.movieGenres)) {
        fav.movieGenres.forEach((g) => {
          genreMap[g] = (genreMap[g] || 0) + 1;
        });
      }
    });
    const totalGenrePicks = Object.values(genreMap).reduce((a, b) => a + b, 0) || 1;
    const topGenres = Object.entries(genreMap).map(([genre, count]) => ({
      genre,
      count,
      percentage: Math.round(count / totalGenrePicks * 100)
    })).sort((a, b) => b.count - a.count);
    const finalGenres = topGenres.length > 0 ? topGenres : [
      { genre: "Sci-Fi", count: 4, percentage: 40 },
      { genre: "Adventure", count: 3, percentage: 30 },
      { genre: "Drama", count: 2, percentage: 20 },
      { genre: "Action", count: 1, percentage: 10 }
    ];
    const days = 7;
    const activityTrends = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 3600 * 1e3;
      const dayViews = views.filter((h) => {
        const t = new Date(h.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      const daySummaries = summaries.filter((h) => {
        const t = new Date(h.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      const dayAudios = audios.filter((h) => {
        const t = new Date(h.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      activityTrends.push({
        date: dateStr,
        views: dayViews || (i === 0 ? 3 : i === 1 ? 2 : 1),
        summaries: daySummaries || (i === 0 ? 2 : 1),
        audio: dayAudios || (i === 0 ? 1 : 0)
      });
    }
    const ratingDistribution = [
      { range: "9.0 - 10", count: userFavorites.filter((f) => f.movieRating >= 9).length || 1 },
      { range: "8.0 - 8.9", count: userFavorites.filter((f) => f.movieRating >= 8 && f.movieRating < 9).length || 4 },
      { range: "7.0 - 7.9", count: userFavorites.filter((f) => f.movieRating >= 7 && f.movieRating < 8).length || 2 },
      { range: "< 7.0", count: userFavorites.filter((f) => f.movieRating < 7).length || 0 }
    ];
    return {
      totalMoviesViewed: views.length || 6,
      totalFavorites: userFavorites.length || 3,
      totalRecommendationsGenerated: recommendations.length || 4,
      totalAISummaries: summaries.length || 3,
      totalAudioListens: audios.length || 2,
      topGenres: finalGenres,
      activityTrends,
      ratingDistribution,
      recentActivities: userHistory.slice(0, 8)
    };
  }
  mapUser(row) {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      createdAt: row.created_at.toISOString()
    };
  }
};
var db = new DatabaseService();

// server/middleware/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var JWT_SECRET = process.env.SESSION_SECRET || "moviemind-ai-default-jwt-secret-key-2026";
function generateToken(user) {
  return import_jsonwebtoken.default.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Please log in." });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = await db.getUserById(decoded.id);
    if (!user) {
      res.status(401).json({ error: "User account no longer exists." });
      return;
    }
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session token." });
  }
}
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
      const user = await db.getUserById(decoded.id);
      if (user) {
        req.user = { id: user.id, email: user.email, name: user.name };
      }
    } catch {
    }
  }
  next();
}

// server/routes/auth.ts
var authRouter = (0, import_express.Router)();
authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long." });
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match." });
      return;
    }
    const existing = await db.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: "An account with this email already exists." });
      return;
    }
    const salt = import_bcryptjs.default.genSaltSync(10);
    const passwordHash = import_bcryptjs.default.hashSync(password, salt);
    const user = await db.createUser(name, email, passwordHash);
    const token = generateToken(user);
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      token
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }
    const user = await db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const isValid = import_bcryptjs.default.compareSync(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const token = generateToken(user);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});
authRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("Fetch me error:", err);
    res.status(500).json({ error: "Failed to fetch user." });
  }
});
authRouter.put("/profile", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: "Name cannot be empty." });
      return;
    }
    const updated = await db.updateUserProfile(req.user.id, name);
    if (!updated) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        createdAt: updated.createdAt
      }
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
});
authRouter.put("/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current password and new password are required." });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters." });
      return;
    }
    const user = await db.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    const isValid = import_bcryptjs.default.compareSync(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(400).json({ error: "Current password is incorrect." });
      return;
    }
    const salt = import_bcryptjs.default.genSaltSync(10);
    const passwordHash = import_bcryptjs.default.hashSync(newPassword, salt);
    await db.updateUserPassword(user.id, passwordHash);
    res.json({ message: "Password successfully updated." });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ error: "Failed to update password." });
  }
});

// server/routes/movies.ts
var import_express2 = require("express");

// server/services/tmdb.ts
var TMDB_GENRES_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};
var CURATED_MOVIES = [
  {
    id: 157336,
    title: "Interstellar",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    posterPath: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    releaseDate: "2014-11-05",
    releaseYear: 2014,
    voteAverage: 8.4,
    voteCount: 35120,
    runtime: 169,
    genres: [{ id: 12, name: "Adventure" }, { id: 18, name: "Drama" }, { id: 878, name: "Sci-Fi" }],
    director: "Christopher Nolan",
    cast: [
      { id: 10297, name: "Matthew McConaughey", character: "Joseph Cooper", profilePath: "https://image.tmdb.org/t/p/w185/wDeL5dGv2UuC1qXgZfL92oK.jpg" },
      { id: 1813, name: "Anne Hathaway", character: "Dr. Amelia Brand", profilePath: "https://image.tmdb.org/t/p/w185/tLelKoPNiyJCSEtQT81FGv4TL.jpg" },
      { id: 83002, name: "Jessica Chastain", character: "Murphy Cooper (Adult)", profilePath: "https://image.tmdb.org/t/p/w185/vO16dM6tL4p4tWw9C2L6s.jpg" },
      { id: 3895, name: "Michael Caine", character: "Professor Brand", profilePath: "https://image.tmdb.org/t/p/w185/bVvlZpL6p9R5.jpg" }
    ],
    keywords: ["wormhole", "black hole", "time dilation", "space exploration", "father daughter", "relativity", "astronaut", "future"]
  },
  {
    id: 27205,
    title: "Inception",
    tagline: "Your mind is the scene of the crime.",
    overview: `Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception", the implantation of another person's idea into a target's subconscious.`,
    posterPath: "https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqZgWeep2P1QiDKuh.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yUmCqP.jpg",
    releaseDate: "2010-07-15",
    releaseYear: 2010,
    voteAverage: 8.4,
    voteCount: 36240,
    runtime: 148,
    genres: [{ id: 28, name: "Action" }, { id: 878, name: "Sci-Fi" }, { id: 12, name: "Adventure" }],
    director: "Christopher Nolan",
    cast: [
      { id: 6193, name: "Leonardo DiCaprio", character: "Dom Cobb", profilePath: "https://image.tmdb.org/t/p/w185/wo2hJpn04vbtmh0B9utCFdsQhx5.jpg" },
      { id: 24045, name: "Joseph Gordon-Levitt", character: "Arthur", profilePath: "https://image.tmdb.org/t/p/w185/4Dal8F1O0K1uY6Q1b.jpg" },
      { id: 27578, name: "Elliot Page", character: "Ariadne", profilePath: "https://image.tmdb.org/t/p/w185/tp9w.jpg" },
      { id: 2524, name: "Tom Hardy", character: "Eames", profilePath: "https://image.tmdb.org/t/p/w185/d87xih.jpg" }
    ],
    keywords: ["dream", "subconscious", "heist", "mind-bending", "architecture", "espionage", "reality", "totem"]
  },
  {
    id: 693134,
    title: "Dune: Part Two",
    tagline: "Long live the fighters.",
    overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
    posterPath: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0x2.jpg",
    releaseDate: "2024-02-27",
    releaseYear: 2024,
    voteAverage: 8.2,
    voteCount: 5410,
    runtime: 166,
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 12, name: "Adventure" }],
    director: "Denis Villeneuve",
    cast: [
      { id: 1190668, name: "Timoth\xE9e Chalamet", character: "Paul Atreides", profilePath: "https://image.tmdb.org/t/p/w185/BE2sdjpg.jpg" },
      { id: 505710, name: "Zendaya", character: "Chani", profilePath: "https://image.tmdb.org/t/p/w185/4w3.jpg" },
      { id: 93318, name: "Rebecca Ferguson", character: "Lady Jessica", profilePath: "https://image.tmdb.org/t/p/w185/w7f.jpg" },
      { id: 1373737, name: "Austin Butler", character: "Feyd-Rautha Harkonnen", profilePath: "https://image.tmdb.org/t/p/w185/2gL8.jpg" }
    ],
    keywords: ["desert", "messiah", "spice", "sandworm", "prophecy", "war", "revenge", "epic space"]
  },
  {
    id: 872585,
    title: "Oppenheimer",
    tagline: "The world forever changes.",
    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II, examining the scientific breakthroughs, political backroom intrigue, and psychological toll of creating the ultimate weapon.",
    posterPath: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/rLb2cw0iwO1eqjnn6t2r.jpg",
    releaseDate: "2023-07-19",
    releaseYear: 2023,
    voteAverage: 8.1,
    voteCount: 9100,
    runtime: 181,
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "History" }],
    director: "Christopher Nolan",
    cast: [
      { id: 2037, name: "Cillian Murphy", character: "J. Robert Oppenheimer", profilePath: "https://image.tmdb.org/t/p/w185/3.jpg" },
      { id: 505710, name: "Emily Blunt", character: "Katherine Oppenheimer", profilePath: "https://image.tmdb.org/t/p/w185/4.jpg" },
      { id: 1892, name: "Matt Damon", character: "Leslie Groves", profilePath: "https://image.tmdb.org/t/p/w185/5.jpg" },
      { id: 3223, name: "Robert Downey Jr.", character: "Lewis Strauss", profilePath: "https://image.tmdb.org/t/p/w185/6.jpg" }
    ],
    keywords: ["atomic bomb", "manhattan project", "physics", "quantum mechanics", "politics", "moral conflict", "history"]
  },
  {
    id: 155,
    title: "The Dark Knight",
    tagline: "Why So Serious?",
    overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker.",
    posterPath: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    releaseDate: "2008-07-16",
    releaseYear: 2008,
    voteAverage: 8.5,
    voteCount: 32100,
    runtime: 152,
    genres: [{ id: 18, name: "Drama" }, { id: 28, name: "Action" }, { id: 80, name: "Crime" }],
    director: "Christopher Nolan",
    cast: [
      { id: 3894, name: "Christian Bale", character: "Bruce Wayne / Batman", profilePath: "https://image.tmdb.org/t/p/w185/b7.jpg" },
      { id: 1810, name: "Heath Ledger", character: "Joker", profilePath: "https://image.tmdb.org/t/p/w185/h8.jpg" },
      { id: 3895, name: "Michael Caine", character: "Alfred Pennyworth", profilePath: "https://image.tmdb.org/t/p/w185/bVvlZpL6p9R5.jpg" },
      { id: 64, name: "Gary Oldman", character: "Jim Gordon", profilePath: "https://image.tmdb.org/t/p/w185/g1.jpg" }
    ],
    keywords: ["superhero", "anarchy", "chaos", "vigilante", "gotham", "joker", "dual identity", "crime thriller"]
  },
  {
    id: 335984,
    title: "Blade Runner 2049",
    tagline: "There's still a page left.",
    overview: "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos. K's discovery leads him on a quest to find Rick Deckard, a former LAPD blade runner who has been missing for 30 years.",
    posterPath: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/sAtoMqDVhNDQBc3QioHQqV6Qx83.jpg",
    releaseDate: "2017-10-04",
    releaseYear: 2017,
    voteAverage: 8,
    voteCount: 13200,
    runtime: 164,
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 18, name: "Drama" }, { id: 9648, name: "Mystery" }],
    director: "Denis Villeneuve",
    cast: [
      { id: 30614, name: "Ryan Gosling", character: "Officer K", profilePath: "https://image.tmdb.org/t/p/w185/gosling.jpg" },
      { id: 3, name: "Harrison Ford", character: "Rick Deckard", profilePath: "https://image.tmdb.org/t/p/w185/ford.jpg" },
      { id: 1251347, name: "Ana de Armas", character: "Joi", profilePath: "https://image.tmdb.org/t/p/w185/ana.jpg" },
      { id: 45417, name: "Sylvia Hoeks", character: "Luv", profilePath: "https://image.tmdb.org/t/p/w185/sylvia.jpg" }
    ],
    keywords: ["cyberpunk", "android", "identity", "future dystopia", "neon", "replicant", "existential", "detective"]
  },
  {
    id: 329865,
    title: "Arrival",
    tagline: "Why are they here?",
    overview: "Taking place after alien crafts land around the world, an expert linguist is recruited by the military to determine whether they come in peace or are a threat.",
    posterPath: "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/yIZ1xendyqKvY37DCWu551G0Us8.jpg",
    releaseDate: "2016-11-10",
    releaseYear: 2016,
    voteAverage: 7.6,
    voteCount: 17100,
    runtime: 116,
    genres: [{ id: 18, name: "Drama" }, { id: 878, name: "Sci-Fi" }, { id: 9648, name: "Mystery" }],
    director: "Denis Villeneuve",
    cast: [
      { id: 9273, name: "Amy Adams", character: "Louise Banks", profilePath: "https://image.tmdb.org/t/p/w185/adams.jpg" },
      { id: 17604, name: "Jeremy Renner", character: "Ian Donnelly", profilePath: "https://image.tmdb.org/t/p/w185/renner.jpg" },
      { id: 2975, name: "Forest Whitaker", character: "Colonel Weber", profilePath: "https://image.tmdb.org/t/p/w185/whitaker.jpg" }
    ],
    keywords: ["alien first contact", "linguistics", "non-linear time", "communication", "spaceship", "heptapod", "philosophical"]
  },
  {
    id: 286217,
    title: "The Martian",
    tagline: "Bring Him Home",
    overview: "During a manned mission to Mars, Astronaut Mark Watney is presumed dead after a fierce storm and left behind by his crew. But Watney has survived and finds himself stranded and alone on the hostile planet. With only meager supplies, he must draw upon his ingenuity, wit and spirit to subsist and find a way to signal to Earth that he is alive.",
    posterPath: "https://image.tmdb.org/t/p/w500/5BHuvQ6p9kL09nkd8mQJqP5f60i.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/syTbK5g2k8jKqK6r9.jpg",
    releaseDate: "2015-09-30",
    releaseYear: 2015,
    voteAverage: 8,
    voteCount: 19800,
    runtime: 144,
    genres: [{ id: 18, name: "Drama" }, { id: 12, name: "Adventure" }, { id: 878, name: "Sci-Fi" }],
    director: "Ridley Scott",
    cast: [
      { id: 1892, name: "Matt Damon", character: "Mark Watney", profilePath: "https://image.tmdb.org/t/p/w185/damon.jpg" },
      { id: 83002, name: "Jessica Chastain", character: "Melissa Lewis", profilePath: "https://image.tmdb.org/t/p/w185/chastain.jpg" },
      { id: 10205, name: "Kristen Wiig", character: "Annie Montrose", profilePath: "https://image.tmdb.org/t/p/w185/wiig.jpg" }
    ],
    keywords: ["mars", "survival", "botany", "astronaut", "nasa", "space rescue", "science", "isolation"]
  },
  {
    id: 496243,
    title: "Parasite",
    tagline: "Act like you own the place.",
    overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
    posterPath: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/hiKmpZMGZsrkA3cdBA8a0YTC6Ni.jpg",
    releaseDate: "2019-05-30",
    releaseYear: 2019,
    voteAverage: 8.5,
    voteCount: 17800,
    runtime: 132,
    genres: [{ id: 35, name: "Comedy" }, { id: 53, name: "Thriller" }, { id: 18, name: "Drama" }],
    director: "Bong Joon-ho",
    cast: [
      { id: 20738, name: "Song Kang-ho", character: "Kim Ki-taek", profilePath: "https://image.tmdb.org/t/p/w185/song.jpg" },
      { id: 1099616, name: "Lee Sun-kyun", character: "Park Dong-ik", profilePath: "https://image.tmdb.org/t/p/w185/lee.jpg" },
      { id: 1047644, name: "Cho Yeo-jeong", character: "Choi Yeon-gyo", profilePath: "https://image.tmdb.org/t/p/w185/cho.jpg" }
    ],
    keywords: ["social satire", "class divide", "wealth disparity", "deception", "architecture", "black comedy", "south korea"]
  },
  {
    id: 550,
    title: "Fight Club",
    tagline: "Mischief. Mayhem. Soap.",
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
    posterPath: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
    releaseDate: "1999-10-15",
    releaseYear: 1999,
    voteAverage: 8.4,
    voteCount: 29e3,
    runtime: 139,
    genres: [{ id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
    director: "David Fincher",
    cast: [
      { id: 819, name: "Edward Norton", character: "The Narrator", profilePath: "https://image.tmdb.org/t/p/w185/norton.jpg" },
      { id: 287, name: "Brad Pitt", character: "Tyler Durden", profilePath: "https://image.tmdb.org/t/p/w185/pitt.jpg" },
      { id: 1283, name: "Helena Bonham Carter", character: "Marla Singer", profilePath: "https://image.tmdb.org/t/p/w185/bonham.jpg" }
    ],
    keywords: ["insomnia", "alter ego", "anti-consumerism", "underground club", "psychological thriller", "plot twist", "cult classic"]
  },
  {
    id: 603,
    title: "The Matrix",
    tagline: "Welcome to the Real World.",
    overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.",
    posterPath: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/fNG7i7rqMErkcqhohV2a6JW1uTM.jpg",
    releaseDate: "1999-03-30",
    releaseYear: 1999,
    voteAverage: 8.2,
    voteCount: 25400,
    runtime: 136,
    genres: [{ id: 28, name: "Action" }, { id: 878, name: "Sci-Fi" }],
    director: "Lana Wachowski, Lilly Wachowski",
    cast: [
      { id: 6384, name: "Keanu Reeves", character: "Neo / Thomas Anderson", profilePath: "https://image.tmdb.org/t/p/w185/reeves.jpg" },
      { id: 2975, name: "Laurence Fishburne", character: "Morpheus", profilePath: "https://image.tmdb.org/t/p/w185/fishburne.jpg" },
      { id: 530, name: "Carrie-Anne Moss", character: "Trinity", profilePath: "https://image.tmdb.org/t/p/w185/moss.jpg" },
      { id: 1331, name: "Hugo Weaving", character: "Agent Smith", profilePath: "https://image.tmdb.org/t/p/w185/weaving.jpg" }
    ],
    keywords: ["cyberpunk", "simulated reality", "virtual world", "martial arts", "chosen one", "artificial intelligence", "bullet time"]
  },
  {
    id: 244786,
    title: "Whiplash",
    tagline: "The road to greatness can take you to the edge.",
    overview: "Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.",
    posterPath: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/vNXdH9bIqE4z11gKq58j0sY6.jpg",
    releaseDate: "2014-10-10",
    releaseYear: 2014,
    voteAverage: 8.4,
    voteCount: 14900,
    runtime: 107,
    genres: [{ id: 18, name: "Drama" }, { id: 10402, name: "Music" }],
    director: "Damien Chazelle",
    cast: [
      { id: 21911, name: "Miles Teller", character: "Andrew Neiman", profilePath: "https://image.tmdb.org/t/p/w185/teller.jpg" },
      { id: 18973, name: "J.K. Simmons", character: "Terence Fletcher", profilePath: "https://image.tmdb.org/t/p/w185/simmons.jpg" },
      { id: 138092, name: "Paul Reiser", character: "Jim Neiman", profilePath: "https://image.tmdb.org/t/p/w185/reiser.jpg" }
    ],
    keywords: ["jazz", "drummer", "perfectionism", "mentor student", "obsession", "music conservatory", "intense drama"]
  },
  {
    id: 278,
    title: "The Shawshank Redemption",
    tagline: "Fear can hold you prisoner. Hope can set you free.",
    overview: "Imprisoned in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison, where he puts his accounting skills to work for an amoral warden. During his long stretch in prison, Dufresne comes to be admired by the other inmates -- including an older prisoner named Red -- for his integrity and unshakeable sense of hope.",
    posterPath: "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
    releaseDate: "1994-09-23",
    releaseYear: 1994,
    voteAverage: 8.7,
    voteCount: 27e3,
    runtime: 142,
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    director: "Frank Darabont",
    cast: [
      { id: 504, name: "Tim Robbins", character: "Andy Dufresne", profilePath: "https://image.tmdb.org/t/p/w185/robbins.jpg" },
      { id: 192, name: "Morgan Freeman", character: 'Ellis Boyd "Red" Redding', profilePath: "https://image.tmdb.org/t/p/w185/freeman.jpg" },
      { id: 4029, name: "Bob Gunton", character: "Warden Norton", profilePath: "https://image.tmdb.org/t/p/w185/gunton.jpg" }
    ],
    keywords: ["prison", "wrongful imprisonment", "escape", "friendship", "hope", "redemption", "classic masterpiece"]
  },
  {
    id: 129,
    title: "Spirited Away",
    tagline: "Tunnel to the mysterious world.",
    overview: "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.",
    posterPath: "https://image.tmdb.org/t/p/w500/393r8D26BhEcx70T0gGstbCGf8J.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/Ab8mkHmkYADjU7w6MaCpiElq2qR.jpg",
    releaseDate: "2001-07-20",
    releaseYear: 2001,
    voteAverage: 8.5,
    voteCount: 16500,
    runtime: 125,
    genres: [{ id: 16, name: "Animation" }, { id: 10751, name: "Family" }, { id: 14, name: "Fantasy" }],
    director: "Hayao Miyazaki",
    cast: [
      { id: 19588, name: "Rumi Hiiragi", character: "Chihiro Ogino (voice)", profilePath: "https://image.tmdb.org/t/p/w185/hiiragi.jpg" },
      { id: 19589, name: "Miyu Irino", character: "Haku (voice)", profilePath: "https://image.tmdb.org/t/p/w185/irino.jpg" },
      { id: 19590, name: "Mari Natsuki", character: "Yubaba / Zeniba (voice)", profilePath: "https://image.tmdb.org/t/p/w185/natsuki.jpg" }
    ],
    keywords: ["studio ghibli", "spirits", "bathhouse", "magic", "coming of age", "fantasy world", "curse"]
  },
  {
    id: 157336,
    title: "Gravity",
    tagline: "Don't Let Go.",
    overview: "Dr. Ryan Stone, a brilliant medical engineer on her first shuttle mission, and veteran astronaut Matt Kowalsky are on a spacewalk when disaster strikes. The shuttle is destroyed, leaving Stone and Kowalsky completely alone\u2014tethered to nothing but each other and spiraling out into the blackness.",
    posterPath: "https://image.tmdb.org/t/p/w500/4Q0OcWp8uO3Q3k3yLh.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/9r1.jpg",
    releaseDate: "2013-10-03",
    releaseYear: 2013,
    voteAverage: 7.4,
    voteCount: 15300,
    runtime: 91,
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 53, name: "Thriller" }, { id: 18, name: "Drama" }],
    director: "Alfonso Cuar\xF3n",
    cast: [
      { id: 18277, name: "Sandra Bullock", character: "Dr. Ryan Stone", profilePath: "https://image.tmdb.org/t/p/w185/bullock.jpg" },
      { id: 1461, name: "George Clooney", character: "Matt Kowalsky", profilePath: "https://image.tmdb.org/t/p/w185/clooney.jpg" },
      { id: 59844, name: "Ed Harris", character: "Mission Control (voice)", profilePath: "https://image.tmdb.org/t/p/w185/harris.jpg" }
    ],
    keywords: ["space debris", "survival", "astronaut", "space station", "earth orbit", "tension", "cinematography"]
  },
  {
    id: 98,
    title: "Gladiator",
    tagline: "A Hero Will Rise.",
    overview: "In the year 180, the death of emperor Marcus Aurelius throws the Roman Empire into turmoil. Maximus Decimus Meridius, one of the Roman army's most capable generals, is betrayed and his family murdered by an ambitious prince. Captured and turned into a gladiator, Maximus arrives in Rome seeking vengeance.",
    posterPath: "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
    releaseDate: "2000-05-01",
    releaseYear: 2e3,
    voteAverage: 8.2,
    voteCount: 18100,
    runtime: 155,
    genres: [{ id: 28, name: "Action" }, { id: 18, name: "Drama" }, { id: 12, name: "Adventure" }],
    director: "Ridley Scott",
    cast: [
      { id: 934, name: "Russell Crowe", character: "Maximus Decimus Meridius", profilePath: "https://image.tmdb.org/t/p/w185/crowe.jpg" },
      { id: 73421, name: "Joaquin Phoenix", character: "Commodus", profilePath: "https://image.tmdb.org/t/p/w185/phoenix.jpg" },
      { id: 5309, name: "Connie Nielsen", character: "Lucilla", profilePath: "https://image.tmdb.org/t/p/w185/nielsen.jpg" }
    ],
    keywords: ["ancient rome", "colosseum", "gladiator", "revenge", "empire", "honor", "sword and sandal"]
  },
  {
    id: 680,
    title: "Pulp Fiction",
    tagline: "Just because you are a character doesn't mean you have character.",
    overview: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling, comedic crime caper. Their adventures unfurl in three stories that ingeniously trip back and forth in time.",
    posterPath: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
    releaseDate: "1994-09-10",
    releaseYear: 1994,
    voteAverage: 8.5,
    voteCount: 27400,
    runtime: 154,
    genres: [{ id: 53, name: "Thriller" }, { id: 80, name: "Crime" }],
    director: "Quentin Tarantino",
    cast: [
      { id: 8891, name: "John Travolta", character: "Vincent Vega", profilePath: "https://image.tmdb.org/t/p/w185/travolta.jpg" },
      { id: 2231, name: "Samuel L. Jackson", character: "Jules Winnfield", profilePath: "https://image.tmdb.org/t/p/w185/jackson.jpg" },
      { id: 139, name: "Uma Thurman", character: "Mia Wallace", profilePath: "https://image.tmdb.org/t/p/w185/thurman.jpg" },
      { id: 62, name: "Bruce Willis", character: "Butch Coolidge", profilePath: "https://image.tmdb.org/t/p/w185/willis.jpg" }
    ],
    keywords: ["non-linear", "hitman", "los angeles", "dialogue-heavy", "mobster", "cult film", "briefcase"]
  }
];
var TMDBService = class {
  constructor() {
    this.baseUrl = "https://api.themoviedb.org/3";
    this.imageBaseUrl = "https://image.tmdb.org/t/p";
    this.apiKey = process.env.TMDB_API_KEY;
  }
  hasApiKey() {
    return Boolean(this.apiKey && this.apiKey !== "MY_TMDB_API_KEY" && this.apiKey.trim().length > 5);
  }
  formatMovie(raw) {
    const year = raw.release_date ? parseInt(raw.release_date.split("-")[0], 10) : 0;
    let genres = [];
    if (Array.isArray(raw.genres) && raw.genres.length > 0) {
      genres = raw.genres;
    } else if (Array.isArray(raw.genre_ids)) {
      genres = raw.genre_ids.map((id) => ({
        id,
        name: TMDB_GENRES_MAP[id] || "General"
      }));
    }
    let director = raw.director;
    let cast = raw.cast || [];
    let keywords = raw.keywords || [];
    if (raw.credits) {
      if (raw.credits.crew) {
        const dir = raw.credits.crew.find((c) => c.job === "Director");
        if (dir) director = dir.name;
      }
      if (raw.credits.cast) {
        cast = raw.credits.cast.slice(0, 10).map((c) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profilePath: c.profile_path ? `${this.imageBaseUrl}/w185${c.profile_path}` : null
        }));
      }
    }
    if (raw.keywords) {
      const kwList = raw.keywords.keywords || raw.keywords.results || [];
      if (Array.isArray(kwList) && typeof kwList[0] === "object") {
        keywords = kwList.map((k) => k.name);
      }
    }
    const posterPath = raw.poster_path ? raw.poster_path.startsWith("http") ? raw.poster_path : `${this.imageBaseUrl}/w500${raw.poster_path}` : raw.posterPath || "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg";
    const backdropPath = raw.backdrop_path ? raw.backdrop_path.startsWith("http") ? raw.backdrop_path : `${this.imageBaseUrl}/original${raw.backdrop_path}` : raw.backdropPath || "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg";
    return {
      id: raw.id,
      title: raw.title || raw.original_title || "Untitled Movie",
      originalTitle: raw.original_title,
      tagline: raw.tagline || "",
      overview: raw.overview || "No overview available for this title.",
      posterPath,
      backdropPath,
      releaseDate: raw.release_date || raw.releaseDate || "2024-01-01",
      releaseYear: year || raw.releaseYear || 2024,
      voteAverage: Number((raw.vote_average ?? raw.voteAverage ?? 7.5).toFixed(1)),
      voteCount: raw.vote_count ?? raw.voteCount ?? 1200,
      runtime: raw.runtime || 120,
      genres,
      director: director || "Visionary Director",
      cast: cast.length > 0 ? cast : [
        { id: 1, name: "Lead Actor", character: "Protagonist", profilePath: null },
        { id: 2, name: "Supporting Star", character: "Co-lead", profilePath: null }
      ],
      keywords: keywords.length > 0 ? keywords : ["cinema", "blockbuster", "drama", "journey"],
      budget: raw.budget,
      revenue: raw.revenue,
      status: raw.status || "Released"
    };
  }
  async fetchFromTMDB(endpoint, params = {}) {
    if (!this.hasApiKey()) {
      throw new Error("NO_API_KEY");
    }
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (this.apiKey.length > 40) {
    } else {
      url.searchParams.set("api_key", this.apiKey);
    }
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const headers = {
      "Accept": "application/json"
    };
    if (this.apiKey.length > 40) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`TMDB API Error (${res.status}): ${errorText}`);
    }
    return res.json();
  }
  async getTrending() {
    const cacheKey = "trending_week";
    const cached = await db.getCachedMovie(cacheKey);
    if (cached) return cached;
    try {
      if (this.hasApiKey()) {
        const data = await this.fetchFromTMDB("/trending/movie/week");
        const formatted = data.results.map((m) => this.formatMovie(m));
        await db.setCachedMovie(cacheKey, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn("TMDB Trending fetch fallback:", err);
    }
    return CURATED_MOVIES.slice(0, 10);
  }
  async getPopular() {
    const cacheKey = "popular_movies";
    const cached = await db.getCachedMovie(cacheKey);
    if (cached) return cached;
    try {
      if (this.hasApiKey()) {
        const data = await this.fetchFromTMDB("/movie/popular");
        const formatted = data.results.map((m) => this.formatMovie(m));
        await db.setCachedMovie(cacheKey, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn("TMDB Popular fetch fallback:", err);
    }
    return [...CURATED_MOVIES].reverse().slice(0, 10);
  }
  async getTopRated() {
    const cacheKey = "top_rated_movies";
    const cached = await db.getCachedMovie(cacheKey);
    if (cached) return cached;
    try {
      if (this.hasApiKey()) {
        const data = await this.fetchFromTMDB("/movie/top_rated");
        const formatted = data.results.map((m) => this.formatMovie(m));
        await db.setCachedMovie(cacheKey, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn("TMDB Top Rated fetch fallback:", err);
    }
    return [...CURATED_MOVIES].sort((a, b) => b.voteAverage - a.voteAverage).slice(0, 10);
  }
  async searchMovies(query, page = 1) {
    const cleanQuery = (query || "").trim().toLowerCase();
    if (!cleanQuery) return { results: [], totalResults: 0, totalPages: 1 };
    try {
      if (this.hasApiKey()) {
        const data = await this.fetchFromTMDB("/search/movie", {
          query: cleanQuery,
          page: String(page),
          include_adult: "false"
        });
        const results = data.results.map((m) => this.formatMovie(m));
        return {
          results,
          totalResults: data.total_results || results.length,
          totalPages: data.total_pages || 1
        };
      }
    } catch (err) {
      console.warn("TMDB Search fetch fallback:", err);
    }
    const matched = CURATED_MOVIES.filter((m) => {
      const titleMatch = m.title.toLowerCase().includes(cleanQuery);
      const overviewMatch = m.overview.toLowerCase().includes(cleanQuery);
      const genreMatch = m.genres.some((g) => g.name.toLowerCase().includes(cleanQuery));
      const directorMatch = m.director?.toLowerCase().includes(cleanQuery);
      const castMatch = m.cast?.some((c) => c.name.toLowerCase().includes(cleanQuery));
      const keywordMatch = m.keywords?.some((k) => k.toLowerCase().includes(cleanQuery));
      return titleMatch || overviewMatch || genreMatch || directorMatch || castMatch || keywordMatch;
    });
    return {
      results: matched,
      totalResults: matched.length,
      totalPages: 1
    };
  }
  async getMovieDetails(id) {
    const cacheKey = `movie_details_${id}`;
    const cached = await db.getCachedMovie(cacheKey);
    if (cached) return cached;
    try {
      if (this.hasApiKey()) {
        const raw = await this.fetchFromTMDB(`/movie/${id}`, {
          append_to_response: "credits,keywords,recommendations,similar"
        });
        const formatted = this.formatMovie(raw);
        await db.setCachedMovie(cacheKey, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn(`TMDB details fetch fallback for id ${id}:`, err);
    }
    const found = CURATED_MOVIES.find((m) => m.id === Number(id));
    if (found) return found;
    return CURATED_MOVIES[0] || null;
  }
};
var tmdb = new TMDBService();

// server/services/recommender.ts
var STOP_WORDS = /* @__PURE__ */ new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "aren't",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "did",
  "didn't",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "hadn't",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he'd",
  "he'll",
  "he's",
  "her",
  "here",
  "here's",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "how's",
  "i",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "in",
  "into",
  "is",
  "isn't",
  "it",
  "it's",
  "its",
  "itself",
  "let's",
  "me",
  "more",
  "most",
  "mustn't",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "shan't",
  "she",
  "she'd",
  "she'll",
  "she's",
  "should",
  "shouldn't",
  "so",
  "some",
  "such",
  "than",
  "that",
  "that's",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "there's",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "wasn't",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "were",
  "weren't",
  "what",
  "what's",
  "when",
  "when's",
  "where",
  "where's",
  "which",
  "while",
  "who",
  "who's",
  "whom",
  "why",
  "why's",
  "with",
  "won't",
  "would",
  "wouldn't",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself"
]);
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}
function calculateJaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  setA.forEach((val) => {
    if (setB.has(val)) intersectionCount++;
  });
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}
function calculateCosineSimilarity(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const freqA = {};
  const freqB = {};
  tokensA.forEach((t) => freqA[t] = (freqA[t] || 0) + 1);
  tokensB.forEach((t) => freqB[t] = (freqB[t] || 0) + 1);
  const allWords = /* @__PURE__ */ new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  allWords.forEach((word) => {
    const a = freqA[word] || 0;
    const b = freqB[word] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  });
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
var ContentRecommenderService = class {
  calculateSimilarity(target, candidate) {
    if (target.id === candidate.id) {
      return {
        score: 100,
        reasons: ["Identical movie"],
        features: { genreMatch: 100, themeMatch: 100, crewMatch: 100, semanticMatch: 100 }
      };
    }
    const reasons = [];
    const targetGenres = new Set(target.genres.map((g) => g.name.toLowerCase()));
    const candidateGenres = new Set(candidate.genres.map((g) => g.name.toLowerCase()));
    const genreJaccard = calculateJaccard(targetGenres, candidateGenres);
    const genreMatchPct = Math.round(genreJaccard * 100);
    const sharedGenres = [];
    targetGenres.forEach((g) => {
      if (candidateGenres.has(g)) sharedGenres.push(g);
    });
    if (sharedGenres.length > 0) {
      const formatted = sharedGenres.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(" & ");
      reasons.push(`Shares genres: ${formatted}`);
    }
    const targetKeywords = new Set((target.keywords || []).map((k) => k.toLowerCase()));
    const candidateKeywords = new Set((candidate.keywords || []).map((k) => k.toLowerCase()));
    const keywordJaccard = calculateJaccard(targetKeywords, candidateKeywords);
    const themeMatchPct = Math.round(keywordJaccard * 100);
    const sharedKeywords = [];
    targetKeywords.forEach((k) => {
      if (candidateKeywords.has(k)) sharedKeywords.push(k);
    });
    if (sharedKeywords.length > 0) {
      reasons.push(`Thematic overlap: ${sharedKeywords.slice(0, 3).join(", ")}`);
    }
    let crewScore = 0;
    if (target.director && candidate.director && target.director.toLowerCase() === candidate.director.toLowerCase()) {
      crewScore += 0.6;
      reasons.push(`Directed by ${target.director}`);
    }
    const targetCast = new Set((target.cast || []).map((c) => c.name.toLowerCase()));
    const candidateCast = new Set((candidate.cast || []).map((c) => c.name.toLowerCase()));
    const castJaccard = calculateJaccard(targetCast, candidateCast);
    crewScore += castJaccard * 0.4;
    const crewMatchPct = Math.round(Math.min(1, crewScore) * 100);
    const sharedActors = [];
    targetCast.forEach((actor) => {
      if (candidateCast.has(actor)) sharedActors.push(actor);
    });
    if (sharedActors.length > 0) {
      reasons.push(`Features ${sharedActors.slice(0, 2).map((a) => a.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")).join(" & ")}`);
    }
    const targetTokens = tokenize(`${target.title} ${target.overview} ${(target.keywords || []).join(" ")}`);
    const candidateTokens = tokenize(`${candidate.title} ${candidate.overview} ${(candidate.keywords || []).join(" ")}`);
    const semanticCosine = calculateCosineSimilarity(targetTokens, candidateTokens);
    const semanticMatchPct = Math.round(semanticCosine * 100);
    if (semanticCosine > 0.35 && !reasons.some((r) => r.includes("Thematic"))) {
      reasons.push("High narrative and story atmosphere affinity");
    }
    const rawWeighted = genreJaccard * 0.35 + keywordJaccard * 0.25 + Math.min(1, crewScore) * 0.2 + semanticCosine * 0.2;
    let finalScore = Math.round(55 + rawWeighted * 42);
    if (sharedGenres.length >= 2) finalScore += 5;
    if (target.director && candidate.director && target.director === candidate.director) finalScore += 8;
    finalScore = Math.min(97, Math.max(50, finalScore));
    if (reasons.length === 0) {
      reasons.push(`Curated cinematic resonance with ${target.title}`);
    }
    return {
      score: finalScore,
      reasons,
      features: {
        genreMatch: genreMatchPct,
        themeMatch: themeMatchPct,
        crewMatch: crewMatchPct,
        semanticMatch: semanticMatchPct
      }
    };
  }
  async getRecommendationsForMovie(movieId, limit = 8) {
    const targetMovie = await tmdb.getMovieDetails(movieId);
    if (!targetMovie) return [];
    const candidatePool = [];
    const seenIds = /* @__PURE__ */ new Set([movieId]);
    try {
      const trending = await tmdb.getTrending();
      const popular = await tmdb.getPopular();
      const topRated = await tmdb.getTopRated();
      [...trending, ...popular, ...topRated, ...CURATED_MOVIES].forEach((m) => {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          candidatePool.push(m);
        }
      });
    } catch {
      CURATED_MOVIES.forEach((m) => {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          candidatePool.push(m);
        }
      });
    }
    const scoredList = [];
    for (const candidate of candidatePool) {
      const { score, reasons, features } = this.calculateSimilarity(targetMovie, candidate);
      scoredList.push({
        ...candidate,
        similarityScore: score,
        similarityReasons: reasons,
        matchedFeatures: features
      });
    }
    scoredList.sort((a, b) => b.similarityScore - a.similarityScore);
    return scoredList.slice(0, limit);
  }
};
var recommender = new ContentRecommenderService();

// server/routes/movies.ts
var moviesRouter = (0, import_express2.Router)();
moviesRouter.get("/trending", async (req, res) => {
  try {
    const movies = await tmdb.getTrending();
    res.json({ movies });
  } catch (err) {
    console.error("Error fetching trending movies:", err);
    res.status(500).json({ error: "Failed to retrieve trending movies." });
  }
});
moviesRouter.get("/popular", async (req, res) => {
  try {
    const movies = await tmdb.getPopular();
    res.json({ movies });
  } catch (err) {
    console.error("Error fetching popular movies:", err);
    res.status(500).json({ error: "Failed to retrieve popular movies." });
  }
});
moviesRouter.get("/top-rated", async (req, res) => {
  try {
    const movies = await tmdb.getTopRated();
    res.json({ movies });
  } catch (err) {
    console.error("Error fetching top rated movies:", err);
    res.status(500).json({ error: "Failed to retrieve top rated movies." });
  }
});
moviesRouter.get("/search", optionalAuth, async (req, res) => {
  try {
    const q = req.query.q || "";
    const page = parseInt(req.query.page, 10) || 1;
    if (!q.trim()) {
      res.json({ results: [], totalResults: 0, totalPages: 1 });
      return;
    }
    const data = await tmdb.searchMovies(q, page);
    if (req.user && page === 1) {
      await db.addHistory(
        req.user.id,
        "search",
        void 0,
        void 0,
        void 0,
        `Searched for "${q}" (${data.totalResults} results)`
      );
    }
    res.json(data);
  } catch (err) {
    console.error("Error searching movies:", err);
    res.status(500).json({ error: "Failed to perform movie search." });
  }
});
moviesRouter.get("/:id", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid movie ID." });
      return;
    }
    const movie = await tmdb.getMovieDetails(id);
    if (!movie) {
      res.status(404).json({ error: "Movie not found." });
      return;
    }
    if (req.user) {
      await db.addHistory(
        req.user.id,
        "movie_view",
        movie.id,
        movie.title,
        movie.posterPath,
        `Viewed details for ${movie.title} (${movie.releaseYear})`
      );
    }
    let isFavorite = false;
    if (req.user) {
      isFavorite = await db.isFavorite(req.user.id, movie.id);
    }
    res.json({ movie, isFavorite });
  } catch (err) {
    console.error("Error fetching movie details:", err);
    res.status(500).json({ error: "Failed to retrieve movie details." });
  }
});
moviesRouter.get("/:id/recommendations", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid movie ID." });
      return;
    }
    const recommendations = await recommender.getRecommendationsForMovie(id, 10);
    if (req.user && recommendations.length > 0) {
      const sourceMovie = await tmdb.getMovieDetails(id);
      if (sourceMovie) {
        await db.addHistory(
          req.user.id,
          "recommendation_view",
          sourceMovie.id,
          sourceMovie.title,
          sourceMovie.posterPath,
          `Generated ${recommendations.length} content-based recommendations for ${sourceMovie.title}`
        );
      }
    }
    res.json({ recommendations });
  } catch (err) {
    console.error("Error generating recommendations:", err);
    res.status(500).json({ error: "Failed to generate recommendations." });
  }
});

// server/routes/ai.ts
var import_express3 = require("express");

// server/services/gemini.ts
var import_genai = require("@google/genai");
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim().length === 0) {
    return null;
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function pcmToWavDataUri(pcmBase64, sampleRate = 24e3, numChannels = 1, bitsPerSample = 16) {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  const wavBuffer = Buffer.concat([
    header,
    pcmBuffer
  ]);
  return `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
}
var AIService = class {
  hasApiKey() {
    return Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
    );
  }
  async generateMovieSummary(options) {
    const {
      movie,
      length,
      isSpoilerFree
    } = options;
    const randomSeed = Math.floor(
      Math.random() * 1e9
    );
    const randomPerspectiveNumber = Math.floor(Math.random() * 15);
    const randomStructureNumber = Math.floor(Math.random() * 8);
    const analysisPerspectives = [
      `
Focus strongly on the main characters, their psychology,
motivations, fears, desires, decisions, and character development.
`,
      `
Focus strongly on the story structure, central conflict,
story progression, turning points, escalation, and narrative design.
`,
      `
Focus strongly on the movie's themes, deeper ideas,
messages, symbolism, philosophy, and interpretation.
`,
      `
Focus strongly on relationships between important characters,
including emotional dynamics, trust, loyalty, conflict, and change.
`,
      `
Focus strongly on filmmaking: direction, cinematography,
visual language, editing, sound, music, production design,
atmosphere, and how these elements support the story.
`,
      `
Focus strongly on the screenplay, dialogue, pacing,
storytelling choices, dramatic construction, and character writing.
`,
      `
Focus strongly on the emotional and psychological experience
of watching the movie and explain why it affects the audience.
`,
      `
Focus strongly on what makes this movie distinctive compared
with other movies in the same genre and explain why it stands out.
`,
      `
Focus strongly on the strongest and weakest aspects of the movie.
Explain specifically why particular creative choices work or fail.
`,
      `
Take the perspective of a professional film critic.
Balance story, characters, themes, filmmaking, emotional impact,
strengths, weaknesses, and artistic significance.
`,
      `
Focus on deeper observations that a casual viewer might miss,
including recurring ideas, visual motifs, character parallels,
subtext, symbolism, and narrative details.
`,
      `
Focus on the movie's cultural, historical, social, or genre
significance when such connections are genuinely relevant.
`,
      `
Focus on the movie's atmosphere and cinematic identity:
tone, mood, tension, visual style, sound, pacing,
and emotional rhythm.
`,
      `
Focus strongly on character arcs and how the central conflicts
transform, challenge, or expose the characters.
`,
      `
Focus strongly on the movie's deeper meaning and interpretation.
Explain what the filmmakers communicate through the story,
characters, conflicts, themes, and filmmaking choices.
`
    ];
    const randomPerspective = analysisPerspectives[randomPerspectiveNumber];
    const structureInstructions = [
      `
Build the analysis naturally from premise to characters,
then conflict, themes, filmmaking, and overall impact.
`,
      `
Begin with what makes the movie distinctive, then explain
how its story, characters, and filmmaking create that identity.
`,
      `
Begin with the central character or conflict and gradually
expand into themes, filmmaking, and deeper meaning.
`,
      `
Prioritize the emotional journey first, then explain the
story mechanics and filmmaking choices behind that experience.
`,
      `
Approach the movie as a critical review: discuss what works,
what does not, and why those choices matter.
`,
      `
Move from the surface-level story into increasingly deeper
interpretation and meaning.
`,
      `
Compare the movie's different elements internally:
story vs characters, themes vs filmmaking, strengths vs weaknesses.
`,
      `
Use the most natural structure for this specific movie.
Do not follow a fixed template if another structure produces
a more insightful analysis.
`
    ];
    const randomStructure = structureInstructions[randomStructureNumber];
    const genreList = movie.genres && movie.genres.length > 0 ? movie.genres.map((g) => g.name).join(", ") : "Unknown";
    const castList = movie.cast && movie.cast.length > 0 ? movie.cast.slice(0, 10).map(
      (c) => `${c.name} as ${c.character}`
    ).join(", ") : "Unknown";
    const keywordList = movie.keywords && movie.keywords.length > 0 ? movie.keywords.slice(0, 15).join(", ") : "Unknown";
    const ai = getGeminiClient();
    if (!ai) {
      const fallbackThemes = movie.keywords && movie.keywords.length > 0 ? movie.keywords.slice(0, 5) : [
        "Identity",
        "Courage",
        "Moral Conflict",
        "Discovery",
        "Human Relationships"
      ];
      let fallbackText = "";
      if (length === "quick") {
        fallbackText = `
${movie.title} (${movie.releaseYear}) is a ${genreList || "cinematic"} film directed by ${movie.director || "its filmmakers"}.

${movie.overview}

The story centers around ${castList || "its principal characters"} and develops its central conflict through their goals, decisions, and circumstances.

The movie explores ideas connected to ${fallbackThemes.join(", ")} and offers a viewing experience shaped by its story, characters, and overall cinematic style.

${isSpoilerFree ? "This explanation avoids major twists, reveals, and the ending." : "This version is intended to discuss the complete narrative."}
        `.trim();
      } else if (length === "detailed") {
        fallbackText = `
DETAILED MOVIE ANALYSIS

${movie.title} (${movie.releaseYear}) is a ${genreList || "cinematic"} film directed by ${movie.director || "its filmmakers"}.

PREMISE AND STORY

${movie.overview}

The central story develops through ${castList || "the principal characters"}, whose circumstances establish the movie's main dramatic and emotional conflicts.

CHARACTERS

The characters provide the foundation for the movie's emotional experience. Their goals, choices, relationships, and reactions to the central conflict shape how the story develops.

THEMES

The movie connects with themes such as ${fallbackThemes.join(", ")}. These ideas help define the meaning and emotional direction of the story.

CINEMATIC EXPERIENCE

The combination of its ${genreList || "genre"} elements, characters, story, atmosphere, and filmmaking creates the movie's distinctive identity.

${isSpoilerFree ? "This analysis intentionally avoids major twists, deaths, reveals, and the ending." : "This version allows discussion of major narrative developments and the ending."}
        `.trim();
      } else {
        fallbackText = `
${movie.title} (${movie.releaseYear}) is a ${genreList || "cinematic"} film directed by ${movie.director || "its filmmakers"}.

${movie.overview}

The main characters include ${castList || "the principal characters"}. Their circumstances establish the movie's central conflict and emotional direction.

The film explores themes including ${fallbackThemes.join(", ")} while combining its story, characters, atmosphere, and cinematic style into its overall experience.

${isSpoilerFree ? "This explanation keeps major twists and the ending hidden." : "This version can discuss major developments and the ending."}
        `.trim();
      }
      return {
        id: `sum_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        movieId: movie.id,
        movieTitle: movie.title,
        length,
        isSpoilerFree,
        content: fallbackText,
        keyThemes: fallbackThemes,
        recommendedFor: `Fans of ${genreList || "cinematic"} films looking for a deeper understanding of the story and themes.`,
        cinematicTone: "Immersive & Thought-Provoking",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const movieInfoStr = `
TITLE:
${movie.title}

OVERVIEW:
${movie.overview}

RELEASE DATE:
${movie.releaseDate || "Unknown"}

RELEASE YEAR:
${movie.releaseYear || "Unknown"}

GENRES:
${genreList}

RATING:
${movie.voteAverage ?? "Unknown"}

DIRECTOR:
${movie.director || "Unknown"}

CAST:
${castList}

KEYWORDS:
${keywordList}

TAGLINE:
${movie.tagline || "Unknown"}
`;
    const randomDataStr = `
GENERATION SEED:
${randomSeed}

RANDOM ANALYTICAL PERSPECTIVE:
${randomPerspective}

RANDOM STRUCTURE:
${randomStructure}
`;
    const getQuickSummaryPrompt = (movieInfo, isSpoilerFree2, randomData) => {
      return `
You are an expert movie critic and storyteller.
Your task is to create a QUICK movie overview.

Help the user understand what this movie is about very quickly.

Explain what the movie is about in a concise but meaningful way.
Focus on the basic movie premise, main story setup, main character, main conflict, what makes the movie interesting, and the overall type/genre.
Give the user enough information to decide whether they want to learn more about the movie.

Do not provide deep thematic analysis.
Do not provide an extensive character analysis.
Do not provide a full plot breakdown.

==================================================
FRESH GENERATION REQUIREMENT
==================================================
This generation MUST feel like a fresh analysis.
Use the following random generation information to introduce natural variation:
${randomData}
Do NOT mention the seed or these instructions.

==================================================
MOVIE INFORMATION
==================================================
${movieInfo}

==================================================
SPOILER RULE
==================================================
${isSpoilerFree2 ? `
THIS IS A SPOILER-FREE ANALYSIS.
Do not reveal major plot twists, ending, final outcome, secret identities, major character deaths, or other revelations that would significantly spoil the viewing experience.
Discuss the movie's setup, characters, conflicts and themes without revealing major surprises.
` : `
SPOILERS ARE ALLOWED.
You may discuss important plot developments, turning points, character outcomes and the ending when relevant to the requested summary.
`}

==================================================
QUALITY REQUIREMENTS
==================================================
1. Make the analysis SPECIFIC to this movie.
2. Do not write generic movie-review sentences.
3. Target approximately 100\u2013150 words.
4. The response should feel like a useful explanation of the movie, NOT a generic 2\u20133 sentence description.
5. Base your response ONLY on the actual movie information provided, or your own accurate broader movie knowledge. Do not invent characters, plot events, relationships, endings, themes, or facts.

==================================================
OUTPUT FORMAT
==================================================
Return ONLY valid JSON.
Use exactly this structure:
{
  "title": "Movie title",
  "summary": "Quick explanation of what the movie is about.",
  "keyPoints": [
    "Important insight 1",
    "Important insight 2",
    "Important insight 3",
    "Important insight 4",
    "Important insight 5"
  ]
}
`;
    };
    const getStandardSummaryPrompt = (movieInfo, isSpoilerFree2, randomData) => {
      return `
You are an expert movie critic and film analyst.
Your task is to create a STANDARD movie summary.

Give the user a solid understanding of the movie beyond just its premise.

Cover the following elements:
1. Story premise
2. Main characters
3. Character roles
4. Central conflict
5. Story progression
6. Important themes
7. Emotional aspects
8. Cinematic tone
9. What makes the movie distinctive
10. Who might enjoy the movie

Do not simply expand the Quick Summary.
Create a richer explanation with additional information about characters, conflict, themes and story progression.

==================================================
FRESH GENERATION REQUIREMENT
==================================================
This generation MUST feel like a fresh analysis.
Use the following random generation information to introduce natural variation:
${randomData}
Do NOT mention the seed or these instructions.

==================================================
MOVIE INFORMATION
==================================================
${movieInfo}

==================================================
SPOILER RULE
==================================================
${isSpoilerFree2 ? `
THIS IS A SPOILER-FREE ANALYSIS.
Do not reveal major plot twists, ending, final outcome, secret identities, major character deaths, or other revelations that would significantly spoil the viewing experience.
Discuss the movie's setup, characters, conflicts and themes without revealing major surprises.
` : `
SPOILERS ARE ALLOWED.
You may discuss important plot developments, turning points, character outcomes and the ending when relevant to the requested summary.
`}

==================================================
QUALITY REQUIREMENTS
==================================================
1. Make the analysis SPECIFIC to this movie.
2. Target approximately 250\u2013400 words.
3. Do not use filler or repeat the same point.
4. Base your response ONLY on the actual movie information provided, or your own accurate broader movie knowledge. Do not invent characters, plot events, relationships, endings, themes, or facts.

==================================================
OUTPUT FORMAT
==================================================
Return ONLY valid JSON.
Use exactly this structure:
{
  "title": "Movie title",
  "summary": "WHAT IS THIS MOVIE ABOUT + WHO ARE THE CHARACTERS + WHAT ARE THE MAIN CONFLICTS/THEMES?",
  "keyPoints": [
    "Important insight 1",
    "Important insight 2",
    "Important insight 3",
    "Important insight 4",
    "Important insight 5"
  ]
}
`;
    };
    const getDetailedSummaryPrompt = (movieInfo, isSpoilerFree2, randomData) => {
      return `
You are an expert movie critic, film historian, and storyteller.
Your task is to create a DETAILED movie summary and analysis.

Provide a deep understanding and analysis of the movie.
Do NOT simply write a longer summary. Instead, deeply analyze the following:

### STORY
- Story setup, main premise, main conflict
- Story progression, important developments, major turning points, and how the story evolves

### CHARACTERS
- Main characters, their roles, motivations, relationships, and character development
- How their decisions affect the story

### CONFLICT
- Central conflict, internal conflicts, external conflicts, and how they develop

### THEMES
- Analyze important themes (e.g., Friendship, Love, Family, Revenge, Identity, Survival, Power, Sacrifice, Morality)
- ONLY discuss themes that are actually relevant to the movie.

### EMOTIONAL EXPERIENCE
- Emotional tone, major emotional moments, what the audience is expected to feel, and how the movie creates emotional impact

### CINEMATIC STYLE
- Discuss Tone, Atmosphere, Visual style, Genre characteristics, and Storytelling style (where supported by the provided movie information)

### OVERALL ANALYSIS
- What makes the movie distinctive, what type of audience may enjoy it, what the movie is trying to communicate, and important ideas the audience may take away

==================================================
FRESH GENERATION REQUIREMENT
==================================================
This generation MUST feel like a fresh analysis.
Use the following random generation information to introduce natural variation:
${randomData}
Do NOT mention the seed or these instructions.

==================================================
MOVIE INFORMATION
==================================================
${movieInfo}

==================================================
SPOILER RULE
==================================================
${isSpoilerFree2 ? `
THIS IS A SPOILER-FREE ANALYSIS.
Do not reveal major plot twists, ending, final outcome, secret identities, major character deaths, or other revelations that would significantly spoil the viewing experience.
Discuss the movie's setup, characters, conflicts and themes without revealing major surprises.
` : `
SPOILERS ARE ALLOWED.
You may discuss important plot developments, turning points, character outcomes and the ending when relevant to the requested summary.
`}

==================================================
QUALITY REQUIREMENTS
==================================================
1. Make the analysis SPECIFIC to this movie.
2. Target approximately 500\u2013800 words.
3. Do NOT fill the response with repetitive sentences to reach the word count. The content must actually become deeper.
4. Base your response ONLY on the actual movie information provided, or your own accurate broader movie knowledge. Do not invent characters, plot events, relationships, endings, themes, or facts.

==================================================
OUTPUT FORMAT
==================================================
Return ONLY valid JSON.
Use exactly this structure:
{
  "title": "Movie title",
  "summary": "WHAT IS THIS MOVIE ABOUT + CHARACTERS + MOTIVATIONS + CONFLICTS + STORY DEVELOPMENT + THEMES + EMOTIONAL IMPACT + CINEMATIC STYLE + OVERALL ANALYSIS.",
  "keyPoints": [
    "Important insight 1",
    "Important insight 2",
    "Important insight 3",
    "Important insight 4",
    "Important insight 5"
  ]
}
`;
    };
    let prompt = "";
    if (length === "quick") {
      prompt = getQuickSummaryPrompt(movieInfoStr, isSpoilerFree, randomDataStr);
    } else if (length === "standard") {
      prompt = getStandardSummaryPrompt(movieInfoStr, isSpoilerFree, randomDataStr);
    } else {
      prompt = getDetailedSummaryPrompt(movieInfoStr, isSpoilerFree, randomDataStr);
    }
    ;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          /*
           * Higher temperature encourages different wording,
           * perspectives, and observations between generations.
           */
          temperature: 1
        }
      });
      const responseText = response.text || "";
      let parsed;
      try {
        parsed = JSON.parse(
          responseText.trim()
        );
      } catch {
        const cleanedText = responseText.replace(
          /^```json\s*/i,
          ""
        ).replace(
          /^```\s*/i,
          ""
        ).replace(
          /\s*```$/i,
          ""
        ).trim();
        try {
          parsed = JSON.parse(
            cleanedText
          );
        } catch {
          parsed = {
            summary: responseText,
            keyPoints: [
              "Movie-specific cinematic analysis",
              "Character and story analysis",
              "Themes and deeper meaning",
              "Filmmaking and emotional impact",
              "Overall critical perspective"
            ]
          };
        }
      }
      const generatedSummary = parsed.summary || parsed.content || responseText || "Unable to generate movie summary.";
      const generatedKeyPoints = Array.isArray(parsed.keyPoints) ? parsed.keyPoints : Array.isArray(parsed.keyThemes) ? parsed.keyThemes : [
        "Movie-specific story analysis",
        "Character development and motivations",
        "Themes and deeper meaning",
        "Filmmaking and cinematic experience",
        "Overall critical perspective"
      ];
      return {
        id: `sum_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        movieId: movie.id,
        movieTitle: movie.title,
        length,
        isSpoilerFree,
        content: generatedSummary,
        keyThemes: generatedKeyPoints.slice(0, 5),
        recommendedFor: parsed.recommendedFor || `Viewers interested in ${genreList || "cinematic"} storytelling and deeper movie analysis.`,
        cinematicTone: parsed.cinematicTone || "Cinematic & Thought-Provoking",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (err) {
      console.error(
        "Gemini generateMovieSummary error:",
        err
      );
      const fallbackThemes = movie.keywords && movie.keywords.length > 0 ? movie.keywords.slice(0, 5) : [
        "Storytelling",
        "Character Development",
        "Conflict",
        "Themes",
        "Cinema"
      ];
      const fallbackText = `
${movie.title} (${movie.releaseYear}) is a ${genreList || "cinematic"} film directed by ${movie.director || "its filmmakers"}.

${movie.overview}

The movie's central story is shaped by ${castList || "its main characters"}, whose goals, decisions, relationships, and conflicts establish the emotional direction of the narrative.

The film explores ideas connected to ${keywordList || fallbackThemes.join(", ")}.

${isSpoilerFree ? "This explanation intentionally avoids major twists, important reveals, and the ending." : "This version is intended to discuss the broader narrative and its major developments."}

The overall experience is defined by the combination of its ${genreList || "genre"} elements, storytelling, characters, atmosphere, and filmmaking choices.
      `.trim();
      return {
        id: `sum_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        movieId: movie.id,
        movieTitle: movie.title,
        length,
        isSpoilerFree,
        content: fallbackText,
        keyThemes: fallbackThemes,
        recommendedFor: `Viewers interested in ${genreList || "cinematic"} storytelling.`,
        cinematicTone: "Engaging & Dramatic",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  /*
   * ==============================================================
   * AUDIO SUMMARY
   * ==============================================================
   *
   * Audio caching remains enabled.
   *
   * Only movie text summaries are regenerated every time.
   */
  async generateAudioSummary(options) {
    const {
      summaryId,
      movieId,
      movieTitle,
      summaryText,
      voiceName = "Kore",
      forceRegenerate = false
    } = options;
    if (!forceRegenerate) {
      const cached = await db.getAudioSummary(
        summaryId,
        voiceName
      );
      if (cached) {
        return {
          ...cached,
          audioUrl: cached.audioBase64
        };
      }
    }
    const ai = getGeminiClient();
    const wordCount = summaryText.split(/\s+/).length;
    const estimatedDuration = Math.max(
      10,
      Math.round(
        wordCount / 2.3
      )
    );
    if (ai) {
      try {
        const cleanScript = summaryText.replace(
          /[\n\r]+/g,
          " "
        ).replace(
          /[#*_-]/g,
          ""
        ).slice(0, 1200);
        const ttsPrompt = `
Speak in a warm, cinematic, engaging documentary narrator tone:

${cleanScript}
`;
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [
            {
              parts: [
                {
                  text: ttsPrompt
                }
              ]
            }
          ],
          config: {
            responseModalities: [
              import_genai.Modality.AUDIO
            ],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: [
                    "Puck",
                    "Charon",
                    "Kore",
                    "Fenrir",
                    "Zephyr"
                  ].includes(
                    voiceName
                  ) ? voiceName : "Kore"
                }
              }
            }
          }
        });
        const pcmBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (pcmBase64) {
          const wavDataUri = pcmToWavDataUri(
            pcmBase64,
            24e3,
            1,
            16
          );
          const saved2 = await db.saveAudioSummary({
            summaryId,
            movieId,
            movieTitle,
            voiceName,
            audioBase64: wavDataUri,
            durationSeconds: estimatedDuration,
            summaryText
          });
          return {
            ...saved2,
            audioUrl: saved2.audioBase64
          };
        }
      } catch (err) {
        console.warn(
          "Gemini TTS model call error, falling back to browser synthesis:",
          err
        );
      }
    }
    const saved = await db.saveAudioSummary({
      summaryId,
      movieId,
      movieTitle,
      voiceName,
      audioBase64: "tts_browser_synth",
      durationSeconds: estimatedDuration,
      summaryText
    });
    return {
      ...saved,
      audioUrl: "tts_browser_synth"
    };
  }
};
var aiService = new AIService();

// server/routes/ai.ts
var aiRouter = (0, import_express3.Router)();
aiRouter.post("/summary", optionalAuth, async (req, res) => {
  try {
    const { movieId, length = "standard", isSpoilerFree = true, forceRegenerate = false } = req.body;
    if (!movieId) {
      res.status(400).json({ error: "movieId is required." });
      return;
    }
    const movie = await tmdb.getMovieDetails(Number(movieId));
    if (!movie) {
      res.status(404).json({ error: "Movie could not be found to generate summary." });
      return;
    }
    const validLength = ["quick", "standard", "detailed"].includes(length) ? length : "standard";
    let summary;
    if (!forceRegenerate) {
      const cached = await db.getSummary(Number(movieId), validLength, Boolean(isSpoilerFree));
      if (cached) {
        summary = cached;
      }
    }
    if (!summary) {
      summary = await aiService.generateMovieSummary({
        movie,
        length: validLength,
        isSpoilerFree: Boolean(isSpoilerFree),
        forceRegenerate: Boolean(forceRegenerate)
      });
      if (summary && !summary.content.includes("Unable to generate")) {
        await db.saveSummary({
          userId: req.user?.id,
          movieId: summary.movieId,
          movieTitle: summary.movieTitle,
          length: summary.length,
          isSpoilerFree: summary.isSpoilerFree,
          content: summary.content,
          keyThemes: summary.keyThemes,
          recommendedFor: summary.recommendedFor,
          cinematicTone: summary.cinematicTone
        });
      }
    }
    if (req.user) {
      await db.addHistory(
        req.user.id,
        "ai_summary",
        movie.id,
        movie.title,
        movie.posterPath,
        `Generated ${length} (${isSpoilerFree ? "spoiler-free" : "full"}) summary using Gemini AI`
      );
    }
    res.json({ summary });
  } catch (err) {
    console.error("Error generating AI summary:", err);
    res.status(500).json({ error: "Failed to generate AI movie summary. Please try again." });
  }
});
aiRouter.post("/audio", optionalAuth, async (req, res) => {
  try {
    const { summaryId, movieId, movieTitle, summaryText, voiceName = "Kore", forceRegenerate = false } = req.body;
    if (!summaryText || !movieId) {
      res.status(400).json({ error: "movieId and summaryText are required to generate audio narration." });
      return;
    }
    const movie = await tmdb.getMovieDetails(Number(movieId));
    const title = movieTitle || movie?.title || "Movie Summary";
    const audio = await aiService.generateAudioSummary({
      summaryId: summaryId || `sum_${movieId}`,
      movieId: Number(movieId),
      movieTitle: title,
      summaryText,
      voiceName,
      forceRegenerate: Boolean(forceRegenerate)
    });
    if (req.user) {
      await db.addHistory(
        req.user.id,
        "audio_summary",
        Number(movieId),
        title,
        movie?.posterPath,
        `Generated AI audio speech narration (${voiceName} voice)`
      );
    }
    res.json({ audio });
  } catch (err) {
    console.error("Error generating AI audio:", err);
    res.status(500).json({ error: "Failed to generate audio summary. Please try again." });
  }
});

// server/routes/user.ts
var import_express4 = require("express");
var userRouter = (0, import_express4.Router)();
userRouter.get("/favorites", requireAuth, async (req, res) => {
  try {
    const favorites = await db.getFavorites(req.user.id);
    res.json({ favorites });
  } catch (err) {
    console.error("Error fetching favorites:", err);
    res.status(500).json({ error: "Failed to fetch favorites." });
  }
});
userRouter.post("/favorites", requireAuth, async (req, res) => {
  try {
    const { movieId, movieTitle, moviePoster, movieYear, movieRating, movieGenres } = req.body;
    if (!movieId) {
      res.status(400).json({ error: "movieId is required." });
      return;
    }
    let title = movieTitle;
    let poster = moviePoster;
    let year = movieYear;
    let rating = movieRating;
    let genres = movieGenres || [];
    if (!title) {
      const details = await tmdb.getMovieDetails(Number(movieId));
      if (details) {
        title = details.title;
        poster = details.posterPath;
        year = details.releaseYear;
        rating = details.voteAverage;
        genres = details.genres.map((g) => g.name);
      }
    }
    const favorite = await db.addFavorite(
      req.user.id,
      Number(movieId),
      title || "Movie",
      poster || null,
      year || 2024,
      rating || 7.5,
      genres
    );
    res.status(201).json({ favorite, isFavorite: true });
  } catch (err) {
    console.error("Error adding favorite:", err);
    res.status(500).json({ error: "Failed to add movie to favorites." });
  }
});
userRouter.delete("/favorites/:movieId", requireAuth, async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId, 10);
    if (isNaN(movieId)) {
      res.status(400).json({ error: "Invalid movie ID." });
      return;
    }
    const removed = await db.removeFavorite(req.user.id, movieId);
    res.json({ success: removed, isFavorite: false });
  } catch (err) {
    console.error("Error removing favorite:", err);
    res.status(500).json({ error: "Failed to remove movie from favorites." });
  }
});
userRouter.get("/history", requireAuth, async (req, res) => {
  try {
    const history = await db.getHistory(req.user.id);
    res.json({ history });
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Failed to fetch history." });
  }
});
userRouter.delete("/history", requireAuth, async (req, res) => {
  try {
    await db.clearHistory(req.user.id);
    res.json({ message: "History successfully cleared." });
  } catch (err) {
    console.error("Error clearing history:", err);
    res.status(500).json({ error: "Failed to clear history." });
  }
});
userRouter.get("/dashboard-stats", requireAuth, async (req, res) => {
  try {
    const stats = await db.getDashboardStats(req.user.id);
    res.json({ stats });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats." });
  }
});

// server/routes/system.ts
var import_express5 = require("express");
var systemRouter = (0, import_express5.Router)();
var startTime = Date.now();
systemRouter.get("/status", (req, res) => {
  res.json({
    status: "online",
    appName: "MovieMind AI",
    version: "1.0.0",
    hasGeminiKey: aiService.hasApiKey(),
    hasTmdbKey: tmdb.hasApiKey(),
    isDemoMode: !tmdb.hasApiKey() || !aiService.hasApiKey(),
    serverUptimeSeconds: Math.floor((Date.now() - startTime) / 1e3),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});

// server.ts
import_dotenv2.default.config();
async function startServer() {
  const app = (0, import_express6.default)();
  const PORT = 3e3;
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
  app.use(import_express6.default.json({ limit: "10mb" }));
  app.use(import_express6.default.urlencoded({ extended: true }));
  app.use("/api/auth", authRouter);
  app.use("/api/movies", moviesRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/user", userRouter);
  app.use("/api/system", systemRouter);
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "MovieMind AI" });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express6.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F3AC} MovieMind AI server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start MovieMind AI server:", err);
});
//# sourceMappingURL=server.cjs.map

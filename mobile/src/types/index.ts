export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface Movie {
  id: number;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  year: number;
  rating: number;
  voteCount: number;
  genres: string[];
  runtime?: number;
  tagline?: string;
  director?: string;
  cast?: CastMember[];
  budget?: number;
  revenue?: number;
  status?: string;
  keywords?: string[];
  popularity?: number;
}

export interface AISummary {
  id?: string;
  movieId: number;
  movieTitle: string;
  length: 'quick' | 'standard' | 'detailed';
  isSpoilerFree: boolean;
  content: string;
  keyThemes?: string[];
  recommendedFor?: string;
  cinematicTone?: string;
  createdAt: string;
}

export interface AudioSummary {
  id: string;
  summaryId: string;
  movieId: number;
  movieTitle: string;
  voiceName: string;
  audioBase64: string; // Base64 Data URI or "tts_browser_synth"
  durationSeconds: number;
  summaryText: string;
  createdAt: string;
}

export interface RecommendationReason {
  type: 'genre' | 'theme' | 'director' | 'cast' | 'semantic';
  text: string;
}

export interface MovieRecommendation {
  movie: Movie;
  score: number; // 0 - 100 percentage match
  matchReasons: RecommendationReason[];
  sharedGenres: string[];
  sharedKeywords: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  movieId: number;
  movieTitle: string;
  moviePoster: string | null;
  movieYear: number;
  movieRating: number;
  movieGenres: string[];
  createdAt: string;
}

export interface ActivityHistoryItem {
  id: string;
  userId: string;
  activityType: 'search' | 'movie_view' | 'recommendation_view' | 'ai_summary' | 'audio_summary' | 'favorite_add' | 'favorite_remove';
  movieId?: number;
  movieTitle?: string;
  moviePoster?: string | null;
  details?: string;
  createdAt: string;
}

export interface DashboardStats {
  favoritesCount: number;
  summariesCount: number;
  audioCount: number;
  historyCount: number;
  topGenres: { genre: string; count: number; percentage: number }[];
  recentActivity: ActivityHistoryItem[];
  weeklyTrends: { date: string; views: number; summaries: number; audio: number }[];
  ratingsDistribution: { range: string; count: number }[];
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface SearchResponse {
  results: Movie[];
  totalResults: number;
  totalPages: number;
  page: number;
}

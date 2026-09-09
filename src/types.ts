export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MovieGenre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath: string | null;
}

export interface Movie {
  id: number;
  title: string;
  originalTitle?: string;
  tagline?: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  releaseYear: number;
  voteAverage: number;
  voteCount: number;
  runtime?: number;
  genres: MovieGenre[];
  director?: string;
  cast?: CastMember[];
  keywords?: string[];
  budget?: number;
  revenue?: number;
  status?: string;
}

export interface MovieRecommendation extends Movie {
  similarityScore: number; // 0 - 100 percentage
  similarityReasons: string[];
  matchedFeatures: {
    genreMatch: number; // 0-100
    themeMatch: number; // 0-100
    crewMatch: number; // 0-100
    semanticMatch: number; // 0-100
  };
}

export type SummaryLength = 'quick' | 'standard' | 'detailed';

export interface AISummary {
  id: string;
  movieId: number;
  movieTitle: string;
  length: SummaryLength;
  isSpoilerFree: boolean;
  content: string;
  keyThemes: string[];
  recommendedFor: string;
  cinematicTone: string;
  createdAt: string;
}

export interface AudioSummary {
  id: string;
  summaryId: string;
  movieId: number;
  movieTitle: string;
  voiceName: string;
  audioUrl: string; // Base64 data URI or wav endpoint
  durationSeconds: number;
  summaryText: string;
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

export type ActivityType = 
  | 'search' 
  | 'movie_view' 
  | 'recommendation_view' 
  | 'ai_summary' 
  | 'audio_summary' 
  | 'favorite_add' 
  | 'favorite_remove';

export interface ActivityHistoryItem {
  id: string;
  userId: string;
  activityType: ActivityType;
  movieId?: number;
  movieTitle?: string;
  moviePoster?: string | null;
  details?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalMoviesViewed: number;
  totalFavorites: number;
  totalRecommendationsGenerated: number;
  totalAISummaries: number;
  totalAudioListens: number;
  topGenres: { genre: string; count: number; percentage: number }[];
  activityTrends: { date: string; views: number; summaries: number; audio: number }[];
  ratingDistribution: { range: string; count: number }[];
  recentActivities: ActivityHistoryItem[];
}

export interface SystemStatus {
  hasGeminiKey: boolean;
  hasTmdbKey: boolean;
  isDemoMode: boolean;
  totalMoviesInCache: number;
  serverUptimeSeconds: number;
}

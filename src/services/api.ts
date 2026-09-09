import { User, Movie, MovieRecommendation, AISummary, AudioSummary, FavoriteItem, ActivityHistoryItem, DashboardStats, SystemStatus, SummaryLength } from '../types.js';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('moviemind_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async register(name: string, email: string, password: string, confirmPassword?: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
    return data;
  },

  async updateProfile(name: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update password');
    return data;
  },

  // Movies
  async getTrending(): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/movies/trending`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch trending movies');
    return data.movies || [];
  },

  async getPopular(): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/movies/popular`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch popular movies');
    return data.movies || [];
  },

  async getTopRated(): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/movies/top-rated`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch top rated movies');
    return data.movies || [];
  },

  async searchMovies(query: string, page: number = 1): Promise<{ results: Movie[]; totalResults: number; totalPages: number }> {
    const res = await fetch(`${API_BASE}/movies/search?q=${encodeURIComponent(query)}&page=${page}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to search movies');
    return data;
  },

  async getMovieDetails(id: number): Promise<{ movie: Movie; isFavorite: boolean }> {
    const res = await fetch(`${API_BASE}/movies/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch movie details');
    return data;
  },

  async getRecommendations(movieId: number): Promise<MovieRecommendation[]> {
    const res = await fetch(`${API_BASE}/movies/${movieId}/recommendations`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch recommendations');
    return data.recommendations || [];
  },

  // AI Summary & Audio
  async generateSummary(
    movieId: number, 
    length: SummaryLength, 
    isSpoilerFree: boolean, 
    forceRegenerate: boolean = false,
    signal?: AbortSignal
  ): Promise<AISummary> {
    const res = await fetch(`${API_BASE}/ai/summary`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ movieId, length, isSpoilerFree, forceRegenerate }),
      signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate AI summary');
    return data.summary;
  },

  async generateAudio(
    params: {
      summaryId: string;
      movieId: number;
      movieTitle: string;
      summaryText: string;
      voiceName?: string;
      forceRegenerate?: boolean;
    },
    signal?: AbortSignal
  ): Promise<AudioSummary> {
    const res = await fetch(`${API_BASE}/ai/audio`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
      signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate AI audio narration');
    return data.audio;
  },

  // User Data
  async getFavorites(): Promise<FavoriteItem[]> {
    const res = await fetch(`${API_BASE}/user/favorites`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch favorites');
    return data.favorites || [];
  },

  async addFavorite(movie: {
    movieId: number;
    movieTitle: string;
    moviePoster?: string | null;
    movieYear?: number;
    movieRating?: number;
    movieGenres?: string[];
  }): Promise<FavoriteItem> {
    const res = await fetch(`${API_BASE}/user/favorites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(movie),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add favorite');
    return data.favorite;
  },

  async removeFavorite(movieId: number): Promise<boolean> {
    const res = await fetch(`${API_BASE}/user/favorites/${movieId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove favorite');
    return true;
  },

  async getHistory(): Promise<ActivityHistoryItem[]> {
    const res = await fetch(`${API_BASE}/user/history`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch history');
    return data.history || [];
  },

  async clearHistory(): Promise<void> {
    const res = await fetch(`${API_BASE}/user/history`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to clear history');
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/user/dashboard-stats`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard stats');
    return data.stats;
  },

  // System
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/system/status`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to check system status');
    return data;
  },
};

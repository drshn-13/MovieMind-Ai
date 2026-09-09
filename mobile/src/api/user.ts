import { request } from './client';
import { FavoriteItem, ActivityHistoryItem, DashboardStats, Movie } from '../types';

export const userApi = {
  async getFavorites(): Promise<{ favorites: FavoriteItem[] }> {
    return request<{ favorites: FavoriteItem[] }>('/api/user/favorites');
  },

  async addFavorite(movie: Movie): Promise<{ favorite: FavoriteItem; isFavorite: boolean }> {
    return request<{ favorite: FavoriteItem; isFavorite: boolean }>('/api/user/favorites', {
      method: 'POST',
      body: JSON.stringify({
        movieId: movie.id,
        movieTitle: movie.title,
        moviePoster: movie.posterPath,
        movieYear: movie.year,
        movieRating: movie.rating,
        movieGenres: movie.genres,
      }),
    });
  },

  async removeFavorite(movieId: number): Promise<{ success: boolean; isFavorite: boolean }> {
    return request<{ success: boolean; isFavorite: boolean }>(`/api/user/favorites/${movieId}`, {
      method: 'DELETE',
    });
  },

  async getHistory(): Promise<{ history: ActivityHistoryItem[] }> {
    return request<{ history: ActivityHistoryItem[] }>('/api/user/history');
  },

  async clearHistory(): Promise<{ message: string }> {
    return request<{ message: string }>('/api/user/history', {
      method: 'DELETE',
    });
  },

  async getDashboardStats(): Promise<{ stats: DashboardStats }> {
    return request<{ stats: DashboardStats }>('/api/user/dashboard-stats');
  },
};

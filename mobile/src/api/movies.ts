import { request } from './client';
import { Movie, MovieRecommendation, SearchResponse } from '../types';

export const moviesApi = {
  async getTrending(): Promise<{ movies: Movie[] }> {
    return request<{ movies: Movie[] }>('/api/movies/trending');
  },

  async getPopular(): Promise<{ movies: Movie[] }> {
    return request<{ movies: Movie[] }>('/api/movies/popular');
  },

  async getTopRated(): Promise<{ movies: Movie[] }> {
    return request<{ movies: Movie[] }>('/api/movies/top-rated');
  },

  async searchMovies(query: string, page = 1): Promise<SearchResponse> {
    return request<SearchResponse>(`/api/movies/search?q=${encodeURIComponent(query)}&page=${page}`);
  },

  async getMovieDetails(id: number): Promise<{ movie: Movie; isFavorite: boolean }> {
    return request<{ movie: Movie; isFavorite: boolean }>(`/api/movies/${id}`);
  },

  async getRecommendations(id: number): Promise<{ recommendations: MovieRecommendation[] }> {
    return request<{ recommendations: MovieRecommendation[] }>(`/api/movies/${id}/recommendations`);
  },
};

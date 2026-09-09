import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Sparkles, Film, ArrowRight, Star } from 'lucide-react';
import { FavoriteItem, Movie } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface FavoritesPageProps {
  onSelectMovieById: (movieId: number) => void;
  onOpenAISummaryById: (movieId: number, movieTitle: string) => void;
  onBrowseMovies: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  onSelectMovieById,
  onOpenAISummaryById,
  onBrowseMovies,
}) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await api.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (movieId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.removeFavorite(movieId);
      setFavorites(favorites.filter((f) => f.movieId !== movieId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  // Collect all unique genres
  const allGenres = ['All', ...Array.from(new Set(favorites.flatMap((f) => f.movieGenres || [])))];

  const filteredFavorites = favorites.filter((fav) => {
    if (selectedGenre === 'All') return true;
    return fav.movieGenres?.includes(selectedGenre);
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Heart className="w-5 h-5 fill-blue-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Saved Favorites</h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Personal watchlist saved to your account.
          </p>
        </div>

        <span className="text-xs font-semibold text-zinc-400 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
          Total Saved: <strong className="text-white">{favorites.length}</strong>
        </span>
      </div>

      {/* Genre Filters */}
      {allGenres.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {allGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedGenre === genre
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Favorites List */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {filteredFavorites.map((fav) => (
            <div
              key={fav.id}
              onClick={() => onSelectMovieById(fav.movieId)}
              className="group relative flex flex-col bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-zinc-700 hover:shadow-xl"
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] w-full bg-zinc-950">
                <img
                  src={fav.moviePoster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80'}
                  alt={fav.movieTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                {/* Top Actions */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                  <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-amber-400 text-xs font-semibold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{fav.movieRating?.toFixed(1) || '8.0'}</span>
                  </div>

                  <button
                    onClick={(e) => handleRemove(fav.movieId, e)}
                    className="p-1.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-all"
                    title="Remove from favorites"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
                <div>
                  <p className="text-[11px] text-zinc-400">{fav.movieYear}</p>
                  <h3 className="font-semibold text-sm text-zinc-100 line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {fav.movieTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-1 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAISummaryById(fav.movieId, fav.movieTitle);
                    }}
                    className="w-full py-1 px-2 text-xs font-semibold text-blue-300 bg-blue-950/40 border border-blue-800/40 hover:bg-blue-900/50 rounded-lg transition-all flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI Summary</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4 rounded-3xl bg-zinc-900/30 border border-zinc-800">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-200">No favorites saved yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              Explore the trending catalog or search for movies and click the heart icon to save them to your collection.
            </p>
          </div>
          <button
            onClick={onBrowseMovies}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-950/50 transition-all inline-flex items-center space-x-2"
          >
            <span>Explore Movies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

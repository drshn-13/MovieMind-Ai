import React, { useState } from 'react';
import { Star, Heart, Sparkles, FileText, ChevronRight } from 'lucide-react';
import { Movie, MovieRecommendation } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

interface MovieCardProps {
  movie: Movie | MovieRecommendation;
  onSelectMovie: (movie: Movie) => void;
  onOpenAISummary?: (movie: Movie) => void;
  isFavoritedInitial?: boolean;
  showSimilarityScore?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelectMovie,
  onOpenAISummary,
  isFavoritedInitial = false,
  showSimilarityScore = false,
}) => {
  const { user, openAuthModal } = useAuth();
  const [isFavorite, setIsFavorite] = useState<boolean>(isFavoritedInitial);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  const recommendation = showSimilarityScore ? (movie as MovieRecommendation) : null;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      if (isFavorite) {
        await api.removeFavorite(movie.id);
        setIsFavorite(false);
      } else {
        await api.addFavorite({
          movieId: movie.id,
          movieTitle: movie.title,
          moviePoster: movie.posterPath,
          movieYear: movie.releaseYear,
          movieRating: movie.voteAverage,
          movieGenres: (movie.genres || []).map((g) => g.name),
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const posterUrl = imageError || !movie.posterPath
    ? 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80'
    : movie.posterPath;

  const primaryGenre = movie.genres?.[0]?.name || 'Film';

  return (
    <div
      onClick={() => onSelectMovie(movie)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-zinc-700 hover:shadow-xl hover:shadow-blue-950/20"
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        <img
          src={posterUrl}
          alt={movie.title}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
          {/* Rating */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-md bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 text-amber-400 text-xs font-semibold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{movie.voteAverage.toFixed(1)}</span>
          </div>

          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
              isFavorite
                ? 'bg-blue-600/90 border-blue-500 text-white shadow-lg shadow-blue-900/50'
                : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:text-blue-400 hover:bg-zinc-900'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Similarity Score Badge (if in recommendation mode) */}
        {recommendation && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur-md text-white text-xs font-bold shadow-lg shadow-blue-950/50 border border-blue-400/40">
              <Sparkles className="w-3 h-3" />
              <span>{recommendation.similarityScore}% Similar</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="flex flex-1 flex-col p-3.5 justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-zinc-400 mb-1">
            <span className="truncate text-blue-400/90 uppercase tracking-wider font-semibold">{primaryGenre}</span>
            <span>{movie.releaseYear || ''}</span>
          </div>

          <h3 className="font-semibold text-sm text-zinc-100 line-clamp-1 group-hover:text-blue-400 transition-colors">
            {movie.title}
          </h3>

          {movie.director && (
            <p className="text-xs text-zinc-500 truncate mt-0.5">
              Dir. {movie.director}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectMovie(movie);
            }}
            className="flex-1 py-1 px-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 rounded-lg transition-all text-center flex items-center justify-center gap-1"
          >
            <span>Details</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          {onOpenAISummary && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAISummary(movie);
              }}
              className="py-1 px-2 text-xs font-medium text-blue-300 bg-blue-950/40 border border-blue-800/40 hover:bg-blue-900/50 rounded-lg transition-all flex items-center gap-1"
              title="Generate AI Summary"
            >
              <FileText className="w-3 h-3" />
              <span className="hidden sm:inline">AI</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

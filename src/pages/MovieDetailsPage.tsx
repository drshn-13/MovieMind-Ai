import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Clock, 
  Calendar, 
  User as UserIcon, 
  Heart, 
  Sparkles, 
  Headphones, 
  FileText, 
  ArrowLeft, 
  Share2, 
  Tag,
  Film,
  Check
} from 'lucide-react';
import { Movie, MovieRecommendation } from '../types.js';
import { MovieCard } from '../components/MovieCard.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface MovieDetailsPageProps {
  movie: Movie;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenAISummary: (movie: Movie) => void;
  onOpenRecommendationLab: (movie: Movie) => void;
}

export const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({
  movie: initialMovie,
  onBack,
  onSelectMovie,
  onOpenAISummary,
  onOpenRecommendationLab,
}) => {
  const { user, openAuthModal } = useAuth();
  const [movie, setMovie] = useState<Movie>(initialMovie);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    async function loadFullDetails() {
      try {
        const [detailsData, recsData] = await Promise.all([
          api.getMovieDetails(initialMovie.id),
          api.getRecommendations(initialMovie.id),
        ]);
        setMovie(detailsData.movie);
        setIsFavorite(detailsData.isFavorite);
        setRecommendations(recsData);
      } catch (err) {
        console.error('Error loading movie details & recommendations:', err);
      } finally {
        setLoadingRecs(false);
      }
    }
    loadFullDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialMovie.id]);

  const handleToggleFavorite = async () => {
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
          movieGenres: movie.genres.map((g) => g.name),
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to browse</span>
      </button>

      {/* Hero Backdrop Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800/80 bg-zinc-950 shadow-2xl">
        {movie.backdropPath && (
          <div className="absolute inset-0 z-0">
            <img
              src={movie.backdropPath}
              alt={movie.title}
              className="w-full h-full object-cover opacity-25 filter blur-[2px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          </div>
        )}

        {/* Content Container */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Poster */}
          <div className="w-48 sm:w-60 shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl bg-zinc-900 aspect-[2/3]">
            <img
              src={movie.posterPath || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80'}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info Details */}
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {(movie.genres || []).map((g) => (
                  <span
                    key={g.id || g.name}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-800/50"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-sm italic text-zinc-400 mt-1">"{movie.tagline}"</p>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{movie.voteAverage.toFixed(1)} / 10</span>
                {movie.voteCount && <span className="text-zinc-500 font-normal">({movie.voteCount.toLocaleString()} votes)</span>}
              </div>

              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span>{movie.releaseYear || 'N/A'}</span>
              </div>

              {movie.runtime && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>{movie.runtime} min ({Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m)</span>
                </div>
              )}

              {movie.director && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <UserIcon className="w-4 h-4 text-zinc-400" />
                  <span>Director: <strong className="text-white font-medium">{movie.director}</strong></span>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* AI Summary Trigger */}
              <button
                onClick={() => onOpenAISummary(movie)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-950/60 transition-all flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Summary</span>
              </button>

              {/* Find Similar Movies */}
              <button
                onClick={() => onOpenRecommendationLab(movie)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2"
              >
                <Film className="w-4 h-4 text-blue-400" />
                <span>AI Similarity Analysis</span>
              </button>

              {/* Favorite */}
              <button
                onClick={handleToggleFavorite}
                className={`p-2.5 rounded-xl border transition-all flex items-center space-x-1.5 text-xs font-semibold ${
                  isFavorite
                    ? 'bg-blue-600/90 border-blue-500 text-white shadow-lg shadow-blue-950/50'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
                <span>{isFavorite ? 'Saved' : 'Favorite'}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
                title="Share link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Overview */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Storyline Overview</h3>
              <p className="text-zinc-300 text-sm leading-relaxed max-w-3xl">
                {movie.overview}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cast & Thematic Tags Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cast List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-400" />
            <span>Key Cast</span>
          </h3>

          {movie.cast && movie.cast.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {movie.cast.map((actor, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-center space-y-1"
                >
                  <p className="font-semibold text-xs text-zinc-100 truncate">{actor.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{actor.character || 'Cast'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Ensemble cast details.</p>
          )}
        </div>

        {/* Thematic Keywords */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Thematic Tags</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {movie.keywords && movie.keywords.length > 0 ? (
              movie.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-default"
                >
                  #{kw}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-500">Thematic tokens extracted automatically.</span>
            )}
          </div>
        </div>
      </div>

      {/* Content-Based Recommendations Section */}
      <div className="space-y-6 pt-6 border-t border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Similar Movies (Content-Based AI)
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Computed mathematically using genre affinity, keyword intersections, and storyline vector similarity.
            </p>
          </div>

          <button
            onClick={() => onOpenRecommendationLab(movie)}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>Open in Deep Recommendation Lab</span>
          </button>
        </div>

        {loadingRecs ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {recommendations.map((rec) => (
              <div key={rec.id} className="flex flex-col">
                <MovieCard
                  movie={rec}
                  onSelectMovie={onSelectMovie}
                  onOpenAISummary={onOpenAISummary}
                  showSimilarityScore={true}
                />
                {rec.matchReasons && rec.matchReasons.length > 0 && (
                  <p className="text-[10px] text-zinc-400 px-1 mt-1 truncate">
                    Matched: {rec.matchReasons[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <p className="text-xs text-zinc-400">Discovering matching film profiles...</p>
          </div>
        )}
      </div>
    </div>
  );
};

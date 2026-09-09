import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Film, 
  Sliders, 
  HelpCircle, 
  ArrowRight, 
  Cpu, 
  CheckCircle2, 
  Info, 
  Percent,
  Search,
  Headphones
} from 'lucide-react';
import { Movie, MovieRecommendation } from '../types.js';
import { MovieCard } from '../components/MovieCard.js';
import { api } from '../services/api.js';

interface RecommendationsPageProps {
  initialSeedMovie?: Movie | null;
  onSelectMovie: (movie: Movie) => void;
  onOpenAISummary: (movie: Movie) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  initialSeedMovie = null,
  onSelectMovie,
  onOpenAISummary,
}) => {
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(initialSeedMovie);
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchSeed, setSearchSeed] = useState<string>('');

  useEffect(() => {
    async function loadSeeds() {
      try {
        const movies = await api.getPopular();
        setPopularMovies(movies);
        if (!selectedMovie && movies.length > 0) {
          setSelectedMovie(movies[0]);
          loadRecs(movies[0].id);
        } else if (selectedMovie) {
          loadRecs(selectedMovie.id);
        }
      } catch (err) {
        console.error('Failed to load seed movies:', err);
      }
    }
    loadSeeds();
  }, [initialSeedMovie]);

  const loadRecs = async (movieId: number) => {
    setLoading(true);
    try {
      const recs = await api.getRecommendations(movieId);
      setRecommendations(recs);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSeed = (movie: Movie) => {
    setSelectedMovie(movie);
    loadRecs(movie.id);
  };

  return (
    <div className="space-y-10 animate-in fade-in">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>Vector Similarity Recommendation Lab</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Content-Based AI Recommender
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
          Select any seed film to analyze its multi-dimensional feature representation (Genre sets, thematic tags, directors, and storyline vocabulary) and discover mathematically related cinema.
        </p>
      </div>

      {/* Seed Film Selector Bar */}
      <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Film className="w-4 h-4 text-blue-500" />
            <span>Select Seed Film for Matching:</span>
          </label>
          {selectedMovie && (
            <span className="text-xs text-zinc-400">
              Active Seed: <strong className="text-white">{selectedMovie.title}</strong> ({selectedMovie.releaseYear})
            </span>
          )}
        </div>

        {/* Quick horizontal picker */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {popularMovies.map((m) => {
            const isSelected = selectedMovie?.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleSelectSeed(m)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-2 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-950/60'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <span>{m.title}</span>
                <span className="text-[10px] opacity-75">({m.releaseYear})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Algorithm Logic Explainability Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 text-xs">
        <div className="space-y-1">
          <span className="text-blue-400 font-bold flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" /> 1. Genre Overlap (40%)
          </span>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Calculated via Jaccard intersection over union of multi-genre taxonomies.
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-indigo-400 font-bold flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" /> 2. Keyword Themes (30%)
          </span>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Extracts deep thematic tags (e.g. time travel, moral conflict, heist).
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" /> 3. Storyline Semantic (20%)
          </span>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Token frequency cosine vector matching across narrative overview sentences.
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" /> 4. Creative Crew (10%)
          </span>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Director and leading cast member creative synergy matching.
          </p>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Top Content Matches for "{selectedMovie?.title || 'Selected Movie'}"
          </h2>
        </div>
        <span className="text-xs text-zinc-400">
          Showing <strong className="text-zinc-200">{recommendations.length}</strong> ranked matches
        </span>
      </div>

      {/* Recommendations Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {recommendations.map((rec) => (
            <div key={rec.id} className="flex flex-col space-y-1">
              <MovieCard
                movie={rec}
                onSelectMovie={onSelectMovie}
                onOpenAISummary={onOpenAISummary}
                showSimilarityScore={true}
              />
              <div className="px-1 space-y-0.5">
                {rec.matchReasons && rec.matchReasons.map((reason, idx) => (
                  <p key={idx} className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                    <span className="truncate">{reason}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-zinc-500">
          Select a seed movie above to generate recommendations.
        </div>
      )}
    </div>
  );
};

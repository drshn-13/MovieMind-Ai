import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Award, 
  Headphones, 
  ChevronRight, 
  Play, 
  Film,
  Compass
} from 'lucide-react';
import { Movie } from '../types.js';
import { MovieCard } from '../components/MovieCard.js';
import { api } from '../services/api.js';

interface HomePageProps {
  onSelectMovie: (movie: Movie) => void;
  onOpenAISummary: (movie: Movie) => void;
  onSearch: (query: string) => void;
  onExploreRecommendations: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectMovie,
  onOpenAISummary,
  onSearch,
  onExploreRecommendations,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [trendData, popData, topData] = await Promise.all([
          api.getTrending(),
          api.getPopular(),
          api.getTopRated(),
        ]);
        setTrending(trendData);
        setPopular(popData);
        setTopRated(topData);
        if (trendData.length > 0) {
          setFeaturedMovie(trendData[0]);
        }
      } catch (err) {
        console.error('Failed to load home page movies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in">
      {/* Hero Section */}
      <div className="relative min-h-[540px] md:min-h-[600px] flex items-center justify-center rounded-3xl overflow-hidden border border-zinc-800/80 shadow-2xl bg-zinc-950">
        {/* Cinematic Backdrop Image */}
        {featuredMovie?.backdropPath && (
          <div className="absolute inset-0 z-0">
            <img
              src={featuredMovie.backdropPath}
              alt={featuredMovie.title}
              className="w-full h-full object-cover opacity-35 scale-105 transform filter blur-[1px]"
            />
            {/* Multi-layered Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/40" />
            <div className="absolute inset-0 bg-radial from-transparent via-zinc-950/60 to-zinc-950" />
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
          {/* Spotlight Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold backdrop-blur-md shadow-lg shadow-blue-950/40">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI-Driven Cinematic Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white font-sans drop-shadow-md">
            Discover Your Next <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-300 bg-clip-text text-transparent">Favorite Movie</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-300 font-light leading-relaxed">
            Search movies, discover what you'll love, and listen to AI-powered summaries.
          </p>

          {/* Hero Search Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/80 rounded-2xl p-1.5 shadow-2xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <Search className="w-5 h-5 text-zinc-400 ml-3.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a movie (e.g., Interstellar, Inception, Dune)..."
                className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder-zinc-500 px-3.5 py-2.5 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 sm:px-7 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-950/60 transition-all shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Shortcuts */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
            <span className="text-zinc-500">Popular Searches:</span>
            {['Interstellar', 'Oppenheimer', 'The Dark Knight', 'Blade Runner 2049', 'Parasite'].map((term) => (
              <button
                key={term}
                onClick={() => onSearch(term)}
                className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Featured Spotlight CTA if movie available */}
          {featuredMovie && (
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onSelectMovie(featuredMovie)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-700 hover:bg-zinc-800 text-white text-xs font-semibold backdrop-blur-md transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Spotlight: {featuredMovie.title} ({featuredMovie.releaseYear})</span>
              </button>
              <button
                onClick={() => onOpenAISummary(featuredMovie)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-950/60 border border-blue-800/60 hover:bg-blue-900/70 text-blue-300 text-xs font-semibold backdrop-blur-md transition-all"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Listen to AI Summary</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feature Teaser Bar: The Signature Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={onExploreRecommendations}
          className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-blue-500/40 cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-100 text-sm">Content-Based AI Engine</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Multi-vector mathematical matching across genres, keywords, directors, cast, and narrative tokens.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-100 text-sm">Gemini 3.7 Summaries</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Instant spoiler-free cinematic overviews tailored to quick, standard, or detailed viewing preferences.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-sky-500/40 transition-all">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-sky-600/10 text-sky-400 border border-sky-500/20">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-100 text-sm">AI Audio Narration</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Convert any summary into cinematic voice audio with speed adjustments and synchronized transcripts.
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-12">
          {[1, 2].map((section) => (
            <div key={section} className="space-y-4">
              <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Trending Movies Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Flame className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Trending Movies</h2>
              </div>
              <button
                onClick={() => onSearch('')}
                className="text-xs font-semibold text-zinc-400 hover:text-blue-400 flex items-center space-x-1 transition-colors"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {trending.slice(0, 10).map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelectMovie={onSelectMovie}
                  onOpenAISummary={onOpenAISummary}
                />
              ))}
            </div>
          </section>

          {/* Popular Movies Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Popular Movies</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {popular.slice(0, 10).map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelectMovie={onSelectMovie}
                  onOpenAISummary={onOpenAISummary}
                />
              ))}
            </div>
          </section>

          {/* Top Rated Movies Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
                  <Award className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Top Rated Classics</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {topRated.slice(0, 10).map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelectMovie={onSelectMovie}
                  onOpenAISummary={onOpenAISummary}
                />
              ))}
            </div>
          </section>

          {/* Recommended For You Section / Callout */}
          <section className="p-8 rounded-3xl bg-gradient-to-r from-zinc-950 via-blue-950/20 to-zinc-950 border border-blue-900/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-600/20 text-blue-400 text-xs font-semibold">
                <Compass className="w-3.5 h-3.5" />
                <span>Recommendation Lab</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Looking for something specific?</h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                Choose any movie to calculate mathematical similarity scores based on genres, keywords, directors, and storyline themes.
              </p>
            </div>

            <button
              onClick={onExploreRecommendations}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-950/60 transition-all shrink-0 flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Recommendation Lab</span>
            </button>
          </section>
        </>
      )}
    </div>
  );
};

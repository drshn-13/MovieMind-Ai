import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal, Film, AlertCircle } from 'lucide-react';
import { Movie } from '../types.js';
import { MovieCard } from '../components/MovieCard.js';
import { api } from '../services/api.js';

interface SearchPageProps {
  initialQuery?: string;
  onSelectMovie: (movie: Movie) => void;
  onOpenAISummary: (movie: Movie) => void;
}

const GENRE_FILTERS = [
  'All',
  'Science Fiction',
  'Drama',
  'Action',
  'Thriller',
  'Adventure',
  'Crime',
  'Mystery',
  'Animation',
  'Romance',
];

export const SearchPage: React.FC<SearchPageProps> = ({
  initialQuery = '',
  onSelectMovie,
  onOpenAISummary,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeGenre, setActiveGenre] = useState('All');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'newest' | 'oldest'>('relevance');
  const [results, setResults] = useState<Movie[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    } else {
      // Default load popular catalogue for immediate browse
      loadDefaultCatalog();
    }
  }, [initialQuery]);

  const loadDefaultCatalog = async () => {
    setLoading(true);
    try {
      const data = await api.getPopular();
      setResults(data);
      setTotalResults(data.length);
    } catch (err) {
      console.error('Error loading default catalogue:', err);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      loadDefaultCatalog();
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.searchMovies(searchQuery.trim());
      setResults(data.results);
      setTotalResults(data.totalResults);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setHasSearched(false);
    loadDefaultCatalog();
  };

  // Filter & Sort Logic
  const filteredResults = results
    .filter((movie) => {
      if (activeGenre === 'All') return true;
      return movie.genres.some((g) => g.name.toLowerCase().includes(activeGenre.toLowerCase()));
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.voteAverage - a.voteAverage;
      if (sortBy === 'newest') return (b.releaseYear || 0) - (a.releaseYear || 0);
      if (sortBy === 'oldest') return (a.releaseYear || 0) - (b.releaseYear || 0);
      return 0;
    });

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Movie Search & Explore</h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Browse cinematic database with instant keyword queries and genre filters.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <div className="relative w-full flex items-center">
            <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, director, or storyline..."
              className="w-full bg-zinc-900/90 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 pl-12 pr-28 py-3.5 rounded-2xl border border-zinc-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-xl"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60">
        {/* Genre Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {GENRE_FILTERS.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeGenre === genre
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-zinc-900 text-xs text-zinc-200 border border-zinc-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="relevance">Default / Relevance</option>
            <option value="rating">Highest Rating</option>
            <option value="newest">Newest Release</option>
            <option value="oldest">Oldest Release</option>
          </select>
        </div>
      </div>

      {/* Status Line */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          {hasSearched ? `Results for "${query}": ` : 'Catalog collection: '}
          <strong className="text-zinc-200">{filteredResults.length} movies</strong>
        </span>
        {activeGenre !== 'All' && (
          <span className="text-blue-400">Filtered by: {activeGenre}</span>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {filteredResults.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelectMovie={onSelectMovie}
              onOpenAISummary={onOpenAISummary}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-4 rounded-3xl bg-zinc-900/30 border border-zinc-800">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-200">No movies found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Try adjusting your search terms or selecting 'All' in the genre filters.
            </p>
          </div>
          <button
            onClick={handleClear}
            className="px-4 py-2 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all"
          >
            Reset Search
          </button>
        </div>
      )}
    </div>
  );
};

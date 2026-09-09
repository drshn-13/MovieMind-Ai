import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Film, 
  Sparkles, 
  Headphones, 
  Trash2, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { ActivityHistoryItem } from '../types.js';
import { api } from '../services/api.js';

interface HistoryPageProps {
  onSelectMovieById: (movieId: number) => void;
  onBrowseMovies: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onSelectMovieById,
  onBrowseMovies,
}) => {
  const [history, setHistory] = useState<ActivityHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your activity history?')) return;
    try {
      await api.clearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'search':
        return <Search className="w-4 h-4 text-sky-400" />;
      case 'movie_view':
        return <Film className="w-4 h-4 text-zinc-300" />;
      case 'ai_summary':
        return <Sparkles className="w-4 h-4 text-blue-400" />;
      case 'audio_summary':
        return <Headphones className="w-4 h-4 text-indigo-400" />;
      case 'recommendation_view':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <HistoryIcon className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'search':
        return 'Movie Search';
      case 'movie_view':
        return 'Movie Details Viewed';
      case 'ai_summary':
        return 'Gemini AI Summary Generated';
      case 'audio_summary':
        return 'AI Audio Speech Played';
      case 'recommendation_view':
        return 'AI Recommendations Run';
      default:
        return 'Activity';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const filteredHistory = history.filter((item) => {
    if (filterType === 'all') return true;
    return item.actionType === filterType;
  });

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <HistoryIcon className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Activity & Discovery Log</h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Tracks movie searches, AI summary generations, and audio listening sessions.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/40 text-xs font-semibold text-zinc-400 hover:text-red-400 border border-zinc-800 transition-all self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'All Activities' },
          { id: 'ai_summary', label: 'AI Summaries' },
          { id: 'audio_summary', label: 'Audio Listens' },
          { id: 'recommendation_view', label: 'Recommendations' },
          { id: 'movie_view', label: 'Movie Views' },
          { id: 'search', label: 'Searches' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              filterType === tab.id
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History Timeline List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-zinc-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.movieId) {
                  onSelectMovieById(item.movieId);
                }
              }}
              className={`p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between gap-4 ${
                item.movieId ? 'cursor-pointer hover:bg-zinc-900/90' : ''
              }`}
            >
              <div className="flex items-center space-x-3.5 overflow-hidden">
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0">
                  {getActivityIcon(item.actionType)}
                </div>

                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      {getActivityLabel(item.actionType)}
                    </span>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-zinc-100 truncate mt-0.5">
                    {item.movieTitle || item.details || 'User Interaction'}
                  </h4>

                  {item.movieTitle && item.details && (
                    <p className="text-xs text-zinc-400 truncate">{item.details}</p>
                  )}
                </div>
              </div>

              {item.movieId && (
                <div className="shrink-0 text-zinc-500 hover:text-white">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-4 rounded-3xl bg-zinc-900/30 border border-zinc-800">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-200">No activity recorded</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Start searching movies, generating AI summaries, and listening to audio to build your activity history.
            </p>
          </div>
          <button
            onClick={onBrowseMovies}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all"
          >
            Start Exploring
          </button>
        </div>
      )}
    </div>
  );
};

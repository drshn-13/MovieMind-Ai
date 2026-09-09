import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Heart, 
  Sparkles, 
  Headphones, 
  Search, 
  TrendingUp, 
  Film, 
  PieChart,
  ArrowRight,
  Clock
} from 'lucide-react';
import { DashboardStats } from '../types.js';
import { api } from '../services/api.js';

interface DashboardPageProps {
  onSelectMovieById: (movieId: number) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectMovieById,
  onNavigateTab,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-zinc-900 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Watchlist Favorites',
      value: stats.totalFavorites || 0,
      icon: Heart,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/40',
      borderColor: 'border-blue-900/40',
    },
    {
      label: 'AI Summaries Run',
      value: stats.totalAISummaries || 0,
      icon: Sparkles,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-950/40',
      borderColor: 'border-indigo-900/40',
    },
    {
      label: 'Audio Narration Listens',
      value: stats.totalAudioListens || 0,
      icon: Headphones,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-900/40',
    },
    {
      label: 'Movies Explored',
      value: stats.totalMoviesViewed || 0,
      icon: Search,
      color: 'text-sky-400',
      bgColor: 'bg-sky-950/40',
      borderColor: 'border-sky-900/40',
    },
  ];

  // Calculate top genre percentages safely
  const topGenresList = stats.topGenres || [];
  const maxGenreCount = topGenresList.length > 0 ? Math.max(...topGenresList.map((g) => g.count), 1) : 1;

  return (
    <div className="space-y-10 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Personal Cinema Analytics</h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time telemetry and preferences gathered from your movie discovery journey.
          </p>
        </div>
      </div>

      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`p-5 rounded-2xl bg-zinc-950 border ${card.borderColor} shadow-lg flex flex-col justify-between space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.bgColor} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Analytics Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favorite Genres Distribution */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-500" />
              <span>Genre Affinity Spectrum</span>
            </h3>
            <span className="text-xs text-zinc-500">Based on favorites</span>
          </div>

          {topGenresList.length > 0 ? (
            <div className="space-y-3.5">
              {topGenresList.map((genre, idx) => {
                const percentage = Math.round((genre.count / maxGenreCount) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-zinc-300">{genre.genre}</span>
                      <span className="text-zinc-500">{genre.count} movies ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-zinc-500">
              Save more movies to your watchlist to generate your genre spectrum.
            </div>
          )}
        </div>

        {/* AI & Audio Feature Utilization */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>AI Pipeline Utilization</span>
            </h3>
            <span className="text-xs text-zinc-500">Feature Engagement</span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">Gemini 3.7 Summarizer</h4>
                  <p className="text-xs text-zinc-400">Spoiler-free cinematic briefings generated</p>
                </div>
              </div>
              <span className="text-lg font-bold text-white">{stats.totalAISummaries || 0}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">Natural Voice Narration</h4>
                  <p className="text-xs text-zinc-400">Audio summaries converted & streamed</p>
                </div>
              </div>
              <span className="text-lg font-bold text-white">{stats.totalAudioListens || 0}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-sky-600/20 text-sky-400">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">Catalog Explorations</h4>
                  <p className="text-xs text-zinc-400">Keyword queries & vector similarity matching</p>
                </div>
              </div>
              <span className="text-lg font-bold text-white">{stats.totalMoviesViewed || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Snapshot */}
      <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>Recent Activity Timeline</span>
          </h3>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>View Complete History</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {(stats.recentActivities || []).length > 0 ? (
          <div className="space-y-2">
            {(stats.recentActivities || []).slice(0, 5).map((act) => (
              <div
                key={act.id}
                onClick={() => act.movieId && onSelectMovieById(act.movieId)}
                className="p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/60 flex items-center justify-between cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="font-semibold text-zinc-200 truncate">
                    {act.movieTitle || act.details || 'User Action'}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 shrink-0">
                  {new Date(act.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-4">No recent activity logged.</p>
        )}
      </div>
    </div>
  );
};

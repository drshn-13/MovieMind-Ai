import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AudioPlayerProvider } from './context/AudioPlayerContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { GlobalAudioPlayer } from './components/GlobalAudioPlayer.js';
import { AISummaryModal } from './components/AISummaryModal.js';
import { AuthModal } from './components/AuthModal.js';

import { HomePage } from './pages/HomePage.js';
import { SearchPage } from './pages/SearchPage.js';
import { MovieDetailsPage } from './pages/MovieDetailsPage.js';
import { RecommendationsPage } from './pages/RecommendationsPage.js';
import { FavoritesPage } from './pages/FavoritesPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AboutPage } from './pages/AboutPage.js';

import { Movie } from './types.js';
import { api } from './services/api.js';

const MainContent: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [recommendationSeed, setRecommendationSeed] = useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // AI Summary Modal State
  const [summaryModalMovie, setSummaryModalMovie] = useState<Movie | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setActiveTab('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMovieById = async (movieId: number) => {
    try {
      const data = await api.getMovieDetails(movieId);
      if (data.movie) {
        setSelectedMovie(data.movie);
        setActiveTab('details');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error fetching movie by ID:', err);
    }
  };

  const handleOpenAISummary = (movie: Movie) => {
    setSummaryModalMovie(movie);
    setIsSummaryModalOpen(true);
  };

  const handleOpenAISummaryById = async (movieId: number, movieTitle: string) => {
    try {
      const data = await api.getMovieDetails(movieId);
      if (data.movie) {
        setSummaryModalMovie(data.movie);
        setIsSummaryModalOpen(true);
      }
    } catch (err) {
      console.error('Error opening summary by ID:', err);
    }
  };

  const handleOpenRecommendationLab = (movie: Movie) => {
    setRecommendationSeed(movie);
    setActiveTab('recommendations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalSearch = (query: string) => {
    setSearchQuery(query);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-blue-600 selection:text-white font-sans">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSearchSubmit={handleGlobalSearch}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <HomePage
            onSelectMovie={handleSelectMovie}
            onOpenAISummary={handleOpenAISummary}
            onSearch={handleGlobalSearch}
            onExploreRecommendations={() => {
              setActiveTab('recommendations');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'search' && (
          <SearchPage
            initialQuery={searchQuery}
            onSelectMovie={handleSelectMovie}
            onOpenAISummary={handleOpenAISummary}
          />
        )}

        {activeTab === 'details' && selectedMovie && (
          <MovieDetailsPage
            movie={selectedMovie}
            onBack={() => setActiveTab('home')}
            onSelectMovie={handleSelectMovie}
            onOpenAISummary={handleOpenAISummary}
            onOpenRecommendationLab={handleOpenRecommendationLab}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsPage
            initialSeedMovie={recommendationSeed}
            onSelectMovie={handleSelectMovie}
            onOpenAISummary={handleOpenAISummary}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesPage
            onSelectMovieById={handleSelectMovieById}
            onOpenAISummaryById={handleOpenAISummaryById}
            onBrowseMovies={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            onSelectMovieById={handleSelectMovieById}
            onBrowseMovies={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            onSelectMovieById={handleSelectMovieById}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'profile' && <ProfilePage />}

        {activeTab === 'about' && <AboutPage />}
      </main>

      {/* Footer */}
      <Footer
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* AI Summary Modal */}
      <AISummaryModal
        movie={summaryModalMovie}
        isOpen={isSummaryModalOpen}
        onClose={() => {
          setIsSummaryModalOpen(false);
          setSummaryModalMovie(null);
        }}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal />

      {/* Docked Global Audio Narration Player */}
      <GlobalAudioPlayer />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AudioPlayerProvider>
        <MainContent />
      </AudioPlayerProvider>
    </AuthProvider>
  );
}

export default App;

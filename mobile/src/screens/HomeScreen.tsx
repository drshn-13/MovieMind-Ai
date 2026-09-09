import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Search, Sparkles, Play, Star, Heart, Film, User as UserIcon } from 'lucide-react-native';
import { moviesApi } from '../api/movies';
import { userApi } from '../api/user';
import { Movie, FavoriteItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { HorizontalMovieList } from '../components/HorizontalMovieList';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [trendingRes, popularRes, topRatedRes] = await Promise.all([
        moviesApi.getTrending(),
        moviesApi.getPopular(),
        moviesApi.getTopRated(),
      ]);

      setTrendingMovies(trendingRes.movies);
      setPopularMovies(popularRes.movies);
      setTopRatedMovies(topRatedRes.movies);

      if (trendingRes.movies.length > 0) {
        setFeaturedMovie(trendingRes.movies[0]);

        // Load recommendations for featured movie
        try {
          const recRes = await moviesApi.getRecommendations(trendingRes.movies[0].id);
          setRecommendedMovies(recRes.recommendations.map((r) => r.movie));
        } catch (e) {
          console.log('Error loading initial recs:', e);
        }
      }

      // Load favorites if user is authenticated
      if (isAuthenticated) {
        try {
          const favRes = await userApi.getFavorites();
          setFavorites(favRes.favorites);
          setFavoriteIds(new Set(favRes.favorites.map((f) => f.movieId)));
        } catch (e) {
          console.log('Error loading favorites:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching home screen data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleFavoriteToggle = async (movie: Movie) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    const isFav = favoriteIds.has(movie.id);
    try {
      if (isFav) {
        await userApi.removeFavorite(movie.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(movie.id);
          return next;
        });
      } else {
        await userApi.addFavorite(movie);
        setFavoriteIds((prev) => new Set(prev).add(movie.id));
      }
    } catch (e) {
      console.error('Failed to toggle favorite:', e);
    }
  };

  const navigateToDetails = (movie: Movie) => {
    navigation.navigate('MovieDetails', { movieId: movie.id, movieTitle: movie.title });
  };

  const openAISummary = (movie: Movie) => {
    navigation.navigate('AISummary', { movie });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.branding}>
          <View style={styles.logoBadge}>
            <Film size={20} color="#3b82f6" />
          </View>
          <View>
            <Text style={styles.appName}>MovieMind <Text style={styles.aiTag}>AI</Text></Text>
            <Text style={styles.welcomeText}>
              {user ? `Hello, ${user.name.split(' ')[0]}` : 'Discover Cinema with AI'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => (isAuthenticated ? navigation.navigate('Profile') : navigation.navigate('Login'))}
        >
          {isAuthenticated ? (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user?.name.charAt(0).toUpperCase()}</Text>
            </View>
          ) : (
            <View style={styles.loginPill}>
              <Text style={styles.loginPillText}>Sign In</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Launcher Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MovieSearch')}
        >
          <Search size={18} color="#94a3b8" />
          <Text style={styles.searchPlaceholder}>Search titles, actors, directors, themes...</Text>
        </TouchableOpacity>

        {loading ? (
          <View>
            <LoadingSkeleton type="cards" />
            <LoadingSkeleton type="cards" />
          </View>
        ) : (
          <>
            {/* Featured Hero Banner */}
            {featuredMovie && (
              <View style={styles.heroContainer}>
                <Image
                  source={{ uri: featuredMovie.backdropPath || featuredMovie.posterPath || '' }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={styles.heroGradient}>
                  <View style={styles.heroBadgeRow}>
                    <View style={styles.trendingBadge}>
                      <Text style={styles.trendingBadgeText}>#1 Trending Now</Text>
                    </View>
                    <View style={styles.heroRating}>
                      <Star size={13} color="#f59e0b" fill="#f59e0b" />
                      <Text style={styles.heroRatingText}>{featuredMovie.rating.toFixed(1)}</Text>
                    </View>
                  </View>

                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {featuredMovie.title}
                  </Text>

                  <Text style={styles.heroGenres} numberOfLines={1}>
                    {featuredMovie.year} • {featuredMovie.genres.join(', ')}
                  </Text>

                  <Text style={styles.heroOverview} numberOfLines={2}>
                    {featuredMovie.overview}
                  </Text>

                  {/* Hero Action Buttons */}
                  <View style={styles.heroButtonRow}>
                    <TouchableOpacity
                      style={styles.heroDetailsBtn}
                      onPress={() => navigateToDetails(featuredMovie)}
                    >
                      <Play size={16} color="#ffffff" fill="#ffffff" />
                      <Text style={styles.heroDetailsBtnText}>Inspect Movie</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.heroAIBtn}
                      onPress={() => openAISummary(featuredMovie)}
                    >
                      <Sparkles size={16} color="#f59e0b" />
                      <Text style={styles.heroAIBtnText}>AI Summary</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.heroFavBtn}
                      onPress={() => handleFavoriteToggle(featuredMovie)}
                    >
                      <Heart
                        size={18}
                        color={favoriteIds.has(featuredMovie.id) ? '#ef4444' : '#ffffff'}
                        fill={favoriteIds.has(featuredMovie.id) ? '#ef4444' : 'transparent'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Trending Carousel */}
            <HorizontalMovieList
              title="🔥 Trending This Week"
              subtitle="Most popular titles across world cinema"
              movies={trendingMovies}
              onMoviePress={navigateToDetails}
              onFavoriteToggle={handleFavoriteToggle}
              favoriteIds={favoriteIds}
              size="medium"
            />

            {/* AI Recommendations Section */}
            {recommendedMovies.length > 0 && (
              <HorizontalMovieList
                title="✨ AI Recommendations"
                subtitle={`Because you viewed ${featuredMovie?.title}`}
                movies={recommendedMovies}
                onMoviePress={navigateToDetails}
                onFavoriteToggle={handleFavoriteToggle}
                favoriteIds={favoriteIds}
                size="medium"
              />
            )}

            {/* Popular Movies */}
            <HorizontalMovieList
              title="🌟 Popular Hits"
              subtitle="Audience favorites and blockbusters"
              movies={popularMovies}
              onMoviePress={navigateToDetails}
              onFavoriteToggle={handleFavoriteToggle}
              favoriteIds={favoriteIds}
              size="medium"
            />

            {/* Top Rated */}
            <HorizontalMovieList
              title="🏆 All-Time Top Rated"
              subtitle="Critically acclaimed masterpieces"
              movies={topRatedMovies}
              onMoviePress={navigateToDetails}
              onFavoriteToggle={handleFavoriteToggle}
              favoriteIds={favoriteIds}
              size="medium"
            />

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#090d16',
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#131b2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  appName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  aiTag: {
    color: '#3b82f6',
  },
  welcomeText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  profileButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  loginPill: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  loginPillText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131b2e',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  searchPlaceholder: {
    color: '#64748b',
    fontSize: 14,
    flex: 1,
  },
  heroContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 380,
    position: 'relative',
    backgroundColor: '#131b2e',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9, 13, 22, 0.88)',
    padding: 16,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  trendingBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendingBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  heroRatingText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroGenres: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
  },
  heroOverview: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  heroButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  heroDetailsBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  heroAIBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  heroAIBtnText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  heroFavBtn: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { ArrowLeft, SlidersHorizontal, Search, Star } from 'lucide-react-native';
import { moviesApi } from '../api/movies';
import { userApi } from '../api/user';
import { Movie } from '../types';
import { useAuth } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';

export const SearchResultsScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { query, initialResults = [] } = route.params || {};
  const { isAuthenticated } = useAuth();
  const [movies, setMovies] = useState<Movie[]>(initialResults);
  const [loading, setLoading] = useState(initialResults.length === 0);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'year'>('popularity');
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const data = await moviesApi.searchMovies(query);
        setMovies(data.results);
      } catch (e) {
        console.error('Failed to fetch search results:', e);
      } finally {
        setLoading(false);
      }
    };

    if (initialResults.length === 0) {
      fetchResults();
    }

    if (isAuthenticated) {
      userApi.getFavorites().then((res) => {
        setFavoriteIds(new Set(res.favorites.map((f) => f.movieId)));
      }).catch(() => {});
    }
  }, [query, isAuthenticated]);

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
      console.error('Favorite toggle failed:', e);
    }
  };

  const sortedMovies = [...movies].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'year') return (b.year || 0) - (a.year || 0);
    return 0; // popularity / default
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>Results for</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>"{query}"</Text>
        </View>
      </View>

      {/* Filter / Sort Pills */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>{movies.length} titles found</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortPill, sortBy === 'popularity' && styles.activeSortPill]}
            onPress={() => setSortBy('popularity')}
          >
            <Text style={[styles.sortPillText, sortBy === 'popularity' && styles.activeSortPillText]}>
              Popular
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortPill, sortBy === 'rating' && styles.activeSortPill]}
            onPress={() => setSortBy('rating')}
          >
            <Text style={[styles.sortPillText, sortBy === 'rating' && styles.activeSortPillText]}>
              Top Rated
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortPill, sortBy === 'year' && styles.activeSortPill]}
            onPress={() => setSortBy('year')}
          >
            <Text style={[styles.sortPillText, sortBy === 'year' && styles.activeSortPillText]}>
              Newest
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Fetching movie results...</Text>
        </View>
      ) : sortedMovies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Search size={48} color="#475569" />
          <Text style={styles.emptyTitle}>No movies found</Text>
          <Text style={styles.emptySubtitle}>
            Try searching for a different title, actor, or genre keyword.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Try Another Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedMovies}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={() => navigation.navigate('MovieDetails', { movieId: item.id, movieTitle: item.title })}
              onFavoriteToggle={handleFavoriteToggle}
              isFavorite={favoriteIds.has(item.id)}
              size="large"
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  filterLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#131b2e',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activeSortPill: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  sortPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  activeSortPillText: {
    color: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  gridContent: {
    padding: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 6,
  },
});

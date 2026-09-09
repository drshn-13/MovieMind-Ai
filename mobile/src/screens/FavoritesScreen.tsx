import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Heart, Film, ArrowRight, Lock, Trash2 } from 'lucide-react-native';
import { userApi } from '../api/user';
import { FavoriteItem, Movie } from '../types';
import { useAuth } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';

export const FavoritesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await userApi.getFavorites();
      setFavorites(res.favorites);
    } catch (e) {
      console.error('Error fetching favorites:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemove = async (movieId: number) => {
    try {
      await userApi.removeFavorite(movieId);
      setFavorites((prev) => prev.filter((f) => f.movieId !== movieId));
    } catch (e) {
      console.error('Remove favorite error:', e);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#090d16" />
        <View style={styles.authBox}>
          <View style={styles.iconCircle}>
            <Lock size={32} color="#3b82f6" />
          </View>
          <Text style={styles.authTitle}>Sign In to View Watchlist</Text>
          <Text style={styles.authSubtitle}>
            Save your favorite films and access them across all your devices with your MovieMind account.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInBtnText}>Sign In / Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Extract unique genres
  const genresSet = new Set<string>();
  favorites.forEach((f) => f.movieGenres?.forEach((g) => genresSet.add(g)));
  const genresList = ['All', ...Array.from(genresSet)];

  const filteredFavorites =
    selectedGenre === 'All'
      ? favorites
      : favorites.filter((f) => f.movieGenres?.includes(selectedGenre));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Heart size={22} color="#ef4444" fill="#ef4444" />
          <Text style={styles.headerTitle}>My Saved Watchlist</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {favorites.length} {favorites.length === 1 ? 'film' : 'films'} saved to cloud
        </Text>
      </View>

      {/* Genre Filter Pills */}
      {genresList.length > 1 && (
        <View style={styles.genresBar}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={genresList}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.genresList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.genrePill, selectedGenre === item && styles.activeGenrePill]}
                onPress={() => setSelectedGenre(item)}
              >
                <Text style={[styles.genrePillText, selectedGenre === item && styles.activeGenrePillText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Syncing your saved films...</Text>
        </View>
      ) : filteredFavorites.length === 0 ? (
        <View style={styles.emptyBox}>
          <Film size={48} color="#475569" />
          <Text style={styles.emptyTitle}>
            {selectedGenre === 'All' ? 'Your watchlist is empty' : `No ${selectedGenre} films found`}
          </Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any movie card or details page to add it to your watchlist.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('HomeTab')}
          >
            <Text style={styles.browseBtnText}>Explore Trending Films</Text>
            <ArrowRight size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredFavorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
          renderItem={({ item }) => {
            const movieObj: Movie = {
              id: item.movieId,
              title: item.movieTitle,
              posterPath: item.moviePoster,
              backdropPath: null,
              overview: '',
              releaseDate: `${item.movieYear}-01-01`,
              year: item.movieYear,
              rating: item.movieRating,
              voteCount: 0,
              genres: item.movieGenres || [],
            };
            return (
              <MovieCard
                movie={movieObj}
                onPress={() =>
                  navigation.navigate('MovieDetails', {
                    movieId: item.movieId,
                    movieTitle: item.movieTitle,
                  })
                }
                onFavoriteToggle={() => handleRemove(item.movieId)}
                isFavorite={true}
                size="large"
              />
            );
          }}
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
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#090d16',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  genresBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  genresList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#131b2e',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activeGenrePill: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  genrePillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeGenrePillText: {
    color: '#ffffff',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyBox: {
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
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },
  browseBtnText: {
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
  authContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  authBox: {
    alignItems: 'center',
    backgroundColor: '#131b2e',
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    width: '100%',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  authTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  authSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  signInBtn: {
    backgroundColor: '#2563eb',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

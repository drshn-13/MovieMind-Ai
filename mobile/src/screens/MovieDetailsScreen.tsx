import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Heart,
  Star,
  Clock,
  Calendar,
  Sparkles,
  Volume2,
  Compass,
  Film,
  Users,
  DollarSign,
} from 'lucide-react-native';
import { moviesApi } from '../api/movies';
import { userApi } from '../api/user';
import { Movie, MovieRecommendation } from '../types';
import { useAuth } from '../context/AuthContext';
import { HorizontalMovieList } from '../components/HorizontalMovieList';

const { width } = Dimensions.get('window');

export const MovieDetailsScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { movieId } = route.params || {};
  const { isAuthenticated } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!movieId) return;
      setLoading(true);
      try {
        const [detailsRes, recsRes] = await Promise.all([
          moviesApi.getMovieDetails(movieId),
          moviesApi.getRecommendations(movieId),
        ]);
        setMovie(detailsRes.movie);
        setIsFavorite(detailsRes.isFavorite);
        setRecommendations(recsRes.recommendations.map((r) => r.movie));
      } catch (e) {
        console.error('Error fetching movie details:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [movieId]);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    if (!movie) return;

    setFavLoading(true);
    try {
      if (isFavorite) {
        await userApi.removeFavorite(movie.id);
        setIsFavorite(false);
      } else {
        await userApi.addFavorite(movie);
        setIsFavorite(true);
      }
    } catch (e) {
      console.error('Favorite toggle error:', e);
    } finally {
      setFavLoading(false);
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val || val === 0) return 'Not Disclosed';
    return `$${(val / 1000000).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#090d16" />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading film information...</Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Movie details not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Backdrop Banner */}
        <View style={styles.backdropContainer}>
          <Image
            source={{ uri: movie.backdropPath || movie.posterPath || '' }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
          <View style={styles.backdropGradient} />

          {/* Floating Back & Favorite Buttons */}
          <TouchableOpacity style={styles.floatBackBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.floatFavBtn}
            onPress={handleFavoriteToggle}
            disabled={favLoading}
          >
            <Heart
              size={22}
              color={isFavorite ? '#ef4444' : '#ffffff'}
              fill={isFavorite ? '#ef4444' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Poster & Main Metadata Row */}
        <View style={styles.mainInfoContainer}>
          <Image
            source={{ uri: movie.posterPath || '' }}
            style={styles.posterThumb}
            resizeMode="cover"
          />
          <View style={styles.titleMetaContainer}>
            <Text style={styles.title}>{movie.title}</Text>
            {movie.tagline ? <Text style={styles.tagline}>"{movie.tagline}"</Text> : null}

            <View style={styles.metaBadgeRow}>
              <View style={styles.ratingBadge}>
                <Star size={13} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.ratingText}>{movie.rating ? movie.rating.toFixed(1) : 'NR'}</Text>
              </View>

              <View style={styles.metaBadge}>
                <Calendar size={12} color="#94a3b8" />
                <Text style={styles.metaBadgeText}>{movie.year || 'N/A'}</Text>
              </View>

              {movie.runtime ? (
                <View style={styles.metaBadge}>
                  <Clock size={12} color="#94a3b8" />
                  <Text style={styles.metaBadgeText}>{movie.runtime} min</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Genres */}
        {movie.genres && movie.genres.length > 0 && (
          <View style={styles.genreChipsRow}>
            {movie.genres.map((g) => (
              <View key={g} style={styles.genreChip}>
                <Text style={styles.genreChipText}>{g}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Action Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.aiPrimaryBtn}
            onPress={() => navigation.navigate('AISummary', { movie })}
          >
            <Sparkles size={18} color="#ffffff" />
            <Text style={styles.aiPrimaryBtnText}>Generate AI Summary</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={styles.audioActionBtn}
              onPress={() => navigation.navigate('AIAudioSummary', { movie })}
            >
              <Volume2 size={16} color="#60a5fa" />
              <Text style={styles.audioActionBtnText}>Listen to Audio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recsActionBtn}
              onPress={() => navigation.navigate('Recommendations', { seedMovie: movie })}
            >
              <Compass size={16} color="#f59e0b" />
              <Text style={styles.recsActionBtnText}>Smart Recs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Synopsis Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Story Overview</Text>
          <Text style={styles.overviewText}>{movie.overview || 'No synopsis available for this title.'}</Text>
        </View>

        {/* Director & Production Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DIRECTOR</Text>
            <Text style={styles.statValue}>{movie.director || 'Various / Not Listed'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>BUDGET</Text>
            <Text style={styles.statValue}>{formatCurrency(movie.budget)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>BOX OFFICE</Text>
            <Text style={styles.statValue}>{formatCurrency(movie.revenue)}</Text>
          </View>
        </View>

        {/* Cast Members */}
        {movie.cast && movie.cast.length > 0 && (
          <View style={styles.section}>
            <View style={styles.castHeaderRow}>
              <Users size={16} color="#60a5fa" />
              <Text style={styles.sectionHeading}>Featured Cast</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.castScroll}>
              {movie.cast.slice(0, 10).map((actor) => (
                <View key={actor.id} style={styles.castCard}>
                  <Image
                    source={{
                      uri: actor.profilePath
                        ? `https://image.tmdb.org/t/p/w200${actor.profilePath}`
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
                    }}
                    style={styles.castAvatar}
                  />
                  <Text style={styles.castName} numberOfLines={1}>{actor.name}</Text>
                  <Text style={styles.castCharacter} numberOfLines={1}>{actor.character || 'Cast'}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommended & Similar Movies */}
        {recommendations.length > 0 && (
          <HorizontalMovieList
            title="🎯 More Like This"
            subtitle="Based on genre, cast & storyline algorithms"
            movies={recommendations}
            onMoviePress={(m) => navigation.push('MovieDetails', { movieId: m.id, movieTitle: m.title })}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  backButton: {
    marginTop: 12,
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  backdropContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    backgroundColor: '#131b2e',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  backdropGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(9, 13, 22, 0.95)',
  },
  floatBackBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  floatFavBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  mainInfoContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -70,
    alignItems: 'flex-end',
    gap: 14,
  },
  posterThumb: {
    width: 110,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e293b',
    backgroundColor: '#1e293b',
  },
  titleMetaContainer: {
    flex: 1,
    paddingBottom: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  tagline: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131b2e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  metaBadgeText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  genreChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  genreChip: {
    backgroundColor: '#131b2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  genreChipText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 10,
  },
  aiPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  aiPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  audioActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#131b2e',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  audioActionBtnText: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '700',
  },
  recsActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#131b2e',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  recsActionBtnText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  overviewText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#131b2e',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#1e293b',
  },
  castHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  castScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  castCard: {
    width: 90,
    marginRight: 12,
    alignItems: 'center',
  },
  castAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1e293b',
    marginBottom: 6,
  },
  castName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  castCharacter: {
    color: '#94a3b8',
    fontSize: 10,
    textAlign: 'center',
  },
});

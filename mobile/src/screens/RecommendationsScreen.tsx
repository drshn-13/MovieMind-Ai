import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { Compass, Sparkles, Star, ChevronRight, CheckCircle2, Film } from 'lucide-react-native';
import { moviesApi } from '../api/movies';
import { Movie, MovieRecommendation } from '../types';

export const RecommendationsScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const seedMovieParam = route?.params?.seedMovie;
  const [seedMovie, setSeedMovie] = useState<Movie | null>(seedMovieParam || null);
  const [trendingPool, setTrendingPool] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const trendingRes = await moviesApi.getTrending();
        setTrendingPool(trendingRes.movies);
        if (!seedMovie && trendingRes.movies.length > 0) {
          setSeedMovie(trendingRes.movies[0]);
          loadRecommendations(trendingRes.movies[0].id);
        } else if (seedMovie) {
          loadRecommendations(seedMovie.id);
        }
      } catch (e) {
        console.error('Error fetching trending for recommendations:', e);
      }
    };

    init();
  }, []);

  const loadRecommendations = async (id: number) => {
    setLoading(true);
    try {
      const res = await moviesApi.getRecommendations(id);
      setRecommendations(res.recommendations);
    } catch (e) {
      console.error('Error calculating recommendations:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectSeedMovie = (movie: Movie) => {
    setSeedMovie(movie);
    loadRecommendations(movie.id);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Compass size={22} color="#f59e0b" />
          <Text style={styles.headerTitle}>AI Recommendation Lab</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Mathematical multi-factor similarity matching on cast, themes & genres
        </Text>
      </View>

      {/* Seed Selector Carousel */}
      <View style={styles.seedSection}>
        <Text style={styles.sectionLabel}>CHOOSE BASE FILM TO MATCH AGAINST</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={trendingPool}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.seedList}
          renderItem={({ item }) => {
            const isSelected = seedMovie?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.seedCard, isSelected && styles.selectedSeedCard]}
                onPress={() => selectSeedMovie(item)}
              >
                <Image
                  source={{ uri: item.posterPath || '' }}
                  style={styles.seedPoster}
                  resizeMode="cover"
                />
                <Text style={styles.seedTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Active Seed</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Recommendations Results List */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Ranked Recommendations ({recommendations.length})
          </Text>
          {seedMovie && (
            <Text style={styles.resultsSeedInfo}>
              Matched against <Text style={{ color: '#60a5fa' }}>{seedMovie.title}</Text>
            </Text>
          )}
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text style={styles.loadingText}>Computing Cosine & Jaccard similarity vectors...</Text>
          </View>
        ) : recommendations.length === 0 ? (
          <View style={styles.centerBox}>
            <Film size={40} color="#475569" />
            <Text style={styles.emptyText}>No recommendations found for this title.</Text>
          </View>
        ) : (
          <FlatList
            data={recommendations}
            keyExtractor={(item) => item.movie.id.toString()}
            contentContainerStyle={styles.recsList}
            renderItem={({ item }) => {
              const { movie, score, matchReasons } = item;
              return (
                <TouchableOpacity
                  style={styles.recItem}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('MovieDetails', {
                      movieId: movie.id,
                      movieTitle: movie.title,
                    })
                  }
                >
                  <Image
                    source={{ uri: movie.posterPath || '' }}
                    style={styles.recPoster}
                    resizeMode="cover"
                  />

                  <View style={styles.recInfo}>
                    <View style={styles.recTitleRow}>
                      <Text style={styles.recTitle} numberOfLines={1}>
                        {movie.title}
                      </Text>
                      <View style={styles.scorePill}>
                        <Sparkles size={11} color="#ffffff" />
                        <Text style={styles.scorePillText}>{score}%</Text>
                      </View>
                    </View>

                    <Text style={styles.recMeta}>
                      {movie.year} • {movie.genres?.slice(0, 2).join(', ')} • Rating {movie.rating.toFixed(1)}
                    </Text>

                    {/* Explainable Reasons */}
                    <View style={styles.reasonsBox}>
                      {matchReasons.slice(0, 2).map((r, idx) => (
                        <View key={idx} style={styles.reasonRow}>
                          <CheckCircle2 size={11} color="#10b981" />
                          <Text style={styles.reasonText} numberOfLines={1}>
                            {r.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <ChevronRight size={18} color="#64748b" style={styles.chevron} />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
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
  seedSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  seedList: {
    paddingHorizontal: 16,
  },
  seedCard: {
    width: 80,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  selectedSeedCard: {
    borderColor: '#f59e0b',
  },
  seedPoster: {
    width: '100%',
    height: 110,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  seedTitle: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    backgroundColor: '#f59e0b',
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#090d16',
    fontSize: 8,
    fontWeight: '800',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultsSeedInfo: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  recsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  recItem: {
    flexDirection: 'row',
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  recPoster: {
    width: 65,
    height: 95,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  recInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  scorePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  recMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  reasonsBox: {
    marginTop: 6,
    gap: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reasonText: {
    color: '#cbd5e1',
    fontSize: 11,
    flex: 1,
  },
  chevron: {
    marginLeft: 6,
  },
});

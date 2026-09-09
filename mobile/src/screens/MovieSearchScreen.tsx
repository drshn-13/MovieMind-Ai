import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Search, X, TrendingUp, Sparkles, Star, ChevronRight } from 'lucide-react-native';
import { moviesApi } from '../api/movies';
import { Movie } from '../types';

const POPULAR_GENRES = [
  'Action', 'Adventure', 'Sci-Fi', 'Drama', 'Comedy',
  'Thriller', 'Horror', 'Animation', 'Crime', 'Mystery'
];

const SUGGESTED_QUERIES = [
  'Interstellar', 'Oppenheimer', 'Inception', 'Spider-Man',
  'Dune', 'The Dark Knight', 'Blade Runner', 'Avatar'
];

export const MovieSearchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Movie[]>([]);

  const handleSearch = async (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;

    setLoading(true);
    try {
      const data = await moviesApi.searchMovies(term);
      setResults(data.results);
      if (data.results.length > 0) {
        navigation.navigate('SearchResults', { query: term, initialResults: data.results });
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = async (text: string) => {
    setQuery(text);
    if (text.trim().length >= 2) {
      try {
        const data = await moviesApi.searchMovies(text.trim());
        setResults(data.results.slice(0, 5));
      } catch (e) {
        // silent fail on typeahead
      }
    } else {
      setResults([]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.input}
            placeholder="Search movies, actors, themes..."
            placeholderTextColor="#64748b"
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchActionBtn}
          onPress={() => handleSearch(query)}
          disabled={!query.trim()}
        >
          <Text style={[styles.searchActionText, !query.trim() && { opacity: 0.5 }]}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Searching MovieMind database...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => navigation.navigate('MovieDetails', { movieId: item.id, movieTitle: item.title })}
            >
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.resultMeta}>
                  {item.year || 'N/A'} • {item.genres?.join(', ') || 'General'}
                </Text>
              </View>
              <View style={styles.ratingPill}>
                <Star size={12} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : 'NR'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View style={styles.suggestionsContainer}>
              {/* Popular Searches */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <TrendingUp size={16} color="#60a5fa" />
                  <Text style={styles.sectionTitle}>Popular Searches</Text>
                </View>
                <View style={styles.chipRow}>
                  {SUGGESTED_QUERIES.map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={styles.queryChip}
                      onPress={() => {
                        setQuery(q);
                        handleSearch(q);
                      }}
                    >
                      <Text style={styles.queryChipText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Browse by Genre */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Sparkles size={16} color="#f59e0b" />
                  <Text style={styles.sectionTitle}>Explore by Genre</Text>
                </View>
                <View style={styles.genreGrid}>
                  {POPULAR_GENRES.map((genre) => (
                    <TouchableOpacity
                      key={genre}
                      style={styles.genreCard}
                      onPress={() => {
                        setQuery(genre);
                        handleSearch(genre);
                      }}
                    >
                      <Text style={styles.genreCardText}>{genre}</Text>
                      <ChevronRight size={14} color="#64748b" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          }
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
    backgroundColor: '#090d16',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131b2e',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
  },
  searchActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchActionText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '700',
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
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131b2e',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  resultInfo: {
    flex: 1,
    marginRight: 10,
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 3,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  suggestionsContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  queryChip: {
    backgroundColor: '#131b2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  queryChipText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreCard: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#131b2e',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  genreCardText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
});

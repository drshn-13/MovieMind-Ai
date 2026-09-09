import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';

interface HorizontalMovieListProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
  onSeeAllPress?: () => void;
  onFavoriteToggle?: (movie: Movie) => void;
  favoriteIds?: Set<number>;
  size?: 'small' | 'medium' | 'large';
}

export const HorizontalMovieList: React.FC<HorizontalMovieListProps> = ({
  title,
  subtitle,
  movies,
  onMoviePress,
  onSeeAllPress,
  onFavoriteToggle,
  favoriteIds,
  size = 'medium',
}) => {
  if (!movies || movies.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onSeeAllPress && (
          <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAllPress}>
            <Text style={styles.seeAllText}>See all</Text>
            <ChevronRight size={14} color="#60a5fa" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MovieCard
            movie={item}
            onPress={onMoviePress}
            onFavoriteToggle={onFavoriteToggle}
            isFavorite={favoriteIds?.has(item.id)}
            size={size}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingLeft: 16,
    paddingRight: 6,
  },
});

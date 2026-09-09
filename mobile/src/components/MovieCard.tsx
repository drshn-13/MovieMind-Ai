import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Star, Heart } from 'lucide-react-native';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onPress: (movie: Movie) => void;
  onFavoriteToggle?: (movie: Movie) => void;
  isFavorite?: boolean;
  size?: 'small' | 'medium' | 'large';
  similarityScore?: number;
}

const { width } = Dimensions.get('window');

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPress,
  onFavoriteToggle,
  isFavorite = false,
  size = 'medium',
  similarityScore,
}) => {
  const cardWidth = size === 'small' ? 120 : size === 'large' ? width * 0.44 : 145;
  const posterHeight = cardWidth * 1.5;

  const fallbackPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
  const posterUri = movie.posterPath || fallbackPoster;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.container, { width: cardWidth }]}
      onPress={() => onPress(movie)}
    >
      <View style={[styles.posterContainer, { height: posterHeight }]}>
        <Image
          source={{ uri: posterUri }}
          style={styles.poster}
          resizeMode="cover"
        />

        {/* Favorite overlay button */}
        {onFavoriteToggle && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              onFavoriteToggle(movie);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart
              size={16}
              color={isFavorite ? '#ef4444' : '#ffffff'}
              fill={isFavorite ? '#ef4444' : 'transparent'}
            />
          </TouchableOpacity>
        )}

        {/* Match score badge */}
        {similarityScore !== undefined && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{similarityScore}% Match</Text>
          </View>
        )}

        {/* Rating overlay */}
        <View style={styles.ratingBadge}>
          <Star size={11} color="#f59e0b" fill="#f59e0b" />
          <Text style={styles.ratingText}>{movie.rating ? movie.rating.toFixed(1) : 'NR'}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {movie.title}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.year}>{movie.year || 'Unknown'}</Text>
        {movie.genres && movie.genres.length > 0 && (
          <>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.genre} numberOfLines={1}>
              {movie.genres[0]}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 14,
    marginBottom: 12,
  },
  posterContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 6,
    borderRadius: 20,
    zIndex: 2,
  },
  scoreBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  year: {
    color: '#94a3b8',
    fontSize: 11,
  },
  dot: {
    color: '#64748b',
    fontSize: 11,
    marginHorizontal: 4,
  },
  genre: {
    color: '#94a3b8',
    fontSize: 11,
    flex: 1,
  },
});

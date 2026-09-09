import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Play, Pause, X, Volume2 } from 'lucide-react-native';
import { useAudio } from '../context/AudioContext';

interface MiniAudioPlayerProps {
  onPressExpand?: () => void;
}

export const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = ({ onPressExpand }) => {
  const { currentAudio, isPlaying, isLoading, pauseAudio, resumeAudio, stopAudio, position, duration } = useAudio();

  if (!currentAudio) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <TouchableOpacity
        style={styles.contentRow}
        activeOpacity={0.9}
        onPress={onPressExpand}
      >
        <View style={styles.iconContainer}>
          <Volume2 size={18} color="#60a5fa" />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            AI Audio: {currentAudio.movieTitle}
          </Text>
          <Text style={styles.meta}>
            {formatTime(position)} / {formatTime(duration)} • Voice: {currentAudio.voiceName}
          </Text>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={isPlaying ? pauseAudio : resumeAudio}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : isPlaying ? (
              <Pause size={18} color="#ffffff" />
            ) : (
              <Play size={18} color="#ffffff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={stopAudio}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderColor: '#1e293b',
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: '#1e293b',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  meta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  playButton: {
    backgroundColor: '#2563eb',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 6,
  },
});

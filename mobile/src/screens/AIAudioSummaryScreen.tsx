import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Sparkles,
  FileText,
  Check,
} from 'lucide-react-native';
import { aiApi } from '../api/ai';
import { useAudio } from '../context/AudioContext';
import { AISummary, AudioSummary, Movie } from '../types';

const VOICES = [
  { id: 'Kore', label: 'Kore (Calm & Cinematic)' },
  { id: 'Puck', label: 'Puck (Engaging & Clear)' },
  { id: 'Charon', label: 'Charon (Deep & Narrative)' },
  { id: 'Fenrir', label: 'Fenrir (Dynamic)' },
  { id: 'Zephyr', label: 'Zephyr (Bright)' },
];

export const AIAudioSummaryScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { movie, summary: initialSummary } = route.params as {
    movie: Movie;
    summary?: AISummary;
  };

  const {
    currentAudio,
    isPlaying,
    isLoading: audioPlayerLoading,
    position,
    duration,
    playbackSpeed,
    playSummaryAudio,
    pauseAudio,
    resumeAudio,
    seekAudio,
    setSpeed,
  } = useAudio();

  const [summary, setSummary] = useState<AISummary | null>(initialSummary || null);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const initData = async () => {
      let currentSummaryObj = summary;
      if (!currentSummaryObj) {
        try {
          const sRes = await aiApi.generateSummary({
            movieId: movie.id,
            length: 'standard',
            isSpoilerFree: true,
          });
          currentSummaryObj = sRes.summary;
          setSummary(sRes.summary);
        } catch (e) {
          console.log('Summary load error:', e);
        }
      }

      if (currentSummaryObj) {
        // Generate and play audio if not already playing this movie
        if (!currentAudio || currentAudio.movieId !== movie.id) {
          generateAndPlay(currentSummaryObj, selectedVoice);
        }
      }
    };

    initData();
  }, [movie.id]);

  const generateAndPlay = async (summaryObj: AISummary, voice: string) => {
    setGeneratingAudio(true);
    try {
      const res = await aiApi.generateAudio({
        summaryId: summaryObj.id || `sum_${movie.id}`,
        movieId: movie.id,
        summaryText: summaryObj.content,
        voiceName: voice,
      });

      await playSummaryAudio(res.audio);
    } catch (e: any) {
      Alert.alert('Audio Error', e.message || 'Could not generate speech audio.');
    } finally {
      setGeneratingAudio(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>AI Spoken Narration</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{movie.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.transcriptBtn}
          onPress={() => setShowTranscript(!showTranscript)}
        >
          <FileText size={18} color={showTranscript ? '#3b82f6' : '#94a3b8'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Vinyl Player Centerpiece */}
        <View style={styles.visualizerContainer}>
          <View style={[styles.outerDisc, isPlaying && styles.outerDiscSpinning]}>
            <View style={styles.innerDisc}>
              <Volume2 size={40} color="#3b82f6" />
            </View>
          </View>

          <Text style={styles.playerTitle}>{movie.title}</Text>
          <Text style={styles.playerMeta}>
            Narrated with {selectedVoice} Voice • Gemini TTS
          </Text>
        </View>

        {/* Progress Bar & Timestamps */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => seekAudio(Math.max(0, position - 15))}
            disabled={generatingAudio}
          >
            <RotateCcw size={22} color="#94a3b8" />
            <Text style={styles.skipText}>15s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainPlayBtn}
            onPress={() => {
              if (isPlaying) {
                pauseAudio();
              } else if (currentAudio) {
                resumeAudio();
              } else if (summary) {
                generateAndPlay(summary, selectedVoice);
              }
            }}
            disabled={generatingAudio || audioPlayerLoading}
          >
            {generatingAudio || audioPlayerLoading ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : isPlaying ? (
              <Pause size={32} color="#ffffff" />
            ) : (
              <Play size={32} color="#ffffff" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => seekAudio(Math.min(duration, position + 15))}
            disabled={generatingAudio}
          >
            <RotateCw size={22} color="#94a3b8" />
            <Text style={styles.skipText}>15s</Text>
          </TouchableOpacity>
        </View>

        {/* Speed Controls */}
        <View style={styles.speedRow}>
          <Text style={styles.speedLabel}>SPEED</Text>
          <View style={styles.speedPills}>
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
              <TouchableOpacity
                key={spd}
                style={[styles.speedPill, playbackSpeed === spd && styles.activeSpeedPill]}
                onPress={() => setSpeed(spd)}
              >
                <Text
                  style={[
                    styles.speedPillText,
                    playbackSpeed === spd && styles.activeSpeedPillText,
                  ]}
                >
                  {spd}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice Selector */}
        <View style={styles.voiceSection}>
          <Text style={styles.sectionLabel}>SYNTHESIS VOICE</Text>
          <View style={styles.voiceList}>
            {VOICES.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.voiceItem, selectedVoice === v.id && styles.activeVoiceItem]}
                onPress={() => {
                  setSelectedVoice(v.id);
                  if (summary) generateAndPlay(summary, v.id);
                }}
              >
                <Text
                  style={[styles.voiceText, selectedVoice === v.id && styles.activeVoiceText]}
                >
                  {v.label}
                </Text>
                {selectedVoice === v.id && <Check size={16} color="#3b82f6" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transcript Accordion */}
        {showTranscript && summary && (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptHeading}>Audio Script Transcript</Text>
            <Text style={styles.transcriptContent}>{summary.content}</Text>
          </View>
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
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  transcriptBtn: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  visualizerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  outerDisc: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#131b2e',
    borderWidth: 4,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
  },
  outerDiscSpinning: {
    borderColor: '#2563eb',
  },
  innerDisc: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#090d16',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  playerMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginVertical: 14,
  },
  progressBar: {
    height: 5,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#64748b',
    fontSize: 11,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    marginVertical: 14,
  },
  skipBtn: {
    alignItems: 'center',
    padding: 10,
  },
  skipText: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  mainPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#131b2e',
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  speedLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 12,
  },
  speedPills: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  speedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeSpeedPill: {
    backgroundColor: '#2563eb',
  },
  speedPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeSpeedPillText: {
    color: '#ffffff',
  },
  voiceSection: {
    width: '100%',
    marginTop: 10,
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  voiceList: {
    backgroundColor: '#131b2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  voiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  activeVoiceItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  voiceText: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  activeVoiceText: {
    color: '#60a5fa',
    fontWeight: '600',
  },
  transcriptCard: {
    width: '100%',
    backgroundColor: '#131b2e',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 16,
  },
  transcriptHeading: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  transcriptContent: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
  },
});

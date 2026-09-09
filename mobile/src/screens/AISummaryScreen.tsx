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
  Sparkles,
  Volume2,
  Shield,
  ShieldAlert,
  Tag,
  ThumbsUp,
  RefreshCw,
} from 'lucide-react-native';
import { aiApi } from '../api/ai';
import { AISummary, Movie } from '../types';

export const AISummaryScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { movie } = route.params as { movie: Movie };
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [length, setLength] = useState<'quick' | 'standard' | 'detailed'>('standard');
  const [isSpoilerFree, setIsSpoilerFree] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSummary = async (force = false) => {
    if (!movie) return;
    setLoading(true);
    try {
      const data = await aiApi.generateSummary({
        movieId: movie.id,
        length,
        isSpoilerFree,
        forceRegenerate: force,
      });
      setSummary(data.summary);
    } catch (e: any) {
      Alert.alert('AI Error', e.message || 'Could not generate AI summary. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [length, isSpoilerFree]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>Gemini AI Film Analysis</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{movie.title}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchSummary(true)} disabled={loading}>
          <RefreshCw size={18} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Configuration Controls Card */}
        <View style={styles.configCard}>
          {/* Length Selector */}
          <Text style={styles.controlLabel}>SUMMARY DEPTH</Text>
          <View style={styles.lengthPillsRow}>
            {(['quick', 'standard', 'detailed'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.lengthPill, length === mode && styles.activeLengthPill]}
                onPress={() => setLength(mode)}
              >
                <Text style={[styles.lengthPillText, length === mode && styles.activeLengthPillText]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Spoiler Policy Toggle */}
          <View style={styles.spoilerToggleRow}>
            <View style={styles.spoilerLabelContainer}>
              {isSpoilerFree ? (
                <Shield size={18} color="#10b981" />
              ) : (
                <ShieldAlert size={18} color="#f59e0b" />
              )}
              <View>
                <Text style={styles.spoilerTitle}>
                  {isSpoilerFree ? 'Spoiler-Free Mode' : 'Full Story (Spoilers)'}
                </Text>
                <Text style={styles.spoilerSubtitle}>
                  {isSpoilerFree
                    ? 'Protects twists and third-act endings'
                    : 'Complete narrative breakdown with resolution'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.toggleBtn, isSpoilerFree ? styles.toggleSafe : styles.toggleSpoilers]}
              onPress={() => setIsSpoilerFree(!isSpoilerFree)}
            >
              <Text style={styles.toggleBtnText}>{isSpoilerFree ? 'SAFE' : 'SPOILERS'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Summary Content Display */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingHeading}>Analyzing Narrative with Gemini 3.7 Flash</Text>
            <Text style={styles.loadingSubtext}>
              Synthesizing cinematic themes, character arcs, and spoiler-safe narrative structure...
            </Text>
          </View>
        ) : summary ? (
          <View style={styles.summaryContainer}>
            {/* Tone & Recommendations Badges */}
            {summary.cinematicTone && (
              <View style={styles.toneBadge}>
                <Sparkles size={14} color="#f59e0b" />
                <Text style={styles.toneText}>Tone: {summary.cinematicTone}</Text>
              </View>
            )}

            {/* Main Narrative Text */}
            <View style={styles.narrativeCard}>
              <Text style={styles.narrativeText}>{summary.content}</Text>
            </View>

            {/* Key Themes Chips */}
            {summary.keyThemes && summary.keyThemes.length > 0 && (
              <View style={styles.themesSection}>
                <View style={styles.themesHeader}>
                  <Tag size={15} color="#60a5fa" />
                  <Text style={styles.themesTitle}>Key Cinematic Themes</Text>
                </View>
                <View style={styles.themeChipsRow}>
                  {summary.keyThemes.map((theme, i) => (
                    <View key={i} style={styles.themeChip}>
                      <Text style={styles.themeChipText}>{theme}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recommended Audience */}
            {summary.recommendedFor && (
              <View style={styles.recAudienceCard}>
                <ThumbsUp size={16} color="#10b981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recAudienceLabel}>Recommended For</Text>
                  <Text style={styles.recAudienceText}>{summary.recommendedFor}</Text>
                </View>
              </View>
            )}

            {/* Listen Action Button */}
            <TouchableOpacity
              style={styles.listenButton}
              onPress={() => navigation.navigate('AIAudioSummary', { movie, summary })}
            >
              <Volume2 size={20} color="#ffffff" />
              <Text style={styles.listenButtonText}>Listen to Spoken Audio Briefing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Tap the button below to generate a breakdown.</Text>
            <TouchableOpacity style={styles.genBtn} onPress={() => fetchSummary()}>
              <Text style={styles.genBtnText}>Generate Summary</Text>
            </TouchableOpacity>
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
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  refreshBtn: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  configCard: {
    backgroundColor: '#131b2e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  controlLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  lengthPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  lengthPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#090d16',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activeLengthPill: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  lengthPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeLengthPillText: {
    color: '#ffffff',
  },
  spoilerToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
  spoilerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  spoilerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  spoilerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  toggleSpoilers: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  toggleBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingBox: {
    backgroundColor: '#131b2e',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 20,
    gap: 12,
  },
  loadingHeading: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryContainer: {
    gap: 14,
  },
  toneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  toneText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  narrativeCard: {
    backgroundColor: '#131b2e',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  narrativeText: {
    color: '#f1f5f9',
    fontSize: 15,
    lineHeight: 24,
  },
  themesSection: {
    backgroundColor: '#131b2e',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  themesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  themesTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  themeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  themeChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  themeChipText: {
    color: '#60a5fa',
    fontSize: 12,
  },
  recAudienceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#131b2e',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    gap: 10,
  },
  recAudienceLabel: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  recAudienceText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 6,
  },
  listenButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  genBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  genBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

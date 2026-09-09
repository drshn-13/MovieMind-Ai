import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Server,
  CheckCircle2,
  XCircle,
  Wifi,
  Sparkles,
  Volume2,
  Info,
  ExternalLink,
} from 'lucide-react-native';
import { API_BASE_URL, setApiBaseUrl, request } from '../api/client';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [baseUrlInput, setBaseUrlInput] = useState(API_BASE_URL);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    details?: any;
  }>({
    tested: false,
    success: false,
    message: '',
  });

  const handleTestConnection = async (urlToTest = baseUrlInput) => {
    const cleanUrl = urlToTest.trim().replace(/\/$/, '');
    setTestingConnection(true);
    setConnectionStatus({ tested: false, success: false, message: '' });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${cleanUrl}/api/system/status`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setApiBaseUrl(cleanUrl);
        setConnectionStatus({
          tested: true,
          success: true,
          message: 'Connected successfully to MovieMind backend!',
          details: data,
        });
      } else {
        setConnectionStatus({
          tested: true,
          success: false,
          message: `Backend returned HTTP status ${res.status}`,
        });
      }
    } catch (e: any) {
      setConnectionStatus({
        tested: true,
        success: false,
        message:
          e.name === 'AbortError'
            ? 'Connection timed out. Check IP & port.'
            : 'Could not connect. Is the Node.js server running?',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const setPresetUrl = (preset: string) => {
    setBaseUrlInput(preset);
    handleTestConnection(preset);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings & Network</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Backend Configuration Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Server size={18} color="#3b82f6" />
            <Text style={styles.cardTitle}>Backend Server Connection</Text>
          </View>
          <Text style={styles.cardDescription}>
            The mobile app connects to the existing MovieMind AI Express backend for TMDB queries, Gemini summaries, recommendations, and user accounts.
          </Text>

          <Text style={styles.inputLabel}>API BASE URL</Text>
          <TextInput
            style={styles.input}
            value={baseUrlInput}
            onChangeText={setBaseUrlInput}
            placeholder="http://10.0.2.2:3000"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.testBtn}
            onPress={() => handleTestConnection()}
            disabled={testingConnection}
          >
            {testingConnection ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Wifi size={16} color="#ffffff" />
                <Text style={styles.testBtnText}>Test & Save Connection</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Quick Presets */}
          <Text style={styles.presetsLabel}>QUICK NETWORK PRESETS</Text>
          <View style={styles.presetButtonsRow}>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setPresetUrl('http://10.0.2.2:3000')}
            >
              <Text style={styles.presetBtnText}>Android Emulator</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setPresetUrl('http://localhost:3000')}
            >
              <Text style={styles.presetBtnText}>Localhost:3000</Text>
            </TouchableOpacity>
          </View>

          {/* Connection Test Result */}
          {connectionStatus.tested && (
            <View
              style={[
                styles.statusBox,
                connectionStatus.success ? styles.statusSuccess : styles.statusError,
              ]}
            >
              {connectionStatus.success ? (
                <CheckCircle2 size={18} color="#10b981" />
              ) : (
                <XCircle size={18} color="#ef4444" />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.statusTitle,
                    connectionStatus.success ? styles.statusSuccessText : styles.statusErrorText,
                  ]}
                >
                  {connectionStatus.message}
                </Text>
                {connectionStatus.details && (
                  <Text style={styles.statusDetails}>
                    Gemini AI: {connectionStatus.details.hasGeminiKey ? 'Active' : 'Fallback'} • TMDB:{' '}
                    {connectionStatus.details.hasTmdbKey ? 'Live' : 'Curated'}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* AI & Synthesis Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Sparkles size={18} color="#f59e0b" />
            <Text style={styles.cardTitle}>AI Intelligence Engines</Text>
          </View>

          <View style={styles.engineRow}>
            <Text style={styles.engineName}>Plot & Thematic Analysis</Text>
            <Text style={styles.engineValue}>Google Gemini 3.7 Flash</Text>
          </View>
          <View style={styles.engineRow}>
            <Text style={styles.engineName}>Audio Narration</Text>
            <Text style={styles.engineValue}>Gemini TTS / Expo Speech</Text>
          </View>
          <View style={styles.engineRow}>
            <Text style={styles.engineName}>Recommendation Metric</Text>
            <Text style={styles.engineValue}>Jaccard + TF-IDF Cosine</Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Info size={18} color="#64748b" />
            <Text style={styles.cardTitle}>App Information</Text>
          </View>
          <View style={styles.engineRow}>
            <Text style={styles.engineName}>Application</Text>
            <Text style={styles.engineValue}>MovieMind AI Mobile</Text>
          </View>
          <View style={styles.engineRow}>
            <Text style={styles.engineName}>Package Name</Text>
            <Text style={styles.engineValue}>com.moviemind.ai</Text>
          </View>
          <View style={styles.engineRow}>
            <Text style={styles.engineName}>Version</Text>
            <Text style={styles.engineValue}>1.0.0 (Expo SDK 52)</Text>
          </View>
        </View>
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
    backgroundColor: '#090d16',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#131b2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  cardDescription: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  inputLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#090d16',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#1e293b',
    fontSize: 14,
    marginBottom: 10,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    height: 46,
    borderRadius: 10,
    gap: 8,
  },
  testBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  presetsLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetBtnText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    gap: 10,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusSuccessText: {
    color: '#10b981',
  },
  statusErrorText: {
    color: '#ef4444',
  },
  statusDetails: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  engineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  engineName: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  engineValue: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '600',
  },
});

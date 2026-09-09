import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Film, Sparkles } from 'lucide-react-native';

export const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        navigation.replace('MainTabs');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Film size={40} color="#3b82f6" />
          <View style={styles.sparkleBadge}>
            <Sparkles size={14} color="#f59e0b" />
          </View>
        </View>
        <Text style={styles.title}>MovieMind <Text style={styles.aiText}>AI</Text></Text>
        <Text style={styles.subtitle}>Discover • Understand • Listen</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.footerText}>Powered by Gemini AI & TMDB</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#131b2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    position: 'relative',
    marginBottom: 20,
  },
  sparkleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#1e293b',
    padding: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiText: {
    color: '#3b82f6',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    color: '#64748b',
    fontSize: 12,
  },
});

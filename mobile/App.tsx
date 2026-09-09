import React from 'react';
import { View, StyleSheet, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { AudioProvider, useAudio } from './src/context/AudioContext';
import { AppNavigator, RootStackParamList } from './src/navigation/AppNavigator';
import { MiniAudioPlayer } from './src/components/MiniAudioPlayer';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Component to handle floating audio player with navigation capabilities
const AppContent = () => {
  const { currentAudio } = useAudio();

  const handleExpandAudio = () => {
    if (navigationRef.isReady() && currentAudio) {
      navigationRef.navigate('AIAudioSummary', {
        movie: {
          id: currentAudio.movieId,
          title: currentAudio.movieTitle,
          overview: currentAudio.summaryText,
          posterPath: null,
          backdropPath: null,
          releaseDate: '',
          year: new Date().getFullYear(),
          rating: 0,
          voteCount: 0,
          genres: [],
        },
      });
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" backgroundColor="#090d16" />
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
      {currentAudio && (
        <View style={styles.miniPlayerContainer}>
          <MiniAudioPlayer onPressExpand={handleExpandAudio} />
        </View>
      )}
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AudioProvider>
          <AppContent />
        </AudioProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
});

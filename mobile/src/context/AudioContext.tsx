import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { AudioSummary } from '../types';

interface AudioContextType {
  currentAudio: AudioSummary | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  playbackSpeed: number;
  playSummaryAudio: (audio: AudioSummary) => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  seekAudio: (seconds: number) => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAudio, setCurrentAudio] = useState<AudioSummary | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const soundRef = useRef<Audio.Sound | null>(null);
  const isSpeechSynthRef = useRef<boolean>(false);

  useEffect(() => {
    // Configure audio mode for background & speaker
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch((e) => console.log('Audio mode set error:', e));

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      Speech.stop();
    };
  }, []);

  const stopAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (isSpeechSynthRef.current) {
        await Speech.stop();
        isSpeechSynthRef.current = false;
      }
    } catch (e) {
      console.log('Error stopping audio:', e);
    } finally {
      setIsPlaying(false);
      setPosition(0);
    }
  };

  const playSummaryAudio = async (audio: AudioSummary) => {
    setIsLoading(true);
    await stopAudio();
    setCurrentAudio(audio);
    setDuration(audio.durationSeconds || 60);

    try {
      if (audio.audioBase64 && audio.audioBase64.startsWith('data:audio/')) {
        // Play backend Gemini-generated WAV audio
        isSpeechSynthRef.current = false;
        const { sound } = await Audio.Sound.createAsync(
          { uri: audio.audioBase64 },
          { shouldPlay: true, rate: playbackSpeed },
          (status) => {
            if (status.isLoaded) {
              setPosition(Math.floor(status.positionMillis / 1000));
              setDuration(Math.floor(status.durationMillis ? status.durationMillis / 1000 : audio.durationSeconds));
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
              }
            }
          }
        );
        soundRef.current = sound;
        setIsPlaying(true);
      } else {
        // Use Native Mobile Text-To-Speech (Expo Speech)
        isSpeechSynthRef.current = true;
        setIsPlaying(true);
        Speech.speak(audio.summaryText, {
          rate: playbackSpeed,
          pitch: 1.0,
          onDone: () => {
            setIsPlaying(false);
            setPosition(0);
          },
          onStopped: () => {
            setIsPlaying(false);
          },
          onError: () => {
            setIsPlaying(false);
          },
        });
      }
    } catch (e) {
      console.error('Failed to play audio:', e);
      // Fallback to speech
      isSpeechSynthRef.current = true;
      setIsPlaying(true);
      Speech.speak(audio.summaryText, {
        rate: playbackSpeed,
        onDone: () => setIsPlaying(false),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pauseAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else if (isSpeechSynthRef.current) {
      await Speech.pause();
      setIsPlaying(false);
    }
  };

  const resumeAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    } else if (isSpeechSynthRef.current) {
      await Speech.resume();
      setIsPlaying(true);
    } else if (currentAudio) {
      await playSummaryAudio(currentAudio);
    }
  };

  const seekAudio = async (seconds: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(seconds * 1000);
      setPosition(seconds);
    }
  };

  const setSpeed = async (speed: number) => {
    setPlaybackSpeed(speed);
    if (soundRef.current) {
      await soundRef.current.setRateAsync(speed, true);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentAudio,
        isPlaying,
        isLoading,
        position,
        duration,
        playbackSpeed,
        playSummaryAudio,
        pauseAudio,
        resumeAudio,
        stopAudio,
        seekAudio,
        setSpeed,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

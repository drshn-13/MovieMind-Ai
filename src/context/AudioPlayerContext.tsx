import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AudioSummary } from '../types.js';

export interface AudioTrack {
  id?: string;
  summaryId: string;
  movieId: number;
  movieTitle: string;
  posterPath?: string | null;
  summaryText: string;
  audioUrl: string;
  voiceName: string;
  durationSeconds: number;
}

interface AudioPlayerContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  voiceName: string;
  isExpanded: boolean;
  playTrack: (track: AudioTrack) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVoiceName: (voice: string) => void;
  setIsExpanded: (expanded: boolean) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.9);
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);
  const [voiceName, setVoiceName] = useState<string>('Kore');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const currentTrackRef = useRef<AudioTrack | null>(null);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthIntervalRef = useRef<any>(null);

  // Initialize HTML5 Audio Element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener('error', (e) => {
      console.warn('Audio playback error, falling back to synthesis:', e);
      if (currentTrackRef.current && currentTrackRef.current.summaryText) {
        startBrowserSynthesis(currentTrackRef.current.summaryText);
      }
    });

    return () => {
      audio.pause();
      audio.src = '';
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
      }
    };
  }, []);

  const stopAll = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch (err) {
        console.warn('Error pausing audio element:', err);
      }
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('Error cancelling speech synthesis:', err);
      }
    }
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const startBrowserSynthesis = (text?: string) => {
    if (!text || typeof text !== 'string') return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[\n\r]+/g, ' ').replace(/[#*_-]/g, '').trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = playbackRate;
    utterance.volume = volume;

    // Pick a good cinematic English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const estDuration = Math.max(12, Math.round(wordCount / (2.2 * playbackRate)));
    setDuration(estDuration);

    let synthTime = 0;
    if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    synthIntervalRef.current = setInterval(() => {
      synthTime += 0.5;
      setCurrentTime((prev) => Math.min(estDuration, prev + 0.5));
    }, 500);

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    };

    synthUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const playTrack = (track: AudioTrack) => {
    stopAll();
    setCurrentTrack(track);
    setDuration(track.durationSeconds || 45);
    setCurrentTime(0);

    // If real Gemini audio URL (data:audio/wav or http)
    if (track.audioUrl && track.audioUrl.startsWith('data:audio')) {
      if (audioRef.current) {
        audioRef.current.src = track.audioUrl;
        audioRef.current.volume = volume;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('HTML5 Audio play rejected, falling back to browser synthesis:', err);
            startBrowserSynthesis(track.summaryText);
          });
      }
    } else {
      // Direct Web Speech synthesis
      startBrowserSynthesis(track.summaryText);
    }
  };

  const pause = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
    }
    setIsPlaying(false);
  };

  const resume = () => {
    if (!currentTrack) return;

    if (currentTrack.audioUrl && currentTrack.audioUrl.startsWith('data:audio')) {
      if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => startBrowserSynthesis(currentTrack.summaryText));
      }
    } else {
      if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
        synthIntervalRef.current = setInterval(() => {
          setCurrentTime((prev) => Math.min(duration, prev + 0.5));
        }, 500);
      } else {
        startBrowserSynthesis(currentTrack.summaryText);
      }
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const stop = () => {
    stopAll();
    setCurrentTrack(null);
  };

  const seek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(duration, seconds));
    setCurrentTime(clamped);
    if (audioRef.current && currentTrack?.audioUrl?.startsWith('data:audio')) {
      audioRef.current.currentTime = clamped;
    }
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        playbackRate,
        voiceName,
        isExpanded,
        playTrack,
        pause,
        resume,
        togglePlay,
        stop,
        seek,
        setVolume,
        setPlaybackRate,
        setVoiceName,
        setIsExpanded,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};

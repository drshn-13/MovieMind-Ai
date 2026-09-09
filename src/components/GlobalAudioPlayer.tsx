import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw, 
  Headphones, 
  ChevronUp, 
  ChevronDown, 
  X,
  Gauge,
  Sparkles
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext.js';

export const GlobalAudioPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    togglePlay,
    stop,
    seek,
    setVolume,
    setPlaybackRate,
  } = useAudioPlayer();

  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [previousVolume, setPreviousVolume] = useState<number>(0.8);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(previousVolume || 0.8);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleSpeedChange = () => {
    const rates = [0.75, 1.0, 1.25, 1.5];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-zinc-950/95 border-t border-blue-900/40 backdrop-blur-xl shadow-2xl transition-all">
      {/* Transcript Drawer (if expanded) */}
      {showTranscript && (
        <div className="max-w-4xl mx-auto px-4 py-4 max-h-48 overflow-y-auto border-b border-zinc-800 text-xs text-zinc-300 leading-relaxed bg-zinc-900/90 rounded-t-xl mb-1">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 font-semibold text-zinc-200">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Headphones className="w-3.5 h-3.5" />
              AI Audio Narration Transcript ({currentTrack.voiceName} Voice)
            </span>
            <button onClick={() => setShowTranscript(false)} className="text-zinc-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="whitespace-pre-line">{currentTrack.summaryText}</p>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Track Details */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-3">
              <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 shadow-md">
                {currentTrack.posterPath ? (
                  <img
                    src={currentTrack.posterPath}
                    alt={currentTrack.movieTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-950 text-blue-400">
                    <Headphones className="w-5 h-5" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-blue-950/40 flex items-center justify-center">
                    <div className="flex items-end gap-0.5 h-4">
                      <span className="w-1 bg-blue-400 animate-pulse h-3" />
                      <span className="w-1 bg-blue-400 animate-pulse h-4 delay-75" />
                      <span className="w-1 bg-blue-400 animate-pulse h-2 delay-150" />
                    </div>
                  </div>
                )}
              </div>

              <div className="truncate max-w-[180px] sm:max-w-[220px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Narration
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white truncate">{currentTrack.movieTitle}</h4>
                <p className="text-[11px] text-zinc-400">Voice: {currentTrack.voiceName}</p>
              </div>
            </div>

            {/* Transcript Toggle for mobile */}
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="sm:hidden text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-900 rounded border border-zinc-800"
            >
              {showTranscript ? 'Hide' : 'Text'}
            </button>
          </div>

          {/* Center: Playback Controls & Scrubber */}
          <div className="flex flex-col items-center flex-1 max-w-xl w-full px-2">
            {/* Buttons */}
            <div className="flex items-center space-x-4 mb-1">
              <button
                onClick={() => seek(currentTime - 10)}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/60 transition-all hover:scale-105"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white translate-x-0.5" />}
              </button>

              <button
                onClick={stop}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                onClick={() => seek(currentTime + 10)}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                title="Forward 10 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Timeline Scrubber */}
            <div className="w-full flex items-center space-x-2 text-[11px] font-mono text-zinc-400">
              <span>{formatTime(currentTime)}</span>
              <div className="relative flex-1 group py-1.5">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Extra Controls */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Speed toggle */}
            <button
              onClick={handleSpeedChange}
              className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-semibold text-zinc-300 hover:text-white transition-all"
              title="Playback speed"
            >
              {playbackRate}x
            </button>

            {/* Volume */}
            <div className="flex items-center space-x-1.5">
              <button onClick={handleMuteToggle} className="text-zinc-400 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Transcript Drawer Toggle */}
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white"
            >
              <span>Text</span>
              {showTranscript ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            {/* Close */}
            <button
              onClick={stop}
              className="p-1 rounded text-zinc-500 hover:text-zinc-200"
              title="Dismiss Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

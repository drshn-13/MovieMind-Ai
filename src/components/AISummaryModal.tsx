import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  Headphones, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  Tag, 
  Sliders,
  Volume2,
  Play,
  Pause,
  Square,
  AlertCircle
} from 'lucide-react';
import { Movie, AISummary, SummaryLength } from '../types.js';
import { api } from '../services/api.js';
import { useAudioPlayer } from '../context/AudioPlayerContext.js';

interface AISummaryModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AISummaryModal: React.FC<AISummaryModalProps> = ({ movie, isOpen, onClose }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, stop } = useAudioPlayer();

  const [length, setLength] = useState<SummaryLength>('standard');
  const [isSpoilerFree, setIsSpoilerFree] = useState<boolean>(true);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [voiceChoice, setVoiceChoice] = useState<string>('Kore');

  const abortControllerRef = useRef<AbortController | null>(null);
  const audioAbortControllerRef = useRef<AbortController | null>(null);

  // Generate on open or movie change
  useEffect(() => {
    if (isOpen && movie) {
      handleGenerate(length, isSpoilerFree, false);
    } else {
      handleCancelRequests();
      setSummary(null);
      setError(null);
    }

    return () => {
      handleCancelRequests();
    };
  }, [isOpen, movie?.id]);

  const handleCancelRequests = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioAbortControllerRef.current) {
      audioAbortControllerRef.current.abort();
      audioAbortControllerRef.current = null;
    }

    setIsLoading(false);
    setIsGeneratingAudio(false);
  };

  const handleClose = () => {
    handleCancelRequests();
    onClose();
  };

  const handleGenerate = async (
    selectedLength: SummaryLength = length,
    selectedSpoiler: boolean = isSpoilerFree,
    forceRegenerate: boolean = false
  ) => {
    if (!movie) return;

    // Abort any pending generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.generateSummary(
        movie.id,
        selectedLength,
        selectedSpoiler,
        forceRegenerate,
        controller.signal
      );

      setSummary(res);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Summary generation aborted');
        return;
      }

      console.error('Summary generation error:', err);

      setError(
        err.message ||
        'Failed to generate AI summary. Please check connection and try again.'
      );
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleCopy = () => {
    if (!summary || !movie) return;

    navigator.clipboard.writeText(
      `${movie.title} (${movie.releaseYear}) - AI Summary [${length.toUpperCase()}]\n\n${summary.content}`
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleListenAudio = async (
    forceRegenerateAudio: boolean = false
  ) => {
    if (!summary || !movie) return;

    if (audioAbortControllerRef.current) {
      audioAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    audioAbortControllerRef.current = controller;

    setIsGeneratingAudio(true);

    try {
      const audio = await api.generateAudio(
        {
          summaryId: summary.id,
          movieId: movie.id,
          movieTitle: movie.title,
          summaryText: summary.content,
          voiceName: voiceChoice,
          forceRegenerate: forceRegenerateAudio,
        },
        controller.signal
      );

      playTrack({
        summaryId: audio.summaryId,
        movieId: movie.id,
        movieTitle: movie.title,
        posterPath: movie.posterPath,
        summaryText: summary.content,
        audioUrl: audio.audioUrl,
        voiceName: audio.voiceName,
        durationSeconds: audio.durationSeconds,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Audio generation aborted');
        return;
      }

      console.error('Audio generation fallback:', err);

      // Fallback: browser speech synthesis
      const contentText = summary.content || '';

      const estimatedWords = contentText
        ? contentText.split(/\s+/).filter(Boolean).length
        : 0;

      playTrack({
        summaryId: summary.id,
        movieId: movie.id,
        movieTitle: movie.title,
        posterPath: movie.posterPath,
        summaryText: contentText,
        audioUrl: 'tts_browser_synth',
        voiceName: voiceChoice,
        durationSeconds: Math.max(
          15,
          Math.round(estimatedWords / 2.2)
        ),
      });
    } finally {
      if (audioAbortControllerRef.current === controller) {
        setIsGeneratingAudio(false);
        audioAbortControllerRef.current = null;
      }
    }
  };

  if (!isOpen || !movie) return null;

  // Determine audio status relative to current summary
  const isThisSummaryPlaying = Boolean(
    currentTrack &&
    currentTrack.movieId === movie.id &&
    (
      currentTrack.summaryId === summary?.id ||
      currentTrack.summaryText === summary?.content
    )
  );

  const isOldAudioPlaying = Boolean(
    currentTrack &&
    currentTrack.movieId === movie.id &&
    summary &&
    !isThisSummaryPlaying
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">

      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">

          <div className="flex items-center space-x-3">

            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">

                <h2 className="text-lg font-bold text-white tracking-tight">
                  AI Movie Summary & Narration
                </h2>

                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
                  Gemini AI
                </span>

              </div>

              <p className="text-xs text-zinc-400 truncate max-w-sm">
                {movie.title} ({movie.releaseYear})
              </p>
            </div>

          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close / Cancel"
          >
            <X className="w-5 h-5" />
          </button>

        </div>

        {/* Configuration Bar */}
        <div className="px-6 py-3 bg-zinc-900/40 border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">

          {/* Length Toggle */}
          <div className="flex items-center space-x-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">

            {[
              { id: 'quick', label: 'Short (Main Events)' },
              { id: 'standard', label: 'Standard' },
              { id: 'detailed', label: 'Detailed (Entire Story)' },
            ].map((item) => (

              <button
                key={item.id}
                onClick={() => {
                  const len = item.id as SummaryLength;

                  setLength(len);

                  // false = use cache if this version already exists
                  handleGenerate(
                    len,
                    isSpoilerFree,
                    false
                  );
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  length === item.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {item.label}
              </button>

            ))}

          </div>

          {/* Spoiler Policy Toggle */}
          <div className="flex items-center space-x-1.5">

            <button
              onClick={() => {
                const next = !isSpoilerFree;

                setIsSpoilerFree(next);

                // Different spoiler setting = different cached summary
                handleGenerate(
                  length,
                  next,
                  false
                );
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium border transition-all ${
                isSpoilerFree
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-800/60 text-amber-400'
              }`}
            >

              {isSpoilerFree
                ? <ShieldCheck className="w-3.5 h-3.5" />
                : <ShieldAlert className="w-3.5 h-3.5" />
              }

              <span>
                {isSpoilerFree
                  ? 'Spoiler-Free'
                  : 'Full Story (With Spoilers)'
                }
              </span>

            </button>

          </div>

        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">

          {isLoading ? (

            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">

              <div className="relative">

                <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />

                <Sparkles className="w-5 h-5 text-blue-400 absolute inset-0 m-auto animate-pulse" />

              </div>

              <div className="space-y-1">

                <p className="text-sm font-semibold text-zinc-200">

                  {length === 'detailed'
                    ? 'Crafting Detailed Movie Review with Gemini AI...'
                    : length === 'quick'
                    ? 'Creating Quick Movie Summary with Gemini AI...'
                    : 'Analyzing Movie with Gemini AI...'
                  }

                </p>

                <p className="text-xs text-zinc-500">
                  Analyzing story, characters, themes, and cinematic tone
                </p>

              </div>

              <button
                onClick={handleCancelRequests}
                className="mt-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg transition-colors"
              >
                Cancel Generation
              </button>

            </div>

          ) : error ? (

            <div className="p-5 rounded-xl bg-red-950/30 border border-red-900/50 text-center space-y-3">

              <div className="flex items-center justify-center space-x-2 text-red-400">

                <AlertCircle className="w-5 h-5" />

                <span className="font-semibold text-sm">
                  Generation Error
                </span>

              </div>

              <p className="text-xs text-red-300 max-w-md mx-auto">
                {error}
              </p>

              <div className="flex items-center justify-center space-x-2 pt-1">

                <button
                  onClick={() =>
                    handleGenerate(
                      length,
                      isSpoilerFree,
                      true
                    )
                  }
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all"
                >
                  Try Again
                </button>

                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 rounded-lg border border-zinc-800 transition-all"
                >
                  Cancel
                </button>

              </div>

            </div>

          ) : summary ? (

            <div className="space-y-4 animate-in fade-in">

              {/* Meta Chips */}
              <div className="flex flex-wrap items-center justify-between gap-2">

                <div className="flex flex-wrap items-center gap-2">

                  {summary.cinematicTone && (
                    <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-blue-400">
                      🎬 Tone: {summary.cinematicTone}
                    </span>
                  )}

                  {summary.keyThemes &&
                    summary.keyThemes.map((theme, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-300"
                      >
                        #{theme}
                      </span>
                    ))
                  }

                </div>

                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">

                  {length === 'quick'
                    ? 'Short Summary'
                    : length === 'detailed'
                    ? 'Detailed Full Story'
                    : 'Standard Summary'
                  }

                </span>

              </div>

              {/* Audio Status Banner */}
              {isThisSummaryPlaying && (

                <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-800/60 flex items-center justify-between gap-3 animate-in fade-in">

                  <div className="flex items-center space-x-2.5">

                    <div className="p-1.5 rounded-lg bg-blue-600 text-white animate-pulse">
                      <Headphones className="w-4 h-4" />
                    </div>

                    <div>

                      <p className="text-xs font-semibold text-blue-200">

                        {isPlaying
                          ? 'Now Playing AI Audio Narration'
                          : 'Audio Narration Paused'
                        }

                      </p>

                      <p className="text-[11px] text-blue-300/70">
                        Voice: {currentTrack?.voiceName || voiceChoice}
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center space-x-2">

                    <button
                      onClick={togglePlay}
                      className="p-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 transition-all"
                    >

                      {isPlaying
                        ? <Pause className="w-3.5 h-3.5 fill-white" />
                        : <Play className="w-3.5 h-3.5 fill-white" />
                      }

                      <span>
                        {isPlaying ? 'Pause' : 'Resume'}
                      </span>

                    </button>

                    <button
                      onClick={stop}
                      className="p-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs flex items-center space-x-1 transition-all"
                      title="Stop audio & dismiss player"
                    >

                      <Square className="w-3 h-3 text-red-400" />

                      <span>
                        Stop
                      </span>

                    </button>

                  </div>

                </div>

              )}

              {/* Older Audio */}
              {isOldAudioPlaying && (

                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center justify-between gap-3 animate-in fade-in">

                  <div className="flex items-center space-x-2 text-amber-300 text-xs">

                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />

                    <span>
                      Previous summary audio is currently playing.
                    </span>

                  </div>

                  <button
                    onClick={() => handleListenAudio(true)}
                    disabled={isGeneratingAudio}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                  >
                    Play This {length === 'detailed'
                      ? 'Detailed'
                      : length === 'quick'
                      ? 'Short'
                      : 'Standard'
                    } Audio
                  </button>

                </div>

              )}

              {/* Summary Text Content */}
              <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed whitespace-pre-line bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50 select-text">
                {summary.content}
              </div>

              {/* Recommended For */}
              {summary.recommendedFor && (

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start space-x-2.5">

                  <Tag className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />

                  <div>

                    <p className="text-xs font-semibold text-zinc-200">
                      Recommended For:
                    </p>

                    <p className="text-xs text-zinc-400 mt-0.5">
                      {summary.recommendedFor}
                    </p>

                  </div>

                </div>

              )}

            </div>

          ) : null}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center space-x-2">

            {/* Force Regenerate */}
            <button
              onClick={() =>
                handleGenerate(
                  length,
                  isSpoilerFree,
                  true
                )
              }
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all disabled:opacity-50"
              title="Force regenerate a fresh summary with Gemini"
            >

              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isLoading ? 'animate-spin' : ''
                }`}
              />

              <span>
                Regenerate Summary
              </span>

            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              disabled={!summary || isLoading}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all disabled:opacity-50"
            >

              {copied
                ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                : <Copy className="w-3.5 h-3.5" />
              }

              <span>
                {copied ? 'Copied' : 'Copy'}
              </span>

            </button>

          </div>

          <div className="flex items-center space-x-2">

            {/* Voice select */}
            <select
              value={voiceChoice}
              onChange={(e) => setVoiceChoice(e.target.value)}
              className="bg-zinc-900 text-xs text-zinc-300 border border-zinc-800 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-500"
              title="Select Narrator Voice"
            >

              <option value="Kore">
                Narrator (Kore - Warm)
              </option>

              <option value="Fenrir">
                Narrator (Fenrir - Deep)
              </option>

              <option value="Puck">
                Narrator (Puck - Upbeat)
              </option>

              <option value="Zephyr">
                Narrator (Zephyr - Smooth)
              </option>

            </select>

            {/* Listen / Regenerate Audio */}
            {isGeneratingAudio ? (

              <div className="flex items-center space-x-2">

                <button
                  disabled
                  className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-blue-700/80 rounded-lg"
                >

                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                  <span>
                    Synthesizing Voice...
                  </span>

                </button>

                <button
                  onClick={handleCancelRequests}
                  className="px-2.5 py-2 text-xs text-zinc-400 hover:text-white bg-zinc-800 rounded-lg border border-zinc-700"
                  title="Cancel voice synthesis"
                >
                  Cancel
                </button>

              </div>

            ) : isThisSummaryPlaying ? (

              <button
                onClick={() => handleListenAudio(true)}
                disabled={!summary || isLoading}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-blue-200 bg-blue-900/60 hover:bg-blue-900 border border-blue-700/70 rounded-lg shadow-md transition-all disabled:opacity-50"
                title="Re-synthesize and restart narration for this summary"
              >

                <RefreshCw className="w-3.5 h-3.5" />

                <span>
                  Re-listen ({voiceChoice})
                </span>

              </button>

            ) : (

              <button
                onClick={() => handleListenAudio(false)}
                disabled={!summary || isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-lg shadow-blue-950/50 transition-all disabled:opacity-50"
              >

                <Headphones className="w-4 h-4" />

                <span>
                  Listen to {
                    length === 'detailed'
                      ? 'Detailed'
                      : length === 'quick'
                      ? 'Short'
                      : 'Standard'
                  } Audio
                </span>

              </button>

            )}

            {/* Close */}
            <button
              onClick={handleClose}
              className="px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 rounded-lg border border-zinc-700/70 transition-all"
            >
              Close
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

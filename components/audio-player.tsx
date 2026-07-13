'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Square, SkipBack, SkipForward,
  Volume2, VolumeX, Settings, X, Headphones, Minus, Plus,
} from 'lucide-react';

interface VoiceOption {
  voice: SpeechSynthesisVoice;
  label: string;
  category: 'premium' | 'standard';
}

interface AudioPlayerProps {
  text: string;
  title?: string;
  onClose?: () => void;
}

export function AudioPlayer({ text, title, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const progressInterval = useRef<any>(null);
  const chunksRef = useRef<string[]>([]);
  const startTimeRef = useRef<number>(0);

  // Load voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const english = allVoices
        .filter((v) => v.lang.startsWith('en'))
        .map((v) => {
          const isGoogle = v.name.includes('Google');
          const isMicrosoft = v.name.includes('Microsoft');
          const isApple = v.name.includes('Samantha') || v.name.includes('Alex') || v.name.includes('Karen');
          const isPremium = isGoogle || isMicrosoft || isApple;
          let label = v.name.replace('Google ', '').replace('Microsoft ', '').replace(' Online (Natural)', '');
          if (label.length > 30) label = label.slice(0, 28) + '...';
          return {
            voice: v,
            label: `${isPremium ? '✨ ' : ''}${label}`,
            category: isPremium ? 'premium' as const : 'standard' as const,
          };
        })
        .sort((a, b) => {
          if (a.category === 'premium' && b.category !== 'premium') return -1;
          if (a.category !== 'premium' && b.category === 'premium') return 1;
          return a.label.localeCompare(b.label);
        });

      if (english.length > 0) setVoices(english);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // Split text into natural chunks at sentence boundaries
  const getChunks = useCallback(() => {
    const maxLen = 1500;
    const sentences = text.replace(/([.!?])\s+/g, '$1|SPLIT|').split('|SPLIT|');
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + ' ' + sentence).length > maxLen && current) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current = current ? current + ' ' + sentence : sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }, [text]);

  const startPlaying = useCallback((fromChunk = 0) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const chunks = getChunks();
    chunksRef.current = chunks;
    setTotalChunks(chunks.length);
    setIsPlaying(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();

    const speakChunk = (idx: number) => {
      if (idx >= chunks.length) {
        setIsPlaying(false);
        setProgress(100);
        setCurrentChunk(0);
        return;
      }

      setCurrentChunk(idx);
      setProgress(Math.round((idx / chunks.length) * 100));

      const utterance = new SpeechSynthesisUtterance(chunks[idx]);
      utterance.lang = 'en-US';
      utterance.rate = speed;
      utterance.pitch = pitch;

      if (voices[selectedVoiceIdx]) {
        utterance.voice = voices[selectedVoiceIdx].voice;
      }

      utterance.onend = () => speakChunk(idx + 1);
      utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
          console.error('Speech error:', e);
          setIsPlaying(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakChunk(fromChunk);
  }, [getChunks, speed, pitch, voices, selectedVoiceIdx]);

  const handlePlayPause = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      startPlaying(0);
    }
  }, [isPlaying, isPaused, startPlaying]);

  const handleStop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentChunk(0);
  }, []);

  const handleSkipBack = useCallback(() => {
    const prev = Math.max(0, currentChunk - 1);
    window.speechSynthesis?.cancel();
    startPlaying(prev);
  }, [currentChunk, startPlaying]);

  const handleSkipForward = useCallback(() => {
    const next = Math.min(chunksRef.current.length - 1, currentChunk + 1);
    window.speechSynthesis?.cancel();
    startPlaying(next);
  }, [currentChunk, startPlaying]);

  const adjustSpeed = useCallback((delta: number) => {
    setSpeed((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      return Math.max(0.5, Math.min(2.0, next));
    });
  }, []);

  // Restart with new settings if currently playing
  useEffect(() => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis?.cancel();
      startPlaying(currentChunk);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoiceIdx]);

  const speedLabel = speed === 1.0 ? '1x' : `${speed.toFixed(1)}x`;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16162a]/90 p-4 backdrop-blur-xl shadow-2xl"
    >
      {/* Title bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30">
            <Headphones className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/80 line-clamp-1">{title || 'Audio Player'}</p>
            <p className="text-[10px] text-white/40">
              {voices[selectedVoiceIdx]?.label || 'Default voice'} · {speedLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings((p) => !p)}
            className={`rounded-lg p-1.5 transition-colors ${
              showSettings ? 'bg-purple-500/20 text-purple-400' : 'text-white/40 hover:bg-white/10 hover:text-white'
            }`}
            title="Voice settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              onClick={() => { handleStop(); onClose(); }}
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-white/30">
            {totalChunks > 0 ? `Part ${currentChunk + 1}/${totalChunks}` : 'Ready'}
          </span>
          <span className="text-[10px] text-white/30">{progress}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <button
          onClick={handleSkipBack}
          disabled={!isPlaying}
          className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          onClick={handlePlayPause}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:scale-105 active:scale-95"
        >
          {isPlaying && !isPaused ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        <button
          onClick={handleSkipForward}
          disabled={!isPlaying}
          className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
        >
          <SkipForward className="h-4 w-4" />
        </button>

        <button
          onClick={handleStop}
          disabled={!isPlaying}
          className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
        >
          <Square className="h-4 w-4" />
        </button>

        {/* Speed control inline */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-1.5 py-1">
          <button
            onClick={() => adjustSpeed(-0.1)}
            className="rounded p-0.5 text-white/50 hover:text-white transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-xs font-mono text-white/70 w-8 text-center">{speedLabel}</span>
          <button
            onClick={() => adjustSpeed(0.1)}
            className="rounded p-0.5 text-white/50 hover:text-white transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
              {/* Voice selector */}
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Voice</label>
                <select
                  value={selectedVoiceIdx}
                  onChange={(e) => setSelectedVoiceIdx(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white focus:border-purple-500/50 focus:outline-none"
                >
                  {voices.map((v, i) => (
                    <option key={i} value={i} className="bg-[#111]">
                      {v.label}
                    </option>
                  ))}
                  {voices.length === 0 && (
                    <option className="bg-[#111]">Loading voices...</option>
                  )}
                </select>
              </div>

              {/* Pitch slider */}
              <div>
                <label className="text-xs text-white/50 mb-1.5 flex items-center justify-between">
                  <span>Pitch</span>
                  <span className="font-mono text-purple-400">{pitch.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
                  <span>Deep</span>
                  <span>High</span>
                </div>
              </div>

              {/* Speed slider */}
              <div>
                <label className="text-xs text-white/50 mb-1.5 flex items-center justify-between">
                  <span>Speed</span>
                  <span className="font-mono text-purple-400">{speedLabel}</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
                  <span>0.5x Slow</span>
                  <span>2x Fast</span>
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '📖 Bedtime', speed: 0.8, pitch: 0.9 },
                    { label: '☕ Relaxed', speed: 0.9, pitch: 1.0 },
                    { label: '📚 Normal', speed: 1.0, pitch: 1.0 },
                    { label: '⚡ Quick', speed: 1.3, pitch: 1.0 },
                    { label: '🎭 Dramatic', speed: 0.85, pitch: 0.8 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => { setSpeed(preset.speed); setPitch(preset.pitch); }}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] transition-all ${
                        speed === preset.speed && pitch === preset.pitch
                          ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                          : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

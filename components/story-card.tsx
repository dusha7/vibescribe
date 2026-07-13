'use client';

import { motion } from 'framer-motion';
import { BookOpen, Trash2, Clock, Volume2, VolumeX } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { StoryData } from '@/lib/types';

const GENRE_COLORS: Record<string, string> = {
  horror: 'from-red-500/20 to-orange-500/20 border-red-500/30',
  'dark-romance': 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
  romance: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
  romantasy: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  cyberpunk: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  fantasy: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
  scifi: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  thriller: 'from-slate-500/20 to-zinc-500/20 border-slate-500/30',
  litfic: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
  dystopian: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  adventure: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
  detective: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
  'fairy-tale': 'from-amber-500/20 to-pink-500/20 border-amber-500/30',
  custom: 'from-gray-500/20 to-gray-500/20 border-gray-500/30',
};

const GENRE_EMOJI: Record<string, string> = {
  horror: '👻',
  'dark-romance': '🖤',
  romance: '💕',
  romantasy: '🗡️',
  cyberpunk: '🌆',
  fantasy: '🧙',
  scifi: '🚀',
  thriller: '🔪',
  litfic: '📜',
  dystopian: '🏚️',
  adventure: '🌍',
  detective: '🔍',
  'fairy-tale': '🧸',
  custom: '✨',
};

interface StoryCardProps {
  story: StoryData;
  index: number;
  onDelete?: (id: string) => void;
  onOpen?: (story: StoryData) => void;
}

export function StoryCard({ story, index, onDelete, onOpen }: StoryCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const genreColor = GENRE_COLORS[story?.genre ?? ''] ?? 'from-gray-500/20 to-gray-500/20 border-gray-500/30';
  const genreEmoji = GENRE_EMOJI[story?.genre ?? ''] ?? '📝';

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window?.speechSynthesis?.cancel?.();
      }
    };
  }, []);

  const toggleSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !window?.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const text = (story?.content ?? '').slice(0, 3000);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith('en') && v.name.includes('Google'))
      ?? voices.find((v) => v.lang.startsWith('en-US'))
      ?? voices.find((v) => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [isSpeaking, story?.content]);

  const preview = (story?.content ?? '').slice(0, 200) + ((story?.content?.length ?? 0) > 200 ? '...' : '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative rounded-2xl border bg-gradient-to-br ${genreColor} p-4 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer`}
      onClick={() => onOpen?.(story)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{genreEmoji}</span>
          <h3 className="font-display font-bold text-white line-clamp-1 text-sm sm:text-base">
            {story?.title ?? 'Untitled'}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSpeech();
            }}
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(story?.id);
              }}
              className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <p className="text-xs sm:text-sm text-white/50 line-clamp-3 mb-3">{preview}</p>
      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/30">
        <Clock className="h-3 w-3" />
        <span>{story?.createdAt ? new Date(story.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' }) : ''}</span>
        <span className="capitalize">{(story?.genre ?? '').replace('-', ' ')}</span>
      </div>
    </motion.div>
  );
}

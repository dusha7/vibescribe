'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const PROMPT_IDEAS = [
  {
    text: 'A vampire influencer falls for a mortal who hates social media',
    emoji: '🧛',
    genre: 'dark-romance',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    text: 'A cyberpunk detective hunts a rogue AI in neon-lit Tokyo',
    emoji: '🌃',
    genre: 'cyberpunk',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    text: 'The ghost in an old mansion turns out to be the previous owner',
    emoji: '🏰',
    genre: 'horror',
    gradient: 'from-red-500 to-orange-600',
  },
  {
    text: 'An elf hacker breaks a magical firewall to save her kingdom',
    emoji: '🧙\u200d\u2642\ufe0f',
    genre: 'romantasy',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    text: 'A brave little fox helps a lost princess through an enchanted forest',
    emoji: '🧸',
    genre: 'fairy-tale',
    gradient: 'from-amber-500 to-pink-500',
  },
  {
    text: 'Two rivals are forced to share a cabin during a blizzard',
    emoji: '\u2744\ufe0f',
    genre: 'romance',
    gradient: 'from-sky-400 to-indigo-600',
  },
  {
    text: 'A detective with a photographic memory solves an impossible murder',
    emoji: '🔍',
    genre: 'detective',
    gradient: 'from-indigo-500 to-blue-700',
  },
  {
    text: 'Treasure hunters race to find a legendary lost city in the Amazon',
    emoji: '🌍',
    genre: 'adventure',
    gradient: 'from-emerald-500 to-teal-600',
  },
];

export function PromptCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {(PROMPT_IDEAS ?? []).map((idea: any, i: number) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05 }}
        >
          <Link
            href={`/studio?genre=${idea?.genre ?? ''}&prompt=${encodeURIComponent(idea?.text ?? '')}`}
            className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.06] hover:scale-[1.02] h-full"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${idea?.gradient ?? 'from-gray-500 to-gray-600'} text-lg shadow-lg`}
            >
              {idea?.emoji ?? '\u2728'}
            </div>
            <div>
              <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                {idea?.text ?? ''}
              </p>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-white/30">
                <span>🖋️</span>
                <span>Tap to start</span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

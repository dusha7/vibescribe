import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

export interface StoryConfig {
  format: 'short' | 'standard' | 'long' | 'series';
  genre: string;
  tropes: string[];
  creativity: number;
  prompt: string;
  ageRating: string;
  style: string;
  protagonist: string;
  setting: string;
  conflict: string;
  characterId?: string;
}

export interface StoryData {
  id: string;
  title: string;
  content: string;
  genre: string;
  format: string;
  prompt: string | null;
  tropes: string | null;
  ageRating: string | null;
  style: string | null;
  protagonist: string | null;
  setting: string | null;
  conflict: string | null;
  createdAt: string;
}

export interface CharacterData {
  id: string;
  name: string;
  age: string | null;
  appearance: string | null;
  race: string | null;
  profession: string | null;
  traits: string | null;
  backstory: string | null;
  createdAt: string;
}

export const FORMAT_CONFIG = {
  short: { label: 'Short Story', words: 500, inks: 5, emoji: '\u26a1' },
  standard: { label: 'Standard Chapter', words: 1500, inks: 10, emoji: '\ud83d\udcd6' },
  long: { label: 'Long Chapter', words: 3000, inks: 20, emoji: '\ud83d\udcda' },
  series: { label: 'Series Chapter', words: 2000, inks: 15, emoji: '\ud83d\udcc1' },
} as const;

export const GENRES = [
  { value: 'fantasy', label: 'Fantasy', emoji: '\ud83e\uddd9' },
  { value: 'scifi', label: 'Sci-Fi', emoji: '\ud83d\ude80' },
  { value: 'horror', label: 'Horror', emoji: '\ud83d\udc7b' },
  { value: 'romance', label: 'Romance', emoji: '\ud83d\udc95' },
  { value: 'adventure', label: 'Adventure', emoji: '\ud83c\udf0d' },
  { value: 'detective', label: 'Detective', emoji: '\ud83d\udd0d' },
  { value: 'dark-romance', label: 'Dark Romance', emoji: '\ud83d\udda4' },
  { value: 'romantasy', label: 'Romantasy', emoji: '\ud83d\udde1\ufe0f' },
  { value: 'cyberpunk', label: 'Cyberpunk', emoji: '\ud83c\udf06' },
  { value: 'fairy-tale', label: 'Fairy Tale', emoji: '\ud83e\uddf8' },
  { value: 'dystopian', label: 'Dystopian', emoji: '\ud83c\udfda\ufe0f' },
  { value: 'thriller', label: 'Thriller', emoji: '\ud83d\udd2a' },
  { value: 'custom', label: 'Custom', emoji: '\u2728' },
] as const;

export const TROPES = [
  { value: 'enemies-to-lovers', label: 'Enemies to Lovers' },
  { value: 'slow-burn', label: 'Slow Burn' },
  { value: 'fake-dating', label: 'Fake Dating' },
  { value: 'found-family', label: 'Found Family' },
  { value: 'forbidden-love', label: 'Forbidden Love' },
  { value: 'grumpy-sunshine', label: 'Grumpy \u00d7 Sunshine' },
  { value: 'morally-grey', label: 'Morally Grey Hero' },
  { value: 'forced-proximity', label: 'Forced Proximity' },
  { value: 'chosen-one', label: 'The Chosen One' },
  { value: 'unreliable-narrator', label: 'Unreliable Narrator' },
  { value: 'time-loop', label: 'Time Loop' },
  { value: 'redemption-arc', label: 'Redemption Arc' },
  { value: 'only-one-bed', label: 'Only One Bed' },
  { value: 'who-did-it', label: 'Whodunit' },
] as const;

export const AGE_RATINGS = [
  { value: 'children', label: 'Children', emoji: '\ud83e\uddf8' },
  { value: 'teens', label: 'Young Adult', emoji: '\ud83c\udf1f' },
  { value: 'adults', label: 'Adults', emoji: '\ud83d\udcdd' },
] as const;

export const STYLES = [
  { value: 'light', label: 'Light & Easy' },
  { value: 'literary', label: 'Literary' },
  { value: 'epic', label: 'Epic & Grand' },
  { value: 'dark', label: 'Dark & Gritty' },
] as const;

export const INK_COSTS = {
  generate: { short: 5, standard: 10, long: 20, series: 15 },
  continue: 3,
  voiceover: 10,
  exportPdf: 2,
} as const;

export const EXAMPLE_STORIES = [
  {
    title: 'The Last Starkeeper',
    genre: 'Fantasy',
    description: 'A young girl discovers she is the last keeper of the celestial flames that light the night sky.',
    gradient: 'from-purple-600 to-violet-600',
    emoji: '\u2728',
  },
  {
    title: 'Whispers at Willow Creek',
    genre: 'Horror',
    description: 'Strange things happen at night in an old mansion where shadows have voices.',
    gradient: 'from-red-600 to-orange-600',
    emoji: '\ud83d\udc7b',
  },
  {
    title: 'Luna and the Magic Forest',
    genre: 'Fairy Tale',
    description: 'A brave little fox helps a lost princess find her way home through an enchanted forest.',
    gradient: 'from-emerald-500 to-teal-600',
    emoji: '\ud83e\uddf8',
  },
  {
    title: 'Neon Hearts',
    genre: 'Romance',
    description: 'Two rival hackers discover love in the digital underground of a neon-lit megacity.',
    gradient: 'from-pink-500 to-rose-600',
    emoji: '\ud83d\udc95',
  },
  {
    title: 'The Quantum Paradox',
    genre: 'Sci-Fi',
    description: 'A physicist discovers that each decision creates a parallel universe — and they are collapsing.',
    gradient: 'from-cyan-500 to-blue-600',
    emoji: '\ud83d\ude80',
  },
] as const;

export const FEATURES = [
  {
    title: 'AI Story Generator',
    description: 'Create stories from a simple description. Pick genre, style, and let AI craft your tale.',
    emoji: '\ud83e\ude84',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Character Creator',
    description: 'Build unique characters with detailed profiles. Reuse them across multiple stories.',
    emoji: '\ud83e\uddd1\u200d\ud83c\udfa8',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Audiobook Generator',
    description: 'Convert your stories into spoken audio with natural-sounding AI voices.',
    emoji: '\ud83c\udfa7',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Story Continuation',
    description: 'Continue any story with a single click. AI remembers context and keeps the plot flowing.',
    emoji: '\ud83d\udcd6',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Multi-Voice Narration',
    description: 'Assign different voices to characters for immersive audiobook experiences.',
    emoji: '\ud83c\udfa4',
    gradient: 'from-rose-500 to-red-500',
  },
  {
    title: 'Export Anywhere',
    description: 'Download your stories as PDF. EPUB and MP3 export coming soon.',
    emoji: '\ud83d\udce4',
    gradient: 'from-indigo-500 to-violet-500',
  },
] as const;

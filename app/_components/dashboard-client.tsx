'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PenTool, BookOpen, Zap, Loader2, Users, TrendingUp } from 'lucide-react';
import { Header } from '@/components/header';
import { StoryCard } from '@/components/story-card';
import { PromptCards } from '@/components/prompt-cards';
import { StoryModal } from '@/components/story-modal';
import type { StoryData } from '@/lib/types';

export function DashboardClient() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stories, setStories] = useState<StoryData[]>([]);
  const [inks, setInks] = useState(0);
  const [storyCount, setStoryCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<StoryData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const fetchData = useCallback(async () => {
    try {
      const [balRes, storiesRes] = await Promise.all([
        fetch('/api/user/balance'),
        fetch('/api/stories'),
      ]);
      if (balRes?.ok) {
        const balData = await balRes.json();
        setInks(balData?.inks ?? 0);
        setStoryCount(balData?.storyCount ?? 0);
        setCharacterCount(balData?.characterCount ?? 0);
      }
      if (storiesRes?.ok) {
        const storiesData = await storiesRes.json();
        setStories(storiesData ?? []);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/stories?id=${id}`, { method: 'DELETE' });
      if (res?.ok) {
        setStories((prev) => (prev ?? []).filter((s: StoryData) => s?.id !== id));
        setStoryCount((p) => Math.max(0, p - 1));
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  }, []);

  const handleContinue = useCallback((story: StoryData) => {
    router.push(`/studio?continueId=${story.id}&genre=${story.genre}&format=${story.format}`);
  }, [router]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a0f' }}>
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 pb-16 pt-4">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-900/30 via-black to-pink-900/20 p-6 sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.1),transparent_50%)]" />
            <div className="relative">
              <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white mb-2">
                Hey, {session?.user?.name?.split?.(' ')?.[0] ?? 'Writer'}! 🖋️
              </h1>
              <p className="text-white/60 text-sm sm:text-base max-w-lg mb-6">
                Create unique stories with AI. Pick a genre, set the vibe, and get your story in seconds.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => router.push('/studio')}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 active:scale-95"
                >
                  <PenTool className="h-4 w-4" />
                  Create Story
                </button>
                <button
                  onClick={() => router.push('/characters')}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10"
                >
                  <Users className="h-4 w-4" />
                  Characters
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid grid-cols-3 gap-3"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                <span className="text-sm">🖋️</span>
              </div>
              <span className="text-xs text-white/50">Inks</span>
            </div>
            <p className="font-mono text-2xl font-bold text-purple-300">{inks}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20">
                <BookOpen className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="text-xs text-white/50">Stories</span>
            </div>
            <p className="font-mono text-2xl font-bold text-cyan-300">{storyCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20">
                <Users className="h-4 w-4 text-pink-400" />
              </div>
              <span className="text-xs text-white/50">Characters</span>
            </div>
            <p className="font-mono text-2xl font-bold text-pink-300">{characterCount}</p>
          </div>
        </motion.section>

        {/* Prompt ideas */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-yellow-400" />
            <h2 className="font-display text-lg font-bold text-white">Quick Start</h2>
          </div>
          <PromptCards />
        </motion.section>

        {/* Stories list */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-purple-400" />
            <h2 className="font-display text-lg font-bold text-white">My Stories</h2>
            {(stories?.length ?? 0) > 0 && (
              <span className="text-xs text-white/30 ml-1">({stories?.length ?? 0})</span>
            )}
          </div>
          {(stories?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-white/20 mb-3" />
              <p className="text-white/40 text-sm">No stories yet. Create your first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(stories ?? []).map((story: StoryData, i: number) => (
                <StoryCard
                  key={story?.id ?? i}
                  story={story}
                  index={i}
                  onDelete={handleDelete}
                  onOpen={setSelectedStory}
                />
              ))}
            </div>
          )}
        </motion.section>
      </main>

      {selectedStory && (
        <StoryModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}

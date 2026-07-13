'use client';

import { motion } from 'framer-motion';
import { PenTool, Sparkles, ArrowRight, Play, BookOpen, Volume2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { FEATURES, EXAMPLE_STORIES } from '@/lib/types';

export function LandingClient() {
  const [demoText, setDemoText] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoPrompt, setDemoPrompt] = useState('');
  const [demoDone, setDemoDone] = useState(false);

  const handleDemo = useCallback(async () => {
    if (demoLoading || !demoPrompt.trim()) return;
    setDemoLoading(true);
    setDemoText('');
    setDemoDone(false);

    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: demoPrompt }),
      });
      if (!res?.ok) {
        setDemoText('Something went wrong. Please try again.');
        setDemoLoading(false);
        return;
      }
      const reader = res?.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = '';
      let full = '';

      while (true) {
        const result = await reader?.read();
        if (!result || result?.done) break;
        partialRead += decoder.decode(result.value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines.pop() ?? '';
        for (const line of lines) {
          if (line?.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed?.type === 'chunk') {
                full += parsed?.content ?? '';
                setDemoText(full);
              } else if (parsed?.type === 'done') {
                setDemoDone(true);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      setDemoText('Connection error. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  }, [demoLoading, demoPrompt]);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 w-full">
        <div className="mx-auto max-w-[1200px] px-4 py-3">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <PenTool className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                VibeScribe
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl px-4 py-1.5 text-sm text-white/70 transition hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-[1200px] px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-300">AI-Powered Story Creation</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Create Books, Stories &<br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Audiobooks with AI
              </span>
              <br />in Minutes
            </h1>
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/60 mb-10 leading-relaxed">
              Design characters, generate plots, narrate stories with multiple AI voices, and export your finished works as PDF, EPUB, and MP3.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <PenTool className="h-4 w-4" />
                Create a Story
              </Link>
              <a
                href="#examples"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
              >
                <Play className="h-4 w-4" />
                See Examples
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">Everything You Need to Tell Your Story</h2>
            <p className="text-white/50 max-w-lg mx-auto">From idea to finished audiobook — all in one place.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-2xl shadow-lg`}>
                  {feature.emoji}
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Gallery */}
      <section id="examples" className="py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">Story Gallery</h2>
            <p className="text-white/50 max-w-lg mx-auto">Browse examples across genres. Every story was created with VibeScribe.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {EXAMPLE_STORIES.map((story, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all hover:border-white/20 hover:scale-[1.02]"
              >
                <div className={`h-32 bg-gradient-to-br ${story.gradient} flex items-center justify-center text-4xl`}>
                  {story.emoji}
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">{story.genre}</span>
                  <h3 className="font-display font-bold text-white text-sm mt-1 mb-1">{story.title}</h3>
                  <p className="text-xs text-white/40 line-clamp-2">{story.description}</p>
                  <div className="mt-3 flex gap-2">
                    <Link href="/login" className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] text-white/60 hover:bg-white/10 transition">
                      <BookOpen className="h-3 w-3" /> Read
                    </Link>
                    <Link href="/login" className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] text-white/60 hover:bg-white/10 transition">
                      <Volume2 className="h-3 w-3" /> Listen
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[800px] px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">Try It Now — No Sign-Up Required</h2>
              <p className="text-white/50">Generate a short story (up to 500 words) for free. No downloads, no account needed.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <div className="flex gap-3 mb-4">
                <input
                  value={demoPrompt}
                  onChange={(e) => setDemoPrompt(e?.target?.value ?? '')}
                  placeholder="Describe your story idea... e.g. A dragon who is afraid of fire"
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleDemo()}
                />
                <button
                  onClick={handleDemo}
                  disabled={demoLoading || !demoPrompt.trim()}
                  className="shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {demoLoading ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <PenTool className="h-4 w-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>
              {demoText && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-5 max-h-[400px] overflow-y-auto">
                  {demoText.split('\n').map((p, i) => (
                    <p key={i} className="text-white/80 text-sm leading-relaxed mb-3">{p}</p>
                  ))}
                  {demoLoading && <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse" />}
                </div>
              )}
              {demoDone && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-white/30 mb-3">Want the full experience? Create longer stories, save them, and listen with AI voices.</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:scale-105"
                  >
                    Sign Up Free — 50 Inks Included
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-[1200px] px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-pink-500">
              <PenTool className="h-3 w-3 text-white" />
            </div>
            <span className="font-display text-sm font-bold text-white/50">VibeScribe</span>
          </div>
          <p className="text-xs text-white/30">&copy; 2026 VibeScribe. AI-powered storytelling.</p>
        </div>
      </footer>
    </div>
  );
}

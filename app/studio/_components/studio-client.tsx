'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  PenTool, Loader2, Volume2, VolumeX,
  Sliders, BookOpen, Wand2, Copy, Check, ArrowLeft, Users,
} from 'lucide-react';
import { Header } from '@/components/header';
import { FORMAT_CONFIG, GENRES, TROPES, AGE_RATINGS, STYLES } from '@/lib/types';
import type { StoryConfig, CharacterData } from '@/lib/types';

function StudioInner() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();

  const continueId = searchParams?.get('continueId') ?? '';

  const [config, setConfig] = useState<StoryConfig>({
    format: (searchParams?.get('format') as any) ?? 'standard',
    genre: searchParams?.get('genre') ?? 'fantasy',
    tropes: [],
    creativity: 0.7,
    prompt: searchParams?.get('prompt') ?? '',
    ageRating: 'adults',
    style: 'literary',
    protagonist: '',
    setting: '',
    conflict: '',
  });
  const [inks, setInks] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDone, setStoryDone] = useState(false);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedCharId, setSelectedCharId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/balance')
        .then((r) => r?.json?.())
        .then((d: any) => setInks(d?.inks ?? 0))
        .catch(() => {});
      fetch('/api/characters')
        .then((r) => r?.json?.())
        .then((d: any) => setCharacters(d ?? []))
        .catch(() => {});
    }
  }, [status]);

  // Preload TTS voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const handler = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', handler);
    }
  }, []);

  const formatInfo = FORMAT_CONFIG[config?.format ?? 'standard'] ?? FORMAT_CONFIG.standard;
  const inksCost = continueId ? 3 : (formatInfo?.inks ?? 5);
  const canGenerate = (inks >= inksCost) && !generating;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setStoryText('');
    setStoryTitle('');
    setStoryDone(false);
    setError('');

    try {
      const body: any = { ...config };
      if (selectedCharId) body.characterId = selectedCharId;
      if (continueId) body.continueStoryId = continueId;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res?.ok) {
        const errData = await res?.json?.().catch(() => ({}));
        setError(errData?.error ?? 'Generation failed');
        setGenerating(false);
        return;
      }

      const reader = res?.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = '';
      let fullText = '';

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
                fullText += parsed?.content ?? '';
                setStoryText(fullText);
                if (contentRef?.current) {
                  contentRef.current.scrollTop = contentRef.current.scrollHeight;
                }
              } else if (parsed?.type === 'done') {
                setStoryTitle(parsed?.title ?? '');
                setStoryDone(true);
                setInks((prev) => Math.max(0, prev - (parsed?.inksCost ?? inksCost)));
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Generate error:', err);
      setError('Connection error');
    } finally {
      setGenerating(false);
    }
  }, [canGenerate, config, inksCost, selectedCharId, continueId]);

  const toggleTrope = useCallback((value: string) => {
    setConfig((prev) => {
      const current = prev?.tropes ?? [];
      const exists = current.includes(value);
      return {
        ...(prev ?? {}),
        tropes: exists ? current.filter((t: string) => t !== value) : [...current, value],
      } as StoryConfig;
    });
  }, []);

  const toggleSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !window?.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const fullText = storyText ?? '';
    const maxChunk = 2000;
    const chunks: string[] = [];
    for (let i = 0; i < fullText.length; i += maxChunk) {
      chunks.push(fullText.slice(i, i + maxChunk));
    }
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith('en') && v.name.includes('Google'))
      ?? voices.find((v) => v.lang.startsWith('en-US'))
      ?? voices.find((v) => v.lang.startsWith('en'));
    chunks.forEach((chunk, idx) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      if (englishVoice) utterance.voice = englishVoice;
      if (idx === chunks.length - 1) utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    });
    setIsSpeaking(true);
  }, [isSpeaking, storyText]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator?.clipboard?.writeText?.(storyText ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [storyText]);

  if (status === 'loading') {
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => router.push('/')}
            className="mb-4 flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {continueId && (
            <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-300">
              📝 Continuing a story &mdash; the AI will pick up where you left off. Cost: 3 🖋️
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Config panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sliders className="h-5 w-5 text-purple-400" />
                  <h2 className="font-display font-bold text-white">Settings</h2>
                </div>

                {/* Format */}
                <div className="mb-4">
                  <label className="text-xs text-white/50 mb-2 block">Format</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.entries(FORMAT_CONFIG) ?? []).map(([key, val]: [string, any]) => (
                      <button
                        key={key}
                        onClick={() => setConfig((p) => ({ ...(p ?? {} as StoryConfig), format: key as any }))}
                        className={`rounded-xl border p-2.5 text-center transition-all ${
                          config?.format === key
                            ? 'border-purple-500/50 bg-purple-500/10 text-white'
                            : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20'
                        }`}
                      >
                        <span className="text-lg block mb-0.5">{val?.emoji ?? ''}</span>
                        <span className="text-[10px] block">{val?.label ?? ''}</span>
                        <span className="text-[10px] text-purple-400 font-mono block mt-0.5">
                          {val?.inks ?? 0} 🖋️
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genre */}
                <div className="mb-4">
                  <label className="text-xs text-white/50 mb-2 block">Genre</label>
                  <div className="flex flex-wrap gap-2">
                    {(GENRES ?? []).map((g: any) => (
                      <button
                        key={g?.value}
                        onClick={() => setConfig((p) => ({ ...(p ?? {} as StoryConfig), genre: g?.value ?? '' }))}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                          config?.genre === g?.value
                            ? 'border-purple-500/50 bg-purple-500/10 text-white'
                            : 'border-white/10 text-white/50 hover:border-white/20'
                        }`}
                      >
                        <span>{g?.emoji ?? ''}</span>
                        {g?.label ?? ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Rating */}
                <div className="mb-4">
                  <label className="text-xs text-white/50 mb-2 block">Age Rating</label>
                  <div className="flex gap-2">
                    {(AGE_RATINGS ?? []).map((a: any) => (
                      <button
                        key={a?.value}
                        onClick={() => setConfig((p) => ({ ...(p ?? {} as StoryConfig), ageRating: a?.value ?? 'adults' }))}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                          config?.ageRating === a?.value
                            ? 'border-purple-500/50 bg-purple-500/10 text-white'
                            : 'border-white/10 text-white/50 hover:border-white/20'
                        }`}
                      >
                        <span>{a?.emoji ?? ''}</span>
                        {a?.label ?? ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Writing Style */}
                <div className="mb-4">
                  <label className="text-xs text-white/50 mb-2 block">Writing Style</label>
                  <div className="flex flex-wrap gap-2">
                    {(STYLES ?? []).map((s: any) => (
                      <button
                        key={s?.value}
                        onClick={() => setConfig((p) => ({ ...(p ?? {} as StoryConfig), style: s?.value ?? 'literary' }))}
                        className={`rounded-xl border px-3 py-1.5 text-xs transition-all ${
                          config?.style === s?.value
                            ? 'border-purple-500/50 bg-purple-500/10 text-white'
                            : 'border-white/10 text-white/50 hover:border-white/20'
                        }`}
                      >
                        {s?.label ?? ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tropes */}
                <div className="mb-4">
                  <label className="text-xs text-white/50 mb-2 block">Tropes</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(TROPES ?? []).map((t: any) => {
                      const isSelected = (config?.tropes ?? []).includes(t?.value);
                      return (
                        <button
                          key={t?.value}
                          onClick={() => toggleTrope(t?.value ?? '')}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] transition-all ${
                            isSelected
                              ? 'border-pink-500/50 bg-pink-500/10 text-pink-300'
                              : 'border-white/10 text-white/40 hover:border-white/20'
                          }`}
                        >
                          {t?.label ?? ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Character Selector */}
                {(characters?.length ?? 0) > 0 && (
                  <div className="mb-4">
                    <label className="text-xs text-white/50 mb-2 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Character
                    </label>
                    <select
                      value={selectedCharId}
                      onChange={(e) => setSelectedCharId(e?.target?.value ?? '')}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                    >
                      <option value="" className="bg-[#111]">No character</option>
                      {(characters ?? []).map((c: CharacterData) => (
                        <option key={c.id} value={c.id} className="bg-[#111]">{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Advanced toggle */}
                <button
                  onClick={() => setShowAdvanced((p) => !p)}
                  className="mb-3 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  {showAdvanced ? '▲ Hide advanced' : '▼ Show advanced options'}
                </button>

                {showAdvanced && (
                  <div className="space-y-3 mb-4">
                    {/* Protagonist */}
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Protagonist</label>
                      <input
                        type="text"
                        value={config?.protagonist ?? ''}
                        onChange={(e) => setConfig((p) => ({ ...(p ?? {} as StoryConfig), protagonist: e?.target?.value ?? '' }))}
                        placeholder="e.g. A young inventor with a secret..."
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                      />
                    </div>
                    {/* Setting */}
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Setting</label>
                      <input
                        type="text"
                        value={config?.setting ?? ''}
                        onChange={(e) => setConfig((p) => ({ ...(p ?? {} as StoryConfig), setting: e?.target?.value ?? '' }))}
                        placeholder="e.g. A floating city above the clouds..."
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                      />
                    </div>
                    {/* Conflict */}
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Central Conflict</label>
                      <input
                        type="text"
                        value={config?.conflict ?? ''}
                        onChange={(e) => setConfig((p) => ({ ...(p ?? {} as StoryConfig), conflict: e?.target?.value ?? '' }))}
                        placeholder="e.g. Must choose between duty and love..."
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                      />
                    </div>
                    {/* Creativity slider */}
                    <div>
                      <label className="text-xs text-white/50 mb-2 flex items-center justify-between">
                        <span>Creativity</span>
                        <span className="font-mono text-purple-400">{(config?.creativity ?? 0.7).toFixed?.(1) ?? '0.7'}</span>
                      </label>
                      <input
                        type="range"
                        min="0.2"
                        max="0.9"
                        step="0.1"
                        value={config?.creativity ?? 0.7}
                        onChange={(e) => setConfig((p) => ({ ...(p ?? {} as StoryConfig), creativity: parseFloat(e?.target?.value ?? '0.7') }))}
                        className="w-full accent-purple-500"
                      />
                      <div className="flex justify-between text-[10px] text-white/30 mt-1">
                        <span>🧠 Logical</span>
                        <span>Unpredictable 🌊</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prompt */}
                <div className="mb-4">
                  <label className="text-xs text-white/50 mb-2 block">Your Idea</label>
                  <textarea
                    value={config?.prompt ?? ''}
                    onChange={(e) => setConfig((p) => ({ ...(p ?? {} as StoryConfig), prompt: e?.target?.value ?? '' }))}
                    placeholder="Describe your story idea..."
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-none"
                  />
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      {continueId ? 'Continue Story' : 'Create Story'}
                      <span className="ml-1 rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-mono">
                        {inksCost} 🖋️
                      </span>
                    </>
                  )}
                </button>

                {inks < inksCost && !generating && (
                  <p className="mt-2 text-center text-xs text-red-400">
                    Not enough Inks (available: {inks})
                  </p>
                )}
              </div>
            </div>

            {/* Story output */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm min-h-[500px] flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-cyan-400" />
                    <h2 className="font-display font-bold text-white">
                      {storyTitle || 'Output'}
                    </h2>
                  </div>
                  {storyText && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={toggleSpeech}
                        className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={handleCopy}
                        className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>

                <div
                  ref={contentRef}
                  className="flex-1 overflow-y-auto p-5 sm:p-8"
                  style={{ maxHeight: '600px' }}
                >
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {!storyText && !generating && !error && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        <Wand2 className="h-8 w-8 text-purple-400" />
                      </div>
                      <p className="text-white/40 text-sm mb-1">Set your preferences and hit "Create"</p>
                      <p className="text-white/25 text-xs">AI will write a story just for you</p>
                    </div>
                  )}

                  {generating && !storyText && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-3" />
                      <p className="text-white/50 text-sm">Crafting your story...</p>
                    </div>
                  )}

                  {storyText && (
                    <div className="prose prose-invert max-w-none">
                      {(storyText ?? '').split('\n').map((para: string, i: number) => (
                        <p key={i} className="text-white/80 text-sm sm:text-base leading-relaxed mb-4">
                          {para}
                        </p>
                      ))}
                      {generating && (
                        <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-0.5" />
                      )}
                    </div>
                  )}

                  {storyDone && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3"
                    >
                      <span className="text-sm">🖋️</span>
                      <span className="text-xs text-green-400">Story saved!</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export function StudioClient() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a0f' }}>
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    }>
      <StudioInner />
    </Suspense>
  );
}

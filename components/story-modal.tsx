'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check, ArrowRight, FileText, Headphones } from 'lucide-react';
import { useState, useCallback } from 'react';
import { AudioPlayer } from '@/components/audio-player';
import type { StoryData } from '@/lib/types';

interface StoryModalProps {
  story: StoryData;
  onClose: () => void;
  onContinue?: (story: StoryData) => void;
}

export function StoryModal({ story, onClose, onContinue }: StoryModalProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator?.clipboard?.writeText?.(story?.content ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [story?.content]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator?.share) {
        await navigator.share({
          title: story?.title ?? 'VibeScribe',
          text: (story?.content ?? '').slice(0, 200),
        });
      }
    } catch { /* ignore */ }
  }, [story?.title, story?.content]);

  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: story?.id }),
      });
      if (res?.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(story?.title ?? 'story').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const err = await res?.json?.().catch(() => ({}));
        alert(err?.error ?? 'Export failed');
      }
    } catch {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  }, [story?.id, story?.title]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="relative w-full max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#111118] overflow-hidden"
          onClick={(e: React.MouseEvent) => e?.stopPropagation?.()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111118]/90 px-5 py-3 backdrop-blur-sm">
            <h2 className="font-display font-bold text-white text-base sm:text-lg line-clamp-1 pr-2">
              {story?.title ?? 'Story'}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowPlayer((p) => !p)}
                className={`rounded-lg p-2 transition-colors ${
                  showPlayer ? 'bg-purple-500/20 text-purple-400' : 'text-white/50 hover:bg-white/10 hover:text-white'
                }`}
                title="Listen"
              >
                <Headphones className="h-4 w-4" />
              </button>
              <button
                onClick={handleCopy}
                className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                title="Copy text"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                onClick={handleShare}
                className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Audio Player */}
          <AnimatePresence>
            {showPlayer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-white/10"
              >
                <div className="p-3">
                  <AudioPlayer
                    text={story?.content ?? ''}
                    title={story?.title}
                    onClose={() => setShowPlayer(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="overflow-y-auto p-5 sm:p-8" style={{ maxHeight: showPlayer ? 'calc(90vh - 340px)' : 'calc(90vh - 120px)' }}>
            <div className="prose prose-invert max-w-none">
              {(story?.content ?? '').split('\n').map((para: string, i: number) => (
                <p key={i} className="text-white/80 text-sm sm:text-base leading-relaxed mb-4">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="sticky bottom-0 border-t border-white/10 bg-[#111118]/90 px-5 py-3 backdrop-blur-sm flex items-center gap-2">
            {onContinue && (
              <button
                onClick={() => onContinue(story)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:scale-[1.02] active:scale-95"
              >
                <ArrowRight className="h-4 w-4" />
                Continue
                <span className="text-[10px] font-mono opacity-70">3 🖋️</span>
              </button>
            )}
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export PDF'}
              <span className="text-[10px] font-mono opacity-70">2 🖋️</span>
            </button>
            {!showPlayer && (
              <button
                onClick={() => setShowPlayer(true)}
                className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300 transition-all hover:bg-purple-500/20"
              >
                <Headphones className="h-4 w-4" />
                Listen
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

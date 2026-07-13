'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X, BookOpen, PenTool, Users, Crown, Gift } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { data: session } = useSession() || {};
  const [inks, setInks] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/balance')
        .then((r) => r?.json?.())
        .then((d: any) => {
          setInks(d?.inks ?? 0);
          if (d?.referralCode) setReferralCode(d.referralCode);
        })
        .catch(() => {});
    }
  }, [session?.user]);

  const handleGetReferralCode = async () => {
    if (referralCode) {
      setShowReferral(true);
      return;
    }
    try {
      const res = await fetch('/api/referral', { method: 'POST' });
      if (res?.ok) {
        const data = await res.json();
        setReferralCode(data?.code ?? '');
        setShowReferral(true);
      }
    } catch (e) {
      console.error('Referral error:', e);
    }
  };

  const copyReferralLink = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      await navigator.clipboard.writeText(`${baseUrl}/login?ref=${referralCode}`);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    } catch { /* ignore */ }
  };

  if (!session?.user) return null;

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 w-full"
      >
        <div className="mx-auto max-w-[1200px] px-4 py-3">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <PenTool className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                VibeScribe
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                <BookOpen className="h-4 w-4" />
                Stories
              </Link>
              <Link
                href="/characters"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Users className="h-4 w-4" />
                Characters
              </Link>
              <Link
                href="/studio"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-purple-500/25"
              >
                <PenTool className="h-4 w-4" />
                Create
              </Link>

              {/* Invite Friend */}
              <button
                onClick={handleGetReferralCode}
                className="flex items-center gap-1.5 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-sm text-green-300 transition-all hover:bg-green-500/20"
              >
                <Gift className="h-4 w-4" />
                <span className="hidden lg:inline">Invite</span>
              </button>

              {/* Subscription */}
              <Link
                href="/subscribe"
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-300 transition-all hover:bg-amber-500/20"
              >
                <Crown className="h-4 w-4" />
                <span className="hidden lg:inline">Pro</span>
              </Link>

              {/* Inks */}
              <div className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5">
                <span className="text-sm">🖋️</span>
                <span className="text-sm font-mono font-bold text-purple-300">{inks}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="rounded-xl p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2 py-1">
                <span className="text-xs">🖋️</span>
                <span className="text-xs font-mono font-bold text-purple-300">{inks}</span>
              </div>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/5"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 rounded-2xl border border-white/10 bg-black/80 p-3 backdrop-blur-xl md:hidden"
            >
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-white/70 hover:bg-white/5 hover:text-white"
              >
                <BookOpen className="h-4 w-4" />
                My Stories
              </Link>
              <Link
                href="/characters"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-white/70 hover:bg-white/5 hover:text-white"
              >
                <Users className="h-4 w-4" />
                Characters
              </Link>
              <Link
                href="/studio"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-white/70 hover:bg-white/5 hover:text-white"
              >
                <PenTool className="h-4 w-4" />
                Create Story
              </Link>
              <button
                onClick={() => { setMenuOpen(false); handleGetReferralCode(); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-green-300 hover:bg-white/5"
              >
                <Gift className="h-4 w-4" />
                Invite Friend &mdash; Get 20 🖋️
              </button>
              <Link
                href="/subscribe"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-amber-300 hover:bg-white/5"
              >
                <Crown className="h-4 w-4" />
                Upgrade to Pro
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-red-400 hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Referral Modal */}
      <AnimatePresence>
        {showReferral && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowReferral(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111118] p-6"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <Gift className="h-7 w-7 text-green-400" />
                </div>
                <h3 className="font-display text-xl font-bold text-white">Invite a Friend</h3>
                <p className="mt-2 text-sm text-white/50">
                  Share your referral link. Both you and your friend get <span className="text-green-400 font-semibold">20 free Inks</span> 🖋️ when they sign up!
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 mb-4">
                <p className="text-xs text-white/40 mb-1">Your referral link</p>
                <p className="text-sm text-white font-mono break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/login?ref={referralCode}
                </p>
              </div>

              <button
                onClick={copyReferralLink}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95"
              >
                {referralCopied ? 'Copied!' : 'Copy Link'}
              </button>

              <button
                onClick={() => setShowReferral(false)}
                className="mt-3 w-full text-center text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

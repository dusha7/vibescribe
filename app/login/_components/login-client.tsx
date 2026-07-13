'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Mail, Lock, User, Loader2, ArrowRight, Gift, KeyRound } from 'lucide-react';
import Link from 'next/link';

function LoginInner() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams?.get('ref') ?? '';

  const [mode, setMode] = useState<'login' | 'signup'>(refCode ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referrerName, setReferrerName] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  // Validate referral code
  useEffect(() => {
    if (refCode) {
      fetch(`/api/referral?code=${refCode}`)
        .then((r) => r?.json?.())
        .then((d: any) => {
          if (d?.valid) setReferrerName(d?.referrerName ?? 'A friend');
        })
        .catch(() => {});
    }
  }, [refCode]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch {
      setForgotSent(true); // Show success anyway to prevent enumeration
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: name || undefined, referralCode: refCode || undefined }),
        });
        const data = await res?.json?.();
        if (!res?.ok) {
          setError(data?.error ?? 'Signup failed');
          setLoading(false);
          return;
        }
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        if (result?.ok) {
          router.replace('/');
        } else {
          setError('Login failed after signup');
        }
      } else {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        if (result?.ok) {
          router.replace('/');
        } else {
          setError('Invalid email or password');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a0f' }}>
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (status === 'authenticated') return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.1),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
            <PenTool className="h-7 w-7 text-white" />
          </div>
          <Link href="/" className="font-display text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            VibeScribe
          </Link>
          <p className="mt-1 text-sm text-white/50">Create stories with AI 🖋️</p>
        </div>

        {/* Referral banner */}
        {refCode && referrerName && mode === 'signup' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-center"
          >
            <Gift className="inline h-4 w-4 text-green-400 mr-1" />
            <span className="text-sm text-green-300">
              {referrerName} invited you! Sign up to get <span className="font-bold">70 free Inks</span> 🖋️
            </span>
          </motion.div>
        )}

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          {/* Google SSO */}
          <button
            onClick={() => signIn('google', { redirect: true, callbackUrl: '/' })}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/30">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Toggle */}
          <div className="mb-4 flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                mode === 'login'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e?.target?.value ?? '')}
                  placeholder="Name"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e?.target?.value ?? '')}
                placeholder="Email"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e?.target?.value ?? '')}
                placeholder="Password"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
              />
            </div>

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setForgotEmail(email); setForgotSent(false); setError(''); }}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-white/30">
            <span className="mr-1">🖋️</span>
            {refCode && referrerName ? '50 + 20 bonus Inks on sign up!' : '50 free Inks on sign up'}
          </p>
        </div>
      </motion.div>

      {/* Forgot password modal */}
      {forgotMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setForgotMode(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#12121a] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <KeyRound className="mx-auto h-10 w-10 text-purple-400 mb-3" />
              <h3 className="text-lg font-semibold text-white">Reset Password</h3>
            </div>

            {forgotSent ? (
              <div className="text-center py-2">
                <p className="text-sm text-green-400 mb-1">✓ Reset link sent!</p>
                <p className="text-xs text-white/50 mb-4">Check your email inbox (and spam folder) for the reset link.</p>
                <button
                  onClick={() => setForgotMode(false)}
                  className="w-full rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white hover:bg-white/15 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-xs text-white/50 text-center">Enter your email and we&apos;ll send you a reset link.</p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="w-full text-xs text-white/40 hover:text-white/60 transition-colors py-1"
                >
                  Cancel
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

export function LoginClient() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a0f' }}>
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    }>
      <LoginInner />
    </Suspense>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { PenTool, Lock, Loader2, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

function ResetInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      return;
    }
    fetch(`/api/reset-password?token=${token}`)
      .then((r) => r.json())
      .then((d: any) => {
        setTokenValid(d?.valid === true);
        if (d?.email) setEmail(d.email);
      })
      .catch(() => setTokenValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data?.error ?? 'Reset failed');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a0f' }}>
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.1),transparent_50%)]" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
            <PenTool className="h-7 w-7 text-white" />
          </div>
          <Link href="/" className="font-display text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            VibeScribe
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">Password Reset!</h2>
              <p className="text-sm text-white/50 mb-6">Your password has been successfully updated.</p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                Sign In <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : !token || !tokenValid ? (
            <div className="text-center py-4">
              <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">Invalid Reset Link</h2>
              <p className="text-sm text-white/50 mb-6">This password reset link is invalid or has expired.</p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                Back to Login <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white text-center mb-1">Set New Password</h2>
              {email && <p className="text-xs text-white/40 text-center mb-4">{email}</p>}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                  />
                </div>
                {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function ResetPasswordClient() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a0f' }}>
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    }>
      <ResetInner />
    </Suspense>
  );
}

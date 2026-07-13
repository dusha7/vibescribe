'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Check, Zap, Star, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    emoji: '\u2728',
    gradient: 'from-gray-600 to-gray-700',
    borderColor: 'border-white/10',
    features: [
      '50 Inks on signup',
      'All genres & tropes',
      'Web Speech TTS',
      'PDF export',
      'Character creator',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    emoji: '\ud83d\udc8e',
    gradient: 'from-purple-600 to-pink-600',
    borderColor: 'border-purple-500/30',
    popular: true,
    features: [
      '500 Inks / month',
      'Premium AI voices',
      'Priority generation',
      'EPUB & MP3 export',
      'Unlimited characters',
      'Story series management',
    ],
    cta: 'Coming Soon',
    disabled: true,
  },
  {
    name: 'Studio',
    price: '$24.99',
    period: '/month',
    emoji: '\ud83c\udfa5',
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/30',
    features: [
      '2000 Inks / month',
      'All Pro features',
      'AI illustrations',
      'Multi-voice narration',
      'Community library access',
      'API access',
    ],
    cta: 'Coming Soon',
    disabled: true,
  },
];

export function SubscribeClient() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [inks, setInks] = useState(0);

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
    }
  }, [status]);

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
      <main className="mx-auto max-w-[1000px] px-4 pb-16 pt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => router.push('/')}
            className="mb-6 flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="text-center mb-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Crown className="h-7 w-7 text-amber-400" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">Upgrade Your Writing</h1>
            <p className="text-white/50 max-w-md mx-auto">
              Unlock premium features, more Inks, and AI-powered tools to take your stories to the next level.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2">
              <span>🖋️</span>
              <span className="text-sm text-purple-300">Current balance: <span className="font-mono font-bold">{inks}</span> Inks</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border ${plan.borderColor} bg-white/[0.03] p-6 backdrop-blur-sm ${
                  plan.popular ? 'ring-2 ring-purple-500/30' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-0.5 text-xs font-medium text-white">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-5">
                  <span className="text-3xl">{plan.emoji}</span>
                  <h3 className="font-display text-xl font-bold text-white mt-2">{plan.name}</h3>
                  <div className="mt-1">
                    <span className="text-2xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-white/40">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 shrink-0 text-green-400 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled={plan.disabled}
                  className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all ${
                    plan.popular && !plan.disabled
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
                      : plan.disabled
                      ? 'border border-white/10 bg-white/5 text-white/40 cursor-not-allowed'
                      : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-white/30">
            Paid plans coming soon. Stay tuned for premium features!
          </p>
        </motion.div>
      </main>
    </div>
  );
}

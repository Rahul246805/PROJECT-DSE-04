import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle.jsx';

const MotionSection = motion.section;

const AUTH_FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Clerk-secured sessions',
    description: 'Production-ready auth flows with protected routes and durable session handling.',
  },
  {
    icon: Sparkles,
    title: 'Premium AI aesthetic',
    description: 'Glass surfaces, neon accents, motion polish, and a focused dark product feel.',
  },
  {
    icon: Zap,
    title: 'Faster entry to chat',
    description: 'Users move directly from auth into the Mate.AI dashboard and conversation workspace.',
  },
];

const AUTH_METHODS = [
  'Google sign in',
  'GitHub sign in',
  'Phone OTP login',
  'Email and password',
];

const AuthShell = ({ title, subtitle, children, mode = 'sign-in' }) => {
  return (
    <div className="auth-backdrop min-h-screen overflow-hidden">
      <div className="section-shell flex min-h-screen flex-col py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(139,92,246,0.25))] text-cyan-300">
              <Bot size={16} />
            </div>
            <span>Mate.AI</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="landing-grid flex-1 items-stretch">
          <MotionSection
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="glass-panel relative col-span-12 overflow-hidden rounded-[32px] p-8 sm:p-10 lg:col-span-7"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_100%_0%,rgba(139,92,246,0.16),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(34,211,238,0.08),transparent_32%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
                  {mode === 'sign-up' ? 'Create your account' : 'Secure AI access'}
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(139,92,246,0.22))] text-cyan-200 shadow-[0_0_50px_rgba(34,211,238,0.18)]">
                      <Bot size={24} />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-semibold text-white">Mate.AI</p>
                      <p className="text-sm text-slate-400">Your Intelligent AI Companion</p>
                    </div>
                  </div>

                  <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
                    {title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                    {subtitle}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {AUTH_METHODS.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {AUTH_FEATURES.map((feature) => (
                  <article key={feature.title} className="rounded-[22px] border border-white/10 bg-black/15 p-5">
                    <feature.icon className="mb-4 text-cyan-300" size={20} />
                    <h2 className="text-base font-semibold text-white">{feature.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </MotionSection>

          <MotionSection
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="col-span-12 flex items-center justify-center lg:col-span-5"
          >
            <div className="auth-card-shell glass-card relative w-full max-w-[470px] rounded-[32px] p-6 sm:p-8">
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="font-display text-2xl font-semibold text-white">Mate.AI Access</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Sign in securely to continue to your dashboard.
                  </p>
                </div>
                <div className="hidden rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-fuchsia-200 sm:block">
                  AI Secure
                </div>
              </div>
              {children}
            </div>
          </MotionSection>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;

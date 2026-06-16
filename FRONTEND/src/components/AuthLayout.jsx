import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BotMessageSquare, ShieldCheck, Sparkles, TimerReset, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

const MotionSection = motion.section;

const AuthLayout = ({ title, subtitle, children, footer, badge = 'Mate.ai access', points = [] }) => {
  const trustStats = [
    { value: 'JWT', label: 'session auth' },
    { value: 'Live', label: 'workspace sync' },
    { value: '24/7', label: 'demo access' },
  ];

  return (
    <div className="auth-backdrop min-h-screen">
      <div className="section-shell flex min-h-screen flex-col py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: 'var(--app-text-soft)' }}
          >
            <ArrowLeft size={16} />
            Back to portfolio
          </Link>
          <ThemeToggle />
        </div>

        <div className="landing-grid flex-1 items-stretch">
          <MotionSection
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="glass-panel relative col-span-12 overflow-hidden rounded-[24px] p-8 sm:p-10 lg:col-span-7"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(152,184,171,0.1),transparent_30%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="section-kicker">{badge}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--app-text-muted)' }}>
                    Secure access layer
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="text-sm uppercase tracking-[0.28em]" style={{ color: 'var(--app-text-muted)' }}>
                    Secure conversations for modern teams
                  </p>
                  <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
                    Authentication that feels like part of the product, not a detour.
                  </h1>
                  <p className="max-w-2xl text-base sm:text-lg" style={{ color: 'var(--app-text-soft)' }}>
                    Mate.ai blends calm visuals, practical security, and fast workspace access so people move from first impression to real usage without friction.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {trustStats.map((item) => (
                    <div key={item.label} className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                      <p className="font-display text-2xl font-semibold text-[var(--app-accent)]">{item.value}</p>
                      <p className="mt-2 text-sm" style={{ color: 'var(--app-text-muted)' }}>
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: Sparkles, title: 'Designed for trust', text: 'A polished interface with quieter contrast, better spacing, and clearer intent cues.' },
                  { icon: ShieldCheck, title: 'Safer auth', text: 'JWT sessions, password hashing, reset tokens, and protected routes.' },
                  { icon: Workflow, title: 'Real product flow', text: 'Public pages, sign-in, recovery, and workspace routing now feel connected.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                    <item.icon className="mb-3 text-white" size={20} />
                    <h2 className="mb-2 text-sm font-semibold">{item.title}</h2>
                    <p className="text-sm leading-6" style={{ color: 'var(--app-text-muted)' }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-[var(--app-accent-soft)] p-3 text-[var(--app-accent)]">
                    <TimerReset size={20} />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em]" style={{ color: 'var(--app-text-muted)' }}>
                      Experience note
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-7" style={{ color: 'var(--app-text-soft)' }}>
                      Loading, redirect, and recovery states are surfaced intentionally so users always know whether the system is verifying access, restoring a session, or waiting on input.
                    </p>
                  </div>
                </div>
              </div>

              {points.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {points.map((point) => (
                    <div key={point} className="rounded-[16px] border border-white/8 bg-black/10 px-4 py-3 text-sm">
                      {point}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </MotionSection>

          <MotionSection
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="glass-card col-span-12 flex items-center rounded-[24px] p-6 sm:p-8 lg:col-span-5"
          >
            <div className="mx-auto w-full max-w-[400px] space-y-6">
              <div className="space-y-2">
                <h2 className="font-display text-3xl font-semibold">{title}</h2>
                <p style={{ color: 'var(--app-text-soft)' }}>{subtitle}</p>
              </div>
              {children}
              {footer ? <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>{footer}</div> : null}
            </div>
          </MotionSection>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

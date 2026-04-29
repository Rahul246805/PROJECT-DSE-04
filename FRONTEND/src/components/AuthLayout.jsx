import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BotMessageSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

const AuthLayout = ({ title, subtitle, children, footer, badge = 'Mate.ai access', points = [] }) => {
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
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="glass-panel relative col-span-12 overflow-hidden rounded-[24px] p-8 sm:p-10 lg:col-span-7"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_30%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="space-y-5">
                <span className="section-kicker">{badge}</span>
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.28em]" style={{ color: 'var(--app-text-muted)' }}>
                    Secure conversations for modern teams
                  </p>
                  <h1 className="max-w-xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
                    Smart conversations. Real product polish.
                  </h1>
                  <p className="max-w-xl text-base sm:text-lg" style={{ color: 'var(--app-text-soft)' }}>
                    Mate.ai combines a refined portfolio presence, secure authentication, and a fast chat workspace in one deployable product.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: Sparkles, title: 'Modern UI', text: 'Glassmorphism, motion, and responsive sections tuned for mobile and desktop.' },
                  { icon: ShieldCheck, title: 'Safer auth', text: 'JWT sessions, password hashing, reset tokens, and protected routes.' },
                  { icon: BotMessageSquare, title: 'Live workspace', text: 'A portfolio that transitions into a working Mate.ai chat dashboard.' },
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
          </motion.section>

          <motion.section
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
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

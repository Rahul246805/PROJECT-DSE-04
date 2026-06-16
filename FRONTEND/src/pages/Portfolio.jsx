import React from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCheck,
  Database,
  Globe,
  LayoutDashboard,
  Linkedin,
  Lock,
  Mail,
  Menu,
  MessageSquareText,
  MoonStar,
  Send,
  Server,
  ServerCog,
  Sparkles,
  SunMedium,
  UserRound,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  fetchApiHealth,
  getErrorMessage,
  submitContactForm,
} from '../components/chat/aiClient.js';
import { clerkAppearance } from '../lib/clerk.js';
import { AuthSignedIn, AuthSignedOut, AuthUserButton, useAppAuth } from '../lib/auth.jsx';
import { applyTheme, getStoredTheme } from '../lib/theme.js';
import { validateEmail, validateName } from '../lib/validation.js';

const MotionDiv = motion.div;
const MotionArticle = motion.article;

const navItems = [
  ['about', 'About'],
  ['features', 'Features'],
  ['demo', 'Live Demo'],
  ['stack', 'Tech Stack'],
  ['showcase', 'Showcase'],
  ['contact', 'Contact'],
];

const features = [
  {
    icon: MessageSquareText,
    title: 'Real-time chat',
    description: 'Fast, conversation-first messaging with saved history, retry flows, and a calmer workspace shell.',
  },
  {
    icon: BrainCircuit,
    title: 'Fast response AI',
    description: 'AI replies are generated through a dedicated backend service layer built for consistent request handling.',
  },
  {
    icon: Sparkles,
    title: 'Clean UI',
    description: 'The portfolio and dashboard now share the same softer premium workspace tone and responsive spacing.',
  },
  {
    icon: Lock,
    title: 'Authentication system',
    description: 'JWT-based login, signup, protected routes, logout, and secure password reset support.',
  },
  {
    icon: ServerCog,
    title: 'Scalable architecture',
    description: 'Separated frontend and backend layers with reusable services, controllers, and models for growth.',
  },
];

const stack = [
  { icon: Globe, name: 'React + Vite', detail: 'Responsive frontend and route-based code splitting' },
  { icon: Sparkles, name: 'Tailwind CSS', detail: 'Custom muted-glass design system inspired by your workspace reference' },
  { icon: Server, name: 'Node.js + Express', detail: 'REST APIs, auth flows, contact delivery, and chat routes' },
  { icon: Database, name: 'MongoDB', detail: 'User, chat, message, and contact persistence' },
  { icon: Lock, name: 'JWT + bcrypt', detail: 'Session tokens, route protection, and password hashing' },
  { icon: Bot, name: 'AI Service Layer', detail: 'Model orchestration and resilient chat response handling' },
];

const showcaseItems = [
  {
    title: 'Workspace-style portfolio theme',
    text: 'The portfolio now follows the same dark softened palette and low-glare surfaces as the app workspace.',
    image: '/showcase/pro-web.png',
  },
  {
    title: 'Responsive authentication access',
    text: 'Login and signup are promoted throughout the portfolio so visitors can immediately enter the product.',
    image: '/showcase/pro-web.png',
  },
];

const quickStats = [
  ['JWT auth', 'Protected routes and secure session storage'],
  ['Live chat', 'Saved history with backend persistence'],
  ['Responsive UX', 'Optimized for desktop, tablet, and mobile'],
];

const trustHighlights = [
  'Production-style auth and recovery flows',
  'Persistent chat sessions backed by MongoDB',
  'Designer-led UI with realistic product framing',
];

const experienceMetrics = [
  { value: '3', label: 'entry paths', detail: 'Sign up, sign in, or open a guest demo in one click.' },
  { value: '100%', label: 'responsive', detail: 'Layouts and messaging are tuned across desktop, tablet, and mobile.' },
  { value: '1', label: 'shared system', detail: 'Public site, auth, and app now speak the same visual language.' },
];

const socialLinks = {
  linkedin: import.meta.env.VITE_LINKEDIN_URL || 'https://www.linkedin.com/',
};

const Portfolio = () => {
  const { isSignedIn } = useAppAuth();
  const heroRef = React.useRef(null);
  const previewRef = React.useRef(null);
  const statGridRef = React.useRef(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [theme, setTheme] = React.useState(() => getStoredTheme());
  const [contact, setContact] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [healthStatus, setHealthStatus] = React.useState({
    label: 'Checking live API',
    detail: 'Verifying backend availability and production routing.',
  });

  React.useEffect(() => {
    document.title = 'Mate.ai | AI Chat Workspace for Planning, Writing and Debugging';
  }, []);

  React.useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('mate_theme', theme);
  }, [theme]);

  React.useEffect(() => {
    let ignore = false;

    async function loadHealth() {
      try {
        const response = await fetchApiHealth();

        if (!ignore) {
          setHealthStatus({
            label: response?.success ? 'Backend online' : 'Backend status unknown',
            detail: response?.message || 'API responded successfully.',
          });
        }
      } catch (error) {
        if (!ignore) {
          setHealthStatus({
            label: 'Backend unavailable',
            detail: getErrorMessage(error),
          });
        }
      }
    }

    loadHealth();

    return () => {
      ignore = true;
    };
  }, []);

  React.useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-gsap="hero-copy"]',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.12,
        }
      );

      gsap.fromTo(
        previewRef.current,
        { opacity: 0, y: 36, scale: 0.96, rotateY: -8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateY: 0,
          duration: 1,
          ease: 'power3.out',
          delay: 0.18,
        }
      );

      gsap.fromTo(
        statGridRef.current?.children || [],
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: 'power2.out',
          delay: 0.28,
        }
      );

      gsap.to('[data-gsap="orb-left"]', {
        x: 16,
        y: -18,
        duration: 4.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('[data-gsap="orb-right"]', {
        x: -18,
        y: 20,
        duration: 5.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContact((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validateContact = () => {
    const nextErrors = {
      name: validateName(contact.name, 'Name'),
      email: validateEmail(contact.email),
      subject: contact.subject.trim() ? '' : 'Subject is required.',
      message: contact.message.trim().length < 20 ? 'Please add a message with at least 20 characters.' : '',
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    if (!validateContact()) {
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');

    try {
      const response = await submitContactForm(contact);
      setSuccessMessage(response.message || 'Thanks for reaching out. Your message has been sent.');
      setContact({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      const message = getErrorMessage(error);
      setErrors((current) => ({ ...current, message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-white/6 bg-[#05090dcc]/90 backdrop-blur-xl">
        <div className="section-shell flex h-18 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[linear-gradient(135deg,#182228,#10171d)] text-[var(--app-accent)] shadow-lg shadow-black/20">
              <Bot size={20} />
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-wide">Mate.ai</p>
              <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                Your workspace
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="text-sm transition hover:text-[var(--app-text)]" style={{ color: 'var(--app-text-soft)' }}>
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className="btn-secondary h-11 w-11 rounded-full p-0"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
            </button>
            <AuthSignedOut>
              <Link to="/login" className="btn-secondary">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Sign up
              </Link>
            </AuthSignedOut>
            <AuthSignedIn>
              <Link to="/app" className="btn-secondary">
                Open dashboard
              </Link>
              <AuthUserButton
                appearance={{
                  ...clerkAppearance,
                  elements: {
                    ...clerkAppearance.elements,
                    avatarBox:
                      'h-11 w-11 rounded-full ring-2 ring-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]',
                    userButtonPopoverCard:
                      'border border-white/10 bg-slate-950/95 text-slate-100 shadow-[0_24px_70px_rgba(2,8,23,0.58)]',
                    userButtonPopoverActionButton:
                      'text-slate-200 hover:bg-white/6 transition-colors duration-200',
                    userButtonPopoverActionButtonText: 'text-slate-200',
                    userButtonPopoverFooter: 'hidden',
                  },
                }}
                afterSignOutUrl="/"
              />
            </AuthSignedIn>
          </div>

          <button
            type="button"
            className="btn-secondary lg:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="section-shell pb-4 lg:hidden">
            <div className="glass-card rounded-3xl p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                  className="btn-secondary h-11 w-full justify-center sm:w-11 sm:p-0"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
                </button>
                <AuthSignedOut>
                  <Link className="btn-secondary flex-1 justify-center" to="/login">
                    Sign in
                  </Link>
                  <Link className="btn-primary flex-1 justify-center" to="/register">
                    Sign up
                  </Link>
                </AuthSignedOut>
                <AuthSignedIn>
                  <Link className="btn-primary flex-1 justify-center" to="/app">
                    Open dashboard
                  </Link>
                </AuthSignedIn>
              </div>
              <div className="flex flex-col gap-3">
                {navItems.map(([id, label]) => (
                  <a key={id} href={`#${id}`} onClick={() => setMobileOpen(false)} className="text-sm" style={{ color: 'var(--app-text-soft)' }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section ref={heroRef} className="section-shell section-block">
          <div className="landing-grid min-h-[calc(100vh-72px)] items-center gap-8">
            <MotionDiv initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="col-span-12 space-y-8 lg:col-span-7">
              <div className="space-y-5">
                <span data-gsap="hero-copy" className="section-kicker">Mate.ai workspace</span>
                <h1 data-gsap="hero-copy" className="max-w-3xl font-display text-5xl font-semibold leading-[0.95] sm:text-6xl lg:text-7xl">
                  Smarter conversations, designed like a real product.
                </h1>
                <p data-gsap="hero-copy" className="max-w-2xl text-lg leading-8" style={{ color: 'var(--app-text-soft)' }}>
                  Mate.ai is an AI chat workspace for support, research, and daily execution. The website now feels less like a demo template and more like a professional SaaS product with clear entry points, better hierarchy, and realistic product framing.
                </p>
              </div>

              <div data-gsap="hero-copy" className="flex flex-wrap gap-4">
                {isSignedIn ? (
                  <Link to="/app" className="btn-primary">
                    Open dashboard
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary">
                      Sign up
                      <ArrowRight size={16} />
                    </Link>
                    <Link to="/login" className="btn-secondary">
                      Sign in
                    </Link>
                  </>
                )}
              </div>

              <div data-gsap="hero-copy" className="glass-card rounded-[28px] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em]" style={{ color: 'var(--app-text-muted)' }}>
                      Product access
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">Move from discovery to a working workspace in seconds.</h2>
                    <p className="mt-3 text-sm leading-6" style={{ color: 'var(--app-text-muted)' }}>
                      {healthStatus.label}: {healthStatus.detail}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {isSignedIn ? (
                      <Link to="/app" className="btn-primary justify-center">
                        Open dashboard
                      </Link>
                    ) : (
                      <>
                        <Link to="/login" className="btn-secondary justify-center">
                          Sign in
                        </Link>
                        <Link to="/register" className="btn-primary justify-center">
                          Sign up
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div data-gsap="hero-copy" className="flex flex-wrap gap-3">
                {trustHighlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm"
                    style={{ color: 'var(--app-text-soft)' }}
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div ref={statGridRef} className="grid gap-4 md:grid-cols-3">
                {quickStats.map(([title, text]) => (
                  <div key={title} className="glass-card rounded-[20px] p-4">
                    <h2 className="mb-2 text-sm font-semibold text-[var(--app-accent)]">{title}</h2>
                    <p className="text-sm leading-6" style={{ color: 'var(--app-text-muted)' }}>
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </MotionDiv>

            <MotionDiv initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.08 }} className="relative col-span-12 lg:col-span-5">
              <div data-gsap="orb-left" className="absolute -left-6 top-8 h-32 w-32 rounded-full bg-[#41514d]/24 blur-3xl" />
              <div data-gsap="orb-right" className="absolute -right-2 bottom-12 h-36 w-36 rounded-full bg-[#243036]/28 blur-3xl" />
              <div ref={previewRef} className="glass-card relative overflow-hidden rounded-[24px] p-5 [transform-style:preserve-3d]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                      <Bot size={20} />
                    </div>
                    <div>
                      <p className="font-semibold">Mate.ai demo</p>
                      <p className="text-sm text-[var(--app-accent)]">Workspace live</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--app-text-muted)' }}>
                    Product preview
                  </div>
                </div>

                <div className="space-y-4 rounded-[28px] border border-white/10 bg-slate-950/35 p-4">
                  <div className="ml-auto max-w-[78%] rounded-[24px] rounded-br-md bg-gradient-to-br from-[#70837d] to-[#93a6a0] px-4 py-3 text-sm text-[#081012] shadow-lg shadow-black/20">
                    Hi Mate.ai, how can you help my product team today?
                  </div>
                  <div className="max-w-[82%] rounded-[24px] rounded-bl-md bg-white/7 px-4 py-3 text-sm leading-7" style={{ color: 'var(--app-text-soft)' }}>
                    I can help with support automation, onboarding flows, FAQ generation, product research, customer response drafting, and saved conversation history for logged-in users.
                  </div>
                  <div className="ml-auto max-w-[74%] rounded-[24px] rounded-br-md bg-gradient-to-br from-[#60716e] to-[#7d9089] px-4 py-3 text-sm text-[#081012]">
                    Show me the stack and security setup.
                  </div>
                  <div className="flex max-w-[82%] items-center gap-2 rounded-[24px] rounded-bl-md bg-white/7 px-4 py-3 text-sm" style={{ color: 'var(--app-text-soft)' }}>
                    <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--app-accent)]" />
                    React, Node.js, MongoDB, JWT auth, bcrypt hashing, protected routes, and reset-token workflows.
                  </div>
                  <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/4 px-4 py-3">
                    <span className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                      Type a message...
                    </span>
                    <span className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6e817b] to-[#93a59f] text-[#081012]">
                      <Send size={16} />
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {experienceMetrics.map((item) => (
                    <div key={item.label} className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                      <p className="font-display text-2xl font-semibold text-[var(--app-accent)]">{item.value}</p>
                      <p className="mt-1 text-sm font-medium">{item.label}</p>
                      <p className="mt-2 text-xs leading-5" style={{ color: 'var(--app-text-muted)' }}>
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </MotionDiv>
          </div>
        </section>

        <section id="about" className="section-shell section-block">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="glass-card rounded-[24px] p-8">
              <span className="section-kicker">About Mate.ai</span>
              <h2 className="mt-5 font-display text-3xl font-semibold">Purpose-built for better conversations and sharper execution.</h2>
              <p className="mt-4 text-base leading-8" style={{ color: 'var(--app-text-soft)' }}>
                Mate.ai is an AI chatbot product designed for smart, responsive conversations. It helps users automate support, improve engagement, and create a cleaner interaction layer between people, tasks, and product knowledge.
              </p>
            </div>
            <div className="glass-card rounded-[24px] p-8">
              <h3 className="font-display text-2xl font-semibold">Developer role</h3>
              <p className="mt-4 text-base leading-8" style={{ color: 'var(--app-text-soft)' }}>
                This upgrade strengthens the full-stack implementation across product design, frontend architecture, backend APIs, MongoDB models, chat persistence, and JWT authentication. It also improves password recovery, production-safe configuration, error handling, and overall product presentation.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  'UI/UX design system and responsive layout',
                  'Frontend routing, forms, and API integration',
                  'Node/Express controllers and auth hardening',
                  'MongoDB persistence for users, chats, and contacts',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                    <CheckCheck className="mt-0.5 text-[var(--app-accent)]" size={18} />
                    <span style={{ color: 'var(--app-text-soft)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section-shell section-block">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-kicker">Features</span>
              <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Everything expected from a polished AI product site.</h2>
            </div>
            <p className="max-w-xl text-base leading-7" style={{ color: 'var(--app-text-soft)' }}>
              Product storytelling, live workspace access, secure auth flows, and scalable architecture now read as one cohesive experience instead of disconnected screens.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <MotionArticle
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="glass-card rounded-[20px] p-6"
              >
                <feature.icon className="mb-4 text-[var(--app-accent)]" size={24} />
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7" style={{ color: 'var(--app-text-muted)' }}>
                  {feature.description}
                </p>
              </MotionArticle>
            ))}
          </div>
        </section>

        <section id="demo" className="section-shell section-block">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="glass-card rounded-[24px] p-8">
              <span className="section-kicker">Live demo</span>
              <h2 className="mt-5 font-display text-3xl font-semibold">Portfolio on the outside, working app on the inside.</h2>
              <p className="mt-4 text-base leading-8" style={{ color: 'var(--app-text-soft)' }}>
                Visitors can explore Mate.ai as a product, then move into a real authenticated chat workspace. The demo surface supports chat creation, saved history, edit-and-regenerate flows, loading states, and error handling.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: LayoutDashboard, title: 'Dashboard UI', text: 'A focused `/app` workspace with chat controls and settings.' },
                  { icon: UserRound, title: 'User profile session', text: 'Logged-in users can manage their account and continue prior conversations.' },
                  { icon: Sparkles, title: 'Typing and loading feel', text: 'Streaming-style response presentation and clearer send states.' },
                  { icon: Database, title: 'Chat history saving', text: 'Messages persist through MongoDB-backed chat and message models.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <item.icon className="mb-3 text-[var(--app-accent)]" size={20} />
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6" style={{ color: 'var(--app-text-muted)' }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[24px] p-8">
              <h3 className="font-display text-2xl font-semibold">Demo entry points</h3>
              <div className="mt-6 space-y-4">
                {[
                  { title: 'Public portfolio', detail: 'Modern product story, screenshots, stack, and contact section.' },
                  { title: 'Login and signup', detail: 'Field-level validation, token storage, and navigation into protected routes.' },
                  { title: 'Forgot password flow', detail: 'Request reset link, verify token, and update credentials securely.' },
                  { title: 'Live chat workspace', detail: 'Backend-driven chat persistence and AI response generation.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6" style={{ color: 'var(--app-text-muted)' }}>
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="stack" className="section-shell section-block">
          <div className="mb-10 text-center">
            <span className="section-kicker">Technology</span>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Built with modern full-stack tooling.</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stack.map((item) => (
              <div key={item.name} className="glass-card rounded-[20px] p-6">
                <item.icon className="mb-4 text-[var(--app-accent)]" size={24} />
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="mt-3 text-sm leading-7" style={{ color: 'var(--app-text-muted)' }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="showcase" className="section-shell section-block">
          <div className="mb-10">
            <span className="section-kicker">Screenshots</span>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Product showcase and visual proof.</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {showcaseItems.map((item) => (
              <div key={item.title} className="glass-card overflow-hidden rounded-[24px]">
                <img src={item.image} alt={item.title} className="h-[300px] w-full object-cover object-top" loading="lazy" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7" style={{ color: 'var(--app-text-muted)' }}>
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="section-shell section-block">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="glass-card rounded-[24px] p-8">
              <span className="section-kicker">Contact</span>
              <h2 className="mt-5 font-display text-3xl font-semibold">Let&apos;s talk about Mate.ai.</h2>
              <p className="mt-4 text-base leading-8" style={{ color: 'var(--app-text-soft)' }}>
                Use the contact form to connect about demos, collaborations, hiring, or deployment support. The form is connected to the backend and can email notifications when SMTP credentials are configured.
              </p>
              <div className="mt-6 space-y-4 text-sm" style={{ color: 'var(--app-text-soft)' }}>
                <div className="flex items-center gap-3">
                  <Mail className="text-[var(--app-accent)]" size={18} />
                  <span>{import.meta.env.VITE_CONTACT_EMAIL || 'hello@mateai.dev'}</span>
                </div>
                <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 transition hover:text-[var(--app-text)]">
                  <Linkedin size={18} />
                  <span>LinkedIn profile</span>
                </a>
              </div>
            </div>

            <div className="glass-card rounded-[24px] p-8">
              <form className="grid gap-4" onSubmit={handleContactSubmit} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="field-shell">
                    <label className="field-label" htmlFor="contact-name">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      className="field-input"
                      placeholder="Your name"
                      value={contact.name}
                      onChange={handleContactChange}
                    />
                    {errors.name ? <p className="text-sm text-rose-300">{errors.name}</p> : null}
                  </div>
                  <div className="field-shell">
                    <label className="field-label" htmlFor="contact-email">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      className="field-input"
                      placeholder="you@example.com"
                      value={contact.email}
                      onChange={handleContactChange}
                    />
                    {errors.email ? <p className="text-sm text-rose-300">{errors.email}</p> : null}
                  </div>
                </div>

                <div className="field-shell">
                  <label className="field-label" htmlFor="contact-subject">
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    name="subject"
                    className="field-input"
                    placeholder="Project inquiry"
                    value={contact.subject}
                    onChange={handleContactChange}
                  />
                  {errors.subject ? <p className="text-sm text-rose-300">{errors.subject}</p> : null}
                </div>

                <div className="field-shell">
                  <label className="field-label" htmlFor="contact-message">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className="field-input min-h-36 resize-y"
                    placeholder="Tell me what you want to build, improve, or deploy with Mate.ai."
                    value={contact.message}
                    onChange={handleContactChange}
                  />
                  {errors.message ? <p className="text-sm text-rose-300">{errors.message}</p> : null}
                </div>

                <button type="submit" disabled={submitting} className="btn-primary w-full justify-center sm:w-fit">
                  {submitting ? 'Sending...' : 'Send message'}
                </button>
              </form>

              {successMessage ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  {successMessage}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="section-shell section-block">
        <div className="glass-card flex flex-col gap-5 rounded-[24px] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xl font-bold">Mate.ai</p>
            <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
              AI Chatbot for smart conversations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--app-text-soft)' }}>
            <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="btn-secondary">
              <Linkedin size={16} />
              LinkedIn
            </a>
            {isSignedIn ? (
              <Link to="/app" className="btn-primary">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;

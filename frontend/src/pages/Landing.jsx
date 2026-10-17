import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import LandingNav from '../components/landing/LandingNav.jsx';
import LandingFooter from '../components/landing/LandingFooter.jsx';
import PerspectiveGrid from '../components/landing/PerspectiveGrid.jsx';
import TiltCard from '../components/landing/TiltCard.jsx';
import WireframeObject from '../components/landing/WireframeObject.jsx';
import { AnalyticsVisual, BioVisual, AiVisual } from '../components/landing/LandingVisuals.jsx';
import { useAuth } from '../hooks/useAuth.js';
import {
  FEATURES,
  FLAGSHIPS,
  DIFFERENTIATORS,
  STEPS,
  SECURITY_POINTS,
} from '../config/landingContent.js';

const VISUALS = {
  analytics: AnalyticsVisual,
  bio: BioVisual,
  ai: AiVisual,
};

const MARQUEE = [
  'Short links',
  'QR codes',
  'Bio pages',
  'Campaigns',
  'Tags',
  'Real-time analytics',
  'AI insights',
  'Custom domains',
  'Click limits',
  'Password protection',
  'Team roles',
  'Audit trail',
];

function SectionHeading({ eyebrow, title, description, align = 'center' }) {
  const alignment = align === 'left' ? 'text-left items-start' : 'text-center items-center';
  return (
    <div className={`flex flex-col ${alignment} ${align === 'left' ? '' : 'mx-auto max-w-2xl'}`}>
      {eyebrow && (
        <span className="mb-3 border-2 border-base-700 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-accent-400">
          {eyebrow}
        </span>
      )}
      <h2 className="text-xl font-semibold leading-relaxed text-ink-100 lg:text-2xl">{title}</h2>
      {description && <p className="mt-4 text-base text-ink-400">{description}</p>}
    </div>
  );
}

function PrimaryCta({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center gap-2 border-2 border-accent-400 bg-accent-gradient px-6 py-3 text-sm font-semibold uppercase tracking-wider text-base-950 shadow-glow transition hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const primaryTo = isAuthenticated ? '/app' : '/register';

  return (
    <div className="min-h-screen bg-base-950">
      <LandingNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b-2 border-base-800">
          <div className="absolute inset-0 grid-noise opacity-40" aria-hidden="true" />
          <PerspectiveGrid />

          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-4 pb-52 pt-16 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pb-64 lg:pt-24">
            <div>
              <span className="inline-flex items-center border-2 border-accent-700 bg-accent-500/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] text-accent-300">
                URL shortener · QR · Bio pages · Analytics
              </span>

              <h1 className="mt-6 text-3xl leading-[1.4] text-ink-100 sm:text-4xl">
                Short links that
                <br />
                <span className="text-gradient">perform in real time</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
                LinkPulse turns every URL into a measurable asset. Create smart short links,
                generate branded QR codes, build link-in-bio pages, and watch clicks arrive live —
                all inside one focused workspace.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <PrimaryCta to={primaryTo}>
                  {isAuthenticated ? 'Open dashboard' : 'Get started free'}
                </PrimaryCta>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center border-2 border-base-600 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-ink-200 transition hover:border-accent-600 hover:text-accent-300"
                >
                  Explore features
                </a>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {['No credit card required', 'Real-time data', 'Privacy-first'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-ink-400">
                    <Check className="h-4 w-4 text-accent-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-md">
              <WireframeObject className="h-full w-full" />

              <div
                className="animate-float absolute -left-2 top-10 border-2 border-base-700 bg-base-850/90 px-3 py-2 shadow-panel"
                style={{ animationDelay: '0.4s' }}
              >
                <p className="text-[11px] uppercase tracking-widest text-ink-500">Redirecting</p>
                <p className="text-sm text-accent-300">links.example.com/launch</p>
              </div>

              <div
                className="animate-float absolute -right-1 bottom-16 border-2 border-base-700 bg-base-850/90 px-3 py-2 shadow-panel"
                style={{ animationDelay: '1.6s' }}
              >
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-accent-400">
                  <span className="h-2 w-2 animate-blink bg-accent-500" /> Click recorded
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="overflow-hidden border-b-2 border-base-800 bg-base-900 py-4">
          <div className="flex w-max animate-marquee items-center">
            {[...MARQUEE, ...MARQUEE].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="flex items-center gap-6 px-6 text-sm uppercase tracking-widest text-ink-400"
              >
                {item}
                <span className="text-accent-500">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Features"
            title="One platform for every link you share"
            description="Each tool solves a specific job — and they all feed the same analytics, so nothing you publish is ever a dead end."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <TiltCard key={feature.name} intensity={6} scale={1.01}>
                <article className="surface-card flex h-full flex-col p-5">
                  <span className="flex h-11 w-11 items-center justify-center border-2 border-base-700 bg-base-850 text-accent-400">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-sm text-ink-100">{feature.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-400">{feature.purpose}</p>
                  <p className="mt-4 border-l-2 border-accent-600 pl-3 text-sm leading-relaxed text-ink-300">
                    {feature.why}
                  </p>
                </article>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* Flagship deep-dives */}
        <section className="border-y-2 border-base-800 bg-base-900/40">
          <div className="mx-auto w-full max-w-6xl space-y-24 px-4 py-20 lg:px-8 lg:py-28">
            {FLAGSHIPS.map((flagship, index) => {
              const Visual = VISUALS[flagship.visual];
              const reversed = index % 2 === 1;
              return (
                <div
                  key={flagship.id}
                  id={flagship.id}
                  className="grid items-center gap-14 lg:grid-cols-2"
                >
                  <div className={reversed ? 'lg:order-2' : ''}>
                    <span className="text-[11px] uppercase tracking-[0.3em] text-accent-400">
                      {flagship.eyebrow}
                    </span>
                    <h2 className="mt-3 text-xl font-semibold leading-relaxed text-ink-100 lg:text-2xl">
                      {flagship.title}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-ink-400">{flagship.body}</p>

                    <ul className="mt-6 space-y-3">
                      {flagship.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-sm text-ink-300">
                          <span className="mt-1.5 h-2 w-2 shrink-0 bg-accent-500" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={reversed ? 'lg:order-1' : ''}>
                    <Visual />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why LinkPulse */}
        <section id="why" className="mx-auto w-full max-w-6xl px-4 py-20 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Why LinkPulse"
            title="Why teams choose LinkPulse over a basic shortener"
            description="A plain link shortener stops at the redirect. LinkPulse carries that connection all the way to insight, safety, and teamwork."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DIFFERENTIATORS.map((item) => (
              <TiltCard key={item.title} intensity={7}>
                <div className="surface-card flex h-full items-start gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-accent-700 bg-accent-500/10 text-accent-300">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm text-ink-100">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-400">{item.body}</p>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y-2 border-base-800 bg-base-900/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 lg:px-8 lg:py-28">
            <SectionHeading
              eyebrow="How it works"
              title="From URL to insight in three steps"
              description="No setup marathons. Create, share, and measure — the whole loop fits in a few minutes."
            />

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <article key={step.title} className="surface-card relative p-6">
                  <span className="font-display text-2xl text-accent-500/40">
                    0{index + 1}
                  </span>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center border-2 border-base-700 bg-base-850 text-accent-400">
                      <step.icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm text-ink-100">{step.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink-400">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="mx-auto w-full max-w-6xl px-4 py-20 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Security"
            title="Protection that is on by default"
            description="Trust is a feature. Every workspace ships with the safeguards that keep your links and your audience safe."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY_POINTS.map((item) => (
              <div key={item.title} className="flex items-start gap-4 border-2 border-base-800 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-base-700 bg-base-850 text-accent-400">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm text-ink-100">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t-2 border-base-800">
          <div className="absolute inset-0 grid-noise opacity-40" aria-hidden="true" />
          <PerspectiveGrid />
          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center lg:px-8 lg:py-32">
            <h2 className="text-xl font-semibold leading-relaxed text-ink-100 lg:text-2xl">
              Start measuring every click
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300">
              Create your first smart link in seconds and watch the data come alive. LinkPulse is
              ready when you are.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <PrimaryCta to={primaryTo}>
                {isAuthenticated ? 'Open dashboard' : 'Get started free'}
              </PrimaryCta>
              <Link
                to="/login"
                className="inline-flex items-center justify-center border-2 border-base-600 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-ink-200 transition hover:border-accent-600 hover:text-accent-300"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

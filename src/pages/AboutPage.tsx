import React from 'react';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { OFFERS, CATEGORIES } from '../lib/data/resources';
import { SlabIllustration } from '../components/illustrations/TocaStickers';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

const VERIFICATION_STATUSES = [
  {
    name: 'Verified',
    icon: ShieldCheck,
    color: 'bg-grass-green',
    meaning:
      'Checked directly against official provider pricing or documentation with cited source quotes.',
  },
  {
    name: 'Needs review',
    icon: AlertCircle,
    color: 'bg-sunshine-yellow',
    meaning:
      'A quota, card requirement, or region rule needs human re-verification before being marked fully current.',
  },
  {
    name: 'Unverified',
    icon: HelpCircle,
    color: 'bg-daylight',
    meaning:
      'Newly discovered or incomplete entry awaiting source evidence confirmation.',
  },
  {
    name: 'Expired',
    icon: Clock,
    color: 'bg-bubblegum-pink',
    meaning:
      'Time-bound credits or promotional programs that have ended, supported by evidence.',
  },
  {
    name: 'Unavailable',
    icon: XCircle,
    color: 'bg-tangerine',
    meaning:
      'Free tier discontinued or official destination confirmed no longer accessible.',
  },
];

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 flex flex-col gap-6 sm:gap-9">
      {/* Compact Header Slab */}
      <section className="bg-sky-blue rounded-[22px] sm:rounded-[26px] p-5 sm:p-7 md:p-9 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col gap-3">
          <h1 className="font-[var(--font-wallop)] font-extrabold text-[26px] sm:text-[38px] lg:text-[46px] leading-[1.04] tracking-[-0.03em] text-midnight-mouth">
            About FreeStack
          </h1>
          <p className="font-[var(--font-inter)] text-[14px] sm:text-[15.5px] leading-[1.5] text-ink max-w-xl">
            FreeStack is a public, login-free directory built on one principle: make free digital resources easier to discover, compare, and trust. Across {OFFERS.length} verified records and {CATEGORIES.length} categories, we explain exact limits, card rules, eligibility, and expiry terms backed by official sources.
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <a
              href="/explore"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/explore');
              }}
              className="justify-center bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-4 py-2 min-h-[38px] inline-flex items-center spring-pill"
            >
              Explore the directory
            </a>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/privacy');
              }}
              className="justify-center bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-4 py-2 min-h-[38px] inline-flex items-center spring-pill"
            >
              Privacy Policy
            </a>
            <a
              href="/privacy-requests"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/privacy-requests');
              }}
              className="justify-center bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-4 py-2 min-h-[38px] inline-flex items-center spring-pill"
            >
              Privacy Requests
            </a>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/terms');
              }}
              className="justify-center bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-4 py-2 min-h-[38px] inline-flex items-center spring-pill"
            >
              Terms of Service
            </a>
          </div>
        </div>
        <div className="lg:col-span-5">
          <SlabIllustration variant="verify" />
        </div>
      </section>

      {/* Core Verification & Discovery Principles */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-daylight rounded-[20px] sm:rounded-[24px] p-5 sm:p-6">
          <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] leading-[1.15] text-midnight-mouth mb-2">
            No fake permanent freebies
          </h2>
          <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.45] text-ink/90">
            Free trials are never presented as permanent free tiers. Every listing separates completely free, open-source, free tiers, credits, freemium plans, and student exclusives.
          </p>
        </div>

        <div className="bg-daylight rounded-[20px] sm:rounded-[24px] p-5 sm:p-6">
          <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] leading-[1.15] text-midnight-mouth mb-2">
            Unknown stays unknown
          </h2>
          <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.45] text-ink/90">
            When official pricing or documentation leaves a card requirement or quota ambiguous, FreeStack records &ldquo;unknown&rdquo; explicitly rather than guessing &ldquo;no&rdquo;.
          </p>
        </div>

        <div className="bg-daylight rounded-[20px] sm:rounded-[24px] p-5 sm:p-6">
          <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] leading-[1.15] text-midnight-mouth mb-2">
            Official terms change
          </h2>
          <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.45] text-ink/90">
            Providers update quotas, regional eligibility, and billing checks over time. Each listing displays a last-verified date and supports community correction reports.
          </p>
        </div>
      </section>

      {/* Verification Status Definitions */}
      <section className="flex flex-col gap-3.5 sm:gap-4">
        <h2 className="font-[var(--font-wallop)] font-extrabold text-[22px] sm:text-[30px] leading-[1.08] tracking-[-0.025em] text-midnight-mouth">
          Verification statuses
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {VERIFICATION_STATUSES.map((status) => {
            const Icon = status.icon;
            return (
              <div
                key={status.name}
                className={`${status.color} rounded-[18px] sm:rounded-[22px] p-4 sm:p-5 flex flex-col gap-2`}
              >
                <div className="w-9 h-9 rounded-[11px] bg-paper flex items-center justify-center">
                  <Icon className="w-4 h-4 text-midnight-mouth" aria-hidden="true" />
                </div>
                <h3 className="font-[var(--font-wallop)] font-bold text-[17px] sm:text-[18px] text-midnight-mouth">
                  {status.name}
                </h3>
                <p className="font-[var(--font-inter)] text-[13px] leading-[1.4] text-ink">
                  {status.meaning}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

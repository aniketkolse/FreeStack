import React from 'react';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { TOTAL_OFFERS_COUNT, CATEGORIES } from '../lib/data/resources';
import { SlabIllustration } from '../components/illustrations/TocaStickers';
import { EDITORIAL_POLICY } from '../lib/verification/editorialPolicy';

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
    color: 'bg-sky-blue',
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
    <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-5 pb-8 sm:pb-12 flex flex-col gap-4 sm:gap-9">
      {/* Compact Header Slab */}
      <section className="bg-sky-blue rounded-[16px] sm:rounded-[26px] p-3.5 sm:p-7 md:p-9 grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 lg:gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col gap-2 sm:gap-3">
          <h1 className="font-[var(--font-wallop)] font-extrabold text-[22px] sm:text-[38px] lg:text-[46px] leading-[1.06] sm:leading-[1.04] tracking-[-0.03em] text-midnight-mouth">
            About FreeStack
          </h1>
          <p className="font-[var(--font-inter)] text-[12.5px] sm:text-[15.5px] leading-[1.45] sm:leading-[1.5] text-ink max-w-xl">
            FreeStack is a public, login-free directory built on one principle: make free digital resources easier to discover, compare, and trust. Across {TOTAL_OFFERS_COUNT} verified records and {CATEGORIES.length} categories, we explain exact limits, card rules, eligibility, and expiry terms backed by official sources.
          </p>
          <div className="pt-0.5 sm:pt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <a
              href="/explore"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/explore');
              }}
              className="justify-center bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[13.5px] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[38px] inline-flex items-center spring-pill"
            >
              Explore the directory
            </a>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/privacy');
              }}
              className="justify-center bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[13.5px] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[38px] inline-flex items-center spring-pill"
            >
              Privacy Policy
            </a>
            <a
              href="/privacy-requests"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/privacy-requests');
              }}
              className="justify-center bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[13.5px] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[38px] inline-flex items-center spring-pill"
            >
              Privacy Requests
            </a>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/terms');
              }}
              className="justify-center bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[13.5px] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[38px] inline-flex items-center spring-pill"
            >
              Terms of Service
            </a>
          </div>
        </div>
        <div className="hidden sm:block lg:col-span-5">
          <SlabIllustration variant="verify" />
        </div>
      </section>

      {/* Core Verification & Discovery Principles */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-daylight rounded-[15px] sm:rounded-[24px] p-3.5 sm:p-6">
          <h2 className="font-[var(--font-wallop)] font-bold text-[15.5px] sm:text-[20px] leading-[1.15] text-midnight-mouth mb-1 sm:mb-2">
            No fake permanent freebies
          </h2>
          <p className="font-[var(--font-inter)] text-[12px] sm:text-[14px] leading-[1.42] sm:leading-[1.45] text-ink/90">
            Free trials are never presented as permanent free tiers. Every listing separates completely free, open-source, free tiers, credits, freemium plans, and student exclusives.
          </p>
        </div>

        <div className="bg-daylight rounded-[15px] sm:rounded-[24px] p-3.5 sm:p-6">
          <h2 className="font-[var(--font-wallop)] font-bold text-[15.5px] sm:text-[20px] leading-[1.15] text-midnight-mouth mb-1 sm:mb-2">
            Unknown stays unknown
          </h2>
          <p className="font-[var(--font-inter)] text-[12px] sm:text-[14px] leading-[1.42] sm:leading-[1.45] text-ink/90">
            When official pricing or documentation leaves a card requirement or quota ambiguous, FreeStack records &ldquo;unknown&rdquo; explicitly rather than guessing &ldquo;no&rdquo;.
          </p>
        </div>

        <div className="bg-daylight rounded-[15px] sm:rounded-[24px] p-3.5 sm:p-6">
          <h2 className="font-[var(--font-wallop)] font-bold text-[15.5px] sm:text-[20px] leading-[1.15] text-midnight-mouth mb-1 sm:mb-2">
            Official terms change
          </h2>
          <p className="font-[var(--font-inter)] text-[12px] sm:text-[14px] leading-[1.42] sm:leading-[1.45] text-ink/90">
            Providers update quotas, regional eligibility, and billing checks over time. Each listing displays a last-verified date backed by direct official provider documentation.
          </p>
        </div>
      </section>

      {/* Verification Status Definitions */}
      <section className="flex flex-col gap-2.5 sm:gap-4">
        <h2 className="font-[var(--font-wallop)] font-extrabold text-[19px] sm:text-[30px] leading-[1.08] tracking-[-0.025em] text-midnight-mouth">
          Verification Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          {VERIFICATION_STATUSES.map((status) => {
            const Icon = status.icon;
            return (
              <div
                key={status.name}
                className={`${status.color} last:col-span-2 sm:last:col-span-1 rounded-[14px] sm:rounded-[22px] p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2`}
              >
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-[9px] sm:rounded-[11px] bg-paper flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-midnight-mouth" aria-hidden="true" />
                </div>
                <h3 className="font-[var(--font-wallop)] font-bold text-[14px] sm:text-[18px] text-midnight-mouth">
                  {status.name}
                </h3>
                <p className="font-[var(--font-inter)] text-[11.5px] sm:text-[13px] leading-[1.35] sm:leading-[1.4] text-ink">
                  {status.meaning}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Editorial ownership, methodology and corrections */}
      <section className="bg-daylight rounded-[16px] sm:rounded-[26px] p-3.5 sm:p-7 md:p-9 flex flex-col gap-2.5 sm:gap-4">
        <h2 className="font-[var(--font-wallop)] font-extrabold text-[19px] sm:text-[30px] leading-[1.08] tracking-[-0.025em] text-midnight-mouth">
          Editorial Ownership &amp; Corrections
        </h2>
        <p className="font-[var(--font-inter)] text-[12.5px] sm:text-[15px] leading-[1.45] text-ink">
          {EDITORIAL_POLICY.maintainer}. Last reviewed: {EDITORIAL_POLICY.lastReviewed}.
        </p>
        <ol className="list-decimal pl-5 flex flex-col gap-1 font-[var(--font-inter)] text-[12px] sm:text-[14px] leading-[1.45] text-ink">
          {EDITORIAL_POLICY.methodology.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="font-[var(--font-inter)] text-[12px] sm:text-[14px] leading-[1.45] text-ink">
          If a quota, card rule, or source is wrong or out of date, report it in the public{' '}
          <a
            href={EDITORIAL_POLICY.contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            FreeStack issue tracker
          </a>
          . Reports are reviewed in the open.
        </p>
      </section>
    </div>
  );
}

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { FreeStackLogo } from '../illustrations/TocaStickers';

interface SiteFooterProps {
  onNavigate: (path: string) => void;
  onReplayIntro?: () => void;
}

export function SiteFooter({ onNavigate, onReplayIntro }: SiteFooterProps) {
  const go = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="w-full bg-paper pt-8 md:pt-12 pb-[max(2rem,env(safe-area-inset-bottom))] md:pb-12">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-daylight rounded-[24px] sm:rounded-[28px] p-5 sm:p-8 md:p-10 flex flex-col gap-7 sm:gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
            {/* Left: Compact stacked Capital-F logo + FreeStack tagline */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <a
                href="/"
                onClick={(e) => go(e, '/')}
                className="inline-flex w-fit min-h-[38px] items-center"
                aria-label="FreeStack Home"
              >
                <FreeStackLogo size="lg" />
              </a>
              <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14.5px] leading-[1.5] text-ink/85 max-w-sm">
                One place for everything free that helps you build, learn and create — with real limits, card rules, and source evidence.
              </p>
              <div className="inline-flex items-center gap-1.5 bg-paper rounded-full px-3 py-1.5 w-fit border border-midnight-mouth/8">
                <ShieldCheck className="w-3.5 h-3.5 text-midnight-mouth shrink-0" aria-hidden="true" />
                <span className="font-[var(--font-inter)] font-medium text-[11.5px] text-midnight-mouth">
                  Privacy-first · No accounts · Local-first storage
                </span>
              </div>
            </div>

            {/* Right: 4 columns including Legal & Privacy */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <h2 className="font-[var(--font-wallop)] font-bold text-[15px] sm:text-[16px] leading-[1.2] text-midnight-mouth mb-2">
                  Directory
                </h2>
                <ul className="flex flex-col gap-0.5">
                  {[
                    { label: 'Home', path: '/' },
                    { label: 'Explore All', path: '/explore' },
                    { label: 'Categories', path: '/categories' },
                    { label: 'Learning', path: '/learning' },
                    { label: 'Student Benefits', path: '/students' },
                  ].map((link) => (
                    <li key={link.path}>
                      <a
                        href={link.path}
                        onClick={(e) => go(e, link.path)}
                        className="inline-flex items-center min-h-[30px] py-0.5 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth/90 hover:text-midnight-mouth hover:underline underline-offset-4"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="font-[var(--font-wallop)] font-bold text-[15px] sm:text-[16px] leading-[1.2] text-midnight-mouth mb-2">
                  Popular Stacks
                </h2>
                <ul className="flex flex-col gap-0.5">
                  {[
                    { label: 'AI Models', path: '/category/ai-ml' },
                    { label: 'MCP Servers', path: '/category/mcp' },
                    { label: 'APIs', path: '/category/apis-integrations' },
                    { label: 'Frontend & Design', path: '/category/design-creative' },
                    { label: 'Cloud & Hosting', path: '/category/cloud-hosting' },
                    { label: 'Databases', path: '/category/databases-backend' },
                    { label: 'Developer Tools', path: '/category/developer-tools' },
                    { label: 'Security & Networking', path: '/category/security-networking' },
                    { label: 'Productivity', path: '/category/productivity-collaboration' },
                  ].map((link) => (
                    <li key={link.path}>
                      <a
                        href={link.path}
                        onClick={(e) => go(e, link.path)}
                        className="inline-flex items-center min-h-[30px] py-0.5 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth/90 hover:text-midnight-mouth hover:underline underline-offset-4"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="font-[var(--font-wallop)] font-bold text-[15px] sm:text-[16px] leading-[1.2] text-midnight-mouth mb-2">
                  Verification
                </h2>
                <ul className="flex flex-col gap-0.5">
                  <li>
                    <a
                      href="/about"
                      onClick={(e) => go(e, '/about')}
                      className="inline-flex items-center min-h-[30px] py-0.5 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth/90 hover:text-midnight-mouth hover:underline underline-offset-4"
                    >
                      Trust Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/explore?card=not_required"
                      onClick={(e) => go(e, '/explore?card=not_required')}
                      className="inline-flex items-center min-h-[30px] py-0.5 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth/90 hover:text-midnight-mouth hover:underline underline-offset-4"
                    >
                      No-Card Resources
                    </a>
                  </li>
                  <li>
                    <a
                      href="/design-system"
                      onClick={(e) => go(e, '/design-system')}
                      className="inline-flex items-center min-h-[30px] py-0.5 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth/90 hover:text-midnight-mouth hover:underline underline-offset-4"
                    >
                      Design System
                    </a>
                  </li>
                  {onReplayIntro && (
                    <li>
                      <button
                        type="button"
                        onClick={onReplayIntro}
                        className="inline-flex items-center min-h-[30px] py-0.5 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth/90 hover:text-midnight-mouth hover:underline underline-offset-4 cursor-pointer"
                      >
                        Replay Stack Intro
                      </button>
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h2 className="font-[var(--font-wallop)] font-bold text-[15px] sm:text-[16px] leading-[1.2] text-midnight-mouth mb-2">
                  Legal &amp; Privacy
                </h2>
                <ul className="flex flex-col gap-0.5">
                  <li>
                    <a
                      href="/privacy"
                      onClick={(e) => go(e, '/privacy')}
                      className="inline-flex items-center min-h-[30px] py-0.5 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth/90 hover:text-midnight-mouth hover:underline underline-offset-4"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy-requests"
                      onClick={(e) => go(e, '/privacy-requests')}
                      className="inline-flex items-center min-h-[30px] py-0.5 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth/90 hover:text-midnight-mouth hover:underline underline-offset-4"
                    >
                      Privacy Requests
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms"
                      onClick={(e) => go(e, '/terms')}
                      className="inline-flex items-center min-h-[30px] py-0.5 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth/90 hover:text-midnight-mouth hover:underline underline-offset-4"
                    >
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy-requests"
                      onClick={(e) => go(e, '/privacy-requests')}
                      className="inline-flex items-center min-h-[30px] py-0.5 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth/90 hover:text-midnight-mouth hover:underline underline-offset-4"
                    >
                      India Grievance Officer
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy-requests"
                      onClick={(e) => go(e, '/privacy-requests')}
                      className="inline-flex items-center min-h-[30px] py-0.5 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth/90 hover:text-midnight-mouth hover:underline underline-offset-4"
                    >
                      US Do Not Sell / Share
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Standard Website Bottom Legal Bar */}
          <div className="pt-5 border-t border-midnight-mouth/10 flex flex-col gap-2.5 text-[12px] font-[var(--font-inter)] text-ink/75">
            <p className="leading-[1.5]">
              <strong>Disclaimer:</strong> FreeStack is an independent informational directory and is not affiliated with or endorsed by listed providers. Free quotas, pricing, and card requirements can change at any time—always verify on the provider&apos;s official documentation before use. Listing a tool, API, or MCP server is not a security review; inspect source code and permissions before connecting credentials.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p>
                © {new Date().getFullYear()} FreeStack Contributors (Apache-2.0). Designed to support privacy rights under India DPDP, US State Privacy Laws, and EU/UK GDPR.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth">
                <a
                  href="/privacy"
                  onClick={(e) => go(e, '/privacy')}
                  className="hover:underline underline-offset-4"
                >
                  Privacy Policy
                </a>
                <a
                  href="/privacy-requests"
                  onClick={(e) => go(e, '/privacy-requests')}
                  className="hover:underline underline-offset-4"
                >
                  Privacy Requests
                </a>
                <a
                  href="/terms"
                  onClick={(e) => go(e, '/terms')}
                  className="hover:underline underline-offset-4"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Compass,
  Home,
  RotateCcw,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { classifyLoadError, type ErrorPageVariant } from '../../lib/errors/errorClassification';
import { SparkBurstDoodle } from '../illustrations/TocaStickers';

export interface ErrorFallbackPageProps {
  explicitVariant?: ErrorPageVariant;
  errorMessage?: string | null;
  notFound?: boolean;
  compact?: boolean;
  onRetry?: () => void | Promise<void>;
  onNavigate?: (path: string) => void;
  onBack?: () => void;
  backLabel?: string;
  backHref?: string;
}

const STACK_QUICK_ROUTES = [
  { label: 'AI Models', href: '/category/ai-ml', bgClass: 'bg-sky-blue' },
  { label: 'MCP Servers', href: '/category/mcp', bgClass: 'bg-sunshine-yellow' },
  { label: 'APIs', href: '/category/apis-integrations', bgClass: 'bg-grass-green' },
  { label: 'Cloud & Hosting', href: '/category/cloud-hosting', bgClass: 'bg-bubblegum-pink' },
];

const BAR_GRADIENTS = [
  { id: 'err-bar-blue', stops: ['#8DC8FF', '#59ACFF', '#267CD9'], width: 92 },
  { id: 'err-bar-green', stops: ['#94F094', '#62D962', '#32A832'], width: 58 },
  { id: 'err-bar-yellow', stops: ['#FFF099', '#FFE359', '#DFB617'], width: 78 },
  { id: 'err-bar-pink', stops: ['#FFB6D5', '#FF8CBC', '#DD528F'], width: 52 },
  { id: 'err-bar-orange', stops: ['#FFC988', '#FFA94D', '#E07B1A'], width: 66 },
];

const PLAYFUL_REACTIONS: Record<ErrorPageVariant, string[]> = {
  offline: [
    'Signal check sent! Reconnect Wi-Fi or data and tap retry.',
    'Cloud mascot wiggled the plug — waiting for a signal spark.',
    'Still offline on this device. FreeStack is ready as soon as you reconnect!',
  ],
  load_error: [
    'Packet bounced! Testing FreeStack server connection...',
    'Stack reshuffled! Ready whenever you tap retry.',
    'Mascot cleared the cobwebs — give retry a quick tap.',
  ],
  not_found: [
    'Boop! Our cloud mascot checked the shelf, definitely not here.',
    'Stack rearranged! Pick a verified category pill below to jump in.',
    'Zero-cost tools ahead — let’s hop back into the catalog!',
  ],
};

export function ErrorFallbackPage({
  explicitVariant,
  errorMessage = null,
  notFound = false,
  compact = false,
  onRetry,
  onNavigate,
  onBack,
  backLabel = 'Return Home',
  backHref = '/',
}: ErrorFallbackPageProps) {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [boopCount, setBoopCount] = useState(0);
  const [isBooping, setIsBooping] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const meta = classifyLoadError({
    isOnline,
    errorMessage,
    notFound,
    explicitVariant,
  });

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  const handlePrimaryRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setPingStatus(null);
    try {
      if (onRetry) {
        await onRetry();
      } else if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } finally {
      window.setTimeout(() => setIsRetrying(false), 300);
    }
  };

  const handleStageBoop = async () => {
    const nextCount = boopCount + 1;
    setBoopCount(nextCount);
    setIsBooping(false);
    window.requestAnimationFrame(() => {
      setIsBooping(true);
    });
    window.setTimeout(() => setIsBooping(false), 450);

    const lines = PLAYFUL_REACTIONS[meta.variant];
    setPingStatus(lines[(nextCount - 1) % lines.length]);

    // If connection or load failed, also perform a real lightweight health ping
    if (meta.variant === 'offline' || meta.variant === 'load_error') {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (res.ok) {
          setIsOnline(true);
          setPingStatus('Connection is live again! Reloading your view...');
          if (onRetry) {
            window.setTimeout(() => {
              void onRetry();
            }, 350);
          }
        }
      } catch {
        // Keep helpful playful feedback when still disconnected
      }
    }
  };

  const badgeBgClass =
    meta.variant === 'offline'
      ? 'bg-tangerine'
      : meta.variant === 'load_error'
        ? 'bg-sunshine-yellow'
        : 'bg-sky-blue';

  const VariantIcon =
    meta.variant === 'offline'
      ? WifiOff
      : meta.variant === 'load_error'
        ? AlertTriangle
        : Compass;

  const isAlert = meta.variant === 'offline' || meta.variant === 'load_error';

  return (
    <section
      data-testid="error-fallback-page"
      data-error-variant={meta.variant}
      role={isAlert ? 'alert' : undefined}
      aria-live={isAlert ? 'assertive' : 'polite'}
      className={
        compact
          ? 'w-full'
          : 'max-w-[1060px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12'
      }
    >
      <div
        className={`bg-daylight border border-midnight-mouth/10 rounded-[24px] sm:rounded-[28px] overflow-hidden ${
          compact ? 'p-5 sm:p-7' : 'p-5 sm:p-8 lg:p-10'
        }`}
      >
        <div
          className={`grid grid-cols-1 ${
            compact ? 'lg:grid-cols-12 gap-5 items-center' : 'lg:grid-cols-12 gap-6 lg:gap-8 items-center'
          }`}
        >
          {/* Left / Top: Interactive Animated 404 + Cloud Illustration Stage */}
          <div className={compact ? 'lg:col-span-5' : 'lg:col-span-6'}>
            <button
              type="button"
              data-testid="error-fallback-stage"
              onClick={() => void handleStageBoop()}
              aria-label="Interactive 404 cloud illustration — click to bounce and check connection"
              className={`group w-full bg-paper text-midnight-mouth border-2 border-midnight-mouth/12 rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 relative overflow-hidden cursor-pointer text-left transition-colors duration-200 hover:border-midnight-mouth/28 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-midnight-mouth ${
                isBooping ? 'fs-boop-pop' : ''
              }`}
            >
              {/* Soft decorative FreeStack dots in background */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-6 -left-6 w-24 h-24 rounded-full bg-sky-blue/15"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-8 -right-6 w-28 h-28 rounded-full bg-sunshine-yellow/20"
              />
              <SparkBurstDoodle className="fs-spark-pulse w-7 h-7 sm:w-8 sm:h-8 absolute top-3 right-3 text-midnight-mouth/80" />

              <div className="relative flex flex-col items-center justify-center">
                <svg
                  viewBox="0 0 380 220"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className={`w-full ${compact ? 'max-w-[300px]' : 'max-w-[360px]'} h-auto select-none`}
                >
                  <defs>
                    {BAR_GRADIENTS.map((grad) => (
                      <linearGradient key={grad.id} id={grad.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={grad.stops[0]} />
                        <stop offset="45%" stopColor={grad.stops[1]} />
                        <stop offset="100%" stopColor={grad.stops[2]} />
                      </linearGradient>
                    ))}
                  </defs>

                  {/* Ground shadow */}
                  <ellipse cx="190" cy="198" rx="134" ry="10" fill="currentColor" opacity="0.1" />

                  {/* Playful twinkling stars */}
                  <path
                    d="M42 26L45 34L53 37L45 40L42 48L39 40L31 37L39 34L42 26Z"
                    fill="#62D962"
                    stroke="#101014"
                    strokeWidth="2.2"
                    className="fs-spark-pulse"
                  />
                  <path
                    d="M334 156L336.5 162.5L343 165L336.5 167.5L334 174L331.5 167.5L325 165L331.5 162.5L334 156Z"
                    fill="#FFE359"
                    stroke="#101014"
                    strokeWidth="2.2"
                    className="fs-spark-pulse"
                    style={{ animationDelay: '650ms' }}
                  />

                  {/* Left Floating '4' Block */}
                  <g className="fs-float-slow">
                    <rect
                      x="22"
                      y="52"
                      width="78"
                      height="96"
                      rx="22"
                      fill="currentColor"
                      opacity="0.14"
                      transform="translate(0, 6)"
                    />
                    <rect
                      x="22"
                      y="52"
                      width="78"
                      height="96"
                      rx="22"
                      fill="#FFE359"
                      stroke="#101014"
                      strokeWidth="5"
                    />
                    <text
                      x="61"
                      y="120"
                      textAnchor="middle"
                      fill="#101014"
                      fontSize="58"
                      fontWeight="800"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      4
                    </text>
                  </g>

                  {/* Right Floating '4' Block */}
                  <g className="fs-float-alt">
                    <rect
                      x="280"
                      y="46"
                      width="78"
                      height="96"
                      rx="22"
                      fill="currentColor"
                      opacity="0.14"
                      transform="translate(0, 6)"
                    />
                    <rect
                      x="280"
                      y="46"
                      width="78"
                      height="96"
                      rx="22"
                      fill="#FF8CBC"
                      stroke="#101014"
                      strokeWidth="5"
                    />
                    <text
                      x="319"
                      y="114"
                      textAnchor="middle"
                      fill="#101014"
                      fontSize="58"
                      fontWeight="800"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      4
                    </text>
                  </g>

                  {/* Center: Animated FreeStack Cloud Mascot (acts as the playful '0') */}
                  <g className="fs-cloud-drift">
                    {/* Cloud drop shadow */}
                    <path
                      d="M143 118H237C250 118 261 107.5 261 94.5C261 81.8 250.7 71.3 238 70C234.6 56.8 222.5 47 208 47C203.7 47 199.5 47.9 195.8 49.5C190.6 36.2 177.5 26.8 162.3 26.8C142.5 26.8 126.4 42.9 126.4 62.7C126.4 63.8 126.5 64.9 126.6 65.9C116.5 71 109.5 81.3 109.5 93.3C109.5 107.5 124.2 118 143 118Z"
                      fill="currentColor"
                      opacity="0.14"
                      transform="translate(0, 5)"
                    />
                    {/* Cloud Body */}
                    <path
                      d="M143 118H237C250 118 261 107.5 261 94.5C261 81.8 250.7 71.3 238 70C234.6 56.8 222.5 47 208 47C203.7 47 199.5 47.9 195.8 49.5C190.6 36.2 177.5 26.8 162.3 26.8C142.5 26.8 126.4 42.9 126.4 62.7C126.4 63.8 126.5 64.9 126.6 65.9C116.5 71 109.5 81.3 109.5 93.3C109.5 107.5 124.2 118 143 118Z"
                      fill="#59ACFF"
                      stroke="#101014"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Reactive Mascot Expression */}
                    {isBooping ? (
                      <>
                        <path
                          d="M158 75C162 69 169 69 173 75"
                          stroke="#101014"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M198 75C202 69 209 69 213 75"
                          stroke="#101014"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M170 91C177 101 195 101 202 91"
                          stroke="#101014"
                          strokeWidth="4.8"
                          strokeLinecap="round"
                        />
                      </>
                    ) : meta.variant === 'offline' ? (
                      <>
                        <path
                          d="M161 70L170 79M170 70L161 79"
                          stroke="#101014"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <circle cx="206" cy="74.5" r="5" fill="#101014" className="fs-eye-blink" />
                        <path
                          d="M172 95C178 89 194 89 200 95"
                          stroke="#101014"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                        />
                      </>
                    ) : meta.variant === 'load_error' ? (
                      <>
                        <g className="fs-eye-blink">
                          <circle cx="166" cy="74" r="4.8" fill="#101014" />
                          <circle cx="205" cy="74" r="4.8" fill="#101014" />
                        </g>
                        <path
                          d="M170 93C175 88 181 97 186 92C191 87 197 96 202 91"
                          stroke="#101014"
                          strokeWidth="4.2"
                          strokeLinecap="round"
                        />
                      </>
                    ) : (
                      <>
                        <g className="fs-eye-blink">
                          <circle cx="167" cy="74" r="4.8" fill="#101014" />
                          <circle cx="205" cy="74" r="4.8" fill="#101014" />
                          <circle cx="168.5" cy="72.5" r="1.6" fill="#FFFFFF" />
                          <circle cx="206.5" cy="72.5" r="1.6" fill="#FFFFFF" />
                        </g>
                        <ellipse cx="186" cy="94" rx="6.5" ry="5" fill="#101014" />
                      </>
                    )}

                    {/* Concentric Signal Radar Rings above cloud */}
                    <path
                      d="M171 19C179 12 193 12 201 19"
                      stroke={meta.variant === 'offline' ? '#FFA94D' : '#62D962'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="fs-signal-wave"
                    />
                    <path
                      d="M162 13C175 3 197 3 210 13"
                      stroke={meta.variant === 'offline' ? '#FFA94D' : '#62D962'}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      className="fs-signal-wave"
                      style={{ animationDelay: '700ms' }}
                    />
                  </g>

                  {/* Mini FreeStack Cylindrical Stack Bars under the cloud */}
                  <g transform="translate(136, 128)">
                    {[0, 1, 2].map((row) => {
                      const grad = BAR_GRADIENTS[(row + boopCount) % BAR_GRADIENTS.length];
                      const xOffset = (108 - grad.width) / 2;
                      return (
                        <g key={row} transform={`translate(${xOffset}, ${row * 13})`}>
                          <rect
                            x="0"
                            y="0"
                            width={grad.width}
                            height="9.5"
                            rx="4.75"
                            fill={`url(#${grad.id})`}
                            stroke="#101014"
                            strokeWidth="2.2"
                          />
                          <rect
                            x="5"
                            y="2"
                            width={Math.max(12, grad.width - 10)}
                            height="1.6"
                            rx="0.8"
                            fill="#FFFFFF"
                            opacity="0.55"
                          />
                        </g>
                      );
                    })}
                  </g>

                  {/* Animated Disconnected Plug & Socket at bottom (uses currentColor for dark/light contrast) */}
                  <g transform="translate(108, 174)">
                    <path
                      d="M0 10C18 10 26 10 42 10"
                      stroke="currentColor"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                    <g className="fs-plug-wobble">
                      <rect
                        x="40"
                        y="2"
                        width="22"
                        height="16"
                        rx="6"
                        fill="#FFA94D"
                        stroke="#101014"
                        strokeWidth="3.5"
                      />
                      <line
                        x1="62"
                        y1="6.5"
                        x2="71"
                        y2="6.5"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="62"
                        y1="13.5"
                        x2="71"
                        y2="13.5"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </g>

                    {/* Pulsing little spark gap */}
                    <circle
                      cx="84"
                      cy="10"
                      r="4.5"
                      fill="#FFE359"
                      stroke="#101014"
                      strokeWidth="2.2"
                      className="fs-spark-pulse"
                    />

                    {/* Right wire + grass green socket */}
                    <g transform="translate(96, 0)">
                      <rect
                        x="0"
                        y="2"
                        width="22"
                        height="16"
                        rx="6"
                        fill="#62D962"
                        stroke="#101014"
                        strokeWidth="3.5"
                      />
                      <path
                        d="M22 10C38 10 48 10 66 10"
                        stroke="currentColor"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                      />
                    </g>
                  </g>
                </svg>

                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-daylight px-3 py-1 border border-midnight-mouth/10 text-[12px] font-[var(--font-wallop)] font-semibold text-midnight-mouth/85">
                  <Sparkles className="w-3.5 h-3.5 text-midnight-mouth" aria-hidden="true" />
                  <span>
                    {boopCount === 0
                      ? 'Tap the 404 cloud to bounce & ping'
                      : `Cloud bounced ×${boopCount}`}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Right / Bottom: Copy + Actions */}
          <div className={`${compact ? 'lg:col-span-7' : 'lg:col-span-6'} flex flex-col items-start gap-3.5`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`${badgeBgClass} text-[#101014] font-[var(--font-wallop)] font-extrabold text-[12px] sm:text-[13px] px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-[#101014]/15`}
              >
                <VariantIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{meta.kicker}</span>
              </span>
              <span className="font-[var(--font-mono)] font-bold text-[12px] text-ink/60 tracking-wide">
                {meta.code}
              </span>
            </div>

            <h1
              className={`font-[var(--font-wallop)] font-extrabold tracking-[-0.03em] text-midnight-mouth leading-[1.08] ${
                compact ? 'text-[24px] sm:text-[30px]' : 'text-[30px] sm:text-[42px]'
              }`}
            >
              {meta.headline}
            </h1>

            <p
              data-testid="error-fallback-message"
              className="font-[var(--font-inter)] text-[14.5px] sm:text-[15.5px] text-ink/80 leading-relaxed max-w-xl"
            >
              {meta.description}
            </p>

            {pingStatus && (
              <div
                data-testid="error-fallback-ping-status"
                className="w-full rounded-[16px] bg-paper border border-midnight-mouth/12 px-3.5 py-2.5 flex items-center gap-2 text-[13px] font-[var(--font-inter)] text-midnight-mouth card-enter"
              >
                <Wifi className="w-4 h-4 text-midnight-mouth shrink-0" aria-hidden="true" />
                <span>{pingStatus}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 w-full">
              {(onRetry || meta.variant !== 'not_found') && (
                <button
                  type="button"
                  data-testid="error-fallback-retry"
                  disabled={isRetrying}
                  onClick={() => void handlePrimaryRetry()}
                  className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-4.5 py-2.5 min-h-[42px] inline-flex items-center gap-2 cursor-pointer spring-pill whitespace-nowrap disabled:opacity-70"
                >
                  <RotateCcw
                    className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{isRetrying ? 'Checking...' : meta.primaryActionLabel}</span>
                </button>
              )}

              {onBack ? (
                <button
                  type="button"
                  data-testid="error-fallback-back"
                  onClick={onBack}
                  className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-4.5 py-2.5 min-h-[42px] inline-flex items-center gap-2 cursor-pointer spring-pill whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>{backLabel}</span>
                </button>
              ) : (
                <a
                  href={backHref}
                  data-testid="error-fallback-home"
                  onClick={(e) => handleLinkClick(e, backHref)}
                  className="bg-paper text-midnight-mouth border border-midnight-mouth/15 font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-4.5 py-2.5 min-h-[42px] inline-flex items-center gap-2 spring-pill whitespace-nowrap"
                >
                  <Home className="w-4 h-4" aria-hidden="true" />
                  <span>{backLabel}</span>
                </a>
              )}

              <a
                href="/explore"
                data-testid="error-fallback-explore"
                onClick={(e) => handleLinkClick(e, '/explore')}
                className="bg-sunshine-yellow text-[#101014] border border-[#101014]/15 font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-4.5 py-2.5 min-h-[42px] inline-flex items-center gap-2 spring-pill whitespace-nowrap"
              >
                <Compass className="w-4 h-4" aria-hidden="true" />
                <span>Explore Directory</span>
              </a>
            </div>

            {/* Quick Category Jump Links (full-page view) */}
            {!compact && (
              <div className="pt-3 border-t border-midnight-mouth/10 w-full flex flex-col gap-2">
                <span className="font-[var(--font-wallop)] font-bold text-[12px] uppercase tracking-[0.04em] text-ink/65">
                  Jump to a popular stack
                </span>
                <div className="flex flex-wrap gap-2">
                  {STACK_QUICK_ROUTES.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleLinkClick(e, item.href)}
                      className={`${item.bgClass} text-[#101014] border border-[#101014]/12 font-[var(--font-wallop)] font-semibold text-[12.5px] rounded-full px-3.5 py-1.5 spring-pill whitespace-nowrap`}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

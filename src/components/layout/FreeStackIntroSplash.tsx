import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { CATEGORIES, OFFERS } from '../../lib/data/resources';
import { SparkBurstDoodle } from '../illustrations/TocaStickers';

interface FreeStackIntroSplashProps {
  forceOpen?: boolean;
  onFinish?: () => void;
}

const STACK_LAYERS = [
  {
    id: 'row-1',
    label: 'AI Models, MCP & APIs',
    detail: 'Zero-cost tokens, context servers & endpoints',
    barWidthClass: 'w-[132px] sm:w-[172px]',
    bgStyle: 'linear-gradient(180deg, #8DC8FF 0%, #59ACFF 45%, #267CD9 100%)',
    chipBg: 'bg-sky-blue',
    delayMs: 40,
  },
  {
    id: 'row-2',
    label: 'Cloud & Serverless Hosting',
    detail: 'Edge deploys & student credits',
    barWidthClass: 'w-[58px] sm:w-[76px]',
    bgStyle: 'linear-gradient(180deg, #94F094 0%, #62D962 45%, #32A832 100%)',
    chipBg: 'bg-grass-green',
    delayMs: 130,
  },
  {
    id: 'row-3',
    label: 'Learning & CS Roadmaps',
    detail: 'University courses & books',
    barWidthClass: 'w-[104px] sm:w-[136px]',
    bgStyle: 'linear-gradient(180deg, #FFF099 0%, #FFE359 45%, #DFB617 100%)',
    chipBg: 'bg-sunshine-yellow',
    delayMs: 220,
  },
  {
    id: 'row-4',
    label: 'Frontend & Design Tools',
    detail: 'UI libraries, Figma, icons & IDEs',
    barWidthClass: 'w-[58px] sm:w-[76px]',
    bgStyle: 'linear-gradient(180deg, #FFB6D5 0%, #FF8CBC 45%, #DD528F 100%)',
    chipBg: 'bg-bubblegum-pink',
    delayMs: 310,
  },
  {
    id: 'row-5',
    label: 'Databases & Student Packs',
    detail: 'Serverless SQL & .edu benefits',
    barWidthClass: 'w-[58px] sm:w-[76px]',
    bgStyle: 'linear-gradient(180deg, #FFC988 0%, #FFA94D 45%, #E07B1A 100%)',
    chipBg: 'bg-tangerine',
    delayMs: 400,
  },
];

const SESSION_KEY = 'freestack-intro-seen-v1';

export function FreeStackIntroSplash({ forceOpen = false, onFinish }: FreeStackIntroSplashProps) {
  const [visible, setVisible] = useState<boolean>(() => {
    if (forceOpen) return true;
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    if (params.get('splash') === '1') return true;
    try {
      return sessionStorage.getItem(SESSION_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setVisible(true);
      setExiting(false);
    }
  }, [forceOpen]);

  const dismiss = () => {
    setExiting(true);
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Ignore storage errors in private mode
    }
    window.setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, 240);
  };

  useEffect(() => {
    if (!visible) return;
    const params = new URLSearchParams(window.location.search);
    const holdSplash = params.get('splash') === 'hold';
    const durationMs = holdSplash ? 8000 : 1450;

    const timer = window.setTimeout(() => {
      dismiss();
    }, durationMs);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        dismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      data-testid="freestack-intro-splash"
      role="status"
      aria-live="polite"
      aria-label="Assembling verified FreeStack directory"
      onClick={dismiss}
      className={`fixed inset-0 z-[100] bg-paper text-ink flex flex-col items-center justify-center p-4 sm:p-6 select-none cursor-pointer transition-all duration-240 ${
        exiting ? 'opacity-0 scale-[0.985] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="max-w-[580px] w-full bg-daylight rounded-[26px] p-5 sm:p-8 flex flex-col items-center gap-5 sm:gap-6 relative overflow-hidden">
        <SparkBurstDoodle className="w-9 h-9 sm:w-11 sm:h-11 absolute top-4 right-4 opacity-80" />

        {/* Project Concept Visual: 5 Horizontal Cylindrical Bars Stacking into Capital 'F' + Domain Layers */}
        <div
          data-testid="freestack-stack-assembly"
          className="w-full flex flex-col gap-2 pt-1"
        >
          {STACK_LAYERS.map((layer) => (
            <div
              key={layer.id}
              style={{ animationDelay: `${layer.delayMs}ms` }}
              className="freestack-cylinder-row flex items-center justify-between gap-3 sm:gap-4 bg-paper/85 rounded-[16px] px-3 sm:px-4 py-2 sm:py-2.5"
            >
              {/* Horizontal 3D Cylindrical Bar of Capital F */}
              <div className="flex items-center min-w-[136px] sm:min-w-[180px]">
                <div
                  style={{ background: layer.bgStyle }}
                  className={`${layer.barWidthClass} h-5 sm:h-6 rounded-full relative shadow-xs flex items-center`}
                >
                  <span className="absolute top-1 left-2 right-2 h-1 rounded-full bg-white/50" />
                </div>
              </div>

              {/* Resource Stack Pillar Concept Label */}
              <div className="flex items-center gap-2 min-w-0 text-right justify-end">
                <span
                  className={`${layer.chipBg} text-[#101014] font-[var(--font-wallop)] font-bold text-[12px] sm:text-[13px] leading-tight px-2.5 py-1 rounded-full truncate`}
                >
                  {layer.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Assembled Wordmark + Tactile Verification Stamp (Zero Loading Bars) */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-midnight-mouth/10">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="inline-flex items-center gap-2">
              <span className="font-[var(--font-wallop)] font-extrabold text-[24px] sm:text-[30px] tracking-[-0.03em] text-midnight-mouth leading-none">
                FreeStack
              </span>
              <span
                style={{ animationDelay: '480ms' }}
                className="freestack-stamp-badge bg-grass-green text-[#101014] font-[var(--font-wallop)] font-extrabold text-[11px] sm:text-[12px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                <span>$0 · SOURCE CITED</span>
              </span>
            </div>
            <p className="font-[var(--font-inter)] text-[13px] sm:text-[13.5px] text-ink/80 mt-1">
              {OFFERS.length} verified resources across {CATEGORIES.length} stacks — real quotas, no card traps.
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="w-full sm:w-auto bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13.5px] sm:text-[14px] rounded-full px-4 py-2.5 min-h-[40px] inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer spring-pill"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Enter FreeStack</span>
          </button>
        </div>
      </div>
    </div>
  );
}

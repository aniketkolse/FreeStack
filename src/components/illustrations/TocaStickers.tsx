import React from 'react';
import type { CategoryColorToken, CategorySlug } from '../../types/resource';

export function FreeStackLogo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const isLarge = size === 'lg';
  const markSize = isLarge ? 44 : 32;
  const uid = isLarge ? 'lg' : 'sm';

  return (
    <span className="inline-flex items-center gap-2 sm:gap-2.5 select-none">
      {/* Capital F formed by 5 colorful horizontal cylindrical rectangles stacked one above another */}
      <svg
        data-testid={`freestack-logo-mark-${uid}`}
        width={markSize}
        height={markSize}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={`shrink-0 ${isLarge ? 'w-9 h-9 sm:w-11 sm:h-11' : 'w-7 h-7 sm:w-8 sm:h-8'}`}
      >
        <defs>
          <linearGradient id={`cyl-blue-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8DC8FF" />
            <stop offset="45%" stopColor="#59ACFF" />
            <stop offset="100%" stopColor="#267CD9" />
          </linearGradient>
          <linearGradient id={`cyl-green-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94F094" />
            <stop offset="45%" stopColor="#62D962" />
            <stop offset="100%" stopColor="#32A832" />
          </linearGradient>
          <linearGradient id={`cyl-yellow-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF099" />
            <stop offset="45%" stopColor="#FFE359" />
            <stop offset="100%" stopColor="#DFB617" />
          </linearGradient>
          <linearGradient id={`cyl-pink-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB6D5" />
            <stop offset="45%" stopColor="#FF8CBC" />
            <stop offset="100%" stopColor="#DD528F" />
          </linearGradient>
          <linearGradient id={`cyl-orange-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFC988" />
            <stop offset="45%" stopColor="#FFA94D" />
            <stop offset="100%" stopColor="#E07B1A" />
          </linearGradient>
        </defs>

        {/* Row 1: Top horizontal crossbar of Capital F */}
        <rect x="4" y="3" width="48" height="8.5" rx="4.25" fill={`url(#cyl-blue-${uid})`} />
        <rect x="7" y="4.5" width="42" height="1.7" rx="0.85" fill="#FFFFFF" opacity="0.48" />

        {/* Row 2: Upper stem cylinder */}
        <rect x="4" y="13.5" width="19" height="8.5" rx="4.25" fill={`url(#cyl-green-${uid})`} />
        <rect x="7" y="15" width="13" height="1.7" rx="0.85" fill="#FFFFFF" opacity="0.48" />

        {/* Row 3: Middle horizontal crossbar of Capital F */}
        <rect x="4" y="24" width="38" height="8.5" rx="4.25" fill={`url(#cyl-yellow-${uid})`} />
        <rect x="7" y="25.5" width="32" height="1.7" rx="0.85" fill="#FFFFFF" opacity="0.48" />

        {/* Row 4: Lower stem cylinder */}
        <rect x="4" y="34.5" width="19" height="8.5" rx="4.25" fill={`url(#cyl-pink-${uid})`} />
        <rect x="7" y="36" width="13" height="1.7" rx="0.85" fill="#FFFFFF" opacity="0.48" />

        {/* Row 5: Base stem cylinder */}
        <rect x="4" y="45" width="19" height="8.5" rx="4.25" fill={`url(#cyl-orange-${uid})`} />
        <rect x="7" y="46.5" width="13" height="1.7" rx="0.85" fill="#FFFFFF" opacity="0.48" />
      </svg>

      <span
        className={`font-[var(--font-wallop)] font-extrabold tracking-[-0.03em] text-midnight-mouth leading-none whitespace-nowrap ${
          isLarge ? 'text-[22px] sm:text-[26px]' : 'text-[18px] sm:text-[20px]'
        }`}
      >
        FreeStack
      </span>
    </span>
  );
}

export const FreeStackMouthLogo = FreeStackLogo;

export function HeroHeartSticker({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`inline-block sticker-bob -rotate-2 ${className}`}
    >
      {/* Drop Shadow for Fun Chunky Tactile Depth */}
      <g opacity="0.16" transform="translate(0, 4)">
        <path
          d="M28 12C17 12 13 17 13 25V36C13 42 8 46 3.5 46C8 46 13 50 13 56V67C13 75 17 80 28 80"
          stroke="#101014"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M100 12C111 12 115 17 115 25V36C115 42 120 46 124.5 46C120 46 115 50 115 56V67C115 75 111 80 100 80"
          stroke="#101014"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Bold Left Yellow Curly Bracket '{' */}
      <path
        d="M28 12C17 12 13 17 13 25V36C13 42 8 46 3.5 46C8 46 13 50 13 56V67C13 75 17 80 28 80"
        stroke="#101014"
        strokeWidth="14.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 12C17 12 13 17 13 25V36C13 42 8 46 3.5 46C8 46 13 50 13 56V67C13 75 17 80 28 80"
        stroke="#FFE359"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bold Right Yellow Curly Bracket '}' */}
      <path
        d="M100 12C111 12 115 17 115 25V36C115 42 120 46 124.5 46C120 46 115 50 115 56V67C115 75 111 80 100 80"
        stroke="#101014"
        strokeWidth="14.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M100 12C111 12 115 17 115 25V36C115 42 120 46 124.5 46C120 46 115 50 115 56V67C115 75 111 80 100 80"
        stroke="#FFE359"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Fun & Bold Center '</>' — Left '<' in Sky Blue */}
      <path
        d="M49 28L33 46L49 64"
        stroke="#101014"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M49 28L33 46L49 64"
        stroke="#59ACFF"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Fun & Bold Center '</>' — Right '>' in Grass Green */}
      <path
        d="M79 28L95 46L79 64"
        stroke="#101014"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M79 28L95 46L79 64"
        stroke="#62D962"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Fun & Bold Center '</>' — Slash '/' in Bubblegum Pink */}
      <path
        d="M70 21L58 71"
        stroke="#101014"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M70 21L58 71"
        stroke="#FF8CBC"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeroBoltSticker({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`inline-block sticker-bob ${className}`}
    >
      {/* Tactile Offset Drop Shadow */}
      <path
        d="M31 76H103C113.5 76 122 67.5 122 57C122 46.6 113.7 38.1 103.4 37.1C100.8 26.9 91.5 19.5 80.5 19.5C77.2 19.5 74 20.2 71.2 21.4C67.2 11.2 57.2 4 45.5 4C30.3 4 18 16.3 18 31.5C18 32.3 18 33.1 18.1 33.9C10.4 37.9 5 45.8 5 55C5 66.6 16.4 76 31 76Z"
        fill="#101014"
        opacity="0.15"
        transform="translate(0, 4)"
      />

      {/* Outer Cloud Shape Filled with Theme Sky Blue (#59ACFF, matching AI Models & APIs cards) */}
      <path
        d="M31 76H103C113.5 76 122 67.5 122 57C122 46.6 113.7 38.1 103.4 37.1C100.8 26.9 91.5 19.5 80.5 19.5C77.2 19.5 74 20.2 71.2 21.4C67.2 11.2 57.2 4 45.5 4C30.3 4 18 16.3 18 31.5C18 32.3 18 33.1 18.1 33.9C10.4 37.9 5 45.8 5 55C5 66.6 16.4 76 31 76Z"
        fill="#59ACFF"
        stroke="#101014"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Friendly Eyes & Smile */}
      <circle cx="49" cy="39.5" r="4.6" fill="#101014" />
      <circle cx="77" cy="39.5" r="4.6" fill="#101014" />
      <path
        d="M51.5 56C56.5 63.5 69.5 63.5 74.5 56"
        stroke="#101014"
        strokeWidth="5.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SparkBurstDoodle({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`text-midnight-mouth ${className}`}
    >
      <path d="M16 20L8 8" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M32 14V2" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M48 22L60 12" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M50 38L62 42" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

export function HandDrawnWaveDoodle({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`text-midnight-mouth ${className}`}
    >
      <path
        d="M4 18C14 4 24 4 34 18C44 32 54 32 64 18C74 4 84 4 94 18C104 32 112 24 116 14"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SlabIllustration({ variant }: { variant: 'verify' | 'students' | 'learning' }) {
  if (variant === 'students') {
    return (
      <div className="w-full h-full min-h-[160px] sm:min-h-[210px] rounded-[20px] sm:rounded-[24px] bg-daylight flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <svg viewBox="0 0 360 400" fill="none" className="w-full max-w-[160px] sm:max-w-[200px]" aria-hidden="true">
          <rect x="44" y="210" width="272" height="140" rx="32" fill="#ffe359" stroke="#101014" strokeWidth="5" />
          <rect x="68" y="130" width="224" height="110" rx="28" fill="#59acff" stroke="#101014" strokeWidth="5" />
          <circle cx="180" cy="96" r="56" fill="#ff8cbc" stroke="#101014" strokeWidth="5" />
          <path d="M112 72L180 42L248 72L180 102L112 72Z" fill="#101014" />
          <path d="M236 78V110" stroke="#ffe359" strokeWidth="5" strokeLinecap="round" />
          <circle cx="236" cy="114" r="7" fill="#ffe359" stroke="#101014" strokeWidth="3" />
          <circle cx="162" cy="102" r="5" fill="#101014" />
          <circle cx="198" cy="102" r="5" fill="#101014" />
          <path d="M168 118C173 125 187 125 192 118" stroke="#101014" strokeWidth="4" strokeLinecap="round" />
          <rect x="94" y="162" width="76" height="38" rx="19" fill="#ffffff" stroke="#101014" strokeWidth="4" />
          <text x="132" y="187" textAnchor="middle" fill="#101014" fontSize="16" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
            .EDU
          </text>
          <rect x="190" y="162" width="76" height="38" rx="19" fill="#62d962" stroke="#101014" strokeWidth="4" />
          <text x="228" y="187" textAnchor="middle" fill="#101014" fontSize="16" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
            $100+
          </text>
          <rect x="86" y="242" width="188" height="76" rx="18" fill="#ffffff" stroke="#101014" strokeWidth="4" />
          <path d="M122 272L144 294L194 256" stroke="#62d962" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="208" y="264" width="44" height="10" rx="5" fill="#101014" />
          <rect x="208" y="284" width="32" height="10" rx="5" fill="#59acff" />
        </svg>
        <HandDrawnWaveDoodle className="absolute -bottom-2 -right-3 w-20" />
      </div>
    );
  }

  if (variant === 'learning') {
    return (
      <div className="w-full h-full min-h-[150px] sm:min-h-[190px] rounded-[20px] sm:rounded-[24px] bg-daylight flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <svg viewBox="0 0 360 280" fill="none" className="w-full max-w-[180px] sm:max-w-[230px]" aria-hidden="true">
          <rect x="44" y="182" width="272" height="58" rx="20" fill="#ff8cbc" stroke="#101014" strokeWidth="5" />
          <rect x="64" y="120" width="232" height="58" rx="20" fill="#62d962" stroke="#101014" strokeWidth="5" />
          <rect x="84" y="58" width="192" height="58" rx="20" fill="#ffe359" stroke="#101014" strokeWidth="5" />
          <path d="M150 76L134 87L150 98" stroke="#101014" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M210 76L226 87L210 98" stroke="#101014" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M186 73L174 101" stroke="#101014" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="290" cy="54" r="28" fill="#59acff" stroke="#101014" strokeWidth="4" />
          <circle cx="282" cy="52" r="3.5" fill="#101014" />
          <circle cx="298" cy="52" r="3.5" fill="#101014" />
          <path d="M284 61C287 65 293 65 296 61" stroke="#101014" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[160px] sm:min-h-[220px] rounded-[20px] sm:rounded-[24px] bg-daylight flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <svg viewBox="0 0 360 400" fill="none" className="w-full max-w-[160px] sm:max-w-[210px]" aria-hidden="true">
        <rect x="52" y="56" width="256" height="300" rx="32" fill="#ffffff" stroke="#101014" strokeWidth="5" />
        <rect x="116" y="34" width="128" height="40" rx="20" fill="#ffe359" stroke="#101014" strokeWidth="5" />
        <circle cx="104" cy="128" r="22" fill="#62d962" stroke="#101014" strokeWidth="4" />
        <path d="M94 128L101 135L115 121" stroke="#101014" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="142" y="116" width="132" height="14" rx="7" fill="#101014" />
        <rect x="142" y="138" width="90" height="10" rx="5" fill="#59acff" />

        <circle cx="104" cy="200" r="22" fill="#ff8cbc" stroke="#101014" strokeWidth="4" />
        <path d="M94 200L101 207L115 193" stroke="#101014" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="142" y="188" width="120" height="14" rx="7" fill="#101014" />
        <rect x="142" y="210" width="104" height="10" rx="5" fill="#62d962" />

        <rect x="82" y="256" width="196" height="68" rx="24" fill="#ffe359" stroke="#101014" strokeWidth="4" />
        <text x="180" y="298" textAnchor="middle" fill="#101014" fontSize="22" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
          SOURCE CITED
        </text>
      </svg>
      <SparkBurstDoodle className="absolute top-4 right-4 w-9 h-9" />
    </div>
  );
}

const COLOR_BG_MAP: Record<CategoryColorToken, string> = {
  'sky-blue': 'bg-sky-blue',
  'grass-green': 'bg-grass-green',
  'bubblegum-pink': 'bg-bubblegum-pink',
  tangerine: 'bg-tangerine',
  'sunshine-yellow': 'bg-sunshine-yellow',
  daylight: 'bg-daylight',
};

export function getCategoryBgClass(color: CategoryColorToken): string {
  return COLOR_BG_MAP[color] ?? 'bg-sky-blue';
}

export function CategoryStickerIcon({
  slug,
  className = 'w-10 h-10',
}: {
  slug: CategorySlug;
  className?: string;
}) {
  switch (slug) {
    case 'ai-ml':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="12" width="48" height="40" rx="16" fill="#ffffff" stroke="#101014" strokeWidth="4" />
          <circle cx="24" cy="30" r="4" fill="#101014" />
          <circle cx="40" cy="30" r="4" fill="#101014" />
          <path d="M25 40C28 43 36 43 39 40" stroke="#101014" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M32 4V12" stroke="#101014" strokeWidth="4" strokeLinecap="round" />
          <circle cx="32" cy="5" r="3" fill="#ffe359" stroke="#101014" strokeWidth="2.5" />
        </svg>
      );
    case 'mcp':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="8" width="48" height="48" rx="14" fill="#ffffff" stroke="#101014" strokeWidth="4" />
          <path d="M20 42V22L32 33L44 22V42" stroke="#101014" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="22" r="4.5" fill="#59acff" stroke="#101014" strokeWidth="2.5" />
          <circle cx="44" cy="22" r="4.5" fill="#62d962" stroke="#101014" strokeWidth="2.5" />
          <circle cx="32" cy="33" r="4.5" fill="#ff8cbc" stroke="#101014" strokeWidth="2.5" />
        </svg>
      );
    case 'cloud-hosting':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path
            d="M18 46H47C52.5 46 57 41.5 57 36C57 30.8 53 26.5 47.9 26C46.2 18.6 39.6 13 31.7 13C22.5 13 15 20.5 15 29.7C15 30.2 15 30.7 15.1 31.2C10.5 32.3 7 36.4 7 41.4C7 44 12.2 46 18 46Z"
            fill="#ffffff"
            stroke="#101014"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <circle cx="26" cy="33" r="2.8" fill="#101014" />
          <circle cx="38" cy="33" r="2.8" fill="#101014" />
        </svg>
      );
    case 'developer-tools':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="10" width="48" height="44" rx="14" fill="#ffffff" stroke="#101014" strokeWidth="4" />
          <path d="M24 25L17 32L24 39" stroke="#101014" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 25L47 32L40 39" stroke="#101014" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M35 22L29 42" stroke="#59acff" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'databases-backend':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <ellipse cx="32" cy="17" rx="20" ry="8" fill="#ffffff" stroke="#101014" strokeWidth="4" />
          <path d="M12 17V32C12 36.4 21 40 32 40C43 40 52 36.4 52 32V17" fill="#ffffff" stroke="#101014" strokeWidth="4" />
          <path d="M12 32V47C12 51.4 21 55 32 55C43 55 52 51.4 52 47V32" fill="#ffe359" stroke="#101014" strokeWidth="4" />
        </svg>
      );
    case 'learning':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M10 16C18 14 26 16 32 21C38 16 46 14 54 16V48C46 46 38 48 32 52C26 48 18 46 10 48V16Z" fill="#ffffff" stroke="#101014" strokeWidth="4" strokeLinejoin="round" />
          <line x1="32" y1="21" x2="32" y2="52" stroke="#101014" strokeWidth="4" />
        </svg>
      );
    case 'student-benefits':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M8 26L32 14L56 26L32 38L8 26Z" fill="#ffffff" stroke="#101014" strokeWidth="4" strokeLinejoin="round" />
          <path d="M18 31V44C18 48 24 51 32 51C40 51 46 48 46 44V31" fill="#ffe359" stroke="#101014" strokeWidth="4" strokeLinejoin="round" />
          <path d="M52 28V44" stroke="#101014" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'apis-integrations':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <circle cx="18" cy="32" r="9" fill="#ffffff" stroke="#101014" strokeWidth="4" />
          <circle cx="46" cy="18" r="9" fill="#ffe359" stroke="#101014" strokeWidth="4" />
          <circle cx="46" cy="46" r="9" fill="#ff8cbc" stroke="#101014" strokeWidth="4" />
          <path d="M26 28L38 22M26 36L38 42" stroke="#101014" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'design-creative':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="10" width="48" height="44" rx="14" fill="#ffffff" stroke="#101014" strokeWidth="4" />
          <circle cx="18" cy="20" r="3" fill="#ff8cbc" />
          <circle cx="27" cy="20" r="3" fill="#ffe359" />
          <circle cx="36" cy="20" r="3" fill="#62d962" />
          <rect x="15" y="29" width="16" height="16" rx="5" fill="#59acff" stroke="#101014" strokeWidth="2.5" />
          <circle cx="42" cy="37" r="7" fill="#ff8cbc" stroke="#101014" strokeWidth="2.5" />
        </svg>
      );
    case 'security-networking':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M32 8L52 16V31C52 44 43 52 32 56C21 52 12 44 12 31V16L32 8Z" fill="#ffffff" stroke="#101014" strokeWidth="4" strokeLinejoin="round" />
          <path d="M24 32L30 38L41 26" stroke="#62d962" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'productivity-collaboration':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="10" y="12" width="44" height="40" rx="14" fill="#ffffff" stroke="#101014" strokeWidth="4" />
          <rect x="18" y="21" width="12" height="12" rx="4" fill="#59acff" stroke="#101014" strokeWidth="3" />
          <rect x="34" y="21" width="12" height="22" rx="4" fill="#ff8cbc" stroke="#101014" strokeWidth="3" />
          <rect x="18" y="37" width="12" height="6" rx="3" fill="#62d962" stroke="#101014" strokeWidth="2.5" />
        </svg>
      );
  }
}

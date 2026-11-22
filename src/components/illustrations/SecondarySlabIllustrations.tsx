import React from 'react';
import { HandDrawnWaveDoodle } from './TocaStickers';

export function SecondarySlabIllustration({
  variant,
}: {
  variant: 'students' | 'learning';
}) {
  if (variant === 'students') {
    return (
      <div className="w-full h-full min-h-[160px] sm:min-h-[210px] rounded-[20px] sm:rounded-[24px] bg-daylight flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <svg
          viewBox="0 0 360 400"
          fill="none"
          className="w-full max-w-[160px] sm:max-w-[200px]"
          aria-hidden="true"
        >
          <rect
            x="44"
            y="210"
            width="272"
            height="140"
            rx="32"
            fill="#ffe359"
            stroke="#101014"
            strokeWidth="5"
          />
          <rect
            x="68"
            y="130"
            width="224"
            height="110"
            rx="28"
            fill="#59acff"
            stroke="#101014"
            strokeWidth="5"
          />
          <circle
            cx="180"
            cy="96"
            r="56"
            fill="#ff8cbc"
            stroke="#101014"
            strokeWidth="5"
          />
          <path d="M112 72L180 42L248 72L180 102L112 72Z" fill="#101014" />
          <path d="M236 78V110" stroke="#ffe359" strokeWidth="5" strokeLinecap="round" />
          <circle cx="236" cy="114" r="7" fill="#ffe359" stroke="#101014" strokeWidth="3" />
          <circle cx="162" cy="102" r="5" fill="#101014" />
          <circle cx="198" cy="102" r="5" fill="#101014" />
          <path
            d="M168 118C173 125 187 125 192 118"
            stroke="#101014"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect
            x="94"
            y="162"
            width="76"
            height="38"
            rx="19"
            fill="#ffffff"
            stroke="#101014"
            strokeWidth="4"
          />
          <text
            x="132"
            y="187"
            textAnchor="middle"
            fill="#101014"
            fontSize="16"
            fontWeight="800"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            .EDU
          </text>
          <rect
            x="190"
            y="162"
            width="76"
            height="38"
            rx="19"
            fill="#62d962"
            stroke="#101014"
            strokeWidth="4"
          />
          <text
            x="228"
            y="187"
            textAnchor="middle"
            fill="#101014"
            fontSize="16"
            fontWeight="800"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            $100+
          </text>
          <rect
            x="86"
            y="242"
            width="188"
            height="76"
            rx="18"
            fill="#ffffff"
            stroke="#101014"
            strokeWidth="4"
          />
          <path
            d="M122 272L144 294L194 256"
            stroke="#62d962"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="208" y="264" width="44" height="10" rx="5" fill="#101014" />
          <rect x="208" y="284" width="32" height="10" rx="5" fill="#59acff" />
        </svg>
        <HandDrawnWaveDoodle className="absolute -bottom-2 -right-3 w-20" />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[150px] sm:min-h-[190px] rounded-[20px] sm:rounded-[24px] bg-daylight flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <svg
        viewBox="0 0 360 280"
        fill="none"
        className="w-full max-w-[180px] sm:max-w-[230px]"
        aria-hidden="true"
      >
        <rect
          x="44"
          y="182"
          width="272"
          height="58"
          rx="20"
          fill="#ff8cbc"
          stroke="#101014"
          strokeWidth="5"
        />
        <rect
          x="64"
          y="120"
          width="232"
          height="58"
          rx="20"
          fill="#62d962"
          stroke="#101014"
          strokeWidth="5"
        />
        <rect
          x="84"
          y="58"
          width="192"
          height="58"
          rx="20"
          fill="#ffe359"
          stroke="#101014"
          strokeWidth="5"
        />
        <path
          d="M150 76L134 87L150 98"
          stroke="#101014"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M210 76L226 87L210 98"
          stroke="#101014"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M186 73L174 101" stroke="#101014" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="290" cy="54" r="28" fill="#59acff" stroke="#101014" strokeWidth="4" />
        <circle cx="282" cy="52" r="3.5" fill="#101014" />
        <circle cx="298" cy="52" r="3.5" fill="#101014" />
        <path
          d="M284 61C287 65 293 65 296 61"
          stroke="#101014"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

import React, { useCallback, useState } from 'react';
import type { Offer } from '../../types/resource';

interface OfferLogoProps {
  offer: Offer;
  imgClassName?: string;
  fallbackClassName?: string;
  priority?: boolean;
}

const CATEGORY_DEFAULT_LOGO: Record<string, string> = {
  'ai-ml': '/logos/huggingface.svg',
  mcp: '/logos/mcp.svg',
  'apis-data': '/logos/postman.svg',
  'cloud-hosting': '/logos/cloudflare.svg',
  'databases-backend': '/logos/supabase.svg',
  'developer-tools': '/logos/github.svg',
  'design-creative': '/logos/figma.svg',
  'security-networking': '/logos/letsencrypt.svg',
  'productivity-collaboration': '/logos/notion.svg',
  learning: '/logos/freecodecamp.svg',
  'student-benefits': '/logos/github.svg',
};

const TILE_PALETTE = [
  { bg: 'bg-sky-blue', text: 'text-[#101014]' },
  { bg: 'bg-grass-green', text: 'text-[#101014]' },
  { bg: 'bg-sunshine-yellow', text: 'text-[#101014]' },
  { bg: 'bg-bubblegum-pink', text: 'text-[#101014]' },
  { bg: 'bg-tangerine', text: 'text-[#101014]' },
];

function getInitialsAndColor(offer: Offer): { initials: string; bg: string; text: string } {
  const slug = offer.identity.slug || offer.identity.name || 'fs';
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const palette = TILE_PALETTE[hash % TILE_PALETTE.length];

  const sourceLabel = (offer.identity.provider || offer.identity.name || 'FS').trim();
  const words = sourceLabel.split(/[\s\-_/]+/).filter(Boolean);
  let initials = 'FS';
  if (words.length >= 2) {
    initials = `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
  } else if (words.length === 1) {
    initials = words[0].slice(0, 2).toUpperCase();
  }
  initials = initials.replace(/[^A-Z0-9]/g, '') || 'FS';

  return {
    initials,
    bg: palette.bg,
    text: palette.text,
  };
}

export function OfferLogo({
  offer,
  imgClassName = 'w-9 h-9 object-contain',
  priority = false,
}: OfferLogoProps) {
  const [localFailed, setLocalFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [wasCachedOnMount, setWasCachedOnMount] = useState(false);

  const candidateSrc =
    offer.identity.logo_url ||
    CATEGORY_DEFAULT_LOGO[offer.classification.category] ||
    '/logos/github.svg';

  // Enforce same-origin /logos/* paths only (zero third-party hotlinking or favicon leaks)
  const safeLocalSrc =
    !localFailed &&
    candidateSrc &&
    /^\/logos\/[a-z0-9-]+\.(?:svg|png|jpg)$/i.test(candidateSrc)
      ? candidateSrc
      : null;

  const handleImgRef = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth > 0) {
      setWasCachedOnMount(true);
      setLoaded(true);
    }
  }, []);

  const { initials, bg, text } = getInitialsAndColor(offer);

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 aspect-square select-none overflow-hidden rounded-[8px] ${imgClassName}`}
    >
      {/* Zero-request instant deterministic initials tile */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center rounded-[8px] font-[var(--font-wallop)] font-extrabold text-[11px] leading-none tracking-[-0.02em] ${bg} ${text} transition-opacity duration-150 ${
          safeLocalSrc && loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {initials}
      </span>

      {safeLocalSrc && (
        <img
          ref={handleImgRef}
          src={safeLocalSrc}
          alt={`${offer.identity.provider} logo`}
          width={36}
          height={36}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLocalFailed(true);
          }}
          className={`offer-logo-img relative z-10 w-full h-full object-contain rounded-[8px] ${
            wasCachedOnMount
              ? 'opacity-100'
              : `transition-opacity duration-150 ${loaded ? 'opacity-100' : 'opacity-0'}`
          }`}
        />
      )}
    </span>
  );
}

import React, { useState } from 'react';
import type { Offer } from '../../types/resource';
import {
  resolveOfferBrandLogoSrc,
  resolveOfferLogoSrc,
} from '../../lib/offers/offerLogos';
import { CategoryStickerIcon } from '../illustrations/TocaStickers';

interface OfferLogoProps {
  offer: Offer;
  imgClassName?: string;
  fallbackClassName?: string;
}

export function OfferLogo({
  offer,
  imgClassName = 'w-9 h-9 object-contain',
  fallbackClassName = 'w-9 h-9',
}: OfferLogoProps) {
  const [localFailed, setLocalFailed] = useState(false);

  const brandSrc = resolveOfferBrandLogoSrc(offer);
  const fallbackLocalSrc = resolveOfferLogoSrc(offer);
  const candidateSrc = brandSrc || fallbackLocalSrc;

  // Enforce same-origin /logos/* paths only (zero third-party hotlinking or favicon leaks)
  const safeLocalSrc =
    !localFailed &&
    candidateSrc &&
    /^\/logos\/[a-z0-9-]+\.(?:svg|png|jpg)$/i.test(candidateSrc)
      ? candidateSrc
      : null;

  if (safeLocalSrc) {
    return (
      <img
        src={`${safeLocalSrc}?v=official4`}
        alt={`${offer.identity.provider} logo`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={`${imgClassName} rounded-[8px]`}
        onError={() => {
          setLocalFailed(true);
        }}
      />
    );
  }

  return <CategoryStickerIcon slug={offer.classification.category} className={fallbackClassName} />;
}

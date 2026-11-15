import React, { useState } from 'react';
import type { Offer } from '../../types/resource';
import {
  resolveOfferBrandLogoSrc,
  resolveOfferLogoSrc,
  resolveOfferRemoteBrandUrl,
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
  const [remoteFailed, setRemoteFailed] = useState(false);
  const [localFailed, setLocalFailed] = useState(false);

  const brandSrc = resolveOfferBrandLogoSrc(offer);
  const remoteSrc = !brandSrc ? resolveOfferRemoteBrandUrl(offer) : null;
  const fallbackLocalSrc = resolveOfferLogoSrc(offer);

  const activeSrc = brandSrc || (!remoteFailed && remoteSrc) || (!localFailed && fallbackLocalSrc);

  if (activeSrc) {
    const cacheBustedSrc = activeSrc.startsWith('/logos/')
      ? `${activeSrc}?v=official4`
      : activeSrc;

    return (
      <img
        src={cacheBustedSrc}
        alt={`${offer.identity.provider} logo`}
        loading="lazy"
        className={`${imgClassName} rounded-[8px]`}
        onError={() => {
          if (!brandSrc && remoteSrc && !remoteFailed) {
            setRemoteFailed(true);
          } else {
            setLocalFailed(true);
          }
        }}
      />
    );
  }

  return <CategoryStickerIcon slug={offer.classification.category} className={fallbackClassName} />;
}

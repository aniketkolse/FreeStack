import React, { useEffect, useState } from 'react';
import { Bookmark, Home, Menu, X } from 'lucide-react';
import { FreeStackLogo } from '../illustrations/TocaStickers';
import { useSavedOffers } from '../../lib/saved/savedOffers';

interface SiteHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/explore' },
  { label: 'Categories', href: '/categories' },
  { label: 'AI Models', href: '/category/ai-ml' },
  { label: 'MCP', href: '/category/mcp' },
  { label: 'APIs', href: '/category/apis-integrations' },
  { label: 'Learning', href: '/learning' },
  { label: 'Students', href: '/students' },
  { label: 'About', href: '/about' },
];

export function SiteHeader({ currentPath, onNavigate }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { savedCount } = useSavedOffers();

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    onNavigate(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-paper/98 border-b border-midnight-mouth/8">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-[60px] sm:h-[68px] flex items-center justify-between gap-3 sm:gap-5">
        {/* Zone 1: Brand mark */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="shrink-0 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 rounded-full min-h-[38px] inline-flex items-center"
          aria-label="FreeStack Home"
        >
          <FreeStackLogo size="sm" />
        </a>

        {/* Zone 2: Desktop Navigation links */}
        <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href === '/categories' &&
                currentPath.startsWith('/category/') &&
                currentPath !== '/category/ai-ml' &&
                currentPath !== '/category/mcp' &&
                currentPath !== '/category/apis-integrations') ||
              (item.href === '/explore' && currentPath === '/search');
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleLinkClick(e, item.href)}
                aria-current={isActive ? 'page' : undefined}
                className={`font-[var(--font-wallop)] font-semibold text-[13px] xl:text-[13.5px] leading-none whitespace-nowrap shrink-0 px-2.5 xl:px-3 py-2 rounded-full inline-flex items-center gap-1.5 filter-pill ${
                  isActive
                    ? 'bg-midnight-mouth text-daylight'
                    : 'text-midnight-mouth/85 hover:text-midnight-mouth hover:bg-daylight'
                }`}
              >
                {item.href === '/' && <Home className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Saved Stack + Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <a
            href="/saved"
            data-testid="header-saved-link"
            onClick={(e) => handleLinkClick(e, '/saved')}
            aria-label={`Saved tools (${savedCount})`}
            className="inline-flex items-center justify-center gap-1.5 font-[var(--font-wallop)] font-semibold text-[13px] leading-none rounded-full px-3.5 py-2 min-h-[38px] bg-daylight text-midnight-mouth hover:bg-sunshine-yellow spring-pill"
          >
            <Bookmark className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Saved</span>
            <span className="tabular-nums">({savedCount})</span>
          </a>

          <a
            href="/explore"
            onClick={(e) => handleLinkClick(e, '/explore')}
            className="hidden sm:inline-flex items-center justify-center bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13.5px] xl:text-[14px] leading-none rounded-full px-4 sm:px-5 py-2.5 min-h-[38px] whitespace-nowrap shrink-0 spring-pill"
          >
            Browse Free
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-daylight text-midnight-mouth spring-pill cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav
          id="mobile-nav-menu"
          aria-label="Mobile Navigation"
          className="lg:hidden max-w-[1360px] mx-auto px-4 sm:px-6 pb-4 pt-1 drawer-enter"
        >
          <div className="bg-daylight rounded-[22px] p-3.5 sm:p-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                currentPath === item.href ||
                (item.href === '/categories' && currentPath.startsWith('/category/')) ||
                (item.href === '/explore' && currentPath === '/search');
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`font-[var(--font-wallop)] font-semibold text-[15px] text-midnight-mouth px-3.5 py-2.5 min-h-[42px] flex items-center rounded-[14px] ${
                    isActive ? 'bg-paper' : 'hover:bg-paper/60'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            <a
              href="/saved"
              onClick={(e) => handleLinkClick(e, '/saved')}
              className="font-[var(--font-wallop)] font-semibold text-[15px] text-midnight-mouth px-3.5 py-2.5 min-h-[42px] flex items-center justify-between rounded-[14px] hover:bg-paper/60"
            >
              <span>Saved Tools</span>
              <span className="tabular-nums">({savedCount})</span>
            </a>
            <a
              href="/explore"
              onClick={(e) => handleLinkClick(e, '/explore')}
              className="mt-1.5 inline-flex items-center justify-center bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-5 py-2.5 min-h-[42px]"
            >
              Browse Directory
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

import { useEffect, useState } from 'react';
import { useRouter, type NavigateOptions } from './lib/router/useRouter';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { FreeStackIntroSplash } from './components/layout/FreeStackIntroSplash';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { OfferDetailPage } from './pages/OfferDetailPage';
import { LearningPage } from './pages/LearningPage';
import { StudentsPage } from './pages/StudentsPage';
import { AboutPage } from './pages/AboutPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { LegalCenterPage } from './pages/LegalCenterPage';
import { SavedOffersPage } from './pages/SavedOffersPage';

export default function App() {
  const { pathname, params, navigate } = useRouter();
  const [replaySplash, setReplaySplash] = useState(false);

  useEffect(() => {
    let title = 'FreeStack — Find more. Spend less. Build anything.';
    if (pathname === '/explore') title = 'Explore Free Resources — FreeStack';
    else if (pathname === '/search') title = 'Search Results — FreeStack';
    else if (pathname === '/categories') title = 'All Categories — FreeStack';
    else if (pathname.startsWith('/category/')) title = 'Category Resources — FreeStack';
    else if (pathname.startsWith('/offer/')) title = 'Resource Details — FreeStack';
    else if (pathname === '/learning') title = 'Free Learning & Study Materials — FreeStack';
    else if (pathname === '/students') title = 'Student Benefits & Credits — FreeStack';
    else if (pathname === '/saved') title = 'Saved Tools & Stack — FreeStack';
    else if (pathname === '/about') title = 'About & Verification Policy — FreeStack';
    else if (pathname === '/privacy') title = 'Privacy Policy (India DPDP, US CCPA, Global GDPR) — FreeStack';
    else if (pathname === '/privacy-requests') title = 'Privacy Requests & Grievance Portal — FreeStack';
    else if (pathname === '/terms') title = 'Terms of Service — FreeStack';
    else if (pathname === '/design-system') title = 'Design System Showcase — FreeStack';
    document.title = title;
  }, [pathname]);

  const handleNavigate = (to: string, options?: NavigateOptions) => {
    navigate(to, options);
  };

  const renderPage = () => {
    if (pathname === '/' || pathname === '') {
      return <HomePage onNavigate={handleNavigate} />;
    }
    if (pathname === '/explore') {
      return <ExplorePage searchParams={params} onNavigate={handleNavigate} mode="explore" />;
    }
    if (pathname === '/search') {
      return <ExplorePage searchParams={params} onNavigate={handleNavigate} mode="search" />;
    }
    if (pathname === '/categories') {
      return <CategoriesPage onNavigate={handleNavigate} />;
    }
    if (pathname.startsWith('/category/')) {
      const slug = pathname.replace('/category/', '').replace(/\/$/, '');
      return (
        <CategoryDetailPage
          key={slug}
          slug={slug}
          searchParams={params}
          onNavigate={handleNavigate}
        />
      );
    }
    if (pathname.startsWith('/offer/')) {
      const slug = pathname.replace('/offer/', '').replace(/\/$/, '');
      return <OfferDetailPage slug={slug} onNavigate={handleNavigate} />;
    }
    if (pathname === '/learning') {
      return <LearningPage searchParams={params} onNavigate={handleNavigate} />;
    }
    if (pathname === '/students') {
      return <StudentsPage onNavigate={handleNavigate} />;
    }
    if (pathname === '/saved') {
      return <SavedOffersPage onNavigate={handleNavigate} />;
    }
    if (pathname === '/about') {
      return <AboutPage onNavigate={handleNavigate} />;
    }
    if (pathname === '/privacy') {
      return <LegalCenterPage activeTab="privacy" onNavigate={handleNavigate} />;
    }
    if (pathname === '/privacy-requests') {
      return <LegalCenterPage activeTab="privacy-requests" onNavigate={handleNavigate} />;
    }
    if (pathname === '/terms') {
      return <LegalCenterPage activeTab="terms" onNavigate={handleNavigate} />;
    }
    if (pathname === '/design-system') {
      return (
        <DesignSystemPage
          onNavigate={handleNavigate}
          onReplayIntro={() => setReplaySplash(true)}
        />
      );
    }
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center gap-6">
        <h1 className="font-[var(--font-wallop)] font-extrabold text-[40px] sm:text-[64px] leading-[1] tracking-[-0.04em] text-midnight-mouth">
          Page not found
        </h1>
        <p className="font-[var(--font-inter)] text-[17px] sm:text-[18px] text-ink/80 max-w-md">
          That route does not exist in FreeStack. Try exploring all verified free tools or returning home.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('/');
            }}
            className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[17px] rounded-full px-6 py-3.5 min-h-[48px] inline-flex items-center spring-pill"
          >
            Back to Home
          </a>
          <a
            href="/explore"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('/explore');
            }}
            className="bg-daylight text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[17px] rounded-full px-6 py-3.5 min-h-[48px] inline-flex items-center spring-pill"
          >
            Explore Directory
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-dvh flex flex-col bg-paper text-ink overflow-x-clip">
      <FreeStackIntroSplash
        forceOpen={replaySplash}
        onFinish={() => setReplaySplash(false)}
      />
      <SiteHeader currentPath={pathname} onNavigate={handleNavigate} />
      <main className="flex-1 min-w-0">{renderPage()}</main>
      <SiteFooter
        onNavigate={handleNavigate}
        onReplayIntro={() => setReplaySplash(true)}
      />
    </div>
  );
}

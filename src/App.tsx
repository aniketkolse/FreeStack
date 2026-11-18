import React, { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { useRouter, type NavigateOptions } from './lib/router/useRouter';
import { getBackNavigationMeta } from './lib/router/navigationHistory';
import { getCategoryBySlug, getOfferBySlug } from './lib/data/resources';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { FreeStackIntroSplash } from './components/layout/FreeStackIntroSplash';
import { CardGridSkeleton } from './components/offers/CardGridSkeleton';
import { HomePage } from './pages/HomePage';

// Route-level code splitting for all secondary routes
const ExplorePage = lazy(() =>
  import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage }))
);
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage }))
);
const CategoryDetailPage = lazy(() =>
  import('./pages/CategoryDetailPage').then((m) => ({ default: m.CategoryDetailPage }))
);
const OfferDetailPage = lazy(() =>
  import('./pages/OfferDetailPage').then((m) => ({ default: m.OfferDetailPage }))
);
const LearningPage = lazy(() =>
  import('./pages/LearningPage').then((m) => ({ default: m.LearningPage }))
);
const StudentsPage = lazy(() =>
  import('./pages/StudentsPage').then((m) => ({ default: m.StudentsPage }))
);
const SavedOffersPage = lazy(() =>
  import('./pages/SavedOffersPage').then((m) => ({ default: m.SavedOffersPage }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const DesignSystemPage = lazy(() =>
  import('./pages/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage }))
);
const LegalCenterPage = lazy(() =>
  import('./pages/LegalCenterPage').then((m) => ({ default: m.LegalCenterPage }))
);

function DelayedRouteSkeleton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  if (!show) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 flex flex-col gap-6">
      <div className="h-32 sm:h-40 rounded-[24px] bg-daylight animate-pulse" />
      <CardGridSkeleton count={6} />
    </div>
  );
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

class RouteErrorBoundary extends Component<
  { routeKey: string; children: ReactNode },
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { routeKey: string }) {
    if (prevProps.routeKey !== this.props.routeKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center flex flex-col items-center gap-4">
          <h2 className="font-[var(--font-wallop)] font-extrabold text-[28px] sm:text-[36px] text-midnight-mouth">
            Unable to load this view
          </h2>
          <p className="font-[var(--font-inter)] text-[15px] text-ink/75 max-w-md">
            A network hiccup interrupted loading this page. Try reloading the view.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[15px] rounded-full px-6 py-3 min-h-[42px] cursor-pointer spring-pill"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { pathname, params, previousPath, navigate, goBack } = useRouter();
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

  const handleBack = (fallbackPath?: string) => {
    goBack(fallbackPath);
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
      return <CategoriesPage searchParams={params} onNavigate={handleNavigate} />;
    }
    if (pathname.startsWith('/category/')) {
      const slug = pathname.replace('/category/', '').replace(/\/$/, '');
      return (
        <CategoryDetailPage
          key={slug}
          slug={slug}
          searchParams={params}
          onNavigate={handleNavigate}
          onBack={handleBack}
          previousPath={previousPath}
        />
      );
    }
    if (pathname.startsWith('/offer/')) {
      const slug = pathname.replace('/offer/', '').replace(/\/$/, '');
      return (
        <OfferDetailPage
          key={slug}
          slug={slug}
          onNavigate={handleNavigate}
          onBack={handleBack}
          previousPath={previousPath}
        />
      );
    }
    if (pathname === '/learning') {
      return <LearningPage searchParams={params} onNavigate={handleNavigate} />;
    }
    if (pathname === '/students') {
      return <StudentsPage searchParams={params} onNavigate={handleNavigate} />;
    }
    if (pathname === '/saved') {
      return (
        <SavedOffersPage
          onNavigate={handleNavigate}
          onBack={handleBack}
          previousPath={previousPath}
        />
      );
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
          onBack={handleBack}
          previousPath={previousPath}
          onReplayIntro={() => setReplaySplash(true)}
        />
      );
    }

    const notFoundBackMeta = getBackNavigationMeta(previousPath, '/', {
      getCategoryName: (slug) => getCategoryBySlug(slug)?.name,
      getOfferName: (slug) => getOfferBySlug(slug)?.identity.name,
    });

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
            href={notFoundBackMeta.targetHref}
            onClick={(e) => {
              e.preventDefault();
              handleBack('/');
            }}
            className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[17px] rounded-full px-6 py-3.5 min-h-[48px] inline-flex items-center spring-pill"
          >
            {notFoundBackMeta.label}
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
      <main className="flex-1 min-w-0">
        <RouteErrorBoundary routeKey={pathname}>
          <Suspense fallback={<DelayedRouteSkeleton />}>{renderPage()}</Suspense>
        </RouteErrorBoundary>
      </main>
      <SiteFooter
        onNavigate={handleNavigate}
        onReplayIntro={() => setReplaySplash(true)}
      />
    </div>
  );
}

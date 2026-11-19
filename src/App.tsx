import React, { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { useRouter, type NavigateOptions } from './lib/router/useRouter';
import { getBackNavigationMeta } from './lib/router/navigationHistory';
import { getCategoryBySlug, getOfferBySlug } from './lib/data/resources';
import { isLikelyNetworkOrLoadMessage } from './lib/errors/errorClassification';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { ErrorFallbackPage } from './components/layout/ErrorFallbackPage';
import { CardGridSkeleton } from './components/offers/CardGridSkeleton';
import { HomePage } from './pages/HomePage';

function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error ?? '');
      if (
        typeof window !== 'undefined' &&
        (typeof navigator === 'undefined' || navigator.onLine) &&
        /dynamically imported module|importing a module script|chunk/i.test(msg)
      ) {
        try {
          const key = 'freestack-chunk-reload-ts';
          const lastReload = Number(window.sessionStorage.getItem(key) || '0');
          const now = Date.now();
          if (now - lastReload > 15_000) {
            window.sessionStorage.setItem(key, String(now));
            window.location.reload();
            return new Promise<never>(() => {});
          }
        } catch {
          // Ignore storage errors
        }
      }
      throw error;
    }
  });
}

// Route-level code splitting for all secondary routes
const ExplorePage = lazyWithRetry(() =>
  import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage }))
);
const CategoriesPage = lazyWithRetry(() =>
  import('./pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage }))
);
const CategoryDetailPage = lazyWithRetry(() =>
  import('./pages/CategoryDetailPage').then((m) => ({ default: m.CategoryDetailPage }))
);
const OfferDetailPage = lazyWithRetry(() =>
  import('./pages/OfferDetailPage').then((m) => ({ default: m.OfferDetailPage }))
);
const LearningPage = lazyWithRetry(() =>
  import('./pages/LearningPage').then((m) => ({ default: m.LearningPage }))
);
const StudentsPage = lazyWithRetry(() =>
  import('./pages/StudentsPage').then((m) => ({ default: m.StudentsPage }))
);
const SavedOffersPage = lazyWithRetry(() =>
  import('./pages/SavedOffersPage').then((m) => ({ default: m.SavedOffersPage }))
);
const AboutPage = lazyWithRetry(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const DesignSystemPage = lazyWithRetry(() =>
  import('./pages/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage }))
);
const LegalCenterPage = lazyWithRetry(() =>
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
  errorMessage: string | null;
}

class RouteErrorBoundary extends Component<
  { routeKey: string; onNavigate: (path: string) => void; children: ReactNode },
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(error: unknown): RouteErrorBoundaryState {
    const msg = error instanceof Error ? error.message : 'Unable to load this view.';
    return { hasError: true, errorMessage: msg };
  }

  componentDidUpdate(prevProps: { routeKey: string }) {
    if (prevProps.routeKey !== this.props.routeKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: null });
    }
  }

  render() {
    if (this.state.hasError) {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      return (
        <ErrorFallbackPage
          explicitVariant={online ? 'load_error' : 'offline'}
          errorMessage={this.state.errorMessage}
          onNavigate={this.props.onNavigate}
          onRetry={() => {
            this.setState({ hasError: false, errorMessage: null });
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
        />
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { pathname, params, previousPath, navigate, goBack } = useRouter();
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [globalLoadError, setGlobalLoadError] = useState<string | null>(null);
  const [retrySeed, setRetrySeed] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setGlobalLoadError(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    const handleCustomLoadError = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setGlobalLoadError(detail?.message || 'Failed to load website bundle.');
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : '';
      if (isLikelyNetworkOrLoadMessage(msg) && /chunk|module|import/i.test(msg)) {
        event.preventDefault();
        setGlobalLoadError(msg);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('freestack:load-error', handleCustomLoadError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('freestack:load-error', handleCustomLoadError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || globalLoadError) {
      document.title = 'Connection Issue (404) — FreeStack';
      return;
    }

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
    else if (pathname !== '/' && pathname !== '') title = '404 Page Not Found — FreeStack';
    document.title = title;
  }, [pathname, isOnline, globalLoadError]);

  const handleNavigate = (to: string, options?: NavigateOptions) => {
    setGlobalLoadError(null);
    navigate(to, options);
  };

  const handleBack = (fallbackPath?: string) => {
    setGlobalLoadError(null);
    goBack(fallbackPath);
  };

  const handleRecoverConnection = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setIsOnline(true);
    }
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (res.ok) {
        setIsOnline(true);
        setGlobalLoadError(null);
        setRetrySeed((s) => s + 1);
        return;
      }
    } catch {
      // Keep error state visible if still unreachable
    }
  };

  const renderPage = () => {
    if (!isOnline || globalLoadError) {
      return (
        <ErrorFallbackPage
          explicitVariant={!isOnline ? 'offline' : 'load_error'}
          errorMessage={globalLoadError}
          onRetry={handleRecoverConnection}
          onNavigate={handleNavigate}
          backLabel="Return Home"
          backHref="/"
        />
      );
    }

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
        />
      );
    }

    const notFoundBackMeta = getBackNavigationMeta(previousPath, '/', {
      getCategoryName: (slug) => getCategoryBySlug(slug)?.name,
      getOfferName: (slug) => getOfferBySlug(slug)?.identity.name,
    });

    return (
      <ErrorFallbackPage
        explicitVariant="not_found"
        notFound
        onNavigate={handleNavigate}
        onBack={() => handleBack('/')}
        backLabel={notFoundBackMeta.label}
        backHref={notFoundBackMeta.targetHref}
      />
    );
  };

  return (
    <div className="min-h-dvh flex flex-col bg-paper text-ink overflow-x-clip">
      <SiteHeader currentPath={pathname} onNavigate={handleNavigate} />
      <main className="flex-1 min-w-0">
        <RouteErrorBoundary routeKey={`${pathname}-${retrySeed}`} onNavigate={handleNavigate}>
          <Suspense fallback={<DelayedRouteSkeleton />}>{renderPage()}</Suspense>
        </RouteErrorBoundary>
      </main>
      <SiteFooter onNavigate={handleNavigate} />
    </div>
  );
}

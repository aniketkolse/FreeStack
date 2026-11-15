import { useCallback, useEffect, useState } from 'react';

export interface RouteLocation {
  pathname: string;
  search: string;
  params: URLSearchParams;
}

export interface NavigateOptions {
  replace?: boolean;
  scrollTop?: boolean;
}

function readLocation(): RouteLocation {
  const pathname = window.location.pathname || '/';
  const search = window.location.search || '';
  return {
    pathname,
    search,
    params: new URLSearchParams(search),
  };
}

export function useRouter() {
  const [location, setLocation] = useState<RouteLocation>(() => readLocation());

  useEffect(() => {
    const onPopState = () => {
      setLocation(readLocation());
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string, options: NavigateOptions = {}) => {
    const { replace = false, scrollTop = true } = options;
    const current = window.location.pathname + window.location.search;
    if (to === current) {
      if (scrollTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    setLocation(readLocation());

    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  return {
    pathname: location.pathname,
    search: location.search,
    params: location.params,
    navigate,
  };
}

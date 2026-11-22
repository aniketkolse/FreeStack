import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Enforce light-only appearance and clear any legacy dark-mode preference
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light only';
}
if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('freestack-theme');
  } catch {
    // Ignore storage errors in restricted environments
  }
}

// Recover gracefully from stale chunk deploys or offline navigation without reload loops
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        window.dispatchEvent(
          new CustomEvent('freestack:load-error', {
            detail: { message: 'Device is offline while loading page assets.' },
          })
        );
        return;
      }
      const key = 'freestack-chunk-reload-ts';
      const lastReload = Number(window.sessionStorage.getItem(key) || '0');
      const now = Date.now();
      if (now - lastReload > 15_000) {
        window.sessionStorage.setItem(key, String(now));
        window.location.reload();
        return;
      }
    } catch {
      // Ignore storage errors
    }
    window.dispatchEvent(
      new CustomEvent('freestack:load-error', {
        detail: { message: 'Failed to load website bundle. Please retry.' },
      })
    );
  });
}

const rootElement = document.getElementById('root')!;
const normalizedPath = typeof window !== 'undefined' ? window.location.pathname : '/';
if (
  rootElement.dataset.freestackHomeSsr === 'true' &&
  (normalizedPath === '/' || normalizedPath === '')
) {
  hydrateRoot(rootElement, <App />);
} else {
  createRoot(rootElement).render(<App />);
}

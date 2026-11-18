import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Recover gracefully from stale chunk deploys without infinite reload loops
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    try {
      const key = 'freestack-chunk-reload-ts';
      const lastReload = Number(window.sessionStorage.getItem(key) || '0');
      const now = Date.now();
      if (now - lastReload > 15_000) {
        event.preventDefault();
        window.sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
    } catch {
      // Ignore storage errors
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);

import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/jetbrains-mono';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize theme class synchronously before first React paint without inline HTML scripts
try {
  const stored = window.localStorage.getItem('freestack-theme');
  const sysDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = stored === 'dark' || (!stored && sysDark);
  document.documentElement.classList.toggle('dark', Boolean(dark));
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
} catch {
  // Ignore localStorage access errors in restricted browsing modes
}

createRoot(document.getElementById('root')!).render(<App />);

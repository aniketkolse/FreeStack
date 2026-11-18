(function () {
  try {
    var stored = window.localStorage.getItem('freestack-theme');
    var sysDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'dark' || (!stored && sysDark);
    document.documentElement.classList.toggle('dark', Boolean(dark));
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {
    // Ignore storage errors in restricted environments
  }
})();

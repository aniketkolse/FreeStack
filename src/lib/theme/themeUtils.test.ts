import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInitialTheme, toggleThemeMode } from './themeUtils';

test('resolveInitialTheme honors explicit stored theme preferences', () => {
  assert.equal(resolveInitialTheme('dark', false), 'dark');
  assert.equal(resolveInitialTheme('light', true), 'light');
});

test('resolveInitialTheme falls back to system preference when unset or invalid', () => {
  assert.equal(resolveInitialTheme(null, true), 'dark');
  assert.equal(resolveInitialTheme(undefined, false), 'light');
  assert.equal(resolveInitialTheme('sepia', true), 'dark');
});

test('toggleThemeMode switches between light and dark cleanly', () => {
  assert.equal(toggleThemeMode('light'), 'dark');
  assert.equal(toggleThemeMode('dark'), 'light');
});

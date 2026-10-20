import { beforeEach, describe, expect, it } from 'vitest';
import { readAccent, readTheme, writeAccent, writeTheme } from './theme';

// Minimal localStorage and document stubs for the node test environment.
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage;
(globalThis as unknown as { document: Document }).document = {
  documentElement: { dataset: {} as Record<string, string> },
} as unknown as Document;

describe('theme pairing', () => {
  beforeEach(() => { store.clear(); for (const k of Object.keys(document.documentElement.dataset)) delete document.documentElement.dataset[k]; });

  it('defaults to dark plus default accent', () => {
    expect(readTheme()).toBe('dark');
    expect(readAccent()).toBe('default');
  });

  it('writing an accent never changes appearance, and the reverse', () => {
    writeTheme('light');
    writeAccent('ember');
    expect(readTheme()).toBe('light');
    expect(readAccent()).toBe('ember');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.accent).toBe('ember');
    writeAccent('signal');
    expect(readTheme()).toBe('light');
    writeTheme('dark');
    expect(readAccent()).toBe('signal');
  });

  it('stored values round trip and unknown values fall back', () => {
    writeAccent('ember');
    expect(readAccent()).toBe('ember');
    store.set('los.ui.accent', 'purple');
    expect(readAccent()).toBe('default');
    store.set('los.ui.theme', 'sepia');
    expect(readTheme()).toBe('dark');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { trapTabKey } from './focusTrap';

type FakeEl = { focus: () => void };

function fakeContainer() {
  const focused: string[] = [];
  const els = ['a', 'b', 'c'].map((name) => ({ name, focus: () => { focused.push(name); (globalThis as { document: { activeElement: unknown } }).document.activeElement = el(name); } }));
  function el(name: string) { return els.find((x) => x.name === name); }
  const container = {
    querySelectorAll: () => els,
    contains: (node: unknown) => els.includes(node as never),
  } as unknown as HTMLElement;
  return { container, els, focused };
}

function setActive(el: unknown) {
  (globalThis as { document: { activeElement: unknown } }).document = { activeElement: el };
}

describe('trapTabKey', () => {
  it('ignores non-Tab keys', () => {
    const { container } = fakeContainer();
    const e = { key: 'Enter', shiftKey: false, preventDefault: vi.fn() };
    expect(trapTabKey(e, container)).toBe(false);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });
  it('wraps from last to first and first to last', () => {
    const { container, els, focused } = fakeContainer();
    setActive(els[2]);
    const fwd = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
    expect(trapTabKey(fwd, container)).toBe(true);
    expect(focused).toContain('a');
    setActive(els[0]);
    const back = { key: 'Tab', shiftKey: true, preventDefault: vi.fn() };
    expect(trapTabKey(back, container)).toBe(true);
    expect(focused).toContain('c');
  });
  it('pulls focus in when it is outside the container', () => {
    const { container, focused } = fakeContainer();
    setActive({ name: 'outside', focus: () => undefined } as FakeEl);
    // container.contains returns false for the outsider per the fake above
    const e = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
    expect(trapTabKey(e, container)).toBe(true);
    expect(focused).toContain('a');
  });
});

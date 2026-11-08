import { describe, expect, it } from 'vitest';
import {
  buildFeedbackIssueUrl,
  composeDiagnostics,
  FEEDBACK_URL_MAX_LENGTH,
  validateFeedbackDraft,
  type FeedbackTargetConfig,
} from '../src/feedback.js';

const config: FeedbackTargetConfig = {
  owner: 'ankan97dutta',
  repo: 'los',
  kinds: {
    bug: { labels: ['bug'] },
    idea: { template: 'idea.yml', labels: ['enhancement'] },
    other: { labels: ['feedback'] },
  },
};

describe('validateFeedbackDraft', () => {
  it('requires kind, title, and description after trim', () => {
    expect(validateFeedbackDraft({ kind: null, title: '', description: '' }).errors).toEqual([
      'kind_required',
      'title_required',
      'description_required',
    ]);
    expect(validateFeedbackDraft({ kind: 'bug', title: '  ', description: '\n' }).errors).toEqual([
      'title_required',
      'description_required',
    ]);
    expect(validateFeedbackDraft({ kind: 'bug', title: 't', description: 'd' }).ok).toBe(true);
  });
});

describe('composeDiagnostics', () => {
  it('returns an editable appendix block', () => {
    const text = composeDiagnostics({ appVersion: '0.1.0', platform: 'macOS' });
    expect(text).toContain('App version: 0.1.0');
    expect(text).toContain('Platform: macOS');
  });
});

describe('buildFeedbackIssueUrl', () => {
  it('prefers template and always clipboards body for template path', () => {
    const r = buildFeedbackIssueUrl(
      { kind: 'idea', title: 'Ship X', description: 'Please add X' },
      config,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.url).toContain('template=idea.yml');
    expect(r.url).toContain('title=Ship');
    expect(r.url).not.toContain('body=');
    expect(r.usedClipboardFallback).toBe(true);
    expect(r.bodyForClipboard).toBe('Please add X');
  });

  it('uses labels and body on blank issue when under budget', () => {
    const r = buildFeedbackIssueUrl(
      { kind: 'bug', title: 'Crash', description: 'Steps to reproduce' },
      config,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.url).toContain('labels=bug');
    expect(r.url).toContain('body=');
    expect(r.usedClipboardFallback).toBe(false);
  });

  it('drops body when encoded URL exceeds budget', () => {
    const longBody = 'x'.repeat(FEEDBACK_URL_MAX_LENGTH);
    const r = buildFeedbackIssueUrl(
      { kind: 'other', title: 'Long', description: longBody },
      config,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.url.length).toBeLessThanOrEqual(FEEDBACK_URL_MAX_LENGTH + 50);
    expect(r.url).not.toMatch(/[?&]body=/);
    expect(r.usedClipboardFallback).toBe(true);
    expect(r.bodyForClipboard).toBe(longBody);
  });

  it('never invents workspace database fields', () => {
    const r = buildFeedbackIssueUrl(
      { kind: 'bug', title: 't', description: 'user text only' },
      config,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.url).not.toMatch(/los\.sqlite|Application Support|workspace/i);
    expect(r.bodyForClipboard ?? '').not.toMatch(/los\.sqlite/);
  });
});

/** GitHub feedback draft validation and issue URL construction (pure). */

export type FeedbackKind = 'bug' | 'idea' | 'other';

export const FEEDBACK_KINDS: FeedbackKind[] = ['bug', 'idea', 'other'];

export type FeedbackDraft = {
  kind: FeedbackKind | null;
  title: string;
  description: string;
};

export type FeedbackKindConfig = {
  /** GitHub issue form/template query value; empty ⇒ label-only blank issue */
  template?: string;
  labels: string[];
};

export type FeedbackTargetConfig = {
  owner: string;
  repo: string;
  kinds: Record<FeedbackKind, FeedbackKindConfig>;
};

export type FeedbackValidationError =
  | 'kind_required'
  | 'title_required'
  | 'description_required';

export type HandoffResult = {
  ok: true;
  url: string;
  usedClipboardFallback: boolean;
  bodyForClipboard: string | null;
} | {
  ok: false;
  errors: FeedbackValidationError[];
};

/** Conservative cross-browser budget for GitHub new-issue query strings. */
export const FEEDBACK_URL_MAX_LENGTH = 2000;

export function validateFeedbackDraft(draft: FeedbackDraft): {
  ok: boolean;
  errors: FeedbackValidationError[];
} {
  const errors: FeedbackValidationError[] = [];
  if (!draft.kind || !FEEDBACK_KINDS.includes(draft.kind)) errors.push('kind_required');
  if (!draft.title.trim()) errors.push('title_required');
  if (!draft.description.trim()) errors.push('description_required');
  return { ok: errors.length === 0, errors };
}

export function composeDiagnostics(input: {
  appVersion: string;
  platform: string;
}): string {
  const version = input.appVersion.trim() || 'unknown';
  const platform = input.platform.trim() || 'unknown';
  return `\n\n---\nApp version: ${version}\nPlatform: ${platform}\n`;
}

function buildBlankIssueUrl(
  base: string,
  title: string,
  labels: string[],
  body: string | null,
): string {
  const params = new URLSearchParams();
  params.set('title', title);
  if (labels.length > 0) params.set('labels', labels.join(','));
  if (body !== null) params.set('body', body);
  return `${base}?${params.toString()}`;
}

/**
 * Prefer per-kind issue template when configured (title in URL; body always via clipboard
 * because GitHub issue forms do not reliably accept `body` query params).
 * Otherwise blank new-issue with labels; body in URL until length budget forces clipboard.
 */
export function buildFeedbackIssueUrl(
  draft: FeedbackDraft,
  config: FeedbackTargetConfig,
): HandoffResult {
  const validated = validateFeedbackDraft(draft);
  if (!validated.ok) {
    return { ok: false, errors: validated.errors };
  }

  const kind = draft.kind as FeedbackKind;
  const kindCfg = config.kinds[kind];
  const title = draft.title.trim();
  const description = draft.description.trim();
  const base = `https://github.com/${config.owner}/${config.repo}/issues/new`;

  const template = kindCfg.template?.trim();
  if (template) {
    const params = new URLSearchParams();
    params.set('template', template);
    params.set('title', title);
    return {
      ok: true,
      url: `${base}?${params.toString()}`,
      usedClipboardFallback: true,
      bodyForClipboard: description,
    };
  }

  const withBody = buildBlankIssueUrl(base, title, kindCfg.labels, description);
  if (withBody.length <= FEEDBACK_URL_MAX_LENGTH) {
    return {
      ok: true,
      url: withBody,
      usedClipboardFallback: false,
      bodyForClipboard: null,
    };
  }

  const withoutBody = buildBlankIssueUrl(base, title, kindCfg.labels, null);
  return {
    ok: true,
    url: withoutBody,
    usedClipboardFallback: true,
    bodyForClipboard: description,
  };
}

import { useEffect, useRef, useState } from 'react';
import {
  buildFeedbackIssueUrl,
  composeDiagnostics,
  validateFeedbackDraft,
  type FeedbackKind,
  type FeedbackValidationError,
} from '@los/domain';
import { trapTabKey } from '../../ui/focusTrap';
import { FEEDBACK_TARGET, resolveFeedbackAppVersion } from '../../lib/feedbackConfig';
import { openFeedbackUrl } from '../../lib/feedbackOpen';
import { FEEDBACK_COPY } from './feedbackCopy';

type Props = {
  open: boolean;
  onClose: () => void;
  onHandoffSuccess: (message: string) => void;
};

const KIND_OPTIONS: Array<{ value: FeedbackKind; label: string }> = [
  { value: 'bug', label: 'Bug' },
  { value: 'idea', label: 'Idea' },
  { value: 'other', label: 'Other' },
];

function platformLabel(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Mac/i.test(ua)) return 'macOS';
  if (/Win/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return ua.slice(0, 80) || 'unknown';
}

function errorMessage(code: FeedbackValidationError): string {
  if (code === 'kind_required') return FEEDBACK_COPY.kindRequired;
  if (code === 'title_required') return FEEDBACK_COPY.titleRequired;
  return FEEDBACK_COPY.descriptionRequired;
}

export function FeedbackDialog({ open, onClose, onHandoffSuccess }: Props) {
  const [kind, setKind] = useState<FeedbackKind | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FeedbackValidationError[]>([]);
  const [openError, setOpenError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  /** Synchronous single-flight guard so rapid Continue clicks cannot open multiple windows. */
  const handoffInFlightRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    handoffInFlightRef.current = false;
    setKind(null);
    setTitle('');
    setFieldErrors([]);
    setOpenError(null);
    setCopyNote(null);
    setBusy(false);
    setDescription('');

    void (async () => {
      const appVersion = await resolveFeedbackAppVersion();
      if (cancelled) return;
      setDescription(
        composeDiagnostics({ appVersion, platform: platformLabel() }).trimStart(),
      );
      queueMicrotask(() => titleRef.current?.focus());
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  async function copyDraft() {
    const text = [`Kind: ${kind ?? '(none)'}`, `Title: ${title}`, '', description].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopyNote(FEEDBACK_COPY.copyDraftDone);
    } catch {
      setCopyNote(FEEDBACK_COPY.copyDraftFailed);
    }
  }

  async function onContinue() {
    if (handoffInFlightRef.current || busy) return;
    setOpenError(null);
    setCopyNote(null);
    const draft = { kind, title, description };
    const validated = validateFeedbackDraft(draft);
    if (!validated.ok) {
      setFieldErrors(validated.errors);
      return;
    }
    setFieldErrors([]);
    const handoff = buildFeedbackIssueUrl(draft, FEEDBACK_TARGET);
    if (!handoff.ok) {
      setFieldErrors(handoff.errors);
      return;
    }

    handoffInFlightRef.current = true;
    setBusy(true);
    let clipboardOk = true;
    if (handoff.usedClipboardFallback && handoff.bodyForClipboard) {
      try {
        await navigator.clipboard.writeText(handoff.bodyForClipboard);
      } catch {
        clipboardOk = false;
      }
    }

    const opened = await openFeedbackUrl(handoff.url);
    setBusy(false);
    if (!opened.ok) {
      handoffInFlightRef.current = false;
      setOpenError(opened.error || FEEDBACK_COPY.openFailed);
      return;
    }

    const message: string = handoff.usedClipboardFallback
      ? (clipboardOk ? FEEDBACK_COPY.browserOpenedPaste : FEEDBACK_COPY.clipboardFailed)
      : FEEDBACK_COPY.browserOpened;
    onHandoffSuccess(message);
    onClose();
  }

  return (
    <div
      className="palette-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="palette-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Send feedback"
        style={{ maxWidth: 520 }}
        onKeyDown={(e) => {
          if (trapTabKey(e, panelRef.current)) return;
          if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
      >
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Send feedback</h2>
        <p className="muted" style={{ marginTop: 0 }}>{FEEDBACK_COPY.privacy}</p>

        <fieldset className="stack" style={{ border: 0, padding: 0, margin: '0 0 0.75rem' }}>
          <legend className="field-label">Kind</legend>
          <div className="row" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
            {KIND_OPTIONS.map((opt) => (
              <label key={opt.value} className="row" style={{ gap: '0.35rem', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="feedback-kind"
                  value={opt.value}
                  checked={kind === opt.value}
                  onChange={() => setKind(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field" htmlFor="feedback-title">
          <span className="field-label">Title</span>
          <input
            ref={titleRef}
            id="feedback-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={fieldErrors.includes('title_required')}
          />
        </label>

        <label className="field" htmlFor="feedback-description">
          <span className="field-label">Description</span>
          <textarea
            id="feedback-description"
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={fieldErrors.includes('description_required')}
          />
        </label>
        <p className="muted" style={{ fontSize: '0.75rem', marginTop: 0 }}>
          Optional diagnostics are in the description — edit or delete them before continuing.
        </p>

        {fieldErrors.length > 0 ? (
          <ul className="stack" style={{ margin: '0 0 0.75rem', paddingLeft: '1.2rem', color: 'var(--danger, #c44)' }}>
            {fieldErrors.map((code) => (
              <li key={code}>{errorMessage(code)}</li>
            ))}
          </ul>
        ) : null}

        {openError ? (
          <p role="alert" style={{ margin: '0 0 0.75rem' }}>{openError}</p>
        ) : null}
        {copyNote ? (
          <p className="muted" role="status" style={{ margin: '0 0 0.75rem' }}>{copyNote}</p>
        ) : null}

        <div className="row" style={{ justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
          {openError ? (
            <button type="button" className="ghost" onClick={() => void copyDraft()}>
              Copy draft
            </button>
          ) : null}
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" onClick={() => void onContinue()} disabled={busy}>
            {busy ? 'Opening…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

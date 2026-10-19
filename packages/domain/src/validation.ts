import { DESCRIPTION_MAX, err, ok, Result } from './result.js';

export function validateDescription(raw: string): Result<string> {
  const description = raw.trim();
  if (!description) {
    return err('EMPTY_DESCRIPTION', 'Description is required.');
  }
  if (description.length > DESCRIPTION_MAX) {
    return err(
      'DESCRIPTION_TOO_LONG',
      `Description must be at most ${DESCRIPTION_MAX} characters.`,
    );
  }
  return ok(description);
}

export function validateName(raw: string): Result<string> {
  const name = raw.trim();
  if (!name) return err('EMPTY_NAME', 'Name is required.');
  return ok(name);
}

export function newId(): string {
  return crypto.randomUUID();
}

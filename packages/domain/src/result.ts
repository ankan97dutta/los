export type ErrorCode =
  | 'EMPTY_DESCRIPTION'
  | 'DESCRIPTION_TOO_LONG'
  | 'EMPTY_NAME'
  | 'NOT_FOUND'
  | 'INVALID_STATE'
  | 'INVALID_DATE'
  | 'INVALID_PERIOD'
  | 'INVALID_YEAR_MONTH'
  | 'INVALID_WEEKDAY'
  | 'INVALID_ACCEL'
  | 'APPLICATION_NOT_FOUND'
  | 'ACTION_NOT_FOUND';

export type AppError = { code: ErrorCode; message: string };

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(code: ErrorCode, message: string): Result<T> {
  return { ok: false, error: { code, message } };
}

export const DESCRIPTION_MAX = 4000;

import { describe, expect, it } from 'vitest';
import {
  isCarryForwardEligible,
  validateAllocation,
  validateEstimate,
} from '../src/planning.js';

describe('planning invariants', () => {
  it('requires assignee for commitment', () => {
    const r = validateAllocation({ teamMemberId: null, commitmentKind: 'commitment' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('COMMIT_REQUIRES_ASSIGNEE');
  });

  it('allows stretch while unallocated', () => {
    const r = validateAllocation({ teamMemberId: null, commitmentKind: 'stretch' });
    expect(r.ok).toBe(true);
  });

  it('rejects unknown estimate with hours', () => {
    const r = validateEstimate({ estimateHours: 2, estimateUnknown: true });
    expect(r.ok).toBe(false);
  });

  it('carry-forward excludes done and dropped', () => {
    expect(
      isCarryForwardEligible({ commitmentKind: 'commitment', status: 'ready' }),
    ).toBe(true);
    expect(
      isCarryForwardEligible({ commitmentKind: 'commitment', status: 'blocked' }),
    ).toBe(true);
    expect(
      isCarryForwardEligible({ commitmentKind: 'commitment', status: 'done' }),
    ).toBe(false);
    expect(
      isCarryForwardEligible({ commitmentKind: 'stretch', status: 'ready' }),
    ).toBe(false);
  });
});

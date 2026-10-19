import { describe, expect, it } from 'vitest';
import {
  computeCapacity,
  computeMemberLoad,
  isValidHours,
  remainingHours,
} from '../src/capacity.js';

describe('capacity math (SC-C01)', () => {
  it('computes net as gross minus deductions (may be negative)', () => {
    const c = computeCapacity({
      availableHours: 40,
      leaveHours: 8,
      reservedCommitmentHours: 10,
      unplannedBufferHours: 4,
    });
    expect(c.grossHours).toBe(40);
    expect(c.deductionHours).toBe(22);
    expect(c.netHours).toBe(18);
  });

  it('shows negative net when deductions exceed gross', () => {
    const c = computeCapacity({
      availableHours: 10,
      leaveHours: 8,
      reservedCommitmentHours: 4,
      unplannedBufferHours: 2,
    });
    expect(c.netHours).toBe(-4);
  });

  it('excludes unknown estimates from committed load (unknown ≠ zero)', () => {
    const load = computeMemberLoad(
      [
        {
          estimateHours: 8,
          estimateUnknown: false,
          commitmentKind: 'commitment',
          teamMemberId: 'm1',
        },
        {
          estimateHours: null,
          estimateUnknown: true,
          commitmentKind: 'commitment',
          teamMemberId: 'm1',
        },
        {
          estimateHours: 0,
          estimateUnknown: false,
          commitmentKind: 'commitment',
          teamMemberId: 'm1',
        },
      ],
      'm1',
    );
    expect(load.committedLoadHours).toBe(8);
    expect(load.unestimatedCommitCount).toBe(1);
  });

  it('excludes stretch from committed load', () => {
    const load = computeMemberLoad(
      [
        {
          estimateHours: 5,
          estimateUnknown: false,
          commitmentKind: 'stretch',
          teamMemberId: 'm1',
        },
        {
          estimateHours: 3,
          estimateUnknown: false,
          commitmentKind: 'commitment',
          teamMemberId: 'm1',
        },
      ],
      'm1',
    );
    expect(load.committedLoadHours).toBe(3);
    expect(load.stretchHours).toBe(5);
  });

  it('ignores unallocated items for member load', () => {
    const load = computeMemberLoad(
      [
        {
          estimateHours: 10,
          estimateUnknown: false,
          commitmentKind: 'stretch',
          teamMemberId: null,
        },
      ],
      'm1',
    );
    expect(load.committedLoadHours).toBe(0);
    expect(load.stretchHours).toBe(0);
  });

  it('remaining may be negative under overload', () => {
    expect(remainingHours(10, 14)).toBe(-4);
  });

  it('validates half-hour steps', () => {
    expect(isValidHours(1.5)).toBe(true);
    expect(isValidHours(1.25)).toBe(false);
    expect(isValidHours(-1)).toBe(false);
  });
});

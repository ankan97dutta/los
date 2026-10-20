import { describe, expect, it } from 'vitest';
import {
  actualLabel, commitmentLabel, estimateLabel, formatHours,
  workloadLabel, workloadPercent, workloadState,
} from './planningView';

describe('planningView', () => {
  it('never renders an unknown estimate as 0h', () => {
    expect(estimateLabel({ estimateHours: null, estimateUnknown: true })).toBe('Unknown');
    expect(estimateLabel({ estimateHours: null, estimateUnknown: false })).toBe('Unknown');
    expect(estimateLabel({ estimateHours: 0, estimateUnknown: false })).toBe('0h');
  });

  it('classifies workload state without relying on color', () => {
    expect(workloadState({ netHours: 40, committedLoadHours: 46 })).toBe('over');
    expect(workloadState({ netHours: 0, committedLoadHours: 0 })).toBe('zero');
    expect(workloadState({ netHours: 40, committedLoadHours: 36 })).toBe('open');
    expect(workloadLabel({ netHours: 40, committedLoadHours: 46 })).toContain('Over capacity by 6h');
    expect(workloadLabel({ netHours: 0, committedLoadHours: 4 })).toContain('No capacity');
  });

  it('clamps the workload bar and formats tabular hours', () => {
    expect(workloadPercent({ netHours: 40, committedLoadHours: 60 })).toBe(100);
    expect(workloadPercent({ netHours: 40, committedLoadHours: 20 })).toBe(50);
    expect(workloadPercent({ netHours: 0, committedLoadHours: 0 })).toBe(0);
    expect(formatHours(34)).toBe('34h');
    expect(formatHours(6.5)).toBe('6.5h');
  });

  it('distinguishes committed from stretch by symbol and word, not color', () => {
    expect(commitmentLabel('commitment')).toBe('● Committed');
    expect(commitmentLabel('stretch')).toBe('○ Stretch');
    expect(actualLabel(null)).toBe('Not logged');
    expect(actualLabel(3)).toBe('3h');
  });
});

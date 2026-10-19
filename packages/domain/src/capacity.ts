/** Pure capacity and load math (FR-C03/C04/C06/C09). */

export type CapacityInputs = {
  availableHours: number;
  leaveHours: number;
  reservedCommitmentHours: number;
  unplannedBufferHours: number;
};

export type CapacityBreakdown = {
  grossHours: number;
  deductionHours: number;
  netHours: number;
};

export function computeCapacity(inputs: CapacityInputs): CapacityBreakdown {
  const grossHours = inputs.availableHours;
  const deductionHours =
    inputs.leaveHours + inputs.reservedCommitmentHours + inputs.unplannedBufferHours;
  return {
    grossHours,
    deductionHours,
    netHours: grossHours - deductionHours,
  };
}

export type LoadItem = {
  estimateHours: number | null;
  estimateUnknown: boolean;
  commitmentKind: 'none' | 'commitment' | 'stretch';
  teamMemberId: string | null;
};

export type MemberLoad = {
  committedLoadHours: number;
  unestimatedCommitCount: number;
  stretchHours: number;
};

export function computeMemberLoad(items: LoadItem[], teamMemberId: string): MemberLoad {
  let committedLoadHours = 0;
  let unestimatedCommitCount = 0;
  let stretchHours = 0;
  for (const item of items) {
    if (item.teamMemberId !== teamMemberId) continue;
    if (item.commitmentKind === 'commitment') {
      if (item.estimateUnknown || item.estimateHours == null) {
        unestimatedCommitCount += 1;
      } else {
        committedLoadHours += item.estimateHours;
      }
    } else if (item.commitmentKind === 'stretch') {
      if (!item.estimateUnknown && item.estimateHours != null) {
        stretchHours += item.estimateHours;
      }
    }
  }
  return { committedLoadHours, unestimatedCommitCount, stretchHours };
}

export function remainingHours(netHours: number, committedLoadHours: number): number {
  return netHours - committedLoadHours;
}

/** Half-hour steps; non-negative. */
export function isValidHours(value: number): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  return Math.abs(value * 2 - Math.round(value * 2)) < 1e-9;
}

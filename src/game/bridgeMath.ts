import { Traveler, BridgeBank, OptimalSolutionResult } from '../types';

/**
 * Calculates crossing time for a group of travelers (bottleneck invariant: max(times))
 */
export function getCrossingDuration(travelers: Traveler[]): number {
  if (travelers.length === 0) return 0;
  return Math.max(...travelers.map((t) => t.time));
}

/**
 * Validates if the selected group can cross right now
 */
export function validateCrossing(
  selectedIds: string[],
  torchBank: BridgeBank,
  leftBankIds: string[],
  rightBankIds: string[],
  capacity: number = 2
): { valid: boolean; reason?: string } {
  if (selectedIds.length === 0) {
    return { valid: false, reason: 'Please select at least 1 traveler to cross.' };
  }
  if (selectedIds.length > capacity) {
    return { valid: false, reason: `The bridge can only hold up to ${capacity} people at once!` };
  }

  const currentBankIds = torchBank === 'left' ? leftBankIds : rightBankIds;
  const allOnTorchBank = selectedIds.every((id) => currentBankIds.includes(id));

  if (!allOnTorchBank) {
    return { valid: false, reason: 'Selected travelers must be on the same bank where the torch is located.' };
  }

  return { valid: true };
}

/**
 * Dijkstra / Breadth-First State Search Solver
 * Computes exact minimum possible time and optimal step sequence.
 */
interface SearchState {
  leftMask: number; // bitmask of people on left bank (1 = left, 0 = right)
  torch: 0 | 1; // 0 = left, 1 = right
  cost: number;
  history: { travelerIndices: number[]; duration: number; direction: 'forward' | 'backward' }[];
}

export function solveBridgeCrossing(travelers: Traveler[], capacity: number = 2): OptimalSolutionResult {
  const n = travelers.length;
  if (n === 0) {
    return { minTime: 0, naiveTime: 0, steps: [], breakdown: 'No travelers.' };
  }

  // Sorted list of traveler speeds for reference
  const sorted = [...travelers].sort((a, b) => a.time - b.time);

  // Initial state: everyone on left bank (mask = (1 << n) - 1), torch = 0 (left)
  const initialMask = (1 << n) - 1;
  const targetMask = 0; // everyone on right bank

  // Dijkstra Priority Queue / Distance map
  // Key format: `${mask}_${torch}`
  const dist = new Map<string, number>();
  const pq: SearchState[] = [];

  const startState: SearchState = {
    leftMask: initialMask,
    torch: 0,
    cost: 0,
    history: [],
  };

  pq.push(startState);
  dist.set(`${initialMask}_0`, 0);

  let bestSolution: SearchState | null = null;

  while (pq.length > 0) {
    // Pick state with smallest cost
    pq.sort((a, b) => a.cost - b.cost);
    const current = pq.shift()!;

    const stateKey = `${current.leftMask}_${current.torch}`;
    if (current.cost > (dist.get(stateKey) ?? Infinity)) {
      continue;
    }

    // Check goal: everyone on right bank (leftMask == 0) and torch on right (1)
    if (current.leftMask === targetMask && current.torch === 1) {
      bestSolution = current;
      break;
    }

    const isTorchLeft = current.torch === 0;

    // Available travelers on current torch bank
    const availableIndices: number[] = [];
    for (let i = 0; i < n; i++) {
      const isOnLeft = (current.leftMask & (1 << i)) !== 0;
      if (isTorchLeft && isOnLeft) {
        availableIndices.push(i);
      } else if (!isTorchLeft && !isOnLeft) {
        availableIndices.push(i);
      }
    }

    // Generate combinations of 1 to `capacity` travelers
    const combinations: number[][] = [];

    function generateCombos(startIdx: number, currentCombo: number[], maxLen: number) {
      if (currentCombo.length >= 1 && currentCombo.length <= maxLen) {
        combinations.push([...currentCombo]);
      }
      if (currentCombo.length === maxLen) return;

      for (let i = startIdx; i < availableIndices.length; i++) {
        currentCombo.push(availableIndices[i]);
        generateCombos(i + 1, currentCombo, maxLen);
        currentCombo.pop();
      }
    }

    generateCombos(0, [], capacity);

    for (const combo of combinations) {
      // Calculate group duration = max(travelers' times)
      const duration = Math.max(...combo.map((idx) => travelers[idx].time));
      let nextLeftMask = current.leftMask;

      if (isTorchLeft) {
        // Moving left -> right: unset bits
        for (const idx of combo) {
          nextLeftMask &= ~(1 << idx);
        }
      } else {
        // Moving right -> left: set bits
        for (const idx of combo) {
          nextLeftMask |= 1 << idx;
        }
      }

      const nextTorch = isTorchLeft ? 1 : 0;
      const nextCost = current.cost + duration;
      const nextKey = `${nextLeftMask}_${nextTorch}`;

      if (nextCost < (dist.get(nextKey) ?? Infinity)) {
        dist.set(nextKey, nextCost);
        pq.push({
          leftMask: nextLeftMask,
          torch: nextTorch,
          cost: nextCost,
          history: [
            ...current.history,
            {
              travelerIndices: combo,
              duration,
              direction: isTorchLeft ? 'forward' : 'backward',
            },
          ],
        });
      }
    }
  }

  // Calculate Naive Greedy Strategy (Fastest traveler shuttles everyone individually)
  let naiveTime = 0;
  if (n <= 2) {
    naiveTime = Math.max(...travelers.map((t) => t.time));
  } else {
    const minTime = sorted[0].time;
    // Fastest escorts each person: for i = 1 to n-1: cross with sorted[i], return alone (except last)
    for (let i = 1; i < n; i++) {
      naiveTime += sorted[i].time;
      if (i < n - 1) {
        naiveTime += minTime; // return trip
      }
    }
  }

  const optimalTime = bestSolution ? bestSolution.cost : naiveTime;

  // Format steps
  const formattedSteps = (bestSolution?.history || []).map((step) => ({
    travelerNames: step.travelerIndices.map((i) => travelers[i].name),
    time: step.duration,
    direction: step.direction,
  }));

  // Construct educational breakdown
  const timeSaved = naiveTime - optimalTime;
  const breakdown =
    timeSaved > 0
      ? `By pairing the two slowest travelers together (${sorted[n - 1]?.name} & ${sorted[n - 2]?.name}), their crossing times are absorbed into a single trip (saving ${timeSaved} minutes compared to the naive shuttle strategy)!`
      : `Optimal and naive strategies converge for this configuration.`;

  return {
    minTime: optimalTime,
    naiveTime,
    steps: formattedSteps,
    breakdown,
  };
}

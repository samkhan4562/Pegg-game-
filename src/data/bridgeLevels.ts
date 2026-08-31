import { BridgeLevelData } from '../types';

export const BRIDGE_LEVELS: BridgeLevelData[] = [
  // --- ACT 1: INITIATION (LEVELS 1–5: 2 to 3 TRAVELERS) ---
  {
    id: 1,
    name: "The Duo Crossing",
    difficulty: "Tutorial",
    bridgeCapacity: 2,
    parTime: 2,
    travelers: [
      { id: 't1', name: 'Scout', time: 1, avatarColor: '#38bdf8', role: 'Speedster' },
      { id: 't2', name: 'Guide', time: 2, avatarColor: '#34d399', role: 'Navigator' }
    ],
    description: "Learn the fundamental bottleneck invariant: two people cross together at the pace of the slower traveler max(A, B).",
    hint: "Select both Scout (1m) and Guide (2m) and cross together! Elapsed time: max(1, 2) = 2 minutes."
  },
  {
    id: 2,
    name: "The Trio Relay",
    difficulty: "Tutorial",
    bridgeCapacity: 2,
    parTime: 10,
    travelers: [
      { id: 't1', name: 'Runner', time: 1, avatarColor: '#38bdf8', role: 'Sprinter' },
      { id: 't2', name: 'Trekker', time: 3, avatarColor: '#34d399', role: 'Hiker' },
      { id: 't3', name: 'Elder', time: 6, avatarColor: '#f87171', role: 'Elder' }
    ],
    description: "Three travelers must cross the canyon. One person must shuttle the torch back to the start bank.",
    hint: "Send Runner (1m) with Trekker (3m) [3 mins], Runner returns alone [1 min], then Runner escorts Elder (6m) [6 mins] = 10 mins total."
  },
  {
    id: 3,
    name: "Unequal Strides",
    difficulty: "Easy",
    bridgeCapacity: 2,
    parTime: 12,
    travelers: [
      { id: 't1', name: 'Courier', time: 1, avatarColor: '#38bdf8', role: 'Courier' },
      { id: 't2', name: 'Climber', time: 4, avatarColor: '#a78bfa', role: 'Climber' },
      { id: 't3', name: 'Veteran', time: 7, avatarColor: '#f87171', role: 'Veteran' }
    ],
    description: "Courier must ferry two heavier companions one by one across the dark ravine.",
    hint: "Cross (1,4) [4m], return 1 [1m], cross (1,7) [7m] = 12 mins."
  },
  {
    id: 4,
    name: "The Heavy Haul",
    difficulty: "Easy",
    bridgeCapacity: 2,
    parTime: 15,
    travelers: [
      { id: 't1', name: 'Jogger', time: 2, avatarColor: '#38bdf8', role: 'Jogger' },
      { id: 't2', name: 'Porter', time: 5, avatarColor: '#fbbf24', role: 'Porter' },
      { id: 't3', name: 'Anchor', time: 8, avatarColor: '#f87171', role: 'Anchor' }
    ],
    description: "No ultra-fast 1-minute courier available. Every return trip costs 2 minutes.",
    hint: "Send (2,5) [5m], return 2 [2m], send (2,8) [8m] = 15 mins total."
  },
  {
    id: 5,
    name: "Night Ascent",
    difficulty: "Easy",
    bridgeCapacity: 2,
    parTime: 8,
    travelers: [
      { id: 't1', name: 'Zephyr', time: 1, avatarColor: '#38bdf8', role: 'Sprinter' },
      { id: 't2', name: 'Aero', time: 2, avatarColor: '#34d399', role: 'Scout' },
      { id: 't3', name: 'Stone', time: 5, avatarColor: '#fbbf24', role: 'Scholar' }
    ],
    description: "Swift pair with one heavy traveler. Achieve the tightest 8-minute par.",
    hint: "Zephyr (1m) and Aero (2m) cross first [2m], Zephyr returns [1m], Zephyr and Stone (5m) cross [5m] = 8 mins."
  },

  // --- ACT 2: BOTTLENECK SYNCHRONIZATION (LEVELS 6–10: 4 TRAVELERS) ---
  {
    id: 6,
    name: "The Classic Quad",
    difficulty: "Medium",
    bridgeCapacity: 2,
    parTime: 17,
    travelers: [
      { id: 't1', name: 'Runner', time: 1, avatarColor: '#38bdf8', role: 'Sprinter' },
      { id: 't2', name: 'Walker', time: 2, avatarColor: '#34d399', role: 'Walker' },
      { id: 't3', name: 'Stroller', time: 5, avatarColor: '#fbbf24', role: 'Stroller' },
      { id: 't4', name: 'Elder', time: 10, avatarColor: '#f87171', role: 'Elder' }
    ],
    description: "The legendary 17-minute riddle: pair the two slowest people (5 & 10) together to absorb both times into a single crossing!",
    hint: "1. (1,2) cross [2m] -> 2. 1 returns [1m] -> 3. (5,10) cross together [10m] -> 4. 2 returns [2m] -> 5. (1,2) cross [2m] = 17 mins!"
  },
  {
    id: 7,
    name: "Narrow Gorge",
    difficulty: "Medium",
    bridgeCapacity: 2,
    parTime: 18,
    travelers: [
      { id: 't1', name: 'Scout', time: 1, avatarColor: '#38bdf8', role: 'Courier' },
      { id: 't2', name: 'Climber', time: 3, avatarColor: '#34d399', role: 'Climber' },
      { id: 't3', name: 'Sherpa', time: 6, avatarColor: '#fbbf24', role: 'Sherpa' },
      { id: 't4', name: 'Bearer', time: 8, avatarColor: '#f87171', role: 'Bearer' }
    ],
    description: "Bottleneck theorem with 1, 3, 6, and 8 minute crossing times.",
    hint: "Send (1,3) [3m], return 1 [1m], send (6,8) [8m], return 3 [3m], send (1,3) [3m] = 18 mins."
  },
  {
    id: 8,
    name: "Heavyweight Bottleneck",
    difficulty: "Medium",
    bridgeCapacity: 2,
    parTime: 23,
    travelers: [
      { id: 't1', name: 'Sprinter', time: 2, avatarColor: '#38bdf8', role: 'Sprinter' },
      { id: 't2', name: 'Jogger', time: 3, avatarColor: '#34d399', role: 'Jogger' },
      { id: 't3', name: 'Porter', time: 8, avatarColor: '#fbbf24', role: 'Porter' },
      { id: 't4', name: 'Giant', time: 12, avatarColor: '#f87171', role: 'Heavy' }
    ],
    description: "Pairing (8,12) saves 8 full minutes compared to crossing separately.",
    hint: "Cross (2,3) [3m], return 2 [2m], cross (8,12) [12m], return 3 [3m], cross (2,3) [3m] = 23 mins."
  },
  {
    id: 9,
    name: "Tight Margins",
    difficulty: "Hard",
    bridgeCapacity: 2,
    parTime: 21,
    travelers: [
      { id: 't1', name: 'Swift', time: 2, avatarColor: '#38bdf8', role: 'Swift' },
      { id: 't2', name: 'Steady', time: 4, avatarColor: '#34d399', role: 'Steady' },
      { id: 't3', name: 'Heavy', time: 5, avatarColor: '#fbbf24', role: 'Heavy' },
      { id: 't4', name: 'Anchor', time: 8, avatarColor: '#f87171', role: 'Anchor' }
    ],
    description: "Speeds are closely clustered (2, 4, 5, 8). Analyze whether the shuttle strategy edges out the bottleneck strategy.",
    hint: "Swift (2m) escorts everyone individually: (2,4)[4] + 2[2] + (2,5)[5] + 2[2] + (2,8)[8] = 21 mins."
  },
  {
    id: 10,
    name: "Midnight Sprint",
    difficulty: "Hard",
    bridgeCapacity: 2,
    parTime: 17,
    travelers: [
      { id: 't1', name: 'Falcon', time: 1, avatarColor: '#38bdf8', role: 'Scout' },
      { id: 't2', name: 'Hawk', time: 2, avatarColor: '#34d399', role: 'Guide' },
      { id: 't3', name: 'Bison', time: 7, avatarColor: '#fbbf24', role: 'Bison' },
      { id: 't4', name: 'Mammoth', time: 10, avatarColor: '#f87171', role: 'Mammoth' }
    ],
    description: "Two swift birds and two ancient beasts. Achieve the theoretical 17-minute limit.",
    hint: "Pair the beasts (7,10) together [10m] while Falcon & Hawk handle the torch shuttle returns [2+1+2+2 = 7m]."
  },

  // --- ACT 3: MULTI-STAGE EXPEDITIONS (LEVELS 11–15: 5 TRAVELERS) ---
  {
    id: 11,
    name: "Five Souls Expedition",
    difficulty: "Hard",
    bridgeCapacity: 2,
    parTime: 29,
    travelers: [
      { id: 't1', name: 'Alpha', time: 1, avatarColor: '#38bdf8', role: 'Leader' },
      { id: 't2', name: 'Beta', time: 2, avatarColor: '#34d399', role: 'Scout' },
      { id: 't3', name: 'Gamma', time: 4, avatarColor: '#a78bfa', role: 'Scholar' },
      { id: 't4', name: 'Delta', time: 8, avatarColor: '#fbbf24', role: 'Porter' },
      { id: 't5', name: 'Epsilon', time: 12, avatarColor: '#f87171', role: 'Veteran' }
    ],
    description: "Five travelers across the abyss. Combine shuttle relays with bottleneck pairing.",
    hint: "Use fastest pair (1,2) to shuttle torch returns after pairing the slowest (8,12) together."
  },
  {
    id: 12,
    name: "Asymmetric Caravan",
    difficulty: "Hard",
    bridgeCapacity: 2,
    parTime: 34,
    travelers: [
      { id: 't1', name: 'Courier', time: 1, avatarColor: '#38bdf8', role: 'Courier' },
      { id: 't2', name: 'Ranger', time: 3, avatarColor: '#34d399', role: 'Ranger' },
      { id: 't3', name: 'Merchant', time: 6, avatarColor: '#818cf8', role: 'Merchant' },
      { id: 't4', name: 'Knight', time: 9, avatarColor: '#a78bfa', role: 'Knight' },
      { id: 't5', name: 'Monk', time: 15, avatarColor: '#f87171', role: 'Monk' }
    ],
    description: "Five-tiered expedition. Slowest pair (9,15) takes 15 minutes together.",
    hint: "Cross (1,3)[3] + 1[1] + (9,15)[15] + 3[3] + (1,6)[6] + 1[1] + (1,3)[3] = 32-34 mins."
  },
  {
    id: 13,
    name: "The Triple Slowdown",
    difficulty: "Master",
    bridgeCapacity: 2,
    parTime: 37,
    travelers: [
      { id: 't1', name: 'Brisk', time: 2, avatarColor: '#38bdf8', role: 'Brisk' },
      { id: 't2', name: 'Nimble', time: 3, avatarColor: '#34d399', role: 'Nimble' },
      { id: 't3', name: 'Burdened', time: 7, avatarColor: '#818cf8', role: 'Burdened' },
      { id: 't4', name: 'Sluggish', time: 10, avatarColor: '#fbbf24', role: 'Sluggish' },
      { id: 't5', name: 'Immobile', time: 14, avatarColor: '#f87171', role: 'Immobile' }
    ],
    description: "Three slow travelers (7, 10, 14). Pair the two heaviest (10,14) first, then relay the middle.",
    hint: "Carefully coordinate Brisk (2) and Nimble (3) to return the torch after the heavy crossing."
  },
  {
    id: 14,
    name: "The Reinforced Chasm",
    difficulty: "Master",
    bridgeCapacity: 3,
    parTime: 16,
    travelers: [
      { id: 't1', name: 'Scout', time: 1, avatarColor: '#38bdf8', role: 'Scout' },
      { id: 't2', name: 'Guide', time: 2, avatarColor: '#34d399', role: 'Guide' },
      { id: 't3', name: 'Scholar', time: 5, avatarColor: '#818cf8', role: 'Scholar' },
      { id: 't4', name: 'Porter', time: 8, avatarColor: '#fbbf24', role: 'Porter' },
      { id: 't5', name: 'Elder', time: 10, avatarColor: '#f87171', role: 'Elder' }
    ],
    description: "Reinforced bridge: holds up to 3 people simultaneously! Exploit 3-person crossings.",
    hint: "Cross (1,2,5) [5m], Scout (1m) returns [1m], then cross (1,8,10) [10m] = 16 mins total!"
  },
  {
    id: 15,
    name: "Highland Convoy",
    difficulty: "Master",
    bridgeCapacity: 2,
    parTime: 40,
    travelers: [
      { id: 't1', name: 'Acrobat', time: 2, avatarColor: '#38bdf8', role: 'Acrobat' },
      { id: 't2', name: 'Climber', time: 4, avatarColor: '#34d399', role: 'Climber' },
      { id: 't3', name: 'Mechanic', time: 6, avatarColor: '#818cf8', role: 'Mechanic' },
      { id: 't4', name: 'Blacksmith', time: 10, avatarColor: '#fbbf24', role: 'Blacksmith' },
      { id: 't5', name: 'Golem', time: 16, avatarColor: '#f87171', role: 'Golem' }
    ],
    description: "Five highland travelers with steep intervals. Master the multi-stage relay.",
    hint: "Absorb the 16m Golem and 10m Blacksmith into one joint 16-minute crossing."
  },

  // --- ACT 4: GRANDMASTER SYNCHRONIZATION (LEVELS 16–20: 6 TRAVELERS) ---
  {
    id: 16,
    name: "The Hexa Chasm",
    difficulty: "Grandmaster",
    bridgeCapacity: 2,
    parTime: 41,
    travelers: [
      { id: 't1', name: 'Zephyr', time: 1, avatarColor: '#38bdf8', role: 'Sprinter' },
      { id: 't2', name: 'Breeze', time: 2, avatarColor: '#34d399', role: 'Navigator' },
      { id: 't3', name: 'Gale', time: 5, avatarColor: '#818cf8', role: 'Courier' },
      { id: 't4', name: 'Stone', time: 7, avatarColor: '#a78bfa', role: 'Builder' },
      { id: 't5', name: 'Iron', time: 10, avatarColor: '#fbbf24', role: 'Blacksmith' },
      { id: 't6', name: 'Colossus', time: 15, avatarColor: '#f87171', role: 'Colossus' }
    ],
    description: "Six travelers crossing deep chasm. Double bottleneck pairs: (10,15) and (5,7)!",
    hint: "Pair (10,15) together first, then (5,7) together, with (1,2) managing all torch shuttles."
  },
  {
    id: 17,
    name: "The Colossus March",
    difficulty: "Grandmaster",
    bridgeCapacity: 2,
    parTime: 47,
    travelers: [
      { id: 't1', name: 'Volt', time: 1, avatarColor: '#38bdf8', role: 'Volt' },
      { id: 't2', name: 'Pulse', time: 2, avatarColor: '#34d399', role: 'Pulse' },
      { id: 't3', name: 'Wave', time: 6, avatarColor: '#818cf8', role: 'Wave' },
      { id: 't4', name: 'Surge', time: 9, avatarColor: '#a78bfa', role: 'Surge' },
      { id: 't5', name: 'Flux', time: 14, avatarColor: '#fbbf24', role: 'Flux' },
      { id: 't6', name: 'Apex', time: 20, avatarColor: '#f87171', role: 'Apex' }
    ],
    description: "Six souls facing a 20-minute titan. Perform double paired bottlenecks to hit 47 minutes.",
    hint: "1. (1,2) cross -> 2. 1 returns -> 3. (14,20) cross -> 4. 2 returns -> 5. (6,9) cross -> 6. 1 returns -> 7. (1,2) cross."
  },
  {
    id: 18,
    name: "Triple Capacity Expedition",
    difficulty: "Grandmaster",
    bridgeCapacity: 3,
    parTime: 23,
    travelers: [
      { id: 't1', name: 'Spark', time: 1, avatarColor: '#38bdf8', role: 'Spark' },
      { id: 't2', name: 'Blaze', time: 2, avatarColor: '#34d399', role: 'Blaze' },
      { id: 't3', name: 'Torch', time: 4, avatarColor: '#818cf8', role: 'Torch' },
      { id: 't4', name: 'Beacon', time: 6, avatarColor: '#a78bfa', role: 'Beacon' },
      { id: 't5', name: 'Furnace', time: 10, avatarColor: '#fbbf24', role: 'Furnace' },
      { id: 't6', name: 'Inferno', time: 15, avatarColor: '#f87171', role: 'Inferno' }
    ],
    description: "Six travelers on a 3-person bridge! Triple bottlenecks create unprecedented tactical synergies.",
    hint: "Cross (1,2,4) [4m], return 1 [1m], cross (1,10,15) [15m], return 2 [2m], cross (1,2,6) [6m] = 28m, or optimize with (1,2,15) groups!"
  },
  {
    id: 19,
    name: "Iron Will",
    difficulty: "Grandmaster",
    bridgeCapacity: 2,
    parTime: 55,
    travelers: [
      { id: 't1', name: 'Ranger', time: 2, avatarColor: '#38bdf8', role: 'Ranger' },
      { id: 't2', name: 'Tracker', time: 3, avatarColor: '#34d399', role: 'Tracker' },
      { id: 't3', name: 'Warden', time: 6, avatarColor: '#818cf8', role: 'Warden' },
      { id: 't4', name: 'Knight', time: 10, avatarColor: '#a78bfa', role: 'Knight' },
      { id: 't5', name: 'Sentinel', time: 15, avatarColor: '#fbbf24', role: 'Sentinel' },
      { id: 't6', name: 'Overlord', time: 22, avatarColor: '#f87171', role: 'Overlord' }
    ],
    description: "No 1-minute speedster available: minimum return trip is 2 or 3 minutes.",
    hint: "Combine Ranger (2) and Tracker (3) as synchronized torch couriers to absorb (15,22) and (6,10)."
  },
  {
    id: 20,
    name: "The Midnight Singularity",
    difficulty: "Grandmaster",
    bridgeCapacity: 2,
    parTime: 59,
    travelers: [
      { id: 't1', name: 'Alpha', time: 1, avatarColor: '#38bdf8', role: 'Alpha' },
      { id: 't2', name: 'Beta', time: 2, avatarColor: '#34d399', role: 'Beta' },
      { id: 't3', name: 'Gamma', time: 4, avatarColor: '#818cf8', role: 'Gamma' },
      { id: 't4', name: 'Delta', time: 8, avatarColor: '#a78bfa', role: 'Delta' },
      { id: 't5', name: 'Epsilon', time: 16, avatarColor: '#fbbf24', role: 'Epsilon' },
      { id: 't6', name: 'Omega', time: 32, avatarColor: '#f87171', role: 'Omega' }
    ],
    description: "The ultimate mathematical bridge crossing riddle: exponential binary crossing times (1, 2, 4, 8, 16, 32).",
    hint: "Cross (1,2) [2], return 1 [1], cross (16,32) [32], return 2 [2], cross (4,8) [8], return 1 [1], cross (1,2) [2] = 2+1+32+2+8+1+2 = 48 minutes!"
  }
];

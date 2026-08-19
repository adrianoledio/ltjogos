export interface SlotSpinRequest {
  userId?: string;
  gameId: 'tattoo-slot' | 'yakuza-ink' | 'mystic-ink' | 'wild-tattoo' | 'calavera-ink' | 'tattoo-cash' | 'rouletta-ink' | 'ink-reveal';
  baseBet?: number;
  activeBet?: number;
  bet?: number;
  betPerLine?: number;
  totalBet?: number;
  freeSpins?: number;
  freeSpinsActive?: boolean;
  freeSpinsMultiplier?: number;
  freeSpinMultiplier?: number;
  doubleChance?: boolean;
  tigerActive?: boolean;
  dragonActive?: boolean;
  isWildTattoo?: boolean;
  isFeverActive?: boolean;
  userRole?: string;
}

export interface TattooSlotResult {
  gameId: 'tattoo-slot';
  targetPrize: number;
  finalGrid: string[][];
  totalWin: number;
  winningPositions: { r: number; c: number }[];
  scatterCount: number;
  freeSpinsWon: number;
  newMultiplier?: number;
}

export interface YakuzaInkResult {
  gameId: 'yakuza-ink';
  targetPrize: number;
  tigerResult: string[];
  dragonResult: string[];
  calculatedTigerWin: number;
  calculatedDragonWin: number;
  totalWin: number;
  isDoubleWin: boolean;
  winningTigerPos: number[];
  winningDragonPos: number[];
}

export interface MysticInkResult {
  gameId: 'mystic-ink' | 'wild-tattoo';
  targetPrize: number;
  finalGrid: string[][];
  totalWin: number;
  winningPositions: { r: number; c: number }[];
  winningMults: number[];
  scatterCount: number;
  wonFreeSpins: boolean;
  topMultipliers: number[];
}

export interface CalaveraInkResult {
  gameId: 'calavera-ink';
  targetPrize: number;
  finalGrid: string[][];
  goldenFrames: string[];
  initialWin: number;
  winningPositions: { r: number; c: number }[];
  scatterCount: number;
  wonFreeSpins: boolean;
}

export interface TattooCashResult {
  gameId: 'tattoo-cash';
  targetPrize: number;
  finalLeft: any;
  finalCenter: any;
  finalRight: any;
  reelLeft: any[];
  reelCenter: any[];
  reelRight: any[];
  isWin: boolean;
  winAmount: number;
  freeSpinsWon: number;
}

export interface RoulettaInkResult {
  gameId: 'rouletta-ink';
  targetPrize: number;
  targetSliceIndex: number;
  targetSlice: any;
  actualPayout: number;
  isBigWin: boolean;
}

export interface InkRevealResult {
  gameId: 'ink-reveal';
  targetPrize: number;
  wonAmount: number;
  grid: any[];
}

// ----------------------------------------------------
// 1. TATTOO SLOT
// ----------------------------------------------------
const TATTOO_SYMBOLS = ['HEART', 'MACHINE', 'INK', 'BOOTS', 'NEEDLE', 'A', 'K', 'Q', 'J', '10'];
const TATTOO_WEIGHTED_SYMBOLS = [
  '10', '10', '10', '10', '10',
  'J', 'J', 'J', 'J',
  'Q', 'Q', 'Q', 'Q',
  'K', 'K', 'K',
  'A', 'A', 'A',
  'NEEDLE', 'NEEDLE',
  'BOOTS', 'BOOTS',
  'INK', 'INK',
  'MACHINE',
  'HEART',
  'WILD',
  'SCATTER',
];

const TATTOO_PAYTABLE: Record<string, number[]> = {
  HEART: [0, 0, 0, 2.5, 5.0, 12.0],
  MACHINE: [0, 0, 0, 2.0, 4.0, 8.0],
  INK: [0, 0, 0, 1.5, 3.0, 6.0],
  BOOTS: [0, 0, 0, 1.2, 2.5, 5.0],
  NEEDLE: [0, 0, 0, 1.0, 2.0, 4.0],
  A: [0, 0, 0, 0.6, 1.2, 2.5],
  K: [0, 0, 0, 0.5, 1.0, 2.0],
  Q: [0, 0, 0, 0.4, 0.8, 1.6],
  J: [0, 0, 0, 0.3, 0.6, 1.2],
  '10': [0, 0, 0, 0.2, 0.4, 0.8],
};

export function computeTattooSlotOutcome(
  targetPrize: number,
  baseBet: number,
  freeSpinsActive: boolean,
  freeSpinsMultiplier: number,
  doubleChance: boolean
): TattooSlotResult {
  const ROWS = 4;
  const COLS = 5;

  let finalGrid: string[][] = [];

  if (targetPrize >= baseBet * 5) {
    const highSyms = ['HEART', 'MACHINE', 'INK'];
    const winSym = highSyms[Math.floor(Math.random() * highSyms.length)];

    finalGrid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => TATTOO_WEIGHTED_SYMBOLS[Math.floor(Math.random() * TATTOO_WEIGHTED_SYMBOLS.length)])
    );

    for (let c = 0; c < 4; c++) {
      const r = Math.floor(Math.random() * ROWS);
      finalGrid[r][c] = winSym;
    }
    finalGrid[Math.floor(Math.random() * ROWS)][2] = 'WILD';

    if (Math.random() < 0.2 || doubleChance) {
      finalGrid[Math.floor(Math.random() * ROWS)][0] = 'SCATTER';
      finalGrid[Math.floor(Math.random() * ROWS)][4] = 'SCATTER';
    }
  } else if (targetPrize > 0) {
    const letterSyms = ['A', 'K', 'Q', 'J', '10'];
    const winSym = letterSyms[Math.floor(Math.random() * letterSyms.length)];
    const matchCount = Math.floor(Math.random() * 2) + 3;

    finalGrid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => TATTOO_WEIGHTED_SYMBOLS[Math.floor(Math.random() * TATTOO_WEIGHTED_SYMBOLS.length)])
    );

    for (let c = 0; c < matchCount; c++) {
      const r = Math.floor(Math.random() * ROWS);
      finalGrid[r][c] = winSym;
    }

    if (matchCount < COLS) {
      for (let r = 0; r < ROWS; r++) {
        if (finalGrid[r][matchCount] === winSym || finalGrid[r][matchCount] === 'WILD') {
          finalGrid[r][matchCount] = winSym === 'A' ? '10' : 'A';
        }
      }
    }
  } else {
    let attempts = 0;
    while (attempts < 10) {
      finalGrid = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => TATTOO_WEIGHTED_SYMBOLS[Math.floor(Math.random() * TATTOO_WEIGHTED_SYMBOLS.length)])
      );

      const col1Syms = finalGrid.map(row => row[0]);
      const col2Syms = finalGrid.map(row => row[1]);

      let hasPotential = false;
      finalGrid.forEach((row, rIdx) => {
        const sym = row[2];
        if (col1Syms.includes(sym) || col2Syms.includes(sym) || sym === 'WILD') {
          hasPotential = true;
          finalGrid[rIdx][2] = '10';
        }
      });

      if (!hasPotential) break;
      attempts++;
    }

    if (Math.random() < 0.1 || (doubleChance && Math.random() < 0.25)) {
      finalGrid[Math.floor(Math.random() * ROWS)][0] = 'SCATTER';
      finalGrid[Math.floor(Math.random() * ROWS)][2] = 'SCATTER';
    }
  }

  // Calculate winnings and winning positions
  let totalWin = 0;
  let winningPositions: { r: number; c: number }[] = [];
  let scatterCount = 0;

  finalGrid.forEach(row => {
    row.forEach(sym => {
      if (sym === 'SCATTER') scatterCount++;
    });
  });

  Object.keys(TATTOO_PAYTABLE).forEach(symbol => {
    let ways = 1;
    let matchCount = 0;
    let tempPositions: { r: number; c: number }[] = [];

    for (let c = 0; c < COLS; c++) {
      let countInCol = 0;
      let colPositions: { r: number; c: number }[] = [];

      for (let r = 0; r < ROWS; r++) {
        if (finalGrid[r][c] === symbol || finalGrid[r][c] === 'WILD') {
          countInCol++;
          colPositions.push({ r, c });
        }
      }

      if (countInCol > 0) {
        ways *= countInCol;
        matchCount++;
        tempPositions.push(...colPositions);
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const payoutMultiplier = TATTOO_PAYTABLE[symbol][matchCount];
      if (payoutMultiplier > 0) {
        const winMultiplier = freeSpinsActive ? freeSpinsMultiplier : 1;
        let cashWin = baseBet * payoutMultiplier * ways * winMultiplier;

        if (targetPrize > 0) {
          const remainingCap = targetPrize - totalWin;
          if (cashWin > remainingCap) {
            cashWin = Math.max(0, remainingCap);
          }
        }

        totalWin += cashWin;
        winningPositions.push(...tempPositions);
      }
    }
  });

  const freeSpinsWon = scatterCount >= 3 ? 10 + (scatterCount - 3) * 2 : 0;

  return {
    gameId: 'tattoo-slot',
    targetPrize,
    finalGrid,
    totalWin: Math.round(totalWin * 100) / 100,
    winningPositions,
    scatterCount,
    freeSpinsWon,
  };
}

// ----------------------------------------------------
// 2. YAKUZA INK
// ----------------------------------------------------
const TIGER_SYMBOLS = [
  { id: 'TIGER_HEAD', payout: 100 },
  { id: 'TIGER_BODY', payout: 50 },
  { id: 'TIGER_CLAWS', payout: 25 },
  { id: 'GOLD_TIGER', payout: 10 },
  { id: 'SILVER_TIGER', payout: 5 },
  { id: 'TIGER_PAW', payout: 3 },
  { id: 'KATANA', payout: 2 },
];

const DRAGON_SYMBOLS = [
  { id: 'DRAGON_HEAD', payout: 100 },
  { id: 'DRAGON_BODY', payout: 50 },
  { id: 'DRAGON_CLAWS', payout: 25 },
  { id: 'GOLD_DRAGON', payout: 10 },
  { id: 'SILVER_DRAGON', payout: 5 },
  { id: 'DRAGON_PAW', payout: 3 },
  { id: 'KATANA', payout: 2 },
];

export function computeYakuzaInkOutcome(
  targetPrize: number,
  betPerLine: number,
  tigerActive: boolean,
  dragonActive: boolean
): YakuzaInkResult {
  const makeLoseTiger = () => {
    const syms = [...TIGER_SYMBOLS];
    const list = [
      syms[Math.floor(Math.random() * syms.length)].id,
      syms[Math.floor(Math.random() * syms.length)].id,
      syms[Math.floor(Math.random() * syms.length)].id,
    ];
    if (list[0] === list[1] && list[1] === list[2]) {
      list[0] = list[0] === 'KATANA' ? 'TIGER_PAW' : 'KATANA';
    }
    return list;
  };

  const makeLoseDragon = () => {
    const syms = [...DRAGON_SYMBOLS];
    const list = [
      syms[Math.floor(Math.random() * syms.length)].id,
      syms[Math.floor(Math.random() * syms.length)].id,
      syms[Math.floor(Math.random() * syms.length)].id,
    ];
    if (list[0] === list[1] && list[1] === list[2]) {
      list[0] = list[0] === 'KATANA' ? 'DRAGON_PAW' : 'KATANA';
    }
    return list;
  };

  let tigerResult: string[] = [];
  let dragonResult: string[] = [];
  let calculatedTigerWin = 0;
  let calculatedDragonWin = 0;
  let winningTigerPos: number[] = [];
  let winningDragonPos: number[] = [];

  if (targetPrize > 0) {
    if (tigerActive && dragonActive) {
      const halfTarget = targetPrize / 2;
      let TigerPayout = 0;
      let DragonPayout = 0;

      const options = [100, 50, 25, 10, 5];
      const matchTig = options.find(o => Math.abs(o * betPerLine - halfTarget / 2) < 0.1);
      const matchDrag = options.find(o => Math.abs(o * betPerLine - halfTarget / 2) < 0.1);

      if (matchTig && matchDrag) {
        TigerPayout = matchTig * betPerLine;
        DragonPayout = matchDrag * betPerLine;
      } else {
        if (Math.random() > 0.5) {
          TigerPayout = targetPrize;
          DragonPayout = 0;
        } else {
          TigerPayout = 0;
          DragonPayout = targetPrize;
        }
      }

      if (TigerPayout > 0) {
        const mult = TigerPayout / betPerLine;
        const config = TIGER_SYMBOLS.find(s => s.payout === mult);
        if (config) {
          tigerResult = [config.id, config.id, config.id];
          calculatedTigerWin = TigerPayout;
          winningTigerPos = [0, 1, 2];
        } else if (mult === 5) {
          tigerResult = ['GOLD_TIGER', 'SILVER_TIGER', 'TIGER_PAW'];
          calculatedTigerWin = TigerPayout;
          winningTigerPos = [0, 1, 2];
        } else {
          tigerResult = makeLoseTiger();
        }
      } else {
        tigerResult = makeLoseTiger();
      }

      if (DragonPayout > 0) {
        const mult = DragonPayout / betPerLine;
        const config = DRAGON_SYMBOLS.find(s => s.payout === mult);
        if (config) {
          dragonResult = [config.id, config.id, config.id];
          calculatedDragonWin = DragonPayout;
          winningDragonPos = [0, 1, 2];
        } else if (mult === 5) {
          dragonResult = ['GOLD_DRAGON', 'SILVER_DRAGON', 'DRAGON_PAW'];
          calculatedDragonWin = DragonPayout;
          winningDragonPos = [0, 1, 2];
        } else {
          dragonResult = makeLoseDragon();
        }
      } else {
        dragonResult = makeLoseDragon();
      }
    } else if (tigerActive) {
      const mult = targetPrize / betPerLine;
      const config = TIGER_SYMBOLS.find(s => s.payout === mult);
      if (config) {
        tigerResult = [config.id, config.id, config.id];
        calculatedTigerWin = targetPrize;
        winningTigerPos = [0, 1, 2];
      } else if (mult === 5) {
        tigerResult = ['GOLD_TIGER', 'SILVER_TIGER', 'TIGER_PAW'];
        calculatedTigerWin = targetPrize;
        winningTigerPos = [0, 1, 2];
      } else {
        tigerResult = makeLoseTiger();
      }
      dragonResult = makeLoseDragon();
    } else if (dragonActive) {
      const mult = targetPrize / betPerLine;
      const config = DRAGON_SYMBOLS.find(s => s.payout === mult);
      if (config) {
        dragonResult = [config.id, config.id, config.id];
        calculatedDragonWin = targetPrize;
        winningDragonPos = [0, 1, 2];
      } else if (mult === 5) {
        dragonResult = ['GOLD_DRAGON', 'SILVER_DRAGON', 'DRAGON_PAW'];
        calculatedDragonWin = targetPrize;
        winningDragonPos = [0, 1, 2];
      } else {
        dragonResult = makeLoseDragon();
      }
      tigerResult = makeLoseTiger();
    }
  } else {
    if (tigerActive) {
      if (Math.random() < 0.12) {
        const possible = [...TIGER_SYMBOLS];
        const choice = possible[Math.floor(Math.random() * possible.length)];
        tigerResult = [choice.id, choice.id, choice.id];
        calculatedTigerWin = choice.payout * betPerLine;
        winningTigerPos = [0, 1, 2];
      } else if (Math.random() < 0.25) {
        tigerResult = ['GOLD_TIGER', 'SILVER_TIGER', 'TIGER_PAW'];
        calculatedTigerWin = 5 * betPerLine;
        winningTigerPos = [0, 1, 2];
      } else {
        tigerResult = makeLoseTiger();
      }
    } else {
      tigerResult = makeLoseTiger();
    }

    if (dragonActive) {
      if (Math.random() < 0.12) {
        const possible = [...DRAGON_SYMBOLS];
        const choice = possible[Math.floor(Math.random() * possible.length)];
        dragonResult = [choice.id, choice.id, choice.id];
        calculatedDragonWin = choice.payout * betPerLine;
        winningDragonPos = [0, 1, 2];
      } else if (Math.random() < 0.25) {
        dragonResult = ['GOLD_DRAGON', 'SILVER_DRAGON', 'DRAGON_PAW'];
        calculatedDragonWin = 5 * betPerLine;
        winningDragonPos = [0, 1, 2];
      } else {
        dragonResult = makeLoseDragon();
      }
    } else {
      dragonResult = makeLoseDragon();
    }
  }

  // Double win multiplier
  const bothActive = tigerActive && dragonActive;
  const isBothFullWin = winningTigerPos.length === 3 && winningDragonPos.length === 3;
  const isDoubleWin = bothActive && isBothFullWin;

  let totalWin = calculatedTigerWin + calculatedDragonWin;
  if (isDoubleWin) {
    totalWin *= 2;
  }

  return {
    gameId: 'yakuza-ink',
    targetPrize,
    tigerResult,
    dragonResult,
    calculatedTigerWin,
    calculatedDragonWin,
    totalWin: Math.round(totalWin * 100) / 100,
    isDoubleWin,
    winningTigerPos,
    winningDragonPos,
  };
}

// ----------------------------------------------------
// 3. MYSTIC INK / WILD TATTOO
// ----------------------------------------------------
const MYSTIC_WEIGHTED_SYMBOLS = [
  '10', '10', '10', '10',
  '9', '9', '9', '9',
  'J', 'J', 'J',
  'Q', 'Q', 'Q',
  'K', 'K',
  'A', 'A',
  'SCALES', 'SCALES',
  'POTION',
  'WILD',
  'SCATTER',
];

const MYSTIC_PAYTABLE: Record<string, number[]> = {
  POTION: [0, 0, 0, 1.0, 2.5, 5.0],
  SCALES: [0, 0, 0, 0.8, 2.0, 4.0],
  A: [0, 0, 0, 0.5, 1.5, 3.0],
  K: [0, 0, 0, 0.4, 1.2, 2.5],
  Q: [0, 0, 0, 0.3, 1.0, 2.0],
  J: [0, 0, 0, 0.2, 0.8, 1.5],
  '10': [0, 0, 0, 0.1, 0.5, 1.0],
  '9': [0, 0, 0, 0.1, 0.5, 1.0],
};

const getRandomMultiplier = () => {
  const rand = Math.random();
  if (rand < 0.50) return 2;
  if (rand < 0.75) return 3;
  if (rand < 0.85) return 4;
  if (rand < 0.92) return 5;
  if (rand < 0.96) return 10;
  if (rand < 0.98) return 20;
  if (rand < 0.995) return 50;
  return 100;
};

export function computeMysticInkOutcome(
  targetPrize: number,
  bet: number,
  freeSpins: number,
  freeSpinMultiplier: number,
  isWildTattoo: boolean
): MysticInkResult {
  const ROWS = 3;
  const COLS = 5;

  let finalGrid: string[][] = [];

  if (targetPrize > 0) {
    const symbols = ['POTION', 'SCALES', 'A', 'K', 'Q', 'J', '10', '9'];
    const winSymbol = targetPrize > bet * 10 ? 'POTION' : symbols[Math.floor(Math.random() * symbols.length)];

    finalGrid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => MYSTIC_WEIGHTED_SYMBOLS[Math.floor(Math.random() * MYSTIC_WEIGHTED_SYMBOLS.length)])
    );

    const matchCols = Math.min(5, Math.floor(Math.random() * 3) + 3);
    for (let c = 0; c < matchCols; c++) {
      const r = Math.floor(Math.random() * ROWS);
      finalGrid[r][c] = winSymbol;
    }

    if (Math.random() < 0.25) {
      finalGrid[Math.floor(Math.random() * ROWS)][2] = 'WILD';
    }

    if (Math.random() < 0.1) {
      finalGrid[Math.floor(Math.random() * ROWS)][0] = 'SCATTER';
      finalGrid[Math.floor(Math.random() * ROWS)][2] = 'SCATTER';
      finalGrid[Math.floor(Math.random() * ROWS)][4] = 'SCATTER';
    }
  } else {
    let attempts = 0;
    while (attempts < 10) {
      finalGrid = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => MYSTIC_WEIGHTED_SYMBOLS[Math.floor(Math.random() * MYSTIC_WEIGHTED_SYMBOLS.length)])
      );

      const col0 = finalGrid.map(r => r[0]);
      const col1 = finalGrid.map(r => r[1]);

      let hasWin = false;
      finalGrid.forEach((row, rIdx) => {
        const s = row[2];
        if (col0.includes(s) || col1.includes(s) || s === 'WILD') {
          hasWin = true;
          finalGrid[rIdx][2] = '9';
        }
      });

      if (!hasWin) break;
      attempts++;
    }

    if (Math.random() < 0.08) {
      finalGrid[Math.floor(Math.random() * ROWS)][0] = 'SCATTER';
      finalGrid[Math.floor(Math.random() * ROWS)][3] = 'SCATTER';
    }
  }

  // Top multipliers
  const topMultipliers = Array.from({ length: 5 }, () => getRandomMultiplier());

  // Evaluate win
  let totalWin = 0;
  let newWinningPositions: { r: number; c: number }[] = [];
  let newWinningMults: number[] = [];
  let scatterCount = 0;

  finalGrid.forEach(row => {
    row.forEach(sym => {
      if (sym === 'SCATTER') scatterCount++;
    });
  });

  const wonFreeSpins = scatterCount >= 3;
  const currentMultiplier = freeSpins > 0 ? freeSpinMultiplier : 1;

  Object.keys(MYSTIC_PAYTABLE).forEach(symbol => {
    let ways = 1;
    let matchCount = 0;
    let symbolWinningPositions: { r: number; c: number }[] = [];
    let colsCounts: number[] = [];

    for (let c = 0; c < COLS; c++) {
      let countInCol = 0;
      let colPositions: { r: number; c: number }[] = [];
      for (let r = 0; r < ROWS; r++) {
        if (finalGrid[r][c] === symbol || finalGrid[r][c] === 'WILD') {
          countInCol++;
          colPositions.push({ r, c });
        }
      }

      if (countInCol > 0) {
        colsCounts.push(countInCol);
        ways *= countInCol;
        matchCount++;
        symbolWinningPositions.push(...colPositions);
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const payoutMultiplier = MYSTIC_PAYTABLE[symbol][matchCount];
      if (payoutMultiplier > 0) {
        let multSum = 0;
        for (let c = 0; c < matchCount; c++) {
          if (colsCounts[c] >= 3) {
            multSum += topMultipliers[c];
            if (!newWinningMults.includes(c)) {
              newWinningMults.push(c);
            }
          }
        }

        const finalMult = multSum > 0 ? multSum : 1;
        let winAmount = bet * payoutMultiplier * ways * finalMult * currentMultiplier;

        if (targetPrize > 0) {
          const remainingCap = targetPrize - totalWin;
          if (winAmount > remainingCap) {
            winAmount = Math.max(0, remainingCap);
          }
        }

        totalWin += winAmount;
        symbolWinningPositions.forEach(pos => {
          if (pos.c < matchCount && !newWinningPositions.some(p => p.r === pos.r && p.c === pos.c)) {
            newWinningPositions.push(pos);
          }
        });
      }
    }
  });

  return {
    gameId: isWildTattoo ? 'wild-tattoo' : 'mystic-ink',
    targetPrize,
    finalGrid,
    totalWin: Math.round(totalWin * 100) / 100,
    winningPositions: newWinningPositions,
    winningMults: newWinningMults,
    scatterCount,
    wonFreeSpins,
    topMultipliers,
  };
}

// ----------------------------------------------------
// 4. CALAVERA INK
// ----------------------------------------------------
const CALAVERA_WEIGHTED_SYMBOLS = [
  '10', '10', '10', '10',
  'J', 'J', 'J',
  'Q', 'Q', 'Q',
  'K', 'K',
  'A', 'A',
  'MARACAS', 'MARACAS',
  'GUITAR', 'GUITAR',
  'TEQUILA',
  'GUN',
  'SKULL',
  'SCATTER',
];

export function computeCalaveraInkOutcome(
  targetPrize: number,
  activeBet: number,
  freeSpinsActive: boolean,
  freeSpinsMultiplier: number
): CalaveraInkResult {
  const ROWS = 4;
  const COLS = 5;

  let finalGrid: string[][] = [];

  if (targetPrize > 0) {
    const highSyms = ['SKULL', 'GUN', 'TEQUILA', 'GUITAR', 'MARACAS'];
    const winSym = targetPrize > activeBet * 5 ? 'SKULL' : highSyms[Math.floor(Math.random() * highSyms.length)];

    finalGrid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => CALAVERA_WEIGHTED_SYMBOLS[Math.floor(Math.random() * CALAVERA_WEIGHTED_SYMBOLS.length)])
    );

    const matchCols = Math.min(5, Math.floor(Math.random() * 2) + 3);
    for (let c = 0; c < matchCols; c++) {
      const r = Math.floor(Math.random() * ROWS);
      finalGrid[r][c] = winSym;
    }

    if (Math.random() < 0.25) {
      finalGrid[Math.floor(Math.random() * ROWS)][2] = 'WILD';
    }
  } else {
    let attempts = 0;
    while (attempts < 10) {
      finalGrid = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => CALAVERA_WEIGHTED_SYMBOLS[Math.floor(Math.random() * CALAVERA_WEIGHTED_SYMBOLS.length)])
      );

      const col0 = finalGrid.map(r => r[0]);
      const col1 = finalGrid.map(r => r[1]);

      let hasWin = false;
      finalGrid.forEach((row, rIdx) => {
        const s = row[2];
        if (col0.includes(s) || col1.includes(s) || s === 'WILD') {
          hasWin = true;
          finalGrid[rIdx][2] = '10';
        }
      });

      if (!hasWin) break;
      attempts++;
    }
  }

  // Generate golden frames on reels 2, 3, 4
  const goldenFrames: string[] = [];
  for (let c = 1; c <= 3; c++) {
    if (Math.random() < 0.5) {
      const r = Math.floor(Math.random() * ROWS);
      goldenFrames.push(`${r}_${c}`);
    }
  }

  let scatterCount = 0;
  finalGrid.forEach(row => {
    row.forEach(s => {
      if (s === 'SCATTER') scatterCount++;
    });
  });

  return {
    gameId: 'calavera-ink',
    targetPrize,
    finalGrid,
    goldenFrames,
    initialWin: targetPrize,
    winningPositions: [],
    scatterCount,
    wonFreeSpins: scatterCount >= 3,
  };
}

// ----------------------------------------------------
// 5. TATTOO CASH
// ----------------------------------------------------
const CASH_VALUES = [0.5, 1, 2, 5, 10, 50, 100];
const MULTIPLIERS = [2, 3, 5, 10, 50, 100];

const generateLeftNotes = (bet: number) => [
  { id: 'l1', type: 'cash', value: 0.5, label: `R$ ${(bet * 0.5).toFixed(2)}`, color: 'from-blue-600/90 to-cyan-500/90', artType: 'skull' },
  { id: 'l2', type: 'cash', value: 1, label: `R$ ${(bet * 1).toFixed(2)}`, color: 'from-emerald-600/90 to-teal-500/90', artType: 'rose' },
  { id: 'l3', type: 'cash', value: 2, label: `R$ ${(bet * 2).toFixed(2)}`, color: 'from-purple-600/90 to-indigo-500/90', artType: 'tiger' },
  { id: 'l4', type: 'cash', value: 5, label: `R$ ${(bet * 5).toFixed(2)}`, color: 'from-amber-600/90 to-orange-500/90', artType: 'dragon' },
  { id: 'l5', type: 'cash', value: 10, label: `R$ ${(bet * 10).toFixed(2)}`, color: 'from-rose-600/90 to-pink-500/90', artType: 'machine' },
  { id: 'l6', type: 'cash', value: 50, label: `R$ ${(bet * 50).toFixed(2)}`, color: 'from-yellow-500 to-amber-500', artType: 'adriano' },
  { id: 'l7', type: 'cash', value: 100, label: `R$ ${(bet * 100).toFixed(2)}`, color: 'from-fuchsia-600 to-rose-500', artType: 'adriano' },
];

const generateRightNotes = (bet: number) => [
  { id: 'r1', type: 'cash', value: 0.5, label: `R$ ${(bet * 0.5).toFixed(2)}`, color: 'from-blue-600/90 to-cyan-500/90', artType: 'skull' },
  { id: 'r2', type: 'cash', value: 2, label: `R$ ${(bet * 2).toFixed(2)}`, color: 'from-purple-600/90 to-indigo-500/90', artType: 'tiger' },
  { id: 'r3', type: 'multiplier', value: 2, label: 'x2', color: 'from-orange-500 to-red-600', artType: 'dragon' },
  { id: 'r4', type: 'multiplier', value: 5, label: 'x5', color: 'from-amber-500 to-orange-600', artType: 'rose' },
  { id: 'r5', type: 'multiplier', value: 10, label: 'x10', color: 'from-yellow-400 to-amber-500', artType: 'machine' },
  { id: 'r6', type: 'multiplier', value: 100, label: 'x100', color: 'from-pink-500 to-rose-600', artType: 'adriano' },
];

const CENTER_ACTIVATORS = [
  { id: 'c1', type: 'activator', value: 1, label: 'PAGUE COIN', color: 'from-yellow-400 via-amber-400 to-yellow-600', artType: 'machine' },
  { id: 'c2', type: 'free_spins', value: 5, label: '5 FREE SPINS', color: 'from-teal-400 via-emerald-400 to-teal-600', artType: 'adriano' },
  { id: 'c3', type: 'blank', value: 0, label: 'TATUAGEM', color: 'from-neutral-800 to-neutral-750', artType: 'skull' },
  { id: 'c4', type: 'blank', value: 0, label: 'ROSAS', color: 'from-neutral-800 to-neutral-750', artType: 'rose' },
];

export function computeTattooCashOutcome(
  targetPrize: number,
  bet: number,
  freeSpins: number
): TattooCashResult {
  const leftOpts = generateLeftNotes(bet);
  const rightOpts = generateRightNotes(bet);

  let finalLeft: any;
  let finalCenter: any;
  let finalRight: any;
  let isWin = false;
  let winAmount = 0;
  let freeSpinsWon = 0;

  if (targetPrize > 0) {
    finalCenter = CENTER_ACTIVATORS[0]; // Activator
    isWin = true;

    const targetMult = targetPrize / bet;
    const multOpt = rightOpts.find(r => r.type === 'multiplier' && r.value > 1 && leftOpts.some(l => l.value * r.value === targetMult));
    
    if (multOpt) {
      finalRight = multOpt;
      finalLeft = leftOpts.find(l => l.value * multOpt.value === targetMult) || leftOpts[0];
      winAmount = finalLeft.value * finalRight.value * bet;
    } else {
      const sumMatch = leftOpts.find(l => rightOpts.some(r => r.type === 'cash' && l.value + r.value === targetMult));
      if (sumMatch) {
        finalLeft = sumMatch;
        finalRight = rightOpts.find(r => r.type === 'cash' && sumMatch.value + r.value === targetMult);
        winAmount = (finalLeft.value + finalRight.value) * bet;
      } else {
        finalLeft = leftOpts[0];
        finalRight = rightOpts[0];
        winAmount = (finalLeft.value + finalRight.value) * bet;
      }
    }

    if (targetPrize > 0 && winAmount > targetPrize) {
      winAmount = targetPrize;
    }
  } else {
    // Non-winning spin or tiny random
    finalCenter = CENTER_ACTIVATORS[2 + Math.floor(Math.random() * 2)];
    finalLeft = leftOpts[Math.floor(Math.random() * leftOpts.length)];
    finalRight = rightOpts[Math.floor(Math.random() * rightOpts.length)];
  }

  const getRandomNote = (reel: 'left' | 'center' | 'right') => {
    if (reel === 'left') return leftOpts[Math.floor(Math.random() * leftOpts.length)];
    if (reel === 'right') return rightOpts[Math.floor(Math.random() * rightOpts.length)];
    return CENTER_ACTIVATORS[Math.floor(Math.random() * CENTER_ACTIVATORS.length)];
  };

  return {
    gameId: 'tattoo-cash',
    targetPrize,
    finalLeft,
    finalCenter,
    finalRight,
    reelLeft: [getRandomNote('left'), finalLeft, getRandomNote('left')],
    reelCenter: [getRandomNote('center'), finalCenter, getRandomNote('center')],
    reelRight: [getRandomNote('right'), finalRight, getRandomNote('right')],
    isWin,
    winAmount: Math.round(winAmount * 100) / 100,
    freeSpinsWon,
  };
}

// ----------------------------------------------------
// 6. ROULETTA INK
// ----------------------------------------------------
const WHEEL_SLICES = [
  { id: 0, label: 'JACKPOT', value: 1000, color: 'from-[#f59e0b] to-[#b45309]', textColor: '#ffffff', subText: '1000x' },
  { id: 1, label: 'QUASE!', value: 0.5, color: 'from-[#334155] to-[#1e293b]', textColor: '#94a3b8', subText: '0.5x' },
  { id: 2, label: 'REGULAR', value: 10, color: 'from-[#3b82f6] to-[#1d4ed8]', textColor: '#ffffff', subText: '10x' },
  { id: 3, label: 'SALVO!', value: 2, color: 'from-[#10b981] to-[#047857]', textColor: '#ffffff', subText: '2x' },
  { id: 4, label: 'SUPER WIN', value: 50, color: 'from-[#8b5cf6] to-[#5b21b6]', textColor: '#ffffff', subText: '50x' },
  { id: 5, label: 'NADA', value: 0, color: 'from-[#0f172a] to-[#020617]', textColor: '#475569', subText: '0x' },
  { id: 6, label: 'MINI', value: 5, color: 'from-[#06b6d4] to-[#0891b2]', textColor: '#ffffff', subText: '5x' },
  { id: 7, label: 'BIG WIN', value: 100, color: 'from-[#f97316] to-[#c2410c]', textColor: '#ffffff', subText: '100x' },
  { id: 8, label: 'IPHONE 15', value: 500, color: 'from-[#ec4899] to-[#9d174d]', textColor: '#ffffff', subText: 'BÔNUS', isIphone: true },
  { id: 9, label: 'NADA', value: 0, color: 'from-[#0f172a] to-[#020617]', textColor: '#475569', subText: '0x' },
  { id: 10, label: 'BOOST', value: 20, color: 'from-[#10b981] to-[#064e3b]', textColor: '#ffffff', subText: '20x' },
  { id: 11, label: 'QUASE!', value: 0.1, color: 'from-[#334155] to-[#1e293b]', textColor: '#64748b', subText: '0.1x' },
  { id: 12, label: 'MEGA WIN', value: 250, color: 'from-[#6366f1] to-[#3730a3]', textColor: '#ffffff', subText: '250x' },
  { id: 13, label: 'NADA', value: 0, color: 'from-[#0f172a] to-[#020617]', textColor: '#475569', subText: '0x' },
  { id: 14, label: 'PLUS', value: 15, color: 'from-[#14b8a6] to-[#0f766e]', textColor: '#ffffff', subText: '15x' },
  { id: 15, label: 'EPIC WIN', value: 500, color: 'from-[#f43f5e] to-[#9f1239]', textColor: '#ffffff', subText: '500x' }
];

export function computeRoulettaInkOutcome(
  targetPrize: number,
  bet: number,
  isFeverActive: boolean
): RoulettaInkResult {
  let targetMultiplier = targetPrize / bet;
  if (isFeverActive) {
    targetMultiplier = targetMultiplier / 1.5;
  }

  let targetSliceIndex = 5; // Default NADA
  let minDiff = Infinity;

  WHEEL_SLICES.forEach((slice, idx) => {
    const diff = Math.abs(slice.value - targetMultiplier);
    if (diff < minDiff) {
      minDiff = diff;
      targetSliceIndex = idx;
    }
  });

  const targetSlice = WHEEL_SLICES[targetSliceIndex];
  let actualPayout = targetSlice.value * bet;
  if (isFeverActive && actualPayout > 0) {
    actualPayout = Math.round(actualPayout * 1.5 * 10) / 10;
  }

  return {
    gameId: 'rouletta-ink',
    targetPrize,
    targetSliceIndex,
    targetSlice,
    actualPayout: Math.round(actualPayout * 100) / 100,
    isBigWin: actualPayout >= bet * 20,
  };
}

// ----------------------------------------------------
// 7. INK REVEAL (SCRATCH CARD)
// ----------------------------------------------------
const REVEAL_SYMBOLS = [
  { id: 'crown', label: 'COROA' },
  { id: 'rose', label: 'ROSA' },
  { id: 'skull', label: 'CAVEIRA' },
  { id: 'heart', label: 'CORAÇÃO' },
  { id: 'dagger', label: 'PUNHAL' },
  { id: 'diamond', label: 'DIAMANTE' },
  { id: 'star', label: 'ESTRELA' },
  { id: 'anchor', label: 'ÂNCORA' }
];

export function computeInkRevealOutcome(
  wonAmount: number,
  bet: number
): InkRevealResult {
  const chosenCells: any[] = [];

  if (wonAmount > 0) {
    const winningSymbol = wonAmount >= bet * 10 
      ? REVEAL_SYMBOLS[0] 
      : REVEAL_SYMBOLS[Math.floor(Math.random() * REVEAL_SYMBOLS.length)];

    const allIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = allIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }
    const winningIndices = allIndices.slice(0, 3);

    for (let i = 0; i < 9; i++) {
      if (winningIndices.includes(i)) {
        chosenCells.push({
          id: i,
          symbolId: winningSymbol.id,
          revealed: false,
          isWinning: true,
          prizeLabel: `R$ ${wonAmount.toFixed(2)}`
        });
      } else {
        let randomSymbol = REVEAL_SYMBOLS[Math.floor(Math.random() * REVEAL_SYMBOLS.length)];
        while (randomSymbol.id === winningSymbol.id) {
          randomSymbol = REVEAL_SYMBOLS[Math.floor(Math.random() * REVEAL_SYMBOLS.length)];
        }
        chosenCells.push({
          id: i,
          symbolId: randomSymbol.id,
          revealed: false,
          isWinning: false,
          prizeLabel: `R$ ${(bet * (0.5 + Math.random() * 2)).toFixed(2)}`
        });
      }
    }
  } else {
    const symbolPool: any[] = [];
    REVEAL_SYMBOLS.forEach(s => {
      symbolPool.push(s);
      symbolPool.push(s);
    });

    for (let i = symbolPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [symbolPool[i], symbolPool[j]] = [symbolPool[j], symbolPool[i]];
    }

    for (let i = 0; i < 9; i++) {
      chosenCells.push({
        id: i,
        symbolId: symbolPool[i].id,
        revealed: false,
        isWinning: false,
        prizeLabel: `R$ ${(bet * (0.1 + Math.random() * 1.5)).toFixed(2)}`
      });
    }
  }

  return {
    gameId: 'ink-reveal',
    targetPrize: wonAmount,
    wonAmount: Math.round(wonAmount * 100) / 100,
    grid: chosenCells,
  };
}

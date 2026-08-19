import { PrizeService } from './prizeService';

export interface SlotSpinBackendRequest {
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
}

export interface TattooSlotSpinResponse {
  gameId: 'tattoo-slot';
  targetPrize: number;
  finalGrid: string[][];
  totalWin: number;
  winningPositions: { r: number; c: number }[];
  scatterCount: number;
  freeSpinsWon: number;
  newMultiplier?: number;
}

export interface YakuzaInkSpinResponse {
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

export interface MysticInkSpinResponse {
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

export interface CalaveraInkSpinResponse {
  gameId: 'calavera-ink';
  targetPrize: number;
  finalGrid: string[][];
  goldenFrames: string[];
  initialWin: number;
  winningPositions: { r: number; c: number }[];
  scatterCount: number;
  wonFreeSpins: boolean;
}

export interface TattooCashSpinResponse {
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

export interface RoulettaInkSpinResponse {
  gameId: 'rouletta-ink';
  targetPrize: number;
  targetSliceIndex: number;
  targetSlice: any;
  actualPayout: number;
  isBigWin: boolean;
}

export interface InkRevealSpinResponse {
  gameId: 'ink-reveal';
  targetPrize: number;
  wonAmount: number;
  grid: any[];
}

export class SlotService {
  /**
   * Authoritative backend spin calculation for all games.
   * Calculates the exact probability and result on the server for zero client delay and optimal synchronization.
   */
  static async requestSpin(params: SlotSpinBackendRequest): Promise<any> {
    try {
      const response = await fetch('/api/slots/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Backend slot spin fetch failed, falling back to client fallback:', e);
    }

    // Fallback if backend is unreachable
    return this.fallback(params);
  }

  private static async fallback(params: SlotSpinBackendRequest): Promise<any> {
    let target = 0;
    if (params.userId) {
      try {
        const category = params.gameId === 'rouletta-ink' ? 'roletas' : 'slots';
        const p = await PrizeService.getTargetPrize(params.userId, category);
        target = p.amount;
      } catch {}
    }

    if (params.gameId === 'tattoo-slot') {
      return {
        gameId: 'tattoo-slot',
        targetPrize: target,
        finalGrid: [
          ['10', 'J', 'Q', 'K', 'A'],
          ['J', 'Q', 'K', 'A', '10'],
          ['Q', 'K', 'A', '10', 'J'],
          ['K', 'A', '10', 'J', 'Q'],
        ],
        totalWin: 0,
        winningPositions: [],
        scatterCount: 0,
        freeSpinsWon: 0,
      };
    }

    if (params.gameId === 'yakuza-ink') {
      return {
        gameId: 'yakuza-ink',
        targetPrize: target,
        tigerResult: ['KATANA', 'TIGER_PAW', 'KATANA'],
        dragonResult: ['KATANA', 'DRAGON_PAW', 'KATANA'],
        calculatedTigerWin: 0,
        calculatedDragonWin: 0,
        totalWin: 0,
        isDoubleWin: false,
        winningTigerPos: [],
        winningDragonPos: [],
      };
    }

    if (params.gameId === 'mystic-ink' || params.gameId === 'wild-tattoo') {
      return {
        gameId: params.gameId,
        targetPrize: target,
        finalGrid: [
          ['10', 'J', 'Q', 'K', 'A'],
          ['J', 'Q', 'K', 'A', '10'],
          ['Q', 'K', 'A', '10', 'J'],
        ],
        totalWin: 0,
        winningPositions: [],
        winningMults: [],
        scatterCount: 0,
        wonFreeSpins: false,
        topMultipliers: [2, 2, 2, 2, 2],
      };
    }

    if (params.gameId === 'calavera-ink') {
      return {
        gameId: 'calavera-ink',
        targetPrize: target,
        finalGrid: [
          ['10', 'J', 'Q', 'K', 'A'],
          ['J', 'Q', 'K', 'A', '10'],
          ['Q', 'K', 'A', '10', 'J'],
          ['K', 'A', '10', 'J', 'Q'],
        ],
        goldenFrames: [],
        initialWin: 0,
        winningPositions: [],
        scatterCount: 0,
        wonFreeSpins: false,
      };
    }

    if (params.gameId === 'tattoo-cash') {
      return {
        gameId: 'tattoo-cash',
        targetPrize: target,
        finalLeft: { id: 'l1', type: 'cash', value: 0.5, label: 'R$ 0.50', color: 'from-blue-600/90 to-cyan-500/90' },
        finalCenter: { id: 'c3', type: 'blank', value: 0, label: 'TATUAGEM', color: 'from-neutral-800 to-neutral-750' },
        finalRight: { id: 'r1', type: 'cash', value: 0.5, label: 'R$ 0.50', color: 'from-blue-600/90 to-cyan-500/90' },
        reelLeft: [],
        reelCenter: [],
        reelRight: [],
        isWin: false,
        winAmount: 0,
        freeSpinsWon: 0,
      };
    }

    if (params.gameId === 'rouletta-ink') {
      return {
        gameId: 'rouletta-ink',
        targetPrize: target,
        targetSliceIndex: 5,
        targetSlice: { id: 5, label: 'NADA', value: 0 },
        actualPayout: 0,
        isBigWin: false,
      };
    }

    if (params.gameId === 'ink-reveal') {
      return {
        gameId: 'ink-reveal',
        targetPrize: target,
        wonAmount: 0,
        grid: [],
      };
    }

    return { success: true, targetPrize: target };
  }
}

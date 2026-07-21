import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import { db } from '../../data/db';
import { PrizeService } from '../../services/prizeService';
import { ArrowLeft, Info, Coins, Zap, Minus, Plus, RefreshCw, Volume2, VolumeX, Flame } from 'lucide-react';
import { GameLoader } from '../../components/GameLoader';

// Symbol structures
interface SymbolConfig {
  id: string;
  name: string;
  tier: 'gold' | 'silver' | 'bronze' | 'neutral';
  payout: number; // Multiplier of line bet
}

const TIGER_SYMBOLS: SymbolConfig[] = [
  { id: 'GOLD_TIGER', name: 'Tigre de Ouro', tier: 'gold', payout: 100 },
  { id: 'SILVER_TIGER', name: 'Tigre de Prata', tier: 'silver', payout: 50 },
  { id: 'TIGER_PAW', name: 'Pata do Tigre', tier: 'bronze', payout: 25 },
  { id: 'KATANA', name: 'Espada Katana', tier: 'neutral', payout: 10 },
];

const DRAGON_SYMBOLS: SymbolConfig[] = [
  { id: 'GOLD_DRAGON', name: 'Dragão de Ouro', tier: 'gold', payout: 100 },
  { id: 'SILVER_DRAGON', name: 'Dragão de Prata', tier: 'silver', payout: 50 },
  { id: 'DRAGON_PAW', name: 'Garra do Dragão', tier: 'bronze', payout: 25 },
  { id: 'KATANA', name: 'Espada Katana', tier: 'neutral', payout: 10 },
];

// Helper to render high-quality SVGs for Tiger/Dragon/Katana symbols
const renderYakuzaSymbol = (id: string, isWinning: boolean = false) => {
  const glow = isWinning ? 'drop-shadow-[0_0_15px_rgba(234,179,8,0.95)] scale-110' : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]';
  const containerClass = "flex items-center justify-center w-full h-full p-1 relative transition-all duration-300";

  switch (id) {
    case 'GOLD_TIGER':
      return (
        <div className={`${containerClass} ${glow}`} id="sym-gold-tiger">
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="goldTigerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE875" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <radialGradient id="goldTigerEye" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#7F1D1D" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.3)" strokeWidth="1.5" />
            {/* Tiger Face Silhouette */}
            <path d="M 18 30 C 22 20 35 15 50 15 C 65 15 78 20 82 30 C 85 40 82 60 72 75 C 65 83 58 85 50 85 C 42 85 35 83 28 75 C 18 60 15 40 18 30 Z" fill="url(#goldTigerGrad)" stroke="#000" strokeWidth="2.5" />
            {/* Stripes */}
            <path d="M 50 18 L 50 32 M 45 18 L 47 28 M 55 18 L 53 28 M 22 36 L 36 38 M 78 36 L 64 38 M 20 48 L 32 46 M 80 48 L 68 46" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            {/* Eyes */}
            <polygon points="32,42 42,44 40,48" fill="url(#goldTigerEye)" stroke="#000" strokeWidth="1" />
            <polygon points="68,42 58,44 60,48" fill="url(#goldTigerEye)" stroke="#000" strokeWidth="1" />
            {/* Snout & Mouth */}
            <path d="M 42 55 C 45 50 55 50 58 55 C 62 64 58 72 50 72 C 42 72 38 64 42 55 Z" fill="#1e1b4b" stroke="#000" strokeWidth="1.5" />
            <path d="M 44 64 C 47 68 53 68 56 64" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            {/* Golden Whiskers */}
            <path d="M 38 58 C 22 55 12 60 10 65 M 38 61 C 20 62 12 70 8 75 M 62 58 C 78 55 88 60 90 65 M 62 61 C 80 62 88 70 92 75" fill="none" stroke="#FFF" strokeWidth="1" strokeLinecap="round" />
            {/* Roar Aura */}
            <path d="M 50 72 L 46 80 L 54 80 Z" fill="#EF4444" />
          </svg>
        </div>
      );

    case 'SILVER_TIGER':
      return (
        <div className={`${containerClass} ${glow}`} id="sym-silver-tiger">
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="silverTigerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <radialGradient id="silverTigerEye" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0891B2" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="rgba(148,163,184,0.08)" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
            {/* Tiger Face Silhouette */}
            <path d="M 18 30 C 22 20 35 15 50 15 C 65 15 78 20 82 30 C 85 40 82 60 72 75 C 65 83 58 85 50 85 C 42 85 35 83 28 75 C 18 60 15 40 18 30 Z" fill="url(#silverTigerGrad)" stroke="#000" strokeWidth="2.5" />
            {/* Stripes */}
            <path d="M 50 18 L 50 32 M 45 18 L 47 28 M 55 18 L 53 28 M 22 36 L 36 38 M 78 36 L 64 38" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            {/* Eyes */}
            <polygon points="32,42 42,44 40,48" fill="url(#silverTigerEye)" stroke="#000" strokeWidth="1" />
            <polygon points="68,42 58,44 60,48" fill="url(#silverTigerEye)" stroke="#000" strokeWidth="1" />
            <path d="M 42 55 C 45 50 55 50 58 55" fill="none" stroke="#000" strokeWidth="2" />
          </svg>
        </div>
      );

    case 'TIGER_PAW':
      return (
        <div className={`${containerClass} ${glow}`} id="sym-tiger-paw">
          <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
            <defs>
              <linearGradient id="bronzePawGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#CD7F32" />
                <stop offset="100%" stopColor="#5C2E0B" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(205,127,50,0.3)" strokeWidth="2" strokeDasharray="4 4" />
            {/* Center Pad */}
            <path d="M 32 60 C 32 45 42 42 50 42 C 58 42 68 45 68 60 C 68 75 58 80 50 80 C 42 80 32 75 32 60 Z" fill="url(#bronzePawGrad)" stroke="#000" strokeWidth="2" />
            {/* Small Pads */}
            <circle cx="28" cy="38" r="8" fill="url(#bronzePawGrad)" stroke="#000" strokeWidth="1.5" />
            <circle cx="42" cy="25" r="9" fill="url(#bronzePawGrad)" stroke="#000" strokeWidth="1.5" />
            <circle cx="58" cy="25" r="9" fill="url(#bronzePawGrad)" stroke="#000" strokeWidth="1.5" />
            <circle cx="72" cy="38" r="8" fill="url(#bronzePawGrad)" stroke="#000" strokeWidth="1.5" />
            {/* Claw marks */}
            <path d="M 28 24 L 26 14 M 42 12 L 42 4 M 58 12 L 58 4 M 72 24 L 74 14" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'GOLD_DRAGON':
      return (
        <div className={`${containerClass} ${glow}`} id="sym-gold-dragon">
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="goldDragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FCD34D" />
                <stop offset="50%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <radialGradient id="goldDragonEye" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#9D174D" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="rgba(217,119,6,0.08)" stroke="rgba(217,119,6,0.3)" strokeWidth="1.5" />
            {/* Dragon Head */}
            <path d="M 24 35 C 24 15 40 10 50 10 C 60 10 76 15 76 35 C 76 45 74 55 68 70 C 62 82 56 86 50 86 C 44 86 38 82 32 70 C 26 55 24 45 24 35 Z" fill="url(#goldDragonGrad)" stroke="#000" strokeWidth="2.5" />
            {/* Horns */}
            <path d="M 32 18 C 22 5 12 10 14 2 M 68 18 C 78 5 88 10 86 2" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
            {/* Whiskers */}
            <path d="M 38 65 C 22 75 14 62 10 58 M 62 65 C 78 75 86 62 90 58" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
            {/* Eyes */}
            <path d="M 34 38 Q 42 35 44 42 Q 38 45 34 38 Z" fill="url(#goldDragonEye)" stroke="#000" strokeWidth="1.5" />
            <path d="M 66 38 Q 58 35 56 42 Q 62 45 66 38 Z" fill="url(#goldDragonEye)" stroke="#000" strokeWidth="1.5" />
            {/* Dragon Nose & Teeth */}
            <path d="M 44 52 L 50 58 L 56 52" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <path d="M 40 58 L 44 64 L 46 58 M 60 58 L 56 64 L 54 58" fill="#FFF" stroke="#000" strokeWidth="1.5" />
          </svg>
        </div>
      );

    case 'SILVER_DRAGON':
      return (
        <div className={`${containerClass} ${glow}`} id="sym-silver-dragon">
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="silverDragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              <radialGradient id="silverDragonEye" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#BE185D" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="rgba(203,213,225,0.08)" stroke="rgba(203,213,225,0.3)" strokeWidth="1.5" />
            {/* Dragon Head */}
            <path d="M 24 35 C 24 15 40 10 50 10 C 60 10 76 15 76 35 C 76 45 74 55 68 70 C 62 82 56 86 50 86 C 44 86 38 82 32 70 C 26 55 24 45 24 35 Z" fill="url(#silverDragonGrad)" stroke="#000" strokeWidth="2.5" />
            {/* Eyes */}
            <path d="M 34 38 Q 42 35 44 42 Q 38 45 34 38 Z" fill="url(#silverDragonEye)" stroke="#000" strokeWidth="1.5" />
            <path d="M 66 38 Q 58 35 56 42 Q 62 45 66 38 Z" fill="url(#silverDragonEye)" stroke="#000" strokeWidth="1.5" />
          </svg>
        </div>
      );

    case 'DRAGON_PAW':
      return (
        <div className={`${containerClass} ${glow}`} id="sym-dragon-paw">
          <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
            <defs>
              <linearGradient id="bronzeDragonPawGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#451A03" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(217,119,6,0.3)" strokeWidth="2" strokeDasharray="4 4" />
            {/* Sharp claws (Dragon features are 3 sharp points) */}
            <path d="M 30 75 Q 50 45 42 22 Q 40 14 36 8" fill="none" stroke="url(#bronzeDragonPawGrad)" strokeWidth="6" strokeLinecap="round" />
            <path d="M 50 75 Q 50 35 50 16 Q 50 8 50 2" fill="none" stroke="url(#bronzeDragonPawGrad)" strokeWidth="6" strokeLinecap="round" />
            <path d="M 70 75 Q 50 45 58 22 Q 60 14 64 8" fill="none" stroke="url(#bronzeDragonPawGrad)" strokeWidth="6" strokeLinecap="round" />
            <circle cx="50" cy="65" r="12" fill="url(#bronzeDragonPawGrad)" stroke="#000" strokeWidth="2" />
          </svg>
        </div>
      );

    case 'KATANA':
      return (
        <div className={`${containerClass} ${glow}`} id="sym-katana">
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="katanaBlade" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="50%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="katanaRay" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#katanaRay)" strokeWidth="1.5" />
            {/* Neon Background Ray */}
            <line x1="15" y1="85" x2="85" y2="15" stroke="url(#katanaRay)" strokeWidth="8" strokeLinecap="round" className="opacity-40 blur-[2px]" />
            <line x1="15" y1="85" x2="85" y2="15" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
            {/* Sword Blade */}
            <path d="M 24 76 L 76 24 C 77 23 79 23 80 24 L 81 25 C 82 26 82 28 81 29 L 29 81 Z" fill="url(#katanaBlade)" stroke="#000" strokeWidth="1" />
            {/* Hilt Guard (Tsuba) */}
            <circle cx="36" cy="64" r="7" fill="#F59E0B" stroke="#000" strokeWidth="1.5" />
            {/* Handle (Tsuka) */}
            <path d="M 36 64 L 18 82 C 16 84 14 84 13 83 L 11 81 C 10 80 10 78 12 76 L 30 58 Z" fill="#78350F" stroke="#000" strokeWidth="1.5" />
            {/* Handle wrap details */}
            <line x1="28" y1="72" x2="32" y2="68" stroke="#F59E0B" strokeWidth="2" />
            <line x1="22" y1="78" x2="26" y2="74" stroke="#F59E0B" strokeWidth="2" />
          </svg>
        </div>
      );

    default:
      return null;
  }
};

export function YakuzaInk() {
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  const { playSfx, playGameMusic, stopGameMusic } = useAudio();

  // Screen/Game Loader
  const [loading, setLoading] = useState(true);

  // Reels active toggles
  const [tigerActive, setTigerActive] = useState(true);
  const [dragonActive, setDragonActive] = useState(true);

  // Slot States
  const [isSpinning, setIsSpinning] = useState(false);
  const [isTurbo, setIsTurbo] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  // Selected single bet (Bet per active line)
  const [betPerLine, setBetPerLine] = useState(1.00);
  const bets = [0.10, 0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00];

  // Active Total Bet
  const linesCount = (tigerActive ? 1 : 0) + (dragonActive ? 1 : 0);
  const totalBet = betPerLine * (linesCount || 1);

  // Reel states (3 symbols per screen)
  const [tigerReels, setTigerReels] = useState<string[]>(['TIGER_PAW', 'TIGER_PAW', 'TIGER_PAW']);
  const [dragonReels, setDragonReels] = useState<string[]>(['DRAGON_PAW', 'DRAGON_PAW', 'DRAGON_PAW']);

  // Reel spin columns states (to simulate progressive stopping)
  const [spinningTiger, setSpinningTiger] = useState<boolean[]>([false, false, false]);
  const [spinningDragon, setSpinningDragon] = useState<boolean[]>([false, false, false]);

  // Winning results
  const [tigerWinAmount, setTigerWinAmount] = useState(0);
  const [dragonWinAmount, setDragonWinAmount] = useState(0);
  const [isDoubleWin, setIsDoubleWin] = useState(false); // Both reels won with x2 multiplier
  const [totalWin, setTotalWin] = useState(0);

  // Highlighting winning lines
  const [winningTigerPositions, setWinningTigerPositions] = useState<number[]>([]);
  const [winningDragonPositions, setWinningDragonPositions] = useState<number[]>([]);

  // Sound, info & auto intervals
  const [soundMuted, setSoundMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const autoPlayRef = useRef(autoPlay);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  // Load and play Yakuza themed background music
  useEffect(() => {
    const fetchMusic = async () => {
      const g = await db.getGame('yakuza-ink');
      if (g && g.bgMusic) {
        playGameMusic(g.bgMusic);
      }
    };
    fetchMusic();
    return () => {
      stopGameMusic();
    };
  }, []);

  // Helper to change single bet per line
  const adjustBet = (direction: 'up' | 'down') => {
    if (isSpinning) return;
    playSfx('click');
    const idx = bets.indexOf(betPerLine);
    if (direction === 'up' && idx < bets.length - 1) {
      setBetPerLine(bets[idx + 1]);
    } else if (direction === 'down' && idx > 0) {
      setBetPerLine(bets[idx - 1]);
    }
  };

  // Toggle Tiger active status
  const toggleTiger = () => {
    if (isSpinning) return;
    playSfx('click');
    if (tigerActive && !dragonActive) {
      // Must keep at least one active
      setDragonActive(true);
    }
    setTigerActive(!tigerActive);
  };

  // Toggle Dragon active status
  const toggleDragon = () => {
    if (isSpinning) return;
    playSfx('click');
    if (dragonActive && !tigerActive) {
      // Must keep at least one active
      setTigerActive(true);
    }
    setDragonActive(!dragonActive);
  };

  // Main Spinning function
  const spin = async () => {
    if (isSpinning) return;
    
    if (!user || user.balance < totalBet) {
      setAutoPlay(false);
      alert('Saldo insuficiente para realizar a aposta.');
      return;
    }

    // Start Spin Routine
    setIsSpinning(true);
    setTigerWinAmount(0);
    setDragonWinAmount(0);
    setTotalWin(0);
    setIsDoubleWin(false);
    setWinningTigerPositions([]);
    setWinningDragonPositions([]);

    // Deduct Balance
    await updateBalance(-totalBet, 'bet', 'yakuza-ink', { bet: totalBet });
    playSfx('spin');

    // Retrieve Target Prize
    let currentTarget = 0;
    try {
      if (user) {
        const { amount } = await PrizeService.getTargetPrize(user.id, 'slots');
        currentTarget = amount;
      }
    } catch (err) {
      console.error("Error retrieving target prize:", err);
    }

    // Determine outcomes for Tiger and Dragon
    let tigerResult: string[] = [];
    let dragonResult: string[] = [];

    let calculatedTigerWin = 0;
    let calculatedDragonWin = 0;
    let winningTigerPos: number[] = [];
    let winningDragonPos: number[] = [];

    // Helper to generate a losing layout
    const makeLoseTiger = () => {
      const syms = [...TIGER_SYMBOLS];
      // Shuffle and pick 3 different ones to ensure no 3-of-a-kind, and no mixed heads/paws if possible
      const list = [
        syms[Math.floor(Math.random() * syms.length)].id,
        syms[Math.floor(Math.random() * syms.length)].id,
        syms[Math.floor(Math.random() * syms.length)].id,
      ];
      // Ensure no 3 matching
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

    // If there is a target prize to distribute
    if (currentTarget > 0) {
      // Check which reels are active
      if (tigerActive && dragonActive) {
        // Double wins active! If target prize >= 10x single bet, we can make BOTH reels win (with x2 multiplier)
        // Since both win gets x2, pre-multiplier total must equal currentTarget / 2
        const halfTarget = currentTarget / 2;
        
        // Find if we can perfectly fit payouts
        // Standard single payout options (from paytable relative to betPerLine):
        // 100x, 50x, 25x, 10x, 5x
        // Let's divide halfTarget into two parts
        let TigerPayout = 0;
        let DragonPayout = 0;

        // Try to distribute
        const options = [100, 50, 25, 10, 5];
        const matchTig = options.find(o => Math.abs((o * betPerLine) - halfTarget / 2) < 0.1);
        const matchDrag = options.find(o => Math.abs((o * betPerLine) - halfTarget / 2) < 0.1);

        if (matchTig && matchDrag) {
          TigerPayout = matchTig * betPerLine;
          DragonPayout = matchDrag * betPerLine;
        } else {
          // Fallback: one wins, one loses (multiplier doesn't apply, so one wins exact target prize)
          if (Math.random() > 0.5) {
            TigerPayout = currentTarget;
            DragonPayout = 0;
          } else {
            TigerPayout = 0;
            DragonPayout = currentTarget;
          }
        }

        // Generate Tiger Layout
        if (TigerPayout > 0) {
          const mult = TigerPayout / betPerLine;
          const config = TIGER_SYMBOLS.find(s => s.payout === mult);
          if (config) {
            tigerResult = [config.id, config.id, config.id];
            calculatedTigerWin = TigerPayout;
            winningTigerPos = [0, 1, 2];
          } else if (mult === 5) {
            // Mixed Win
            tigerResult = ['GOLD_TIGER', 'SILVER_TIGER', 'TIGER_PAW'];
            calculatedTigerWin = TigerPayout;
            winningTigerPos = [0, 1, 2];
          } else {
            tigerResult = makeLoseTiger();
          }
        } else {
          tigerResult = makeLoseTiger();
        }

        // Generate Dragon Layout
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
        // Only Tiger wins
        const mult = currentTarget / betPerLine;
        const config = TIGER_SYMBOLS.find(s => s.payout === mult);
        if (config) {
          tigerResult = [config.id, config.id, config.id];
          calculatedTigerWin = currentTarget;
          winningTigerPos = [0, 1, 2];
        } else if (mult === 5) {
          tigerResult = ['GOLD_TIGER', 'SILVER_TIGER', 'TIGER_PAW'];
          calculatedTigerWin = currentTarget;
          winningTigerPos = [0, 1, 2];
        } else {
          tigerResult = makeLoseTiger();
        }
        dragonResult = makeLoseDragon();
      } else if (dragonActive) {
        // Only Dragon wins
        const mult = currentTarget / betPerLine;
        const config = DRAGON_SYMBOLS.find(s => s.payout === mult);
        if (config) {
          dragonResult = [config.id, config.id, config.id];
          calculatedDragonWin = currentTarget;
          winningDragonPos = [0, 1, 2];
        } else if (mult === 5) {
          dragonResult = ['GOLD_DRAGON', 'SILVER_DRAGON', 'DRAGON_PAW'];
          calculatedDragonWin = currentTarget;
          winningDragonPos = [0, 1, 2];
        } else {
          dragonResult = makeLoseDragon();
        }
        tigerResult = makeLoseTiger();
      }
    } else {
      // Natural / random spins (losing or tiny chance of winning)
      // High-quality RTP balanced random simulation
      if (tigerActive) {
        if (Math.random() < 0.12) { // 12% hit rate
          const possible = [...TIGER_SYMBOLS];
          const choice = possible[Math.floor(Math.random() * possible.length)];
          tigerResult = [choice.id, choice.id, choice.id];
          calculatedTigerWin = choice.payout * betPerLine;
          winningTigerPos = [0, 1, 2];
        } else if (Math.random() < 0.25) { // mixed win
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

    // Set Spinning Columns
    if (tigerActive) setSpinningTiger([true, true, true]);
    if (dragonActive) setSpinningDragon([true, true, true]);

    // Timings
    const delayStep = isTurbo ? 100 : 350;

    // Sequential stop for Tiger Columns
    if (tigerActive) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          setTigerReels(prev => {
            const next = [...prev];
            next[i] = tigerResult[i];
            return next;
          });
          setSpinningTiger(prev => {
            const next = [...prev];
            next[i] = false;
            return next;
          });
          playSfx('click');
        }, (i + 1) * delayStep);
      }
    }

    // Sequential stop for Dragon Columns
    if (dragonActive) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          setDragonReels(prev => {
            const next = [...prev];
            next[i] = dragonResult[i];
            return next;
          });
          setSpinningDragon(prev => {
            const next = [...prev];
            next[i] = false;
            return next;
          });
          playSfx('click');
        }, (tigerActive ? 3 : 0) * delayStep + (i + 1) * delayStep);
      }
    }

    // All columns completed
    const totalDuration = ((tigerActive ? 3 : 0) + (dragonActive ? 3 : 0) + 1.5) * delayStep;
    
    setTimeout(async () => {
      // Determine final multiplier double win
      const bothActive = tigerActive && dragonActive;
      const bothWon = calculatedTigerWin > 0 && calculatedDragonWin > 0;
      
      let finalWinSum = calculatedTigerWin + calculatedDragonWin;
      let dblWin = false;

      if (bothActive && bothWon) {
        finalWinSum = finalWinSum * 2;
        dblWin = true;
      }

      setTigerWinAmount(calculatedTigerWin);
      setDragonWinAmount(calculatedDragonWin);
      setWinningTigerPositions(winningTigerPos);
      setWinningDragonPositions(winningDragonPos);
      setIsDoubleWin(dblWin);
      setTotalWin(finalWinSum);

      // Save win to server
      if (finalWinSum > 0) {
        playSfx('win');
        await updateBalance(finalWinSum, 'win', 'yakuza-ink', {
          tigerWin: calculatedTigerWin,
          dragonWin: calculatedDragonWin,
          doubleMultiplierApplied: dblWin,
        });
      }

      setIsSpinning(false);

      // Handle Auto Play
      if (autoPlayRef.current) {
        setTimeout(() => {
          if (autoPlayRef.current) {
            spin();
          }
        }, 1500);
      }

    }, totalDuration);
  };

  // Turn off auto-play on manual toggle
  const toggleAutoPlay = () => {
    playSfx('click');
    setAutoPlay(!autoPlay);
  };

  return (
    <div className="h-full max-h-full w-full flex-1 bg-[#08050e] text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Dynamic Background particles / neon mist */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#08050e] to-[#040207] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-pink-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="p-3 bg-black/40 border-b border-white/5 backdrop-blur-md flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app')}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 text-white/70 hover:text-white"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm md:text-base font-black tracking-wider uppercase bg-gradient-to-r from-blue-400 via-amber-400 to-pink-500 bg-clip-text text-transparent">
              Yakuza Ink
            </h1>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Tiger vs Dragon</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Rules / Paytable Button */}
          <button
            onClick={() => setShowInfo(true)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-amber-400 hover:text-amber-300 border border-amber-500/20 transition-all"
          >
            <Info size={14} />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            {soundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Balance Display */}
          <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-amber-600/20 border border-amber-500/30 flex items-center gap-1.5 shadow-inner">
            <Coins size={12} className="text-amber-400" />
            <span className="text-[11px] font-black text-amber-300 tracking-wider">
              R$ {user?.balance?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Reels Section */}
      <main className="flex-1 flex flex-col justify-center gap-2 md:gap-4 px-4 py-2 md:py-4 max-w-md mx-auto w-full overflow-hidden">
        {/* Dynamic Multiplier Status Banner */}
        <div className="h-8 md:h-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isDoubleWin ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.05, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="px-5 py-0.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black rounded-full font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse border border-white flex items-center gap-1"
              >
                <Flame size={12} fill="currentColor" />
                AMBOS GANHAM: MULTIPLICADOR 2X ATIVO!
              </motion.div>
            ) : tigerActive && dragonActive ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[9px] uppercase tracking-widest font-black text-amber-400/80 animate-pulse text-center"
              >
                ✦ Ative ambos cilindros para desbloquear Multiplicador de 2x! ✦
              </motion.div>
            ) : (
              <div className="text-[9px] text-white/30 uppercase tracking-widest text-center">
                Ative ambos para multiplicar ganhos por 2
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* TIGER CILINDRO (Top Reel 3x1) */}
        <div
          className={`relative rounded-[20px] border-2 transition-all duration-300 p-3 md:p-4 ${
            tigerActive
              ? 'bg-gradient-to-b from-blue-950/20 to-neutral-900/90 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.12)]'
              : 'bg-neutral-950/40 border-neutral-800 opacity-45'
          }`}
        >
          {/* Title & Active Indicator */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${tigerActive ? 'bg-blue-400 animate-ping' : 'bg-neutral-600'}`} />
              <span className={`text-[10px] font-black tracking-widest uppercase ${tigerActive ? 'text-blue-400' : 'text-neutral-500'}`}>
                Cilindro do Tigre
              </span>
            </div>
            {/* Toggle switch */}
            <button
              onClick={toggleTiger}
              disabled={isSpinning}
              className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                tigerActive
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
              }`}
            >
              {tigerActive ? 'Ativo' : 'Inativo'}
            </button>
          </div>

          {/* 3x1 Reel Row */}
          <div className="grid grid-cols-3 gap-2.5 relative z-10">
            {tigerReels.map((symbol, idx) => (
              <div
                key={`tiger-slot-${idx}`}
                className={`aspect-square rounded-xl md:rounded-2xl bg-neutral-950/90 border-2 flex items-center justify-center overflow-hidden relative transition-all duration-200 ${
                  spinningTiger[idx]
                    ? 'border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                    : winningTigerPositions.includes(idx)
                    ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.35)] bg-amber-500/10'
                    : 'border-white/5'
                }`}
              >
                {/* Internal vignette shadows to simulate 3D cylinder depth */}
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

                {/* Rolling blur effect */}
                {spinningTiger[idx] ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-start overflow-hidden">
                    <motion.div
                      animate={{ y: [0, -320] }}
                      transition={{ repeat: Infinity, duration: 0.12, ease: 'linear' }}
                      className="flex flex-col gap-4 items-center justify-start filter blur-[3px]"
                    >
                      <div className="w-12 h-12 shrink-0 flex items-center justify-center">{renderYakuzaSymbol('GOLD_TIGER')}</div>
                      <div className="w-12 h-12 shrink-0 flex items-center justify-center">{renderYakuzaSymbol('SILVER_TIGER')}</div>
                      <div className="w-12 h-12 shrink-0 flex items-center justify-center">{renderYakuzaSymbol('KATANA')}</div>
                      <div className="w-12 h-12 shrink-0 flex items-center justify-center">{renderYakuzaSymbol('TIGER_PAW')}</div>
                      <div className="w-12 h-12 shrink-0 flex items-center justify-center">{renderYakuzaSymbol('GOLD_TIGER')}</div>
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ y: -120, scaleY: 1.3, filter: 'blur(6px)', opacity: 0.3 }}
                    animate={{ y: 0, scaleY: 1, filter: 'blur(0px)', opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 13 }}
                    className="w-full h-full"
                  >
                    {renderYakuzaSymbol(symbol, winningTigerPositions.includes(idx))}
                  </motion.div>
                )}

                {/* Grid Overlay Frame decoration */}
                <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-xl md:rounded-2xl" />
              </div>
            ))}
          </div>

          {/* Win amount banner inside reel container */}
          {tigerWinAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-500 border border-blue-400 rounded-full text-black font-black text-[9px] tracking-widest uppercase shadow-md shadow-blue-500/20 z-20"
            >
              Ganhou R$ {tigerWinAmount.toFixed(2)}
            </motion.div>
          )}
        </div>

        {/* DRAGON CILINDRO (Bottom Reel 3x1) */}
        <div
          className={`relative rounded-[20px] border-2 transition-all duration-300 p-3 md:p-4 ${
            dragonActive
              ? 'bg-gradient-to-b from-pink-950/20 to-neutral-900/90 border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.12)]'
              : 'bg-neutral-950/40 border-neutral-800 opacity-45'
          }`}
        >
          {/* Title & Active Indicator */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${dragonActive ? 'bg-pink-400 animate-ping' : 'bg-neutral-600'}`} />
              <span className={`text-[10px] font-black tracking-widest uppercase ${dragonActive ? 'text-pink-400' : 'text-neutral-500'}`}>
                Cilindro do Dragão
              </span>
            </div>
            {/* Toggle switch */}
            <button
              onClick={toggleDragon}
              disabled={isSpinning}
              className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                dragonActive
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-400/30'
                  : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
              }`}
            >
              {dragonActive ? 'Ativo' : 'Inativo'}
            </button>
          </div>

          {/* 3x1 Reel Row */}
          <div className="grid grid-cols-3 gap-2.5 relative z-10">
            {dragonReels.map((symbol, idx) => (
              <div
                key={`dragon-slot-${idx}`}
                className={`aspect-square rounded-xl md:rounded-2xl bg-neutral-950/90 border-2 flex items-center justify-center overflow-hidden relative transition-all duration-200 ${
                  spinningDragon[idx]
                    ? 'border-pink-500/60 shadow-[0_0_12px_rgba(236,72,153,0.25)]'
                    : winningDragonPositions.includes(idx)
                    ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.35)] bg-amber-500/10'
                    : 'border-white/5'
                }`}
              >
                {/* Internal vignette shadows to simulate 3D cylinder depth */}
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

                {/* Rolling blur effect */}
                {spinningDragon[idx] ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-start overflow-hidden">
                    <motion.div
                      animate={{ y: [0, -320] }}
                      transition={{ repeat: Infinity, duration: 0.12, ease: 'linear' }}
                      className="flex flex-col gap-4 items-center justify-start filter blur-[3px]"
                    >
                      <div className="w-12 h-12 shrink-0 flex items-center justify-center">{renderYakuzaSymbol('GOLD_DRAGON')}</div>
                      <div className="w-12 h-12 shrink-0 flex items-center justify-center">{renderYakuzaSymbol('SILVER_DRAGON')}</div>
                      <div className="w-12 h-12 shrink-0 flex items-center justify-center">{renderYakuzaSymbol('KATANA')}</div>
                      <div className="w-12 h-12 shrink-0 flex items-center justify-center">{renderYakuzaSymbol('DRAGON_PAW')}</div>
                      <div className="w-12 h-12 shrink-0 flex items-center justify-center">{renderYakuzaSymbol('GOLD_DRAGON')}</div>
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ y: -120, scaleY: 1.3, filter: 'blur(6px)', opacity: 0.3 }}
                    animate={{ y: 0, scaleY: 1, filter: 'blur(0px)', opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 13 }}
                    className="w-full h-full"
                  >
                    {renderYakuzaSymbol(symbol, winningDragonPositions.includes(idx))}
                  </motion.div>
                )}

                {/* Grid Overlay Frame decoration */}
                <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-xl md:rounded-2xl" />
              </div>
            ))}
          </div>

          {/* Win amount banner inside reel container */}
          {dragonWinAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-pink-500 border border-pink-400 rounded-full text-black font-black text-[9px] tracking-widest uppercase shadow-md shadow-pink-500/20 z-20"
            >
              Ganhou R$ {dragonWinAmount.toFixed(2)}
            </motion.div>
          )}
        </div>
      </main>

      {/* Control Area (Bottom) */}
      <footer className="p-3 pb-5 md:p-5 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent border-t border-white/5 relative z-10">
        <div className="max-w-md mx-auto w-full flex flex-col gap-2 md:gap-3">
          
          {/* Display Win Info */}
          <div className="h-8 md:h-10 flex items-center justify-center text-center">
            {totalWin > 0 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.05, opacity: 1 }}
                className="text-center"
              >
                <div className="text-[9px] text-white/50 uppercase font-black tracking-widest">
                  GANHO TOTAL
                </div>
                <div className="text-lg md:text-xl font-black text-amber-400 tracking-wider">
                  R$ {totalWin.toFixed(2)}
                </div>
              </motion.div>
            ) : isSpinning ? (
              <div className="text-[10px] md:text-xs uppercase font-black text-white/40 tracking-widest animate-pulse">
                Sorrindo para o Dragão e o Tigre...
              </div>
            ) : (
              <div className="text-[9px] uppercase font-bold text-white/40 tracking-widest">
                Selecione sua aposta e comece a rodar!
              </div>
            )}
          </div>

          {/* Grid control items */}
          <div className="flex items-center justify-between gap-3">
            {/* Turbo Toggle */}
            <button
              onClick={() => {
                playSfx('click');
                setIsTurbo(!isTurbo);
              }}
              className={`flex flex-col items-center justify-center gap-1 w-12 h-12 md:w-14 md:h-14 rounded-2xl border transition-all ${
                isTurbo
                  ? 'bg-amber-400/10 border-amber-400/50 text-amber-400'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              <Zap size={16} />
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider">Turbo</span>
            </button>

            {/* Bet Selector */}
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                Aposta por Linha
              </span>
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 md:p-1.5 w-full justify-between">
                <button
                  disabled={isSpinning}
                  onClick={() => adjustBet('down')}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 active:scale-90 disabled:opacity-40"
                >
                  <Minus size={12} />
                </button>
                <div className="text-center">
                  <span className="block text-[11px] md:text-[13px] font-black tracking-wide text-white leading-tight">
                    R$ {betPerLine.toFixed(2)}
                  </span>
                  <span className="block text-[7px] md:text-[8px] font-bold text-white/40 uppercase tracking-wider">
                    Total: R$ {totalBet.toFixed(2)}
                  </span>
                </div>
                <button
                  disabled={isSpinning}
                  onClick={() => adjustBet('up')}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 active:scale-90 disabled:opacity-40"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Auto Play Toggle */}
            <button
              onClick={toggleAutoPlay}
              className={`flex flex-col items-center justify-center gap-1 w-12 h-12 md:w-14 md:h-14 rounded-2xl border transition-all ${
                autoPlay
                  ? 'bg-blue-400/10 border-blue-400/50 text-blue-400'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              <RefreshCw size={16} className={autoPlay ? 'animate-spin' : ''} />
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider">Auto</span>
            </button>
          </div>

          {/* Huge Spin Button */}
          <div className="flex justify-center relative">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={spin}
              disabled={isSpinning}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center relative shadow-2xl transition-all ${
                isSpinning
                  ? 'bg-neutral-800 border-2 border-neutral-700 text-neutral-600'
                  : 'bg-gradient-to-br from-blue-500 via-amber-400 to-pink-500 p-[3px] shadow-[0_0_20px_rgba(236,72,153,0.25)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] active:scale-95'
              }`}
            >
              <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center">
                <RefreshCw
                  size={24}
                  className={`text-white ${isSpinning ? 'animate-spin text-neutral-600' : 'hover:scale-110 duration-200'}`}
                />
              </div>
            </motion.button>
          </div>

        </div>
      </footer>

      {/* Rules / Paytable Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-6 text-white relative shadow-2xl"
            >
              <h3 className="text-base font-black tracking-widest uppercase text-amber-400 mb-4 text-center">
                Tabela de Pagamentos
              </h3>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-black text-amber-300 uppercase tracking-wider mb-2">
                    Cilindro do Tigre & Dragão
                  </h4>
                  <ul className="text-xs space-y-2 text-white/80 font-medium">
                    <li className="flex justify-between items-center">
                      <span>3x Ouro (Cabeça)</span>
                      <span className="font-bold text-yellow-400">100x Aposta</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>3x Prata (Cabeça)</span>
                      <span className="font-bold text-slate-300">50x Aposta</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>3x Bronze (Pata / Garra)</span>
                      <span className="font-bold text-amber-600">25x Aposta</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>3x Katana (Neutral)</span>
                      <span className="font-bold text-cyan-400">10x Aposta</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Mistura de 3 Tigres/Dragões</span>
                      <span className="font-bold text-purple-400">5x Aposta</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <h4 className="text-[10px] font-black text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Flame size={12} fill="currentColor" /> Multiplicador Ambos Ativos (x2)
                  </h4>
                  <p className="text-[11px] text-white/70 leading-relaxed font-bold">
                    Ao ativar ambos cilindros (Tigre + Dragão) na mesma rodada, se AMBOS os cilindros ganharem qualquer prêmio, o prêmio acumulado de ambos será duplicado (x2)!
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playSfx('click');
                  setShowInfo(false);
                }}
                className="w-full mt-6 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all active:scale-95"
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading && (
          <GameLoader
            onComplete={() => setLoading(false)}
            backgroundImage="https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop"
            gameName="Yakuza Ink"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import { db } from '../../data/db';
import { PrizeService } from '../../services/prizeService';
import { ArrowLeft, Info, HelpCircle, Coins, Zap, Minus, Plus, RefreshCw, Volume2, VolumeX, Menu, X, Star, ThumbsUp } from 'lucide-react';
import { GameLoader } from '../../components/GameLoader';
import coverImg from '../../assets/images/calavera_ink_cover_1784495373476.jpg';

// Payout weights and definitions
const SYMBOLS_WEIGHTS = {
  '10': 25,
  'J': 20,
  'Q': 20,
  'K': 15,
  'A': 15,
  'TEQUILA': 12,
  'MARACAS': 10,
  'GUITAR': 8,
  'GUN': 6,
  'SKULL': 4,
  'WILD': 3,
  'SCATTER': 2
};

const WEIGHTED_SYMBOLS: string[] = [];
Object.entries(SYMBOLS_WEIGHTS).forEach(([symbol, weight]) => {
  for (let i = 0; i < weight; i++) {
    WEIGHTED_SYMBOLS.push(symbol);
  }
});

// Render custom vector illustrations for each Calavera Ink symbol
const renderCalaveraSymbol = (symbol: string, isWinning: boolean = false, hasGoldenFrame: boolean = false) => {
  const glowClass = isWinning ? 'drop-shadow-[0_0_15px_rgba(234,179,8,1.0)] scale-110 brightness-125 z-10' : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]';
  const containerClass = `flex flex-col items-center justify-center w-full h-full p-1.5 relative transition-all duration-300 ${
    hasGoldenFrame ? 'border-[3px] border-amber-400 rounded-xl bg-amber-950/20 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''
  }`;

  switch (symbol) {
    case 'WILD':
      return (
        <div id="symbol-wild" className={`${containerClass} ${glowClass}`}>
          {/* Golden Skull with Crossed Guns */}
          <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] animate-pulse">
            <defs>
              <linearGradient id="wildGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF9D0" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="wildRibbon" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#BE185D" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="35" fill="rgba(245,158,11,0.2)" />
            {/* Crossed pistols behind */}
            <g transform="translate(50,50) rotate(45) translate(-50,-50)">
              <rect x="25" y="45" width="50" height="8" rx="2" fill="#4B5563" />
              <rect x="60" y="48" width="12" height="20" rx="2" fill="#4B5563" />
            </g>
            <g transform="translate(50,50) rotate(-45) translate(-50,-50)">
              <rect x="25" y="45" width="50" height="8" rx="2" fill="#4B5563" />
              <rect x="12" y="48" width="12" height="20" rx="2" fill="#4B5563" />
            </g>
            {/* Golden Skull */}
            <path d="M 32 35 C 32 18, 68 18, 68 35 C 68 45, 60 50, 58 58 L 42 58 C 40 50, 32 45, 32 35 Z" fill="url(#wildGoldGrad)" stroke="#111" strokeWidth="2" />
            <circle cx="42" cy="36" r="5" fill="#111" />
            <circle cx="58" cy="36" r="5" fill="#111" />
            <path d="M 46 45 L 50 40 L 54 45 Z" fill="#111" />
            {/* Teeth lines */}
            <line x1="45" y1="52" x2="45" y2="56" stroke="#111" strokeWidth="2" />
            <line x1="50" y1="52" x2="50" y2="56" stroke="#111" strokeWidth="2" />
            <line x1="55" y1="52" x2="55" y2="56" stroke="#111" strokeWidth="2" />
            {/* Ribbon */}
            <path d="M 15 65 L 85 65 L 78 78 L 22 78 Z" fill="url(#wildRibbon)" stroke="#111" strokeWidth="1.5" />
            <text x="50" y="75" textAnchor="middle" fill="#FFF" fontSize="10" fontWeight="900" letterSpacing="1.5">WILD</text>
          </svg>
        </div>
      );

    case 'SCATTER':
      return (
        <div id="symbol-scatter" className={`${containerClass} ${glowClass}`}>
          {/* Purple glowing Calavera Mask */}
          <svg viewBox="0 0 100 100" className="w-[90%] h-[90%]">
            <defs>
              <linearGradient id="scatPurple" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#6B21A8" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="35" fill="rgba(168,85,247,0.25)" stroke="#A855F7" strokeWidth="1" />
            {/* Skull Face */}
            <path d="M 30 38 C 30 20, 70 20, 70 38 C 70 50, 62 55, 60 64 L 40 64 C 38 55, 30 50, 30 38 Z" fill="url(#scatPurple)" stroke="#FFF" strokeWidth="1.5" />
            {/* Eyes */}
            <circle cx="41" cy="38" r="6" fill="#F43F5E" />
            <circle cx="41" cy="38" r="2" fill="#FFF" />
            <circle cx="59" cy="38" r="6" fill="#F43F5E" />
            <circle cx="59" cy="38" r="2" fill="#FFF" />
            {/* Nose */}
            <path d="M 47 48 L 50 43 L 53 48 Z" fill="#FFF" />
            {/* Flower decoration on forehead */}
            <circle cx="50" cy="24" r="3" fill="#EAB308" />
            <circle cx="46" cy="24" r="2.5" fill="#EF4444" />
            <circle cx="54" cy="24" r="2.5" fill="#EF4444" />
            {/* Label SCATTER */}
            <rect x="20" y="70" width="60" height="15" rx="3" fill="#EC4899" stroke="#FFF" strokeWidth="1" />
            <text x="50" y="81" textAnchor="middle" fill="#FFF" fontSize="8" fontWeight="900" letterSpacing="1">SCATTER</text>
          </svg>
        </div>
      );

    case 'SKULL':
      return (
        <div id="symbol-skull" className={`${containerClass} ${glowClass}`}>
          {/* Main Sugar Skull */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="skullWhite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
            </defs>
            {/* Background tattoo floral mandala */}
            <circle cx="50" cy="46" r="32" fill="none" stroke="#D946EF" strokeWidth="1.5" strokeDasharray="4 2" />
            {/* Head */}
            <path d="M 32 38 C 32 22, 68 22, 68 38 C 68 48, 61 52, 59 60 L 41 60 C 39 52, 32 48, 32 38 Z" fill="url(#skullWhite)" stroke="#111" strokeWidth="2" />
            {/* Eye Sockets */}
            <circle cx="42" cy="38" r="6.5" fill="#111" stroke="#3B82F6" strokeWidth="1" />
            <path d="M 39 38 L 45 38 M 42 35 L 42 41" stroke="#3B82F6" strokeWidth="1" />
            <circle cx="58" cy="38" r="6.5" fill="#111" stroke="#3B82F6" strokeWidth="1" />
            <path d="M 55 38 L 61 38 M 58 35 L 58 41" stroke="#3B82F6" strokeWidth="1" />
            {/* Heart Nose */}
            <path d="M 50 49 C 50 49, 47 45, 47 43 C 47 41, 49 40, 50 41 C 51 40, 53 41, 53 43 C 53 45, 50 49, 50 49 Z" fill="#EF4444" />
            {/* Teeth stitching */}
            <line x1="44" y1="55" x2="56" y2="55" stroke="#111" strokeWidth="2" />
            <line x1="47" y1="52" x2="47" y2="58" stroke="#111" strokeWidth="1.5" />
            <line x1="50" y1="52" x2="50" y2="58" stroke="#111" strokeWidth="1.5" />
            <line x1="53" y1="52" x2="53" y2="58" stroke="#111" strokeWidth="1.5" />
            {/* Rose on cheek */}
            <circle cx="36" cy="46" r="3.5" fill="#EF4444" />
            <circle cx="64" cy="46" r="3.5" fill="#EF4444" />
          </svg>
        </div>
      );

    case 'GUN':
      return (
        <div id="symbol-gun" className={`${containerClass} ${glowClass}`}>
          {/* Silver Engraved Revolver with Rose */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="silverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F1F5F9" />
                <stop offset="50%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="30" fill="rgba(148,163,184,0.15)" />
            {/* Gun barrel */}
            <path d="M 24,35 h 42 v 8 H 24 Z" fill="url(#silverGrad)" stroke="#111" strokeWidth="1.5" />
            {/* Cylinder */}
            <rect x="46" y="32" width="14" height="14" fill="url(#silverGrad)" stroke="#111" strokeWidth="1.5" rx="1" />
            {/* Grip */}
            <path d="M 58,40 v 22 c 0,3 -3,6 -6,6 h -10 v -10 Z" fill="#92400E" stroke="#111" strokeWidth="1.5" />
            {/* Trigger guard */}
            <circle cx="48" cy="48" r="5" fill="none" stroke="#111" strokeWidth="1.5" />
            {/* Trigger */}
            <path d="M 49,46 L 47,50" stroke="#111" strokeWidth="2" />
            {/* Red Rose behind */}
            <g transform="translate(30, 52)">
              <circle cx="0" cy="0" r="7" fill="#EF4444" stroke="#111" strokeWidth="1" />
              <path d="M -4,-4 Q 0,-10 4,-4 Q 10,0 4,4 Q 0,10 -4,4 Q -10,0 -4,-4 Z" fill="#DC2626" />
              <circle cx="0" cy="0" r="3" fill="#F59E0B" />
            </g>
          </svg>
        </div>
      );

    case 'GUITAR':
      return (
        <div id="symbol-guitar" className={`${containerClass} ${glowClass}`}>
          {/* Classic Wooden Guitar with Roses */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="guitarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#451A03" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="30" fill="rgba(217,119,6,0.12)" />
            {/* Body */}
            <path d="M 40,32 C 34,32, 34,42, 38,48 C 34,54, 34,68, 50,68 C 66,68, 66,54, 62,48 C 66,42, 66,32, 60,32 Z" fill="url(#guitarGrad)" stroke="#111" strokeWidth="1.5" />
            <circle cx="50" cy="42" r="6" fill="#111" />
            <circle cx="50" cy="42" r="4" fill="#F59E0B" />
            {/* Neck */}
            <rect x="48" y="16" width="4" height="20" fill="#451A03" stroke="#111" strokeWidth="1" />
            {/* Headstock */}
            <rect x="46" y="10" width="8" height="6" rx="1" fill="#78350F" stroke="#111" strokeWidth="1" />
            {/* Tuning pegs */}
            <circle cx="43" cy="11" r="1.5" fill="#F59E0B" />
            <circle cx="43" cy="14" r="1.5" fill="#F59E0B" />
            <circle cx="57" cy="11" r="1.5" fill="#F59E0B" />
            <circle cx="57" cy="14" r="1.5" fill="#F59E0B" />
            {/* Bridge */}
            <rect x="43" y="58" width="14" height="3" fill="#111" />
            {/* Floating red rose petal */}
            <path d="M 60,60 C 64,60 66,64 64,66 C 60,68 58,64 60,60 Z" fill="#EF4444" stroke="#111" strokeWidth="0.5" />
          </svg>
        </div>
      );

    case 'MARACAS':
      return (
        <div id="symbol-maracas" className={`${containerClass} ${glowClass}`}>
          {/* Festive colorful maracas */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="maracaGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="maracaYellow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            {/* Left Maraca */}
            <g transform="translate(42, 46) rotate(-20) translate(-42, -46)">
              <rect x="39" y="44" width="6" height="24" rx="2" fill="#D97706" stroke="#111" strokeWidth="1" />
              <ellipse cx="42" cy="34" rx="11" ry="14" fill="url(#maracaYellow)" stroke="#111" strokeWidth="1.5" />
              {/* Stripe */}
              <path d="M 31,34 Q 42,38 53,34" stroke="#EF4444" strokeWidth="3" fill="none" />
              <circle cx="42" cy="27" r="2" fill="#10B981" />
            </g>
            {/* Right Maraca */}
            <g transform="translate(58, 46) rotate(20) translate(-58, -46)">
              <rect x="55" y="44" width="6" height="24" rx="2" fill="#D97706" stroke="#111" strokeWidth="1" />
              <ellipse cx="58" cy="34" rx="11" ry="14" fill="url(#maracaGreen)" stroke="#111" strokeWidth="1.5" />
              {/* Stripe */}
              <path d="M 47,34 Q 58,38 69,34" stroke="#FBBF24" strokeWidth="3" fill="none" />
              <circle cx="58" cy="27" r="2" fill="#EF4444" />
            </g>
          </svg>
        </div>
      );

    case 'TEQUILA':
      return (
        <div id="symbol-tequila" className={`${containerClass} ${glowClass}`}>
          {/* Shot of Tequila with Lime */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <circle cx="50" cy="50" r="30" fill="rgba(56,189,248,0.12)" />
            {/* Glass */}
            <path d="M 34,26 L 38,62 C 38,65, 41,68, 44,68 L 56,68 C 59,68, 62,65, 62,62 L 66,26 Z" fill="rgba(255,255,255,0.3)" stroke="#111" strokeWidth="1.5" />
            {/* Tequila Liquid */}
            <path d="M 36,38 L 39,58 Q 40,64 45,64 L 55,64 Q 60,64 61,58 L 64,38 Z" fill="#FCD34D" stroke="none" />
            {/* Salt Rim */}
            <line x1="33" y1="26" x2="67" y2="26" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
            {/* Lime Wedge */}
            <g transform="translate(30, 24) rotate(-30)">
              <path d="M -10,0 A 10,10 0 0,1 10,0 Z" fill="#22C55E" stroke="#111" strokeWidth="1" />
              <path d="M -8,-1 A 8,8 0 0,1 8,-1 Z" fill="#86EFAC" />
              <line x1="0" y1="0" x2="-6" y2="-4" stroke="#22C55E" strokeWidth="1" />
              <line x1="0" y1="0" x2="0" y2="-8" stroke="#22C55E" strokeWidth="1" />
              <line x1="0" y1="0" x2="6" y2="-4" stroke="#22C55E" strokeWidth="1" />
            </g>
          </svg>
        </div>
      );

    // Card Suits Styled elegantly
    case 'A':
      return (
        <div className={containerClass}>
          <span className="text-3xl font-black font-serif text-[#EF4444] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">A</span>
        </div>
      );
    case 'K':
      return (
        <div className={containerClass}>
          <span className="text-3xl font-black font-serif text-[#F59E0B] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">K</span>
        </div>
      );
    case 'Q':
      return (
        <div className={containerClass}>
          <span className="text-3xl font-black font-serif text-[#EC4899] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Q</span>
        </div>
      );
    case 'J':
      return (
        <div className={containerClass}>
          <span className="text-3xl font-black font-serif text-[#3B82F6] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">J</span>
        </div>
      );
    case '10':
      return (
        <div className={containerClass}>
          <span className="text-2xl font-black font-serif text-[#10B981] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">10</span>
        </div>
      );

    default:
      return null;
  }
};

// Big win celebration screen overlay
const BigWinScreen = ({ amount, onClose }: { amount: number; onClose: () => void }) => {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const intervalTime = 30;
    const step = (amount / duration) * intervalTime;

    const timer = setInterval(() => {
      start += step;
      if (start >= amount) {
        setDisplayAmount(amount);
        clearInterval(timer);
      } else {
        setDisplayAmount(start);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [amount]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden rounded-[24px]"
    >
      <div className="text-center relative z-10 max-w-sm">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center"
        >
          {/* Exploding Stars */}
          <div className="w-16 h-16 rounded-full bg-[#EAB308]/20 flex items-center justify-center mb-4 border border-[#EAB308]/40 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            <Star className="text-yellow-400 fill-yellow-400" size={32} />
          </div>

          <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] uppercase animate-pulse">
            BIG WIN!
          </h2>
          <p className="text-pink-500 font-bold uppercase tracking-widest text-xs mt-1">TATTOO BANDITO</p>
        </motion.div>
        
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-neutral-900/90 border border-amber-400/30 px-6 py-4 rounded-2xl shadow-[0_0_20px_rgba(251,191,36,0.15)]"
        >
          <p className="text-[10px] text-amber-400/80 uppercase font-mono tracking-widest mb-1">Prêmio Total</p>
          <p className="text-3xl sm:text-4xl font-black text-white font-mono">
            R$ {displayAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <p className="text-white/40 text-[9px] mt-6 uppercase tracking-wider">Clique para continuar</p>

        {/* Floating Stars particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-400"
              initial={{ 
                x: Math.random() * 200 - 100, 
                y: 100, 
                scale: Math.random() * 0.4 + 0.4, 
                opacity: 1 
              }}
              animate={{ 
                y: -200, 
                x: Math.random() * 200 - 100, 
                rotate: 360, 
                opacity: 0 
              }}
              transition={{ 
                duration: Math.random() * 1.5 + 1.2, 
                repeat: Infinity,
                delay: Math.random() * 0.4
              }}
              style={{ left: '50%', top: '40%' }}
            >
              <Star size={12} fill="currentColor" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Small win fly-out indicator
const WinCelebrationIndicator = ({ amount }: { amount: number }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 10 }}
      animate={{ scale: 1.2, opacity: 1, y: -60 }}
      exit={{ scale: 1.4, opacity: 0, y: -110 }}
      transition={{ duration: 1.0, ease: "easeOut" }}
      className="absolute z-50 pointer-events-none bg-neutral-900/95 border border-green-500/40 px-5 py-1.5 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)] flex flex-col items-center justify-center"
      style={{ left: 'calc(50% - 60px)', bottom: '38%' }}
    >
      <span className="text-xl sm:text-2xl font-black font-mono text-green-400 tracking-tight">
        +R$ {amount.toFixed(2)}
      </span>
      <span className="text-[8px] uppercase tracking-widest text-white/50 font-bold">Incrível!</span>
    </motion.div>
  );
};

export function CalaveraInk() {
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  const { playSfx, playGameMusic, stopGameMusic } = useAudio();

  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [gameConfig, setGameConfig] = useState<any>(null);
  
  // Bets configuration
  const [baseBet, setBaseBet] = useState(0.4);
  const activeBet = baseBet;

  const ROWS = 4;
  const COLS = 5;

  // 5x4 Grid state representing the Day of the Dead Tattoo motifs
  const [grid, setGrid] = useState<string[][]>([
    ['TEQUILA', 'SKULL', 'GUN', 'SKULL', 'TEQUILA'],
    ['Q', 'GUITAR', 'Q', 'SCATTER', 'Q'],
    ['J', 'SCATTER', 'TEQUILA', 'GUITAR', 'J'],
    ['MARACAS', 'A', 'GUN', 'A', 'MARACAS']
  ]);

  // Which grid cells currently have golden frames (stored as index matching r_c string)
  const [goldenFrames, setGoldenFrames] = useState<string[]>(['1_1', '2_2', '1_3']);

  // Multiplier state
  const [multiplier, setMultiplier] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false, false, false]);

  // Wins tracking
  const [winningPositions, setWinningPositions] = useState<{r: number; c: number}[]>([]);
  const [winAmount, setWinAmount] = useState(0);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [showBigWin, setShowBigWin] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // AutoPlay settings
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoSpinsLeft, setAutoSpinsLeft] = useState(0);
  const [isTurbo, setIsTurbo] = useState<'none' | 'turbo'>('none');
  const [currentTime, setCurrentTime] = useState('');

  // Free Spins State
  const [freeSpins, setFreeSpins] = useState(0);
  const [freeSpinsMultiplier, setFreeSpinsMultiplier] = useState(1);
  const [totalFreeSpinWin, setTotalFreeSpinWin] = useState(0);
  const [freeSpinsActive, setFreeSpinsActive] = useState(false);

  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showBetSelectionModal, setShowBetSelectionModal] = useState(false);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize game config
  useEffect(() => {
    const initGame = async () => {
      // Check if calavera-ink exists, otherwise use fallback tattoo-slot
      let config = await db.getGame('calavera-ink');
      if (!config) {
        config = {
          id: 'calavera-ink',
          name: 'Calavera Ink',
          active: true,
          minBet: 0.4,
          maxBet: 100,
          rtp: 98,
          thumbnail: coverImg,
          bgPage: '',
          bgContainer: '',
          bgMusic: '',
          category: 'slots'
        };
      }
      setGameConfig(config);
      setBaseBet(config.minBet || 0.4);
      setIsGameLoaded(true);
    };
    initGame();
  }, []);

  // Handle auto-spins
  useEffect(() => {
    if (autoPlay && autoSpinsLeft > 0 && !isSpinning && !freeSpinsActive) {
      const timer = setTimeout(() => {
        spin();
      }, 800);
      return () => clearTimeout(timer);
    } else if (autoPlay && autoSpinsLeft === 0) {
      setAutoPlay(false);
    }
  }, [autoPlay, autoSpinsLeft, isSpinning]);

  // Handle Free Spins Autoplay loop
  useEffect(() => {
    if (freeSpinsActive && freeSpins > 0 && !isSpinning) {
      const timer = setTimeout(() => {
        spin();
      }, 1000);
      return () => clearTimeout(timer);
    } else if (freeSpinsActive && freeSpins === 0 && !isSpinning) {
      // Free Spins Finished!
      setFreeSpinsActive(false);
      setShowBigWin(true); // Show final total winnings
    }
  }, [freeSpinsActive, freeSpins, isSpinning]);

  // Generate target outcome
  const generateGrid = (currentTarget: number): string[][] => {
    const targetWins = currentTarget > 0;

    if (targetWins) {
      // Generate guaranteed win grid
      const newGrid = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)])
      );

      // Map a high value symbol to win
      const winSyms = ['SKULL', 'GUN', 'GUITAR', 'MARACAS'];
      const winSym = winSyms[Math.floor(Math.random() * winSyms.length)];
      const matchCount = Math.floor(Math.random() * 2) + 3; // 3 or 4 match

      for (let c = 0; c < matchCount; c++) {
        const r = Math.floor(Math.random() * ROWS);
        newGrid[r][c] = winSym;
      }

      return newGrid;
    } else {
      // No-win scenario or purely random
      let attempts = 0;
      let newGrid: string[][] = [];
      
      while (attempts < 8) {
        newGrid = Array.from({ length: ROWS }, () =>
          Array.from({ length: COLS }, () => WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)])
        );

        // Break matches by verifying column 3 has no overlapping items
        const col1Syms = newGrid.map(row => row[0]);
        const col2Syms = newGrid.map(row => row[1]);
        let hasWin = false;

        newGrid.forEach((row, rIdx) => {
          const sym = row[2];
          if (col1Syms.includes(sym) || col2Syms.includes(sym) || sym === 'WILD') {
            hasWin = true;
            newGrid[rIdx][2] = '10'; // Overwrite with non-matching card Suit
          }
        });

        if (!hasWin) break;
        attempts++;
      }

      // Occasional scatter
      if (Math.random() < 0.08) {
        newGrid[Math.floor(Math.random() * ROWS)][0] = 'SCATTER';
        newGrid[Math.floor(Math.random() * ROWS)][3] = 'SCATTER';
      }

      return newGrid;
    }
  };

  // Perform cascading slide-down and populate new symbols
  const processCascade = async (currentGrid: string[][], previousWins: {r: number; c: number}[]) => {
    playSfx('click');

    // 1. Mark golden-framed winning positions as WILD, others as null
    const afterExplosion = currentGrid.map((row, r) =>
      row.map((sym, c) => {
        const isWin = previousWins.some(p => p.r === r && p.c === c);
        if (isWin) {
          const frameKey = `${r}_${c}`;
          if (goldenFrames.includes(frameKey)) {
            return 'WILD'; // Turn into WILD
          }
          return null; // Explode
        }
        return sym;
      })
    );

    // 2. Cascade down: Shift non-null elements to the bottom of each column
    const cascadedGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    for (let c = 0; c < COLS; c++) {
      const colSymbols: (string | null)[] = [];
      for (let r = 0; r < ROWS; r++) {
        if (afterExplosion[r][c] !== null) {
          colSymbols.push(afterExplosion[r][c]);
        }
      }
      
      // Pad top with nulls
      const nullCount = ROWS - colSymbols.length;
      const finalCol = [...Array(nullCount).fill(null), ...colSymbols];
      
      for (let r = 0; r < ROWS; r++) {
        cascadedGrid[r][c] = finalCol[r];
      }
    }

    // 3. Populate new random symbols in the empty null spaces at the top
    const finalNewGrid = cascadedGrid.map((row, r) =>
      row.map((sym, c) => {
        if (sym === null) {
          return WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)];
        }
        return sym;
      })
    );

    // 4. Update golden frames: assign new golden frames on reels 2, 3, 4 randomly
    const newGoldenFrames: string[] = [];
    for (let c = 1; c <= 3; c++) {
      if (Math.random() < 0.4) {
        const r = Math.floor(Math.random() * ROWS);
        newGoldenFrames.push(`${r}_${c}`);
      }
    }

    setGoldenFrames(newGoldenFrames);
    setGrid(finalNewGrid);

    // Evaluate again
    setTimeout(() => {
      evaluateCascadeWins(finalNewGrid);
    }, 400);
  };

  // Spin core function
  const spin = async () => {
    if (isSpinning) return;
    
    const cost = freeSpinsActive ? 0 : activeBet;
    if (!freeSpinsActive && (!user || user.balance < cost)) {
      setAutoPlay(false);
      alert('Saldo insuficiente para realizar a aposta.');
      return;
    }

    setIsSpinning(true);
    setWinAmount(0);
    setShowWinCelebration(false);
    setShowBigWin(false);
    setWinningPositions([]);
    setIsShaking(false);
    setMultiplier(1); // Reset multiplier to 1 for new spin

    // Deduct Balance
    if (!freeSpinsActive) {
      await updateBalance(-cost, 'bet', 'calavera-ink', { bet: cost });
    }

    playSfx('spin');

    // Retrieve target payout
    let currentTarget = 0;
    try {
      if (user) {
        const { amount } = await PrizeService.getTargetPrize(user.id, 'slots');
        currentTarget = amount;
      }
    } catch (err) {
      console.error("Error retrieving target prize:", err);
    }

    const finalGrid = generateGrid(currentTarget);

    // Randomize initial Golden Frames on reels 2,3,4 (cols 1,2,3)
    const newGoldenFrames: string[] = [];
    for (let c = 1; c <= 3; c++) {
      if (Math.random() < 0.5) {
        const r = Math.floor(Math.random() * ROWS);
        newGoldenFrames.push(`${r}_${c}`);
      }
    }
    setGoldenFrames(newGoldenFrames);

    // Columns spinning simulation
    setSpinningCols([true, true, true, true, true]);
    setGrid(finalGrid);

    const stagger = isTurbo === 'turbo' ? [150, 200, 250, 300, 350] : [400, 600, 800, 1000, 1200];
    
    stagger.forEach((delay, idx) => {
      setTimeout(() => {
        setSpinningCols(prev => {
          const next = [...prev];
          next[idx] = false;
          return next;
        });
        playSfx('click');

        if (idx === COLS - 1) {
          evaluateCascadeWins(finalGrid);
        }
      }, delay);
    });
  };

  // Evaluate wins inside cascade
  const evaluateCascadeWins = async (currentGrid: string[][]) => {
    const PAYTABLE: Record<string, number[]> = {
      'SKULL': [0, 0, 0, 3.0, 6.0, 15.0],
      'GUN': [0, 0, 0, 2.5, 5.0, 10.0],
      'GUITAR': [0, 0, 0, 2.0, 4.0, 8.0],
      'MARACAS': [0, 0, 0, 1.5, 3.0, 6.0],
      'TEQUILA': [0, 0, 0, 1.0, 2.0, 4.0],
      'A': [0, 0, 0, 0.6, 1.2, 2.5],
      'K': [0, 0, 0, 0.5, 1.0, 2.0],
      'Q': [0, 0, 0, 0.4, 0.8, 1.6],
      'J': [0, 0, 0, 0.3, 0.6, 1.2],
      '10': [0, 0, 0, 0.2, 0.4, 0.8],
    };

    let totalSpinWin = 0;
    let newWinningPositions: {r: number; c: number}[] = [];

    // Detect Scatters
    let scatterCount = 0;
    currentGrid.forEach(row => {
      row.forEach(sym => {
        if (sym === 'SCATTER') scatterCount++;
      });
    });

    const scatterTriggered = scatterCount >= 3;

    // Check adjacent columns for ways to win (left-to-right)
    Object.keys(PAYTABLE).forEach(symbol => {
      let ways = 1;
      let matchCount = 0;
      let tempPositions: {r: number; c: number}[] = [];

      for (let c = 0; c < COLS; c++) {
        let countInCol = 0;
        let colPositions: {r: number; c: number}[] = [];

        for (let r = 0; r < ROWS; r++) {
          if (currentGrid[r][c] === symbol || currentGrid[r][c] === 'WILD') {
            countInCol++;
            colPositions.push({ r, c });
          }
        }

        if (countInCol > 0) {
          ways *= countInCol;
          matchCount++;
          tempPositions.push(...colPositions);
        } else {
          break; // Must be adjacent from leftmost
        }
      }

      if (matchCount >= 3) {
        const payoutVal = PAYTABLE[symbol][matchCount];
        if (payoutVal > 0) {
          const cashWin = baseBet * payoutVal * ways * (freeSpinsActive ? freeSpinsMultiplier : multiplier);
          totalSpinWin += cashWin;

          // Save coordinates
          tempPositions.forEach(pos => {
            if (pos.c < matchCount && !newWinningPositions.some(p => p.r === pos.r && p.c === pos.c)) {
              newWinningPositions.push(pos);
            }
          });
        }
      }
    });

    if (totalSpinWin > 0) {
      setWinningPositions(newWinningPositions);
      setWinAmount(prev => prev + totalSpinWin);

      if (user) {
        await updateBalance(totalSpinWin, 'win', 'calavera-ink', { winningPositions: newWinningPositions });
        await PrizeService.commitPrize(user.id, totalSpinWin);
      }
      playSfx('win');

      if (freeSpinsActive) {
        setTotalFreeSpinWin(prev => prev + totalSpinWin);
      }

      // Setup for cascade: increase multiplier & slide down
      setTimeout(() => {
        // Increase multiplier (x1 -> x2 -> x3 -> x5)
        setMultiplier(prev => {
          if (prev === 1) return 2;
          if (prev === 2) return 3;
          return prev + 2; // Increments to 5, then 7, etc.
        });
        
        processCascade(currentGrid, newWinningPositions);
      }, 1000);

    } else {
      // Cascade ended, no more wins
      setWinningPositions([]);
      setIsSpinning(false);

      if (scatterTriggered) {
        playSfx('win');
        setFreeSpins(12);
        setTotalFreeSpinWin(0);
        setFreeSpinsMultiplier(2); // In Free spins, multipliers are doubled
        setFreeSpinsActive(true);
        setAutoPlay(false);
      }

      if (winAmount > 0) {
        if (winAmount >= baseBet * 20) {
          setShowBigWin(true);
          setIsShaking(true);
        } else {
          setShowWinCelebration(true);
        }
      }

      // Autoplay decrease
      if (autoPlay && autoSpinsLeft > 0) {
        setAutoSpinsLeft(prev => prev - 1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 relative overflow-hidden flex flex-col items-center">
      
      {/* Immersive Day of the Dead Dark Backdrop */}
      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-25 mix-blend-color-dodge filter blur-md" style={{ backgroundImage: `url(${coverImg})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-0 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[440px] px-4 flex flex-col relative z-10 flex-1 justify-between py-2">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <button onClick={() => navigate('/app')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400 font-extrabold tracking-widest text-sm uppercase">CALAVERA INK</span>
          </div>

          <button onClick={() => setShowInfoModal(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
            <Info size={18} />
          </button>
        </div>

        {/* Arched Gothic Frame with Multipliers */}
        <div className="relative mt-3 flex flex-col items-center">
          
          {/* Wooden / Arched Metal Crown Headpiece */}
          <div className="w-full h-16 bg-[#2C1810]/95 rounded-t-[30px] border-t-4 border-x-4 border-yellow-500/80 shadow-[0_4px_15px_rgba(234,179,8,0.4)] flex items-center justify-between px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />
            
            {/* Left Skull Emblem */}
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-yellow-500/40 flex items-center justify-center shadow-inner">
              <span className="text-[10px] font-bold text-yellow-400">☠</span>
            </div>

            {/* Glowing Active Multipliers (x1, x2, x3, x5) */}
            <div className="flex items-center gap-4 z-10">
              <span className={`text-sm font-black transition-all duration-300 ${multiplier === 1 ? 'text-yellow-400 scale-125 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'text-white/40'}`}>x1</span>
              <span className={`text-sm font-black transition-all duration-300 ${multiplier === 2 ? 'text-yellow-400 scale-125 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'text-white/40'}`}>x2</span>
              <span className={`text-sm font-black transition-all duration-300 ${multiplier === 3 ? 'text-yellow-400 scale-125 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'text-white/40'}`}>x3</span>
              <span className={`text-sm font-black transition-all duration-300 ${multiplier >= 5 ? 'text-yellow-400 scale-125 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'text-white/40'}`}>x{multiplier >= 5 ? multiplier : '5'}</span>
            </div>

            {/* Right Skull Emblem */}
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-yellow-500/40 flex items-center justify-center shadow-inner">
              <span className="text-[10px] font-bold text-yellow-400">☠</span>
            </div>
          </div>

          {/* Wooden serif Message Banner */}
          <div className="w-full py-1.5 bg-[#451A03] border-x-4 border-b-2 border-yellow-500/70 text-center shadow-md">
            <span className="text-[10px] font-serif italic text-amber-300 tracking-widest font-bold uppercase">
              {isSpinning ? 'CASCATAS ATIVAS!' : freeSpinsActive ? 'RODADAS GRÁTIS!' : 'MOLDURA DOURADA!'}
            </span>
          </div>
        </div>

        {/* 5x4 Slots Grid Container */}
        <div className={`relative bg-slate-950/95 border-4 border-yellow-500/80 rounded-b-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.9)] p-2 my-2 overflow-hidden ${isShaking ? 'animate-bounce' : ''}`}>
          
          <div className="grid grid-cols-5 gap-1.5 relative z-10">
            {Array.from({ length: COLS }).map((_, cIndex) => (
              <div key={cIndex} className="flex flex-col gap-1.5 relative">
                
                {/* Column Spinning Animation overlay */}
                {spinningCols[cIndex] && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/10 to-transparent animate-pulse z-20 pointer-events-none" />
                )}

                {grid.map((row, rIndex) => {
                  const sym = row[cIndex];
                  const frameKey = `${rIndex}_${cIndex}`;
                  const isWinning = winningPositions.some(p => p.r === rIndex && p.c === cIndex);
                  const hasGoldenFrame = goldenFrames.includes(frameKey);

                  return (
                    <div
                      key={rIndex}
                      className={`aspect-square w-full rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                        isWinning ? 'bg-amber-500/20 border-yellow-400 z-10' : ''
                      }`}
                    >
                      {/* Spinning blur overlay */}
                      {spinningCols[cIndex] ? (
                        <motion.div
                          animate={{ y: [-100, 100] }}
                          transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}
                          className="text-white/10 text-2xl font-black italic select-none"
                        >
                          ☠
                        </motion.div>
                      ) : (
                        renderCalaveraSymbol(sym, isWinning, hasGoldenFrame)
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Warm Flickering Animated Candles at bottom shelf */}
          <div className="absolute bottom-1 left-2 flex items-center gap-1 z-20 pointer-events-none">
            <div className="w-2.5 h-6 bg-amber-100 rounded-t-sm shadow-[0_0_10px_#F59E0B]">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mx-auto -mt-2 animate-ping" />
            </div>
            <div className="w-2.5 h-4 bg-amber-200 rounded-t-sm shadow-[0_0_8px_#F59E0B]">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mx-auto -mt-2 animate-ping" />
            </div>
          </div>

          <div className="absolute bottom-1 right-2 flex items-center gap-1 z-20 pointer-events-none">
            <div className="w-2.5 h-4 bg-amber-200 rounded-t-sm shadow-[0_0_8px_#F59E0B]">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mx-auto -mt-2 animate-ping" />
            </div>
            <div className="w-2.5 h-6 bg-amber-100 rounded-t-sm shadow-[0_0_10px_#F59E0B]">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mx-auto -mt-2 animate-ping" />
            </div>
          </div>
        </div>

        {/* Free Spins / General State status text */}
        {freeSpinsActive && (
          <div className="my-1.5 bg-purple-950/80 border border-purple-500/30 rounded-xl px-4 py-2 flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-purple-300 tracking-wider">Rodadas Grátis Restantes</span>
            <span className="text-lg font-black text-white font-mono">{freeSpins}</span>
          </div>
        )}

        {/* Bottom Digital Dashboard - Balance, Bet, Win */}
        <div className="bg-[#210c04]/90 border-2 border-yellow-600/50 rounded-2xl p-2.5 flex items-center justify-between gap-1.5 shadow-lg mt-1">
          {/* Balance */}
          <div className="flex-1 flex flex-col items-center px-1.5 border-r border-yellow-600/10">
            <span className="text-[8px] text-yellow-500/70 font-bold uppercase tracking-wider">Saldo</span>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-[#06B6D4] truncate">
              R$ {user?.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Active Bet */}
          <button
            onClick={() => !isSpinning && setShowBetSelectionModal(true)}
            className="flex-1 flex flex-col items-center px-1.5 border-r border-yellow-600/10 hover:bg-white/5 rounded-lg transition-colors"
            disabled={isSpinning}
          >
            <span className="text-[8px] text-yellow-500/70 font-bold uppercase tracking-wider">Aposta</span>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-[#06B6D4] flex items-center gap-0.5">
              R$ {activeBet.toFixed(2)}
            </span>
          </button>

          {/* Win */}
          <div className="flex-1 flex flex-col items-center px-1.5">
            <span className="text-[8px] text-yellow-500/70 font-bold uppercase tracking-wider">Ganho</span>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-[#10B981] truncate">
              R$ {winAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Footer / Main Controls Panel */}
        <div className="bg-[#1C0D02] rounded-3xl p-3 border border-yellow-600/30 flex items-center justify-between gap-3 mt-3 shadow-2xl">
          
          {/* Turbo button */}
          <button
            onClick={() => setIsTurbo(prev => prev === 'none' ? 'turbo' : 'none')}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl border transition-all duration-300 ${
              isTurbo === 'turbo' 
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                : 'bg-neutral-900/60 border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <Zap size={16} className={isTurbo === 'turbo' ? 'fill-emerald-400' : ''} />
            <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tighter">Turbo</span>
          </button>

          {/* Plus/Minus select bet shortcuts */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => !isSpinning && setBaseBet(prev => Math.max(0.4, prev - 0.4))}
              disabled={isSpinning || baseBet <= 0.4}
              className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30"
            >
              <Minus size={14} />
            </button>
            
            {/* Spinning Main Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={spin}
              disabled={isSpinning || (freeSpinsActive && freeSpins > 0)}
              className="relative w-18 h-18 rounded-full bg-gradient-to-r from-red-600 to-amber-600 flex items-center justify-center shadow-[0_4px_15px_rgba(239,68,68,0.4)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.6)] border-4 border-yellow-500"
            >
              <motion.div
                animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
                transition={{ repeat: isSpinning ? Infinity : 0, duration: 1.2, ease: "linear" }}
                className="absolute inset-0.5 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center"
              >
                {/* Embedded sugar skull inside the spin button */}
                <span className="text-xl">☠</span>
              </motion.div>
            </motion.button>

            <button
              onClick={() => !isSpinning && setBaseBet(prev => Math.min(100, prev + 0.4))}
              disabled={isSpinning}
              className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Auto button */}
          <button
            onClick={() => {
              if (autoPlay) {
                setAutoPlay(false);
                setAutoSpinsLeft(0);
              } else {
                setAutoPlay(true);
                setAutoSpinsLeft(10);
              }
            }}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl border transition-all duration-300 ${
              autoPlay 
                ? 'bg-amber-950/60 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                : 'bg-neutral-900/60 border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <RefreshCw size={16} className={autoPlay ? 'animate-spin' : ''} />
            <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tighter">
              {autoPlay ? `${autoSpinsLeft}` : 'Auto'}
            </span>
          </button>
        </div>

        {/* Floating time & legal text footer */}
        <div className="flex items-center justify-between py-1 px-1 mt-2 text-[8px] text-white/30 font-mono">
          <span>SUPORTE PG SOFT</span>
          <span>{currentTime}</span>
        </div>
      </div>

      {/* Info Rules Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900 border border-yellow-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowInfoModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-lg font-black text-yellow-400 mb-2 tracking-wider">REGRAS DO JOGO</h3>
              <div className="space-y-3 text-xs text-white/80 overflow-y-auto max-h-[300px] pr-2">
                <p><strong>Calavera Ink</strong> é um slot de 5 colunas e 4 linhas com cascatas ativas e multiplicadores crescentes.</p>
                <p><strong>Multiplicadores:</strong> Toda vitória em cascata aumenta o multiplicador para a próxima cascata do mesmo giro (x1 ➔ x2 ➔ x3 ➔ x5).</p>
                <p><strong>Molduras Douradas:</strong> Símbolos selecionados aleatoriamente nas colunas 2, 3 e 4 recebem uma moldura dourada. Se formarem combinação de vitória, transformam-se em <strong>WILD</strong> na próxima cascata!</p>
                <p><strong>Rodadas Grátis:</strong> 3 ou mais símbolos SCATTER ativam 12 Rodadas Grátis, onde os multiplicadores não resetam entre giros!</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bet Selection Modal */}
      <AnimatePresence>
        {showBetSelectionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900 border border-yellow-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowBetSelectionModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-base font-black text-yellow-400 mb-4 tracking-wider uppercase text-center">Selecionar Aposta</h3>
              
              <div className="grid grid-cols-3 gap-2">
                {[0.4, 0.8, 1.2, 2.0, 4.0, 10.0, 20.0, 50.0, 100.0].map(val => (
                  <button
                    key={val}
                    onClick={() => {
                      setBaseBet(val);
                      setShowBetSelectionModal(false);
                    }}
                    className={`py-3 rounded-xl border text-xs font-bold font-mono transition-all ${
                      baseBet === val 
                        ? 'bg-yellow-500 text-black border-yellow-400' 
                        : 'bg-slate-950 border-white/10 text-white/70 hover:bg-white/5'
                    }`}
                  >
                    R$ {val.toFixed(2)}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating win celebrations and Big wins overlay */}
      <AnimatePresence>
        {showWinCelebration && <WinCelebrationIndicator amount={winAmount} />}
        {showBigWin && <BigWinScreen amount={winAmount} onClose={() => { setShowBigWin(false); setIsShaking(false); }} />}
      </AnimatePresence>
    </div>
  );
}

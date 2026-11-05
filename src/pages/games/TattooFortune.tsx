import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import { 
  ArrowLeft, Info, HelpCircle, Coins, Zap, Minus, Plus, 
  RefreshCw, Volume2, VolumeX, X, Star, Sparkles, Trophy, 
  Flame, ZapOff 
} from 'lucide-react';
import { GameLoader } from '../../components/GameLoader';
import { ConfirmExitModal } from '../../components/ConfirmExitModal';
import { GameAlertModal } from '../../components/GameAlertModal';
import { triggerWinConfetti, triggerBigWinConfetti } from '../../lib/confetti';

// 5x4 Grid definition
const ROWS = 4;
const COLS = 5;

// Symbol values and multipliers
interface GameSymbol {
  id: string;
  name: string;
  description: string;
  multiplier: number[]; // Index 0=3 matches, 1=4 matches, 2=5 matches
  color: string;
  shadow: string;
}

const SYMBOLS: Record<string, GameSymbol> = {
  TATTOO_MACHINE: {
    id: 'TATTOO_MACHINE',
    name: 'Máquina Pró',
    description: 'Máquina de tatuagem premium preta e dourada',
    multiplier: [5, 15, 50],
    color: '#F5C518',
    shadow: 'shadow-[0_0_20px_rgba(245,197,24,0.6)]'
  },
  CALAVERA: {
    id: 'CALAVERA',
    name: 'Calavera Neon',
    description: 'Caveira estilizada em arte de tatuagem neon',
    multiplier: [4, 10, 30],
    color: '#00F5FF',
    shadow: 'shadow-[0_0_20px_rgba(0,245,255,0.6)]'
  },
  ROSE: {
    id: 'ROSE',
    name: 'Rosa Tradicional',
    description: 'Rosa tradicional de tattoo',
    multiplier: [3, 8, 20],
    color: '#FF00A8',
    shadow: 'shadow-[0_0_20px_rgba(255,0,168,0.6)]'
  },
  TIGER: {
    id: 'TIGER',
    name: 'Tigre Tradicional',
    description: 'Cabeça de tigre em estilo tattoo tradicional',
    multiplier: [2.5, 6, 15],
    color: '#FF7A00',
    shadow: 'shadow-[0_0_20px_rgba(255,122,0,0.6)]'
  },
  TATTOO_HEART: {
    id: 'TATTOO_HEART',
    name: 'Coração LT',
    description: 'Coração tradicional tatuado',
    multiplier: [2, 5, 12],
    color: '#EF4444',
    shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]'
  },
  ANCHOR: {
    id: 'ANCHOR',
    name: 'Âncora Oldschool',
    description: 'Âncora tradicional',
    multiplier: [1.5, 3.5, 8],
    color: '#3B82F6',
    shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]'
  },
  BUTTERFLY: {
    id: 'BUTTERFLY',
    name: 'Borboleta Neon',
    description: 'Borboleta estilizada',
    multiplier: [1.2, 2.5, 6],
    color: '#A855F7',
    shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]'
  },
  SKULL_FLAME: {
    id: 'SKULL_FLAME',
    name: 'Caveira Flame',
    description: 'Caveira com chamas neon',
    multiplier: [1, 2, 5],
    color: '#F97316',
    shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]'
  },
  INK_BOTTLE: {
    id: 'INK_BOTTLE',
    name: 'Vidro de Tinta',
    description: 'Frasco de tinta para tatuagem',
    multiplier: [0.8, 1.5, 4],
    color: '#10B981',
    shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]'
  },
  WILD: {
    id: 'WILD',
    name: 'Tattoo Wild',
    description: 'Coringa - máquina cercada por tinta neon',
    multiplier: [0, 0, 0],
    color: '#00D9FF',
    shadow: 'shadow-[0_0_25px_rgba(0,217,255,0.8)]'
  },
  BONUS: {
    id: 'BONUS',
    name: 'Tattoo Bonus',
    description: 'Ativa rodadas de Tattoo Bonus',
    multiplier: [0, 0, 0],
    color: '#7A00FF',
    shadow: 'shadow-[0_0_25px_rgba(122,0,255,0.8)]'
  },
  A: { id: 'A', name: 'A', description: 'Gothic A', multiplier: [0.4, 0.8, 2], color: '#FFFFFF', shadow: 'shadow-none' },
  K: { id: 'K', name: 'K', description: 'Gothic K', multiplier: [0.3, 0.6, 1.5], color: '#FFFFFF', shadow: 'shadow-none' },
  Q: { id: 'Q', name: 'Q', description: 'Gothic Q', multiplier: [0.2, 0.4, 1.2], color: '#FFFFFF', shadow: 'shadow-none' },
  J: { id: 'J', name: 'J', description: 'Gothic J', multiplier: [0.15, 0.3, 1], color: '#FFFFFF', shadow: 'shadow-none' },
  10: { id: '10', name: '10', description: 'Gothic 10', multiplier: [0.1, 0.2, 0.8], color: '#FFFFFF', shadow: 'shadow-none' }
};

// Weighted symbols array for standard generation
const SYMBOL_POOL = [
  ...Array(4).fill('TATTOO_MACHINE'),
  ...Array(5).fill('CALAVERA'),
  ...Array(6).fill('ROSE'),
  ...Array(7).fill('TIGER'),
  ...Array(8).fill('TATTOO_HEART'),
  ...Array(9).fill('ANCHOR'),
  ...Array(10).fill('BUTTERFLY'),
  ...Array(11).fill('SKULL_FLAME'),
  ...Array(12).fill('INK_BOTTLE'),
  ...Array(4).fill('WILD'),
  ...Array(3).fill('BONUS'),
  ...Array(14).fill('A'),
  ...Array(15).fill('K'),
  ...Array(16).fill('Q'),
  ...Array(17).fill('J'),
  ...Array(18).fill('10')
];

// Definition of 50 paylines
const PAYLINES = [
  // Horizontal lines
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [3, 3, 3, 3, 3],
  // V shapes and inverted V shapes
  [0, 1, 2, 1, 0],
  [3, 2, 1, 2, 3],
  [1, 2, 3, 2, 1],
  [2, 1, 0, 1, 2],
  // W and M patterns
  [0, 2, 0, 2, 0],
  [3, 1, 3, 1, 3],
  [1, 3, 1, 3, 1],
  [2, 0, 2, 0, 2],
  // Zigzags
  [0, 1, 0, 1, 0],
  [1, 2, 1, 2, 1],
  [2, 3, 2, 3, 2],
  [3, 2, 3, 2, 3],
  [2, 1, 2, 1, 2],
  [1, 0, 1, 0, 1],
  // Diagonal combinations
  [0, 1, 2, 3, 2],
  [3, 2, 1, 0, 1],
  [1, 2, 3, 2, 3],
  [2, 1, 0, 1, 0],
  // Peak and Valley shapes
  [0, 3, 0, 3, 0],
  [3, 0, 3, 0, 3],
  [1, 0, 3, 0, 1],
  [2, 3, 0, 3, 2],
  // Steps
  [0, 0, 1, 2, 2],
  [3, 3, 2, 1, 1],
  [1, 1, 2, 3, 3],
  [2, 2, 1, 0, 0],
  // Custom Waves
  [0, 2, 3, 2, 0],
  [3, 1, 0, 1, 3],
  [0, 1, 3, 1, 0],
  [3, 2, 0, 2, 3],
  [1, 0, 1, 2, 3],
  [2, 3, 2, 1, 0],
  // Other mixed offsets
  [0, 0, 2, 2, 0],
  [1, 1, 3, 3, 1],
  [2, 2, 0, 0, 2],
  [3, 3, 1, 1, 3],
  [0, 3, 3, 3, 0],
  [3, 0, 0, 0, 3],
  [1, 2, 2, 2, 1],
  [2, 1, 1, 1, 2],
  [0, 1, 1, 1, 0],
  [3, 2, 2, 2, 3],
  [1, 0, 0, 0, 1],
  [2, 3, 3, 3, 2],
  [0, 2, 2, 2, 0],
  [3, 1, 1, 1, 3]
];

export function TattooFortune() {
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  const { playSfx, isMuted, toggleMute } = useAudio();

  // Load and general loading states
  const [isLoading, setIsLoading] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type: 'insufficient_balance' | 'info' | 'error' } | null>(null);

  // Slot States
  const [bet, setBet] = useState(1.00);
  const [grid, setGrid] = useState<string[][]>([
    ['A', 'ROSE', 'ANCHOR', 'SKULL_FLAME', 'K'],
    ['CALAVERA', 'WILD', 'TATTOO_HEART', 'BUTTERFLY', 'Q'],
    ['TIGER', 'INK_BOTTLE', 'BONUS', 'ROSE', 'J'],
    ['10', 'CALAVERA', 'A', 'K', 'TATTOO_MACHINE']
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false]);
  const [winAmount, setWinAmount] = useState(0);
  const [winningPaylines, setWinningPaylines] = useState<{ lineIdx: number; count: number; symbol: string; payout: number }[]>([]);
  const [winningCells, setWinningCells] = useState<{ r: number; c: number }[]>([]);

  // Special Feature States
  const [isTurbo, setIsTurbo] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isBonusMode, setIsBonusMode] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [totalBonusWins, setTotalBonusWins] = useState(0);
  const [currentBonusMultiplier, setCurrentBonusMultiplier] = useState(1);
  const [showBonusCelebration, setShowBonusCelebration] = useState(false);
  const [showBigWinCelebration, setShowBigWinCelebration] = useState(false);
  const [bigWinValue, setBigWinValue] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [characterMood, setCharacterMood] = useState<'idle' | 'spinning' | 'winning' | 'bonus'>('idle');

  const autoPlayRef = useRef(autoPlay);
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  // Handle Initial Loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Symbol SVGs to avoid any broken assets and match the design perfectly
  const renderSymbolSVG = (id: string) => {
    const color = SYMBOLS[id]?.color || '#FFFFFF';
    switch (id) {
      case 'TATTOO_MACHINE':
        return (
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2A3" />
                <stop offset="50%" stopColor="#F5C518" />
                <stop offset="100%" stopColor="#9E7806" />
              </linearGradient>
            </defs>
            {/* Machine Frame */}
            <path d="M 25 30 L 75 30 L 75 40 L 60 40 L 60 70 L 40 70 L 40 40 L 25 40 Z" fill="url(#goldGrad)" stroke="#111111" strokeWidth="2" />
            {/* Magnetic Coils */}
            <rect x="35" y="42" width="12" height="18" fill="#111111" rx="2" />
            <rect x="53" y="42" width="12" height="18" fill="#111111" rx="2" />
            <path d="M 33 51 L 67 51" stroke="#EF4444" strokeWidth="2.5" />
            {/* Armature Bar */}
            <rect x="32" y="36" width="36" height="5" fill="#4B5563" />
            {/* Tube and Grip */}
            <path d="M 50 65 L 50 85 L 47 88 L 47 95 L 53 95 L 53 88 Z" fill="#9CA3AF" stroke="#111" strokeWidth="1.5" />
            {/* Neon Accent Sparks */}
            <circle cx="50" cy="51" r="5" fill="#FFF" className="animate-ping" />
            <circle cx="50" cy="95" r="3" fill={color} />
          </svg>
        );
      case 'CALAVERA':
        return (
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <radialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF" />
                <stop offset="50%" stopColor="#00F5FF" />
                <stop offset="100%" stopColor="#005577" />
              </radialGradient>
            </defs>
            {/* Skull Base */}
            <path d="M 30 40 C 30 20, 70 20, 70 40 C 70 55, 65 65, 60 70 L 60 82 C 60 85, 40 85, 40 82 L 40 70 C 35 65, 30 55, 30 40 Z" fill="#F3F4F6" stroke="#111111" strokeWidth="2" />
            {/* Teeth Stitching */}
            <line x1="45" y1="76" x2="55" y2="76" stroke="#111111" strokeWidth="2" />
            <line x1="48" y1="72" x2="48" y2="80" stroke="#111111" strokeWidth="1.5" />
            <line x1="52" y1="72" x2="52" y2="80" stroke="#111111" strokeWidth="1.5" />
            {/* Glowing Eye Sockets */}
            <circle cx="42" cy="45" r="8" fill="url(#cyanGlow)" stroke="#111" strokeWidth="1" />
            <circle cx="58" cy="45" r="8" fill="url(#cyanGlow)" stroke="#111" strokeWidth="1" />
            <circle cx="42" cy="45" r="2" fill="#000" />
            <circle cx="58" cy="45" r="2" fill="#000" />
            {/* Nose cavity */}
            <path d="M 50 52 L 47 58 L 53 58 Z" fill="#111111" />
            {/* Traditional Flowers/Stars decoration on head */}
            <path d="M 50 22 L 53 28 L 50 34 L 47 28 Z" fill="#FF00A8" />
          </svg>
        );
      case 'ROSE':
        return (
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF66D4" />
                <stop offset="50%" stopColor="#FF00A8" />
                <stop offset="100%" stopColor="#800050" />
              </linearGradient>
            </defs>
            {/* Traditional Leaves */}
            <path d="M 25 35 Q 15 50, 35 45 Z" fill="#059669" stroke="#111" strokeWidth="1.5" />
            <path d="M 75 65 Q 85 50, 65 55 Z" fill="#059669" stroke="#111" strokeWidth="1.5" />
            {/* Rose Petal Clusters */}
            <circle cx="50" cy="50" r="28" fill="url(#roseGrad)" stroke="#111" strokeWidth="2" />
            <path d="M 32 45 C 32 30, 68 30, 68 45 C 68 60, 32 60, 32 45 Z" fill="#E11D48" stroke="#111" strokeWidth="1.5" />
            <path d="M 40 48 C 40 38, 60 38, 60 48 C 60 58, 40 58, 40 48 Z" fill="#BE123C" stroke="#111" strokeWidth="1.5" />
            {/* Center Swirl */}
            <path d="M 47 48 Q 50 43 53 48 Q 50 53 47 48 Z" fill="#9F1239" stroke="#111" strokeWidth="1" />
          </svg>
        );
      case 'TIGER':
        return (
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="tigerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB057" />
                <stop offset="50%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#B34F00" />
              </linearGradient>
            </defs>
            {/* Head Base */}
            <path d="M 22 40 C 22 15, 78 15, 78 40 C 78 65, 72 75, 50 85 C 28 75, 22 65, 22 40 Z" fill="url(#tigerGrad)" stroke="#111111" strokeWidth="2" />
            {/* Ears */}
            <path d="M 25 22 L 15 8 L 32 15 Z" fill="#FF7A00" stroke="#111" strokeWidth="2" />
            <path d="M 75 22 L 85 8 L 68 15 Z" fill="#FF7A00" stroke="#111" strokeWidth="2" />
            <path d="M 23 20 L 18 11 L 28 15 Z" fill="#FCA5A5" />
            <path d="M 77 20 L 82 11 L 72 15 Z" fill="#FCA5A5" />
            {/* Snout and Mouth */}
            <path d="M 40 68 C 40 60, 60 60, 60 68 C 60 76, 40 76, 40 68 Z" fill="#FFF" stroke="#111" strokeWidth="1.5" />
            <path d="M 45 68 L 50 72 L 55 68" fill="none" stroke="#111" strokeWidth="1.5" />
            {/* Nose */}
            <polygon points="46,55 54,55 50,61" fill="#EF4444" stroke="#111" strokeWidth="1" />
            {/* Eyes */}
            <polygon points="32,45 44,45 40,40" fill="#F5C518" stroke="#111" strokeWidth="1.5" />
            <polygon points="68,45 56,45 60,40" fill="#F5C518" stroke="#111" strokeWidth="1.5" />
            <circle cx="38" cy="44" r="1.5" fill="#000" />
            <circle cx="62" cy="44" r="1.5" fill="#000" />
            {/* Tiger Stripes */}
            <path d="M 23 35 L 35 37 L 23 39 Z" fill="#111" />
            <path d="M 77 35 L 65 37 L 77 39 Z" fill="#111" />
            <path d="M 23 50 L 32 51 L 23 53 Z" fill="#111" />
            <path d="M 77 50 L 68 51 L 77 53 Z" fill="#111" />
            <path d="M 45 20 L 50 35 L 55 20 Z" fill="#111" />
            {/* Fangs */}
            <polygon points="42,67 44,74 46,67" fill="#FFF" />
            <polygon points="58,67 56,74 54,67" fill="#FFF" />
          </svg>
        );
      case 'TATTOO_HEART':
        return (
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            {/* Traditional Heart */}
            <path d="M 50 35 C 50 15, 15 15, 15 45 C 15 70, 50 90, 50 90 C 50 90, 85 70, 85 45 C 85 15, 50 15, 50 35 Z" fill="#EF4444" stroke="#111" strokeWidth="2.5" />
            {/* Banner Overlay */}
            <path d="M 10 50 L 90 50 L 85 62 L 15 62 Z" fill="#FFF" stroke="#111" strokeWidth="1.5" />
            {/* Banner Ribbons folded */}
            <path d="M 10 50 L 15 42 L 15 50 Z" fill="#D1D5DB" stroke="#111" strokeWidth="1" />
            <path d="M 90 50 L 85 42 L 85 50 Z" fill="#D1D5DB" stroke="#111" strokeWidth="1" />
            <text x="50" y="59" fill="#111" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="1">LT JOGOS</text>
            {/* Golden Star reflection */}
            <path d="M 30 28 L 33 33 L 38 33 L 34 37 L 36 42 L 30 39 L 24 42 L 26 37 L 22 33 L 27 33 Z" fill="#F5C518" />
          </svg>
        );
      case 'ANCHOR':
        return (
          <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
            {/* Vertical Shank */}
            <rect x="46" y="20" width="8" height="55" fill="#9CA3AF" stroke="#111" strokeWidth="1.5" />
            {/* Ring at top */}
            <circle cx="50" cy="18" r="8" fill="none" stroke="#9CA3AF" strokeWidth="3" />
            {/* Crossbar */}
            <rect x="30" y="32" width="40" height="6" fill="#6B7280" stroke="#111" strokeWidth="1.5" rx="1" />
            {/* Anchor Flukes (curve) */}
            <path d="M 20 50 C 20 80, 80 80, 80 50" fill="none" stroke="#9CA3AF" strokeWidth="8" strokeLinecap="round" />
            {/* Pointy Tips */}
            <polygon points="14,48 24,48 19,38" fill="#4B5563" stroke="#111" strokeWidth="1" />
            <polygon points="86,48 76,48 81,38" fill="#4B5563" stroke="#111" strokeWidth="1" />
            {/* Middle hole */}
            <circle cx="50" cy="62" r="3" fill="#111" />
          </svg>
        );
      case 'BUTTERFLY':
        return (
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            {/* Left Wings */}
            <path d="M 50 50 C 35 15, 10 15, 15 45 C 18 55, 30 60, 50 50 Z" fill="#D946EF" stroke="#111" strokeWidth="1.5" />
            <path d="M 50 50 C 38 60, 20 70, 25 85 C 30 90, 45 75, 50 50 Z" fill="#A855F7" stroke="#111" strokeWidth="1.5" />
            {/* Right Wings */}
            <path d="M 50 50 C 65 15, 90 15, 85 45 C 82 55, 70 60, 50 50 Z" fill="#D946EF" stroke="#111" strokeWidth="1.5" />
            <path d="M 50 50 C 62 60, 80 70, 75 85 C 70 90, 55 75, 50 50 Z" fill="#A855F7" stroke="#111" strokeWidth="1.5" />
            {/* Body */}
            <ellipse cx="50" cy="50" rx="3" ry="25" fill="#111111" />
            {/* Antennae */}
            <path d="M 48 25 Q 40 12, 34 14" fill="none" stroke="#111" strokeWidth="2" />
            <path d="M 52 25 Q 60 12, 66 14" fill="none" stroke="#111" strokeWidth="2" />
            {/* Glowing neon spots */}
            <circle cx="30" cy="35" r="4" fill="#00FFFF" />
            <circle cx="70" cy="35" r="4" fill="#00FFFF" />
          </svg>
        );
      case 'SKULL_FLAME':
        return (
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="50%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#F5C518" />
              </linearGradient>
            </defs>
            {/* Background fire */}
            <path d="M 15 55 Q 30 10, 35 25 Q 50 2, 60 30 Q 75 10, 85 55 Q 50 98, 15 55 Z" fill="url(#fireGrad)" opacity="0.9" />
            {/* Dark Mini Skull on top */}
            <path d="M 38 52 C 38 40, 62 40, 62 52 C 62 62, 58 68, 55 71 L 55 78 C 55 80, 45 80, 45 78 L 45 71 C 42 68, 38 62, 38 52 Z" fill="#1F2937" stroke="#111" strokeWidth="1.5" />
            <circle cx="45" cy="53" r="3.5" fill="#EF4444" />
            <circle cx="55" cy="53" r="3.5" fill="#EF4444" />
            <path d="M 49 59 L 47 64 L 53 64 Z" fill="#111" />
          </svg>
        );
      case 'INK_BOTTLE':
        return (
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            {/* Glass Bottle Outline */}
            <rect x="36" y="38" width="28" height="46" rx="6" fill="rgba(16,185,129,0.2)" stroke="#111" strokeWidth="2" />
            {/* Liquid inside */}
            <rect x="38" y="52" width="24" height="30" rx="3" fill="#10B981" />
            {/* Bottle Neck & Cap */}
            <rect x="44" y="24" width="12" height="14" fill="#374151" stroke="#111" strokeWidth="1.5" />
            <ellipse cx="50" cy="24" rx="6" ry="2" fill="#1F2937" />
            {/* Skull Dropper logo on bottle */}
            <circle cx="50" cy="64" r="5" fill="#FFF" stroke="#111" strokeWidth="1" />
            <line x1="47" y1="67" x2="53" y2="67" stroke="#111" />
            {/* Dropper tip */}
            <line x1="50" y1="20" x2="50" y2="10" stroke="#EF4444" strokeWidth="2" />
            <circle cx="50" cy="8" r="3" fill="#EF4444" />
          </svg>
        );
      case 'WILD':
        return (
          <svg viewBox="0 0 100 100" className="w-[90%] h-[90%]">
            <defs>
              <linearGradient id="wildGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F5FF" />
                <stop offset="50%" stopColor="#7A00FF" />
                <stop offset="100%" stopColor="#FF00A8" />
              </linearGradient>
            </defs>
            {/* Outer dripping circle */}
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#wildGrad)" strokeWidth="4" strokeDasharray="6 3" className="animate-spin" style={{ animationDuration: '6s' }} />
            {/* Pulsating Neon star background */}
            <path d="M 50 15 L 61 38 L 85 41 L 67 58 L 72 82 L 50 70 L 28 82 L 33 58 L 15 41 L 39 38 Z" fill="url(#wildGrad)" opacity="0.3" className="animate-pulse" />
            {/* WILD Bold lettering */}
            <text x="50" y="56" fill="#FFF" fontSize="22" fontWeight="900" textAnchor="middle" stroke="#000" strokeWidth="2" letterSpacing="1" className="animate-pulse">WILD</text>
            <text x="50" y="72" fill="#00FFFF" fontSize="9" fontWeight="800" textAnchor="middle" stroke="#000" strokeWidth="1">CORINGA</text>
          </svg>
        );
      case 'BONUS':
        return (
          <svg viewBox="0 0 100 100" className="w-[90%] h-[90%]">
            <defs>
              <radialGradient id="bonusGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFF00" />
                <stop offset="60%" stopColor="#7A00FF" />
                <stop offset="100%" stopColor="#0F051D" />
              </radialGradient>
            </defs>
            {/* Outer glowing border */}
            <circle cx="50" cy="50" r="40" fill="url(#bonusGlow)" stroke="#FFF" strokeWidth="2" className="animate-pulse" />
            {/* Crown */}
            <path d="M 30 65 L 35 40 L 45 52 L 50 35 L 55 52 L 65 40 L 70 65 Z" fill="#F5C518" stroke="#111" strokeWidth="1.5" />
            <circle cx="35" cy="38" r="2" fill="#FFF" />
            <circle cx="50" cy="33" r="2" fill="#FFF" />
            <circle cx="65" cy="38" r="2" fill="#FFF" />
            {/* BONUS bold script */}
            <text x="50" y="80" fill="#FFFF00" fontSize="15" fontWeight="900" textAnchor="middle" stroke="#111" strokeWidth="1.5" letterSpacing="0.5" className="animate-bounce">BÔNUS</text>
          </svg>
        );
      default:
        // Gothic style card suits
        return (
          <div className="flex items-center justify-center h-full w-full font-black text-3xl tracking-tighter" style={{ color: color, textShadow: '0 0 10px rgba(255,255,255,0.4)' }}>
            <span className="font-serif italic">{id}</span>
          </div>
        );
    }
  };

  // Sound Engine
  const playLocalSfx = (type: 'spin' | 'click' | 'win' | 'bonus' | 'bigwin') => {
    if (isMuted) return;
    try {
      playSfx(type as any);
    } catch {}
  };

  // Adjust Bet Value
  const handleBetChange = (direction: 'up' | 'down') => {
    playLocalSfx('click');
    const betValues = [0.50, 1.00, 2.00, 4.00, 5.00, 10.00, 20.00, 50.00, 100.00];
    const currentIndex = betValues.indexOf(bet);
    if (direction === 'up' && currentIndex < betValues.length - 1) {
      setBet(betValues[currentIndex + 1]);
    } else if (direction === 'down' && currentIndex > 0) {
      setBet(betValues[currentIndex - 1]);
    }
  };

  // Main Spin Action
  const triggerSpin = async () => {
    if (isSpinning) return;
    
    // Check balance
    if (!user || user.balance < bet) {
      setAutoPlay(false);
      setAlertModal({
        isOpen: true,
        message: 'Saldo insuficiente para realizar a aposta.',
        type: 'insufficient_balance'
      });
      return;
    }

    // Reset previous wins
    setWinAmount(0);
    setWinningPaylines([]);
    setWinningCells([]);
    setIsSpinning(true);
    setCharacterMood('spinning');

    // Reel sequence start (All reels start spinning instantly for maximum responsiveness!)
    setSpinningReels([true, true, true, true, true]);
    playLocalSfx('spin');

    // Deduct bet (asynchronous background database update)
    const realCost = isBonusMode ? 0 : -bet;
    if (realCost < 0) {
      try {
        await updateBalance(realCost, 'bet', 'tattoo-fortune', { bet });
      } catch (err) {
        console.error("Failed to update balance for bet:", err);
      }
    }

    // Run spin simulation (Generate and evaluate grid after time)
    setTimeout(() => {
      // Generate random result
      const newGrid: string[][] = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => {
          if (isBonusMode) {
            // No BONUS symbols allowed inside bonus mode
            if (Math.random() < 0.10) {
              return 'WILD'; // Convert potential bonus/wild chance into purely WILD
            }
            // Filter out 'BONUS' from standard pool
            let symbolSelected = 'A';
            do {
              symbolSelected = SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
            } while (symbolSelected === 'BONUS');
            return symbolSelected;
          }

          // Normal mode (allows BONUS symbols)
          return SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
        })
      );

      // Force a bonus feature occasionally to keep it extremely exciting
      const forceBonus = !isBonusMode && Math.random() < 0.04;
      if (forceBonus) {
        // Place at least 3 bonus symbols on different reels
        newGrid[Math.floor(Math.random() * ROWS)][0] = 'BONUS';
        newGrid[Math.floor(Math.random() * ROWS)][2] = 'BONUS';
        newGrid[Math.floor(Math.random() * ROWS)][4] = 'BONUS';
      }

      // Staggered stop sequence
      [0, 1, 2, 3, 4].forEach(idx => {
        setTimeout(() => {
          // Update this specific column in the grid with the new symbols immediately as it stops
          setGrid(currentGrid => {
            const nextGrid = currentGrid.map((row, rIdx) => {
              const newRow = [...row];
              newRow[idx] = newGrid[rIdx][idx];
              return newRow;
            });
            return nextGrid;
          });

          setSpinningReels(prev => {
            const next = [...prev];
            next[idx] = false;
            return next;
          });
          playLocalSfx('click');

          // On last reel stop, evaluate results
          if (idx === COLS - 1) {
            evaluateResults(newGrid);
          }
        }, idx * (isTurbo ? 50 : 200));
      });

    }, isTurbo ? 300 : 1000);
  };

  // Payline Evaluation Engine
  const evaluateResults = async (evaluatedGrid: string[][]) => {
    const hits: typeof winningPaylines = [];
    const activeWinningCells: typeof winningCells = [];
    let payoutTotal = 0;
    let bonusSymbolCount = 0;

    // Count bonus scatter symbols anywhere in the grid
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (evaluatedGrid[r][c] === 'BONUS') {
          bonusSymbolCount++;
        }
      }
    }

    // Evaluate each of the 50 paylines
    PAYLINES.forEach((line, lineIdx) => {
      // Get symbols along the payline path
      const symbolsOnLine = line.map((rowIdx, colIdx) => evaluatedGrid[rowIdx][colIdx]);
      
      // Check matching from left-to-right (min 3)
      const firstSym = symbolsOnLine[0];
      if (firstSym === 'BONUS') return; // Bonus scatters don't pay on paylines

      let matchCount = 1;
      let matchSymbol = firstSym === 'WILD' ? null : firstSym;

      for (let i = 1; i < COLS; i++) {
        const currentSym = symbolsOnLine[i];
        if (currentSym === 'BONUS') break;

        if (currentSym === 'WILD') {
          matchCount++;
        } else if (matchSymbol === null) {
          matchSymbol = currentSym;
          matchCount++;
        } else if (currentSym === matchSymbol) {
          matchCount++;
        } else {
          break;
        }
      }

      // If we have a matching streak of 3, 4, or 5
      if (matchCount >= 3 && matchSymbol) {
        const multiplierArr = SYMBOLS[matchSymbol]?.multiplier;
        if (multiplierArr) {
          const mult = multiplierArr[matchCount - 3];
          const linePayout = bet * mult;
          payoutTotal += linePayout;

          hits.push({
            lineIdx,
            count: matchCount,
            symbol: matchSymbol,
            payout: linePayout
          });

          // Register matching cells for high-visibility flash highlight
          for (let i = 0; i < matchCount; i++) {
            activeWinningCells.push({ r: line[i], c: i });
          }
        }
      }
    });

    // Handle Bonus triggers
    const triggerBonusRound = bonusSymbolCount >= 3;

    // Apply global free-spins multiplier if in bonus mode
    if (isBonusMode) {
      payoutTotal = payoutTotal * currentBonusMultiplier;
    }

    // Update states
    setWinningPaylines(hits);
    setWinningCells(activeWinningCells);
    setIsSpinning(false);

    if (payoutTotal > 0) {
      setWinAmount(payoutTotal);
      setCharacterMood('winning');

      // Update actual database balance with win amount
      await updateBalance(payoutTotal, 'win', 'tattoo-fortune', { bet, win: payoutTotal });

      if (isBonusMode) {
        setTotalBonusWins(prev => prev + payoutTotal);
      }

      // Big Win celebration (> 15x bet)
      if (payoutTotal >= bet * 15) {
        setBigWinValue(payoutTotal);
        setTimeout(() => {
          setShowBigWinCelebration(true);
          playLocalSfx('bigwin');
          triggerBigWinConfetti();
        }, 150);
      } else {
        playLocalSfx('win');
        triggerWinConfetti();
      }
    } else {
      setCharacterMood('idle');
    }

    // Handle Transition to/from Free Spins Bonus mode
    if (triggerBonusRound) {
      setCharacterMood('bonus');
      playLocalSfx('bonus');
      setTimeout(() => {
        setShowBonusCelebration(true);
        triggerBigWinConfetti();
      }, 500);
    } else if (isBonusMode) {
      // Countdown free spins
      setFreeSpinsLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          // Finish Free spins
          setTimeout(() => {
            setAlertModal({
              isOpen: true,
              message: `BÔNUS CONCLUÍDO! Ative seu prêmio em tatuagem de R$ ${(totalBonusWins + payoutTotal).toFixed(2)} no seu estúdio parceiro de escolha ou continue jogando!`,
              type: 'info'
            });
            setIsBonusMode(false);
            setTotalBonusWins(0);
          }, 1500);
        }
        return next;
      });
    }
  };

  // Start Bonus Free Spins
  const startFreeSpins = () => {
    setShowBonusCelebration(false);
    setIsBonusMode(true);
    setFreeSpinsLeft(5);
    setTotalBonusWins(0);
    setAutoPlay(true); // Automatically run spins during bonus
    // Set a random gorgeous multiplier: x2, x3, x5, or x10
    const mults = [2, 3, 5, 10];
    setCurrentBonusMultiplier(mults[Math.floor(Math.random() * mults.length)]);
  };

  // Auto Spin handler loop
  useEffect(() => {
    let timer: any = null;
    if (autoPlay && !isSpinning && !showBonusCelebration && !showBigWinCelebration) {
      // If in bonus mode, free spins automatically trigger next spins
      if (isBonusMode && freeSpinsLeft <= 0) {
        setAutoPlay(false);
      } else {
        timer = setTimeout(() => {
          triggerSpin();
        }, 1200);
      }
    }
    return () => clearTimeout(timer);
  }, [autoPlay, isSpinning, showBonusCelebration, showBigWinCelebration, isBonusMode, freeSpinsLeft]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#050509] text-white select-none overflow-hidden h-screen w-screen z-50">
      {/* Absolute background picture/layer matching user uploaded design */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.25] pointer-events-none z-0" 
        style={{ backgroundImage: "url('/file_00000000d26c820e81ee5d37374ccc1e.png')" }} 
      />

      {/* Top Header Row with LT JOGOS Brand */}
      <header className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <button 
          onClick={() => setShowExitModal(true)} 
          className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-white/80 active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-amber-400 tracking-[0.25em] uppercase">LT JOGOS</span>
          <span className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500">
            TATTOO FORTUNE
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setShowInfo(true)} 
            className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-white/80 active:scale-95"
          >
            <HelpCircle size={20} />
          </button>
          <button 
            onClick={toggleMute} 
            className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-white/80 active:scale-95"
          >
            {isMuted ? <VolumeX size={20} className="text-red-500" /> : <Volume2 size={20} />}
          </button>
        </div>
      </header>

      {/* Main Container Area */}
      <div className="flex-1 relative z-10 flex flex-col justify-between max-w-md mx-auto w-full px-4 pt-1 pb-4 overflow-hidden">
        
        {/* Upper Center Character Mascot Area */}
        <section className="flex flex-col items-center justify-center pt-1.5 relative">
          <div className="relative w-24 h-28 md:w-40 md:h-44 flex items-center justify-center overflow-visible">
            {/* Animated neon tattoo sign background */}
            <div className="absolute -inset-4 bg-gradient-to-r from-fuchsia-600/10 via-cyan-600/10 to-pink-600/10 rounded-full blur-2xl animate-pulse pointer-events-none" />

            {/* SVG Tattoo Artist Mascot */}
            <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,0,168,0.3)]">
              <defs>
                <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E1B4B" />
                  <stop offset="50%" stopColor="#701A75" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
                <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFEDD5" />
                  <stop offset="100%" stopColor="#FED7AA" />
                </linearGradient>
              </defs>

              {/* Character Base & Neck with Flame/Rose Tattoos */}
              <path d="M 40 100 Q 50 85 50 78 L 70 78 Q 70 85 80 100" fill="url(#skinGrad)" />
              {/* Neck tattoo details */}
              <path d="M 52 82 Q 60 90 60 96 M 68 82 Q 60 90 60 96" stroke="#1E2937" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />

              {/* Head / Face */}
              <ellipse cx="60" cy="62" rx="22" ry="24" fill="url(#skinGrad)" stroke="#111" strokeWidth="1.5" />
              <path d="M 42 66 Q 60 78 78 66" fill="none" stroke="#111" strokeWidth="1" />
              <path d="M 55 72 Q 60 76 65 72" fill="none" stroke="#D97706" strokeWidth="1.5" />

              {/* Cool goatee beard */}
              <path d="M 54 81 L 60 88 L 66 81 L 60 84 Z" fill="#111111" />

              {/* Eyes and Eyebrows */}
              <path d="M 44 54 Q 50 51 54 55" stroke="#111" strokeWidth="2.5" fill="none" />
              <path d="M 66 55 Q 70 51 76 54" stroke="#111" strokeWidth="2.5" fill="none" />

              {/* Stylish sunglasses reflecting neon */}
              <path d="M 38 56 Q 50 54 56 56 L 56 61 Q 48 66 38 61 Z" fill="#111827" stroke="#00FFFF" strokeWidth="1.5" />
              <path d="M 64 56 Q 70 54 82 56 L 82 61 Q 72 66 64 61 Z" fill="#111827" stroke="#00FFFF" strokeWidth="1.5" />
              {/* Bridge */}
              <line x1="56" y1="58" x2="64" y2="58" stroke="#00FFFF" strokeWidth="2" />
              {/* Highlight on lenses */}
              <line x1="42" y1="58" x2="48" y2="62" stroke="#FFF" strokeWidth="1.5" opacity="0.6" />
              <line x1="68" y1="58" x2="74" y2="62" stroke="#FFF" strokeWidth="1.5" opacity="0.6" />

              {/* Spikey cool black hair with pink/purple highlights */}
              <path d="M 36 50 C 30 35, 38 25, 45 22 C 40 18, 50 14, 58 18 C 55 10, 68 8, 76 16 C 85 10, 92 20, 84 35 C 92 35, 88 48, 84 50" fill="url(#hairGrad)" stroke="#111" strokeWidth="1.5" />
              <path d="M 48 18 Q 50 28 42 35 M 64 16 Q 60 28 68 35 M 78 22 Q 74 32 82 38" stroke="#D946EF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

              {/* Black Outfit with LT branding */}
              <path d="M 25 100 L 95 100 L 105 140 L 15 140 Z" fill="#111111" />
              <path d="M 38 100 Q 60 120 82 100" fill="none" stroke="#FF00A8" strokeWidth="2" />
              <circle cx="60" cy="118" r="6" fill="#F5C518" />
              <text x="60" y="121" fill="#111" fontSize="8" fontWeight="900" textAnchor="middle">LT</text>

              {/* Hand with black glove holding the buzzing Tattoo Machine */}
              <g className={characterMood === 'spinning' ? 'animate-bounce' : 'animate-pulse'} style={{ transformOrigin: '80px 110px' }}>
                {/* Arm and Glove */}
                <path d="M 90 125 Q 85 110 75 108" stroke="#1F2937" strokeWidth="14" strokeLinecap="round" />
                {/* Machine grip & body */}
                <rect x="74" y="94" width="8" height="24" fill="#6B7280" stroke="#111" rx="1" />
                <path d="M 72 90 L 84 90 L 80 75 L 76 75 Z" fill="#F5C518" stroke="#111" />
                {/* Coils */}
                <rect x="74" y="80" width="10" height="8" fill="#111" />
                {/* Needle tip */}
                <line x1="78" y1="118" x2="78" y2="135" stroke="#E5E7EB" strokeWidth="1.5" />
                {/* Glow/laser sparks at the needle tip */}
                {characterMood === 'spinning' && (
                  <circle cx="78" cy="135" r="4" fill="#00FFFF" className="animate-ping" />
                )}
              </g>
            </svg>

            {/* Dynamic Status / Speech Box */}
            <div className="absolute -bottom-1 bg-black/80 border border-brand-primary/30 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-center flex items-center gap-1 shadow-md max-w-[150px] whitespace-nowrap">
              {characterMood === 'spinning' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-cyan-400">MARCANDO ARTE...</span>
                </>
              )}
              {characterMood === 'winning' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                  <span className="text-pink-500">TATTOO EXCLUSIVA!</span>
                </>
              )}
              {characterMood === 'bonus' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                  <span className="text-purple-400">DEIXE SUA MARCA!</span>
                </>
              )}
              {characterMood === 'idle' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/80">JOGUE. MARQUE. GANHE.</span>
                </>
              )}
            </div>
          </div>

          {/* Current Free Spins Banner overlay */}
          {isBonusMode && (
            <div className="absolute top-2 w-[90%] bg-gradient-to-r from-purple-900/90 via-fuchsia-900/90 to-purple-900/90 border border-fuchsia-500/40 rounded-xl py-1 px-3 text-center flex items-center justify-between shadow-lg">
              <span className="text-[10px] font-black tracking-widest text-fuchsia-400 uppercase">BONUS ATIVO</span>
              <span className="text-sm font-black text-white">{freeSpinsLeft} GIROS RESTANTES</span>
              <span className="text-xs font-bold text-amber-300">MULT: x{currentBonusMultiplier}</span>
            </div>
          )}
        </section>

        {/* Center Grid Area */}
        <main className="flex-1 flex items-center justify-center py-2">
          {/* Main Slot Container */}
          <div className="relative w-full aspect-[5/4] max-w-sm rounded-2xl border-2 border-slate-800 bg-slate-950/90 p-1.5 shadow-[0_0_35px_rgba(0,217,255,0.15)] flex flex-col justify-between overflow-hidden">
            {/* Neon highlight borders */}
            <div className="absolute inset-0 border border-cyan-500/20 rounded-2xl pointer-events-none z-10" />
            <div className="absolute inset-0.5 border border-fuchsia-500/10 rounded-xl pointer-events-none z-10" />

            {/* The 5 Column Grid */}
            <div className="flex-1 grid grid-cols-5 gap-1.5 relative overflow-hidden">
              {[0, 1, 2, 3, 4].map((colIdx) => {
                const isReelSpinning = spinningReels[colIdx];
                return (
                  <div 
                    key={colIdx} 
                    className={`relative h-full flex flex-col justify-around rounded-lg bg-black/60 border border-white/[0.03] overflow-hidden ${
                      isReelSpinning ? 'animate-pulse' : ''
                    }`}
                  >
                    {/* Staggered spin animation element */}
                    {isReelSpinning ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-around h-[300%] animate-spin-reels">
                        {['TATTOO_MACHINE', 'CALAVERA', 'ROSE', 'WILD', 'A', 'K', 'Q', '10', 'TATTOO_HEART', 'BONUS'].map((sym, symIdx) => (
                          <div key={symIdx} className="w-full aspect-square flex items-center justify-center opacity-40 blur-[1px]">
                            {renderSymbolSVG(sym)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Real grid content
                      [0, 1, 2, 3].map((rowIdx) => {
                        const symbolId = grid[rowIdx][colIdx];
                        const isWinner = winningCells.some(cell => cell.r === rowIdx && cell.c === colIdx);
                        const isWild = symbolId === 'WILD';
                        const isBonus = symbolId === 'BONUS';

                        return (
                          <div 
                            key={rowIdx} 
                            className={`relative flex items-center justify-center aspect-square rounded-md transition-all duration-150 ${
                              isWinner 
                                ? 'bg-gradient-to-b from-amber-500/20 to-pink-500/20 scale-105 border border-amber-400 z-20 shadow-[0_0_15px_rgba(245,197,24,0.4)]' 
                                : isWild 
                                  ? 'border border-cyan-500/20' 
                                  : isBonus 
                                    ? 'border border-purple-500/20' 
                                    : 'border border-transparent'
                            }`}
                          >
                            {renderSymbolSVG(symbolId)}

                            {/* Floating spark effect on winning cells */}
                            {isWinner && (
                              <div className="absolute inset-0 bg-white/5 rounded-md mix-blend-overlay animate-ping" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Win / Feedback Banner */}
        <section className="h-10 flex items-center justify-center text-center">
          {winAmount > 0 ? (
            <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-900/60 to-pink-900/60 border border-cyan-500/30 rounded-full py-1.5 px-6 shadow-[0_0_15px_rgba(0,217,255,0.2)] animate-pulse">
              <Trophy size={16} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-black tracking-widest text-white">VOCÊ GANHOU:</span>
              <span className="text-sm font-black text-amber-300">R$ {winAmount.toFixed(2)}</span>
            </div>
          ) : isBonusMode ? (
            <span className="text-xs font-bold text-fuchsia-400 tracking-wider animate-pulse uppercase">
              Bônus de Tatuagem Acumulado: R$ {totalBonusWins.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs font-bold text-white/40 tracking-widest uppercase">
              SELECIONE SUA APOSTA E GIRE
            </span>
          )}
        </section>

        {/* Footer Area controls */}
        <footer className="flex flex-col gap-3 pt-1">
          {/* Balance & Win Indicators */}
          <div className="grid grid-cols-3 gap-2.5 bg-black/40 border border-white/5 rounded-2xl p-3 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-muted/60 tracking-wider">SALDO</span>
              <span className="text-[13px] font-extrabold text-white">
                R$ {user?.balance !== undefined ? user.balance.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-bold text-text-muted/60 tracking-wider">APOSTA</span>
              <span className="text-[13px] font-extrabold text-amber-400">
                R$ {bet.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-text-muted/60 tracking-wider">ÚLTIMO GANHO</span>
              <span className="text-[13px] font-extrabold text-green-400">
                R$ {winAmount > 0 ? winAmount.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Action Row */}
          {!isBonusMode ? (
            <div className="flex items-center justify-between gap-3 animate-fade-in">
              {/* Bet Ajusters */}
              <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-white/5 rounded-2xl p-1.5">
                <button 
                  onClick={() => handleBetChange('down')}
                  disabled={isSpinning}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/70 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Minus size={15} />
                </button>
                <span className="text-xs font-black min-w-[45px] text-center text-white/95">
                  R$ {bet.toFixed(1)}
                </span>
                <button 
                  onClick={() => handleBetChange('up')}
                  disabled={isSpinning}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/70 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Middle Main Large Spin Button */}
              <div className="flex items-center justify-center relative flex-1">
                {/* Outer pulsing neon shadow */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500 rounded-full blur-md opacity-70 animate-pulse pointer-events-none" />
                <button 
                  onClick={triggerSpin}
                  disabled={isSpinning}
                  className="relative w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500 hover:brightness-110 active:scale-95 transition-all text-black flex items-center justify-center shadow-lg disabled:brightness-90 disabled:pointer-events-none"
                >
                  <RefreshCw size={22} className={`text-black ${isSpinning ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Feature Toggles (Turbo / Auto) */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsTurbo(prev => !prev)}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center ${
                    isTurbo 
                      ? 'bg-amber-400 border-amber-400 text-black shadow-[0_0_12px_rgba(245,197,24,0.3)]' 
                      : 'bg-neutral-900 border-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {isTurbo ? <Zap size={18} /> : <ZapOff size={18} />}
                </button>
                <button 
                  onClick={() => setAutoPlay(prev => !prev)}
                  className={`px-3 py-2.5 rounded-2xl border transition-all text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 ${
                    autoPlay 
                      ? 'bg-cyan-500 border-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                      : 'bg-neutral-900 border-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  <span>AUTO</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-black/95 to-purple-950/80 border border-fuchsia-500/40 shadow-[0_0_20px_rgba(217,70,239,0.25)] animate-pulse">
              <span className="text-[10px] font-black tracking-widest text-fuchsia-400 uppercase">MODO RODADAS GRÁTIS ATIVO</span>
              <div className="flex items-center gap-4">
                <span className="text-base font-black text-white">{freeSpinsLeft} GIROS RESTANTES</span>
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-ping" />
                <span className="text-sm font-extrabold text-amber-300">MULTIPLICADOR: x{currentBonusMultiplier}</span>
              </div>
            </div>
          )}
        </footer>

      </div>

      {/* 1. Tattoo Fortune Bonus Celebration Overlay / Popout */}
      {showBonusCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-sm rounded-3xl border border-purple-500/40 bg-gradient-to-b from-[#180a2b] via-[#0b0314] to-[#0f041b] p-6 text-center shadow-[0_0_50px_rgba(122,0,255,0.4)] relative overflow-hidden">
            {/* Background neon elements */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pink-600/20 rounded-full blur-2xl" />

            <div className="w-20 h-20 mx-auto bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400 mb-4 shadow-[0_0_20px_rgba(122,0,255,0.3)] animate-bounce">
              <Flame size={44} className="fill-purple-400 animate-pulse" />
            </div>

            <span className="text-[10px] font-black tracking-[0.3em] text-fuchsia-400 uppercase block mb-1">LT JOGOS APRESENTA</span>
            <h2 className="text-2xl font-black text-white tracking-wider uppercase mb-1">TATTOO BONUS!</h2>
            <h3 className="text-amber-300 font-extrabold text-sm uppercase tracking-wide mb-4">ATIVE SEU PRÊMIO EM TATUAGEM!</h3>

            <p className="text-xs text-text-muted/80 leading-relaxed mb-6">
              Você ganhou <span className="text-white font-bold">5 GIROS GRÁTIS</span> especiais na máquina de Tattoo Fortune! Todos os ganhos serão acumulados em vouchers e créditos de tatuagem.
            </p>

            <button 
              onClick={startFreeSpins}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:brightness-110 active:scale-95 transition-all text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-purple-500/20"
            >
              DEIXE SUA MARCA!
            </button>
          </div>
        </div>
      )}

      {/* 2. Big Win Celebration Overlay */}
      {showBigWinCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-sm rounded-3xl border border-amber-500/40 bg-gradient-to-b from-[#2b1f0c] via-[#0f0a03] to-[#120c04] p-6 text-center shadow-[0_0_50px_rgba(245,197,24,0.4)] relative overflow-hidden">
            <div className="w-20 h-20 mx-auto bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,197,24,0.3)] animate-pulse">
              <Trophy size={44} className="fill-amber-400" />
            </div>

            <span className="text-[10px] font-black tracking-[0.3em] text-amber-400 uppercase block mb-1">GRANDE PRÊMIO</span>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 tracking-wider uppercase mb-1">
              GRANDE GANHO!
            </h2>
            <h3 className="text-white font-bold text-xs uppercase tracking-wide mb-4">MÁXIMA ARTE NA PELE!</h3>

            <div className="text-4xl font-black text-amber-300 mb-6 drop-shadow-[0_2px_10px_rgba(245,197,24,0.5)] animate-bounce">
              R$ {bigWinValue.toFixed(2)}
            </div>

            <p className="text-[11px] text-text-muted/80 leading-relaxed mb-6 italic">
              "Deixe sua marca: prêmios resgatáveis em vouchers de estúdio parceiro LT Jogos!"
            </p>

            <button 
              onClick={() => setShowBigWinCelebration(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 active:scale-95 transition-all text-black font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-500/20"
            >
              COLETAR E CONTINUAR
            </button>
          </div>
        </div>
      )}

      {/* 3. Game Info / Help Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl relative overflow-hidden max-h-[80vh] flex flex-col">
            <header className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h3 className="font-black text-sm tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
                <Info size={16} />
                Regras e Informações
              </h3>
              <button 
                onClick={() => setShowInfo(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-white/80 leading-relaxed scrollbar-hide">
              <div>
                <h4 className="font-black text-white uppercase tracking-wider mb-1.5 text-[10px]">COMO JOGAR</h4>
                <p>Configure sua aposta na barra inferior (de R$ 0.5 a R$ 100) e clique em "GIRAR". Seus prêmios e bônus estarão prontos para a pele.</p>
              </div>

              <div>
                <h4 className="font-black text-white uppercase tracking-wider mb-1.5 text-[10px]">LINHAS DE PAGAMENTO</h4>
                <p>O jogo possui 50 linhas de pagamento ativas que pagam da esquerda para a direita ao conseguir 3 ou mais símbolos iguais em posições adjacentes.</p>
              </div>

              <div>
                <h4 className="font-black text-white uppercase tracking-wider mb-1.5 text-[10px]">TIPO DE PRÊMIOS (IMPORTANTÍSSIMO)</h4>
                <p className="text-amber-300 font-semibold bg-amber-500/5 border border-amber-500/20 rounded-lg p-2">
                  Os prêmios na LT Jogos são na forma de créditos, vouchers e vales de estúdio de tatuagem de alta qualidade. "ATIVE SEU PRÊMIO EM TATUAGEM!" e "DEIXE SUA MARCA!".
                </p>
              </div>

              <div>
                <h4 className="font-black text-white uppercase tracking-wider mb-1.5 text-[10px]">TABELA DE PAGAMENTO (Multiplicadores de Aposta)</h4>
                <div className="grid grid-cols-2 gap-2 mt-1.5 text-[10px]">
                  {Object.entries(SYMBOLS).map(([key, value]) => {
                    if (key === 'WILD' || key === 'BONUS') return null;
                    return (
                      <div key={key} className="flex justify-between items-center bg-black/30 p-1.5 rounded-lg border border-white/5">
                        <span className="font-bold text-white/90">{value.name}</span>
                        <span className="text-amber-400 font-extrabold">x{value.multiplier[2]} (5x)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation and Alert Modals */}
      <ConfirmExitModal 
        isOpen={showExitModal}
        onConfirm={() => window.location.href = '/app'}
        onCancel={() => setShowExitModal(false)}
      />

      <GameAlertModal 
        isOpen={!!alertModal?.isOpen}
        onClose={() => setAlertModal(null)}
        message={alertModal?.message || ''}
        type={alertModal?.type || 'info'}
      />
    </div>
  );
}

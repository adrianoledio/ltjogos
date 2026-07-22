import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import { db } from '../../data/db';
import { PrizeService } from '../../services/prizeService';
import { ArrowLeft, Info, Wallet, Coins, Zap, Minus, Plus, Play, RefreshCw } from 'lucide-react';
import { GameLoader } from '../../components/GameLoader';
import { ConfirmExitModal } from '../../components/ConfirmExitModal';
import { triggerWinConfetti, triggerBigWinConfetti } from '../../lib/confetti';

const SYMBOLS_WEIGHTS = {
  '9': 25,
  '10': 25,
  'J': 20,
  'Q': 20,
  'K': 15,
  'A': 15,
  'SCALES': 10,
  'POTION': 10,
  'WILD': 5,
  'SCATTER': 4
};

const SYMBOL_ASSETS: Record<string, string> = {
  'WILD': 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Glowing%20Star.png',
  'SCATTER': 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Crystal%20Ball.png',
  'SCALES': 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Balance%20Scale.png',
  'POTION': 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Alembic.png',
  'A': 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Red%20Circle.png',
  'K': 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Orange%20Circle.png',
  'Q': 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Yellow%20Circle.png',
  'J': 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Blue%20Circle.png',
  '10': 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Green%20Circle.png',
  '9': 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Purple%20Circle.png',
};

const WEIGHTED_SYMBOLS: string[] = [];
Object.entries(SYMBOLS_WEIGHTS).forEach(([symbol, weight]) => {
  for (let i = 0; i < weight; i++) {
    WEIGHTED_SYMBOLS.push(symbol);
  }
});

const renderSymbol = (symbol: string, isWinning: boolean = false, isWildTattoo: boolean = false) => {
  const containerClass = `flex flex-col items-center justify-center w-full h-full p-1 transition-all duration-500 ${isWinning ? 'scale-110' : ''}`;
  
  if (isWildTattoo) {
    // Render symbols in Japanese/Yakuza Tattoo style matching Yakuza Honor screenshot
    const glowClass = isWinning ? 'drop-shadow-[0_0_12px_rgba(234,179,8,0.8)] brightness-125' : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]';
    
    switch (symbol) {
      case 'WILD':
        return (
          <div className={`${containerClass} ${glowClass} relative w-full h-full flex items-center justify-center`}>
            {/* Golden Crossed Pistols with WILD tag */}
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF2A3" />
                  <stop offset="50%" stopColor="#DAA520" />
                  <stop offset="100%" stopColor="#8B6508" />
                </linearGradient>
                <linearGradient id="wildGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF80BF" />
                  <stop offset="100%" stopColor="#E11D48" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="32" fill="rgba(234,179,8,0.15)" filter="blur(8px)" />
              
              {/* Left Gun */}
              <g transform="translate(50,50) rotate(-35) translate(-50,-50)">
                <path d="M 25,42 h 40 v 10 H 25 Z" fill="url(#goldGrad)" stroke="#1e1b4b" strokeWidth="1.5" />
                <path d="M 55,52 v 18 c 0,2 -2,4 -4,4 h -8 v -10 Z" fill="url(#goldGrad)" stroke="#1e1b4b" strokeWidth="1.5" />
                <rect x="42" y="47" width="10" height="5" rx="1" fill="#1e1b4b" />
                <circle cx="28" cy="45" r="2" fill="#fff" />
              </g>

              {/* Right Gun */}
              <g transform="translate(50,50) scale(-1, 1) rotate(-35) translate(-50,-50)">
                <path d="M 25,42 h 40 v 10 H 25 Z" fill="url(#goldGrad)" stroke="#1e1b4b" strokeWidth="1.5" />
                <path d="M 55,52 v 18 c 0,2 -2,4 -4,4 h -8 v -10 Z" fill="url(#goldGrad)" stroke="#1e1b4b" strokeWidth="1.5" />
                <rect x="42" y="47" width="10" height="5" rx="1" fill="#1e1b4b" />
                <circle cx="28" cy="45" r="2" fill="#fff" />
              </g>

              {/* Glowing WILD Badge */}
              <rect x="15" y="66" width="70" height="20" rx="6" fill="#1e1b4b" stroke="#FF007F" strokeWidth="2" filter="drop-shadow(0 0 4px rgba(255,0,127,0.5))" />
              <text x="50" y="81" textAnchor="middle" fill="url(#wildGrad)" fontSize="14" fontWeight="900" fontStyle="italic" letterSpacing="2">WILD</text>
            </svg>
          </div>
        );

      case 'SCATTER':
        return (
          <div className={`${containerClass} ${glowClass} relative w-full h-full flex items-center justify-center`}>
            {/* Oni Mask */}
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
              <defs>
                <linearGradient id="oniGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#9333EA" />
                  <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
                <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE047" />
                  <stop offset="100%" stopColor="#CA8A04" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(220,38,38,0.4)" strokeWidth="3" />
              <circle cx="50" cy="50" r="38" fill="#180c24" />
              
              {/* Oni Horns */}
              <path d="M 28,30 C 22,20 15,22 18,10 C 25,12 32,18 34,26 Z" fill="url(#goldAccent)" stroke="#180c24" strokeWidth="1" />
              <path d="M 72,30 C 78,20 85,22 82,10 C 75,12 68,18 66,26 Z" fill="url(#goldAccent)" stroke="#180c24" strokeWidth="1" />
              
              {/* Oni Face */}
              <path d="M 30,30 C 30,30 25,48 28,68 C 30,80 70,80 72,68 C 75,48 70,30 70,30 Z" fill="url(#oniGrad)" stroke="#180c24" strokeWidth="1.5" />
              
              {/* Eyebrows & Eyes */}
              <path d="M 34,38 L 46,42 M 66,38 L 54,42" stroke="url(#goldAccent)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="39" cy="46" r="4" fill="#FDE047" />
              <circle cx="39" cy="46" r="1.5" fill="#DC2626" />
              <circle cx="61" cy="46" r="4" fill="#FDE047" />
              <circle cx="61" cy="46" r="1.5" fill="#DC2626" />
              
              {/* Fangs & Mouth */}
              <path d="M 40,64 Q 50,58 60,64" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 37,62 L 39,68 L 42,62 Z M 63,62 L 61,68 L 58,62 Z" fill="#fff" />
              
              {/* SCATTER text */}
              <rect x="20" y="75" width="60" height="14" rx="4" fill="#E11D48" stroke="#FFF" strokeWidth="1" />
              <text x="50" y="85" textAnchor="middle" fill="#FFF" fontSize="7" fontWeight="900" letterSpacing="1">SCATTER</text>
            </svg>
          </div>
        );

      case 'POTION': // Tattooed Katana Sword
        return (
          <div className={`${containerClass} ${glowClass} relative w-full h-full flex items-center justify-center`}>
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
              <circle cx="50" cy="50" r="38" fill="rgba(127,29,29,0.3)" />
              {/* Katana blade */}
              <path d="M 15,85 L 75,25 Q 78,22 80,25 L 82,27 Q 79,30 75,33 L 15,85 Z" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
              <path d="M 15,85 L 75,25" stroke="#94A3B8" strokeWidth="1" />
              {/* Blood splash on blade */}
              <path d="M 60,35 Q 65,33 62,38 Q 66,35 68,40 Q 72,36 71,43 Z" fill="#EF4444" />
              
              {/* Guard (Tsuba) */}
              <ellipse cx="22" cy="78" rx="8" ry="5" transform="rotate(-45 22 78)" fill="#CA8A04" stroke="#0F172A" strokeWidth="1.5" />
              
              {/* Hilt (Tsuka) */}
              <path d="M 22,78 L 10,90 L 6,86 L 18,74 Z" fill="#7F1D1D" stroke="#0F172A" strokeWidth="1.5" />
              <path d="M 22,78 L 10,90" stroke="#CA8A04" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
          </div>
        );

      case 'SCALES': // Sake Ceramic Bottle & Cup
        return (
          <div className={`${containerClass} ${glowClass} relative w-full h-full flex items-center justify-center`}>
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
              <circle cx="50" cy="50" r="38" fill="rgba(30,58,138,0.2)" />
              {/* Sake Bottle */}
              <path d="M 45,25 C 45,20 55,20 55,25 C 55,30 40,40 40,55 C 40,75 60,75 60,55 C 60,40 45,30 45,25 Z" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="2" />
              <path d="M 47,20 L 53,20" stroke="#FFF" strokeWidth="1.5" />
              {/* Golden Japanese wave painting */}
              <path d="M 42,60 Q 50,55 58,60 M 42,64 Q 50,59 58,64" stroke="#FDE047" strokeWidth="1.5" fill="none" />
              
              {/* Small Sake Cup */}
              <path d="M 62,65 L 72,65 L 75,75 L 59,75 Z" fill="#1E40AF" stroke="#3B82F6" strokeWidth="1.5" />
              <ellipse cx="67" cy="65" rx="5" ry="2" fill="#DBEAFE" />
            </svg>
          </div>
        );

      case 'A': // Kanji 仁 (Benevolence)
        return (
          <div className={`${containerClass} ${glowClass} relative w-full h-full flex items-center justify-center`}>
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
              <circle cx="50" cy="50" r="38" fill="#2d1d36" stroke="#4F46E5" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="33" fill="#1d0d26" stroke="#4F46E5" strokeWidth="1" strokeDasharray="4 2" />
              <text x="51" y="61" textAnchor="middle" fill="#C084FC" fontSize="34" fontWeight="900" fontFamily="sans-serif">仁</text>
            </svg>
          </div>
        );

      case 'K': // Kanji 極 (Extreme)
        return (
          <div className={`${containerClass} ${glowClass} relative w-full h-full flex items-center justify-center`}>
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
              <circle cx="50" cy="50" r="38" fill="#3b2d12" stroke="#D97706" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="33" fill="#291d08" stroke="#D97706" strokeWidth="1" strokeDasharray="4 2" />
              <text x="51" y="61" textAnchor="middle" fill="#FBBF24" fontSize="34" fontWeight="900" fontFamily="sans-serif">極</text>
            </svg>
          </div>
        );

      case 'Q': // Kanji 忠 (Loyalty)
        return (
          <div className={`${containerClass} ${glowClass} relative w-full h-full flex items-center justify-center`}>
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
              <circle cx="50" cy="50" r="38" fill="#3b1a1a" stroke="#DC2626" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="33" fill="#290a0a" stroke="#DC2626" strokeWidth="1" strokeDasharray="4 2" />
              <text x="51" y="61" textAnchor="middle" fill="#F87171" fontSize="34" fontWeight="900" fontFamily="sans-serif">忠</text>
            </svg>
          </div>
        );

      case 'J': // Kanji 道 (Way)
        return (
          <div className={`${containerClass} ${glowClass} relative w-full h-full flex items-center justify-center`}>
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
              <circle cx="50" cy="50" r="38" fill="#1a2e3b" stroke="#2563EB" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="33" fill="#0a1a29" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 2" />
              <text x="51" y="61" textAnchor="middle" fill="#60A5FA" fontSize="34" fontWeight="900" fontFamily="sans-serif">道</text>
            </svg>
          </div>
        );

      case '10': // Kanji 義 (Righteousness)
        return (
          <div className={`${containerClass} ${glowClass} relative w-full h-full flex items-center justify-center`}>
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
              <circle cx="50" cy="50" r="38" fill="#132f22" stroke="#059669" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="33" fill="#081f13" stroke="#059669" strokeWidth="1" strokeDasharray="4 2" />
              <text x="51" y="61" textAnchor="middle" fill="#34D399" fontSize="34" fontWeight="900" fontFamily="sans-serif">義</text>
            </svg>
          </div>
        );

      case '9': // Kanji 名 (Honor)
        return (
          <div className={`${containerClass} ${glowClass} relative w-full h-full flex items-center justify-center`}>
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
              <circle cx="50" cy="50" r="38" fill="#351a2e" stroke="#DB2777" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="33" fill="#200a1a" stroke="#DB2777" strokeWidth="1" strokeDasharray="4 2" />
              <text x="51" y="61" textAnchor="middle" fill="#F472B6" fontSize="34" fontWeight="900" fontFamily="sans-serif">名</text>
            </svg>
          </div>
        );

      default:
        return <div className="text-white text-lg font-bold">{symbol}</div>;
    }
  }

  // Mystic Ink default render
  const imgClass = `w-[85%] h-[85%] object-contain drop-shadow-2xl transition-all duration-500 ${isWinning ? 'brightness-125 drop-shadow-[0_0_15px_rgba(255,204,0,0.8)]' : ''}`;
  const isLetter = ['A', 'K', 'Q', 'J', '10', '9'].includes(symbol);

  return (
    <div className={containerClass}>
      <div className="relative w-full h-full flex items-center justify-center">
        {isWinning && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
            className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full"
          />
        )}
        {isLetter ? (
          <div className="relative flex items-center justify-center w-full h-full">
             <img src={SYMBOL_ASSETS[symbol]} alt={symbol} className="absolute inset-0 w-full h-full opacity-20 blur-sm" />
             <span className={`text-3xl sm:text-5xl font-black font-display tracking-tighter drop-shadow-lg ${
               symbol === 'A' ? 'text-red-500' :
               symbol === 'K' ? 'text-orange-500' :
               symbol === 'Q' ? 'text-yellow-500' :
               symbol === 'J' ? 'text-blue-500' :
               symbol === '10' ? 'text-emerald-500' : 'text-purple-500'
             }`}>
               {symbol}
             </span>
          </div>
        ) : (
          <img 
            src={SYMBOL_ASSETS[symbol]} 
            alt={symbol} 
            className={imgClass}
            referrerPolicy="no-referrer"
          />
        )}
        {(symbol === 'WILD' || symbol === 'SCATTER') && (
          <div className="absolute bottom-0 left-0 right-0 text-center">
            <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
              symbol === 'WILD' ? 'bg-brand-secondary text-white shadow-[0_0_10px_rgba(255,0,127,0.5)]' : 'bg-brand-primary text-surface-dark shadow-[0_0_10px_rgba(255,204,0,0.5)]'
            }`}>
              {symbol}
            </span>
          </div>
        )}
      </div>
    </div>
  );
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

const COLS = 5;

const ReelColumn = ({
  spinning,
  symbols,
  colIndex,
  winningPositions,
  isTurbo,
  isWildTattoo
}: {
  key?: number | string;
  spinning: boolean;
  symbols: string[];
  colIndex: number;
  winningPositions: {r: number, c: number}[];
  isTurbo: boolean;
  isWildTattoo: boolean;
}) => {
  const [spinSymbols] = useState(() => 
    Array.from({ length: 12 }, () => WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)])
  );

  const cellAspect = isWildTattoo ? 'aspect-square' : 'aspect-[4/5]';

  return (
    <div className={`flex flex-col gap-[1px] h-full overflow-hidden relative backdrop-blur-sm border-x border-white/5 ${isWildTattoo ? 'bg-black/45' : 'bg-black/20'}`}>
      {/* Invisible placeholder to maintain height */}
      <div className="flex flex-col gap-[1px] w-full invisible">
        {symbols.map((sym, i) => (
          <div key={i} className={`${cellAspect} w-full`} />
        ))}
      </div>

      {spinning ? (
        <motion.div 
          className="flex flex-col gap-[1px] absolute top-0 left-0 w-full"
          animate={{ y: ["-66.6%", "0%"] }}
          transition={{ repeat: Infinity, duration: isTurbo ? 0.08 : 0.15, ease: "linear" }}
        >
          {[...spinSymbols, ...spinSymbols, ...spinSymbols].map((sym, i) => {
            return (
              <div key={i} className={`${cellAspect} flex items-center justify-center`}>
                <div className="w-full h-full flex items-center justify-center blur-[6px] opacity-40 scale-90">
                  {renderSymbol(sym, false, isWildTattoo)}
                </div>
              </div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div 
          className="flex flex-col gap-[1px] absolute top-0 left-0 w-full h-full"
          initial={{ y: "-20%" }}
          animate={{ y: "0%" }}
          transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.8 }}
        >
          {symbols.map((sym, rIndex) => {
            const isWinning = winningPositions.some(p => p.r === rIndex && p.c === colIndex);
            
            return (
              <div key={rIndex} className={`${cellAspect} flex items-center justify-center overflow-hidden relative transition-all duration-500 ${isWinning ? (isWildTattoo ? 'bg-amber-500/10 shadow-[inset_0_0_30px_rgba(245,158,11,0.35)] z-10' : 'bg-brand-primary/10 shadow-[inset_0_0_30px_rgba(255,204,0,0.2)] z-10') : ''}`}>
                <div className="w-full h-full flex items-center justify-center">
                  {renderSymbol(sym, isWinning, isWildTattoo)}
                </div>
                {isWinning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className={`absolute inset-0 border-[3px] rounded-xl ${isWildTattoo ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8),_inset_0_0_15px_rgba(245,158,11,0.5)]' : 'border-brand-primary/50 shadow-[0_0_10px_rgba(255,204,0,0.5)]'}`}
                  />
                )}
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

const BigWinModal = ({ amount, onComplete }: { amount: number, onComplete: () => void }) => {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 3000;
    const increment = amount / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= amount) {
        setDisplayAmount(amount);
        clearInterval(timer);
        setTimeout(onComplete, 2000);
      } else {
        setDisplayAmount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [amount, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="relative z-10"
        >
          <h2 className="text-6xl sm:text-8xl font-black italic text-gradient tracking-tighter drop-shadow-[0_0_30px_rgba(255,204,0,0.8)] animate-bounce">
            BIG WIN!
          </h2>
        </motion.div>
        
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <p className="text-4xl sm:text-6xl font-black font-display text-white drop-shadow-lg">
            R$ {displayAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        {/* Particles/Glow effect */}
        <div className="absolute inset-0 -z-10 bg-brand-primary/20 blur-[100px] rounded-full animate-pulse" />
      </div>
    </motion.div>
  );
};

const WinCelebration = ({ amount, onComplete }: { amount: number, onComplete: () => void }) => {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: -100 }}
      exit={{ scale: 1.5, opacity: 0, y: -200 }}
      className="absolute z-50 pointer-events-none"
    >
      <div className="flex flex-col items-center">
        <span className="text-4xl sm:text-6xl font-black italic text-brand-primary drop-shadow-[0_0_15px_rgba(255,204,0,0.8)]">
          +R$ {amount.toFixed(2)}
        </span>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mt-2"
        >
          Excelente!
        </motion.div>
      </div>
    </motion.div>
  );
};

export function MysticInk() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isWildTattoo = id === 'wild-tattoo' || window.location.pathname.includes('wild-tattoo');
  
  const { user, updateBalance } = useAuth();
  const { playSfx, playGameMusic, stopGameMusic } = useAudio();
  
  const rowsCount = isWildTattoo ? 5 : 4;

  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [gameConfig, setGameConfig] = useState<any>(null);
  const [bet, setBet] = useState(0.5);
  const [grid, setGrid] = useState<string[][]>(() => {
    const isTattoo = window.location.pathname.includes('wild-tattoo') || id === 'wild-tattoo';
    if (isTattoo) {
      return [
        ['POTION', 'SCALES', 'A', 'SCALES', 'K'],
        ['SCATTER', 'SCATTER', 'K', 'SCALES', 'K'],
        ['SCALES', 'A', 'A', 'WILD', 'SCALES'],
        ['K', 'K', 'SCATTER', 'K', 'K'],
        ['K', 'SCATTER', 'POTION', 'POTION', 'A']
      ];
    }
    return [
      ['K', 'SCALES', 'POTION', 'K', 'J'],
      ['9', '10', 'WILD', 'A', 'SCALES'],
      ['POTION', 'WILD', 'SCATTER', 'POTION', 'WILD'],
      ['10', 'K', '10', 'POTION', '10']
    ];
  });
  const [topMultipliers, setTopMultipliers] = useState<number[]>([2, 3, 5, 2, 4]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [lockedCols, setLockedCols] = useState<boolean[]>([true, true, true, true, true]);
  const [lockedMults, setLockedMults] = useState<boolean[]>([true, true, true, true, true]);
  const [winAmount, setWinAmount] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showBigWin, setShowBigWin] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [winningPositions, setWinningPositions] = useState<{r: number, c: number}[]>([]);
  const [winningMults, setWinningMults] = useState<number[]>([]);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isTurbo, setIsTurbo] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Free Spins State
  const [freeSpins, setFreeSpins] = useState(0);
  const [freeSpinMultiplier, setFreeSpinMultiplier] = useState(1);
  const [totalFreeSpinWin, setTotalFreeSpinWin] = useState(0);
  const [targetPrize, setTargetPrize] = useState(0);
  const [showBuyFeatureModal, setShowBuyFeatureModal] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await db.getGame(isWildTattoo ? 'wild-tattoo' : 'mystic-ink');
      if (config) {
        setGameConfig(config);
        setBet(config.minBet);
        if (config.bgMusic) {
          playGameMusic(config.bgMusic);
        }
      }
    };
    fetchConfig();
    
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      const secs = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(isWildTattoo ? `${hrs}:${mins}:${secs}` : `${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    return () => {
      stopGameMusic();
      clearInterval(timer);
    };
  }, []);

  const generateGrid = (target: number) => {
    if (target >= 150) {
      const highSymbols = ['POTION', 'SCALES'];
      const targetSymbol = highSymbols[Math.floor(Math.random() * highSymbols.length)];
      const grid = Array.from({ length: rowsCount }, () =>
        Array.from({ length: COLS }, () => WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)])
      );
      for (let c = 0; c < COLS; c++) {
        const r = Math.floor(Math.random() * rowsCount);
        grid[r][c] = targetSymbol;
      }
      return grid;
    } 
    else if (target >= 50) {
      const mediumSymbols = ['A', 'K', 'Q', 'J'];
      const targetSymbol = mediumSymbols[Math.floor(Math.random() * mediumSymbols.length)];
      const matchCount = Math.floor(Math.random() * 2) + 3;
      const grid = Array.from({ length: rowsCount }, () =>
        Array.from({ length: COLS }, () => WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)])
      );
      for (let c = 0; c < matchCount; c++) {
        const r = Math.floor(Math.random() * rowsCount);
        grid[r][c] = targetSymbol;
      }
      if (matchCount < COLS) {
        for (let r = 0; r < rowsCount; r++) {
          if (grid[r][matchCount] === targetSymbol || grid[r][matchCount] === 'WILD') {
            grid[r][matchCount] = '9';
          }
        }
      }
      return grid;
    }
    else {
      const grid = Array.from({ length: rowsCount }, () =>
        Array.from({ length: COLS }, () => WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)])
      );
      const firstColSymbols = new Set(grid.map(row => row[0]));
      for (let r = 0; r < rowsCount; r++) {
        const sym = grid[r][2];
        if (firstColSymbols.has(sym) || sym === 'WILD') {
          grid[r][2] = '9';
        }
      }
      if (target > 0 && Math.random() < 0.5) {
        grid[0][0] = '10';
        grid[0][1] = '10';
        grid[0][2] = '10';
      }
      return grid;
    }
  };

  const spin = async () => {
    if (isSpinning) return;
    if (freeSpins === 0 && (!user || user.balance < bet)) return;

    setIsSpinning(true);
    setWinAmount(0);
    setShowWinModal(false);
    setShowBigWin(false);
    setLockedCols([false, false, false, false, false]);
    setLockedMults([false, false, false, false, false]);
    setWinningPositions([]);
    setWinningMults([]);
    setIsShaking(false);
    
    if (freeSpins === 0) {
      await updateBalance(-bet, 'bet', isWildTattoo ? 'wild-tattoo' : 'mystic-ink', { bet });
    }
    
    playSfx('spin');

    let currentTarget = 0;
    try {
      if (user) {
        const { amount } = await PrizeService.getTargetPrize(user.id, 'slots');
        currentTarget = amount;
        setTargetPrize(amount);
      }
    } catch (error) {
      console.error("Error generating prize:", error);
    }

    const finalGrid = generateGrid(currentTarget);
    setGrid(finalGrid);

    const spinDuration = isTurbo ? 400 : 1200;

    let currentLockedCols = [false, false, false, false, false];
    let currentLockedMults = [false, false, false, false, false];
    let currentMultipliers = [...topMultipliers];

    const multInterval = setInterval(() => {
      const next = [...currentMultipliers];
      for (let i = 0; i < 5; i++) {
        if (!currentLockedMults[i]) {
          if (i < 4 && !currentLockedMults[i+1]) {
            next[i] = currentMultipliers[i+1];
          } else {
            next[i] = getRandomMultiplier();
          }
        }
      }
      currentMultipliers = next;
      setTopMultipliers(next);
    }, 100);

    setTimeout(() => {
      let colIndex = 0;
      const colInterval = setInterval(() => {
        if (colIndex < 5) {
          currentLockedCols[colIndex] = true;
          setLockedCols([...currentLockedCols]);
          playSfx('click');
          colIndex++;
        } else {
          clearInterval(colInterval);
          
          let multIndex = 0;
          const multLockInterval = setInterval(async () => {
            if (multIndex < 5) {
              currentLockedMults[multIndex] = true;
              setLockedMults([...currentLockedMults]);
              playSfx('click');
              multIndex++;
            } else {
              clearInterval(multLockInterval);
              clearInterval(multInterval);
              
              let currentMultiplier = freeSpins > 0 ? freeSpinMultiplier : 1;
              let scatterCount = 0;
              finalGrid.forEach(row => {
                row.forEach(symbol => {
                  if (symbol === 'SCATTER') scatterCount++;
                });
              });

              let wonFreeSpins = false;
              if (scatterCount >= 3) {
                wonFreeSpins = true;
                playSfx('win');
              }

              const PAYTABLE: Record<string, number[]> = {
                'POTION': [0, 0, 0, 1.0, 2.5, 5.0],
                'SCALES': [0, 0, 0, 0.8, 2.0, 4.0],
                'A': [0, 0, 0, 0.5, 1.5, 3.0],
                'K': [0, 0, 0, 0.4, 1.2, 2.5],
                'Q': [0, 0, 0, 0.3, 1.0, 2.0],
                'J': [0, 0, 0, 0.2, 0.8, 1.5],
                '10': [0, 0, 0, 0.1, 0.5, 1.0],
                '9': [0, 0, 0, 0.1, 0.5, 1.0],
              };

              let totalWin = 0;
              let newWinningPositions: {r: number, c: number}[] = [];
              let newWinningMults: number[] = [];
              const symbolsToCheck = Object.keys(PAYTABLE);
              
              symbolsToCheck.forEach(symbol => {
                let ways = 1;
                let matchCount = 0;
                let symbolWinningPositions: {r: number, c: number}[] = [];
                let colsCounts: number[] = [];
                
                for (let c = 0; c < COLS; c++) {
                  let countInCol = 0;
                  let colPositions: {r: number, c: number}[] = [];
                  for (let r = 0; r < rowsCount; r++) {
                    if (finalGrid[r][c] === symbol || finalGrid[r][c] === 'WILD') {
                      countInCol++;
                      colPositions.push({r, c});
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
                  const payoutMultiplier = PAYTABLE[symbol][matchCount];
                  if (payoutMultiplier > 0) {
                    let multSum = 0;
                    for (let c = 0; c < matchCount; c++) {
                      if (colsCounts[c] >= 3) {
                        multSum += currentMultipliers[c];
                        if (!newWinningMults.includes(c)) {
                          newWinningMults.push(c);
                        }
                      }
                    }
                    
                    const finalMult = multSum > 0 ? multSum : 1;
                    const winAmount = bet * payoutMultiplier * ways * finalMult * currentMultiplier;
                    totalWin += winAmount;
                    
                    symbolWinningPositions.forEach(pos => {
                      if (pos.c < matchCount && !newWinningPositions.some(p => p.r === pos.r && p.c === pos.c)) {
                        newWinningPositions.push(pos);
                      }
                    });
                  }
                }
              });

              if (totalWin > 0) {
                setWinningPositions(newWinningPositions);
                setWinningMults(newWinningMults);
                setWinAmount(totalWin);
                
                if (totalWin >= bet * 20) {
                  setShowBigWin(true);
                  setIsShaking(true);
                  triggerBigWinConfetti();
                } else {
                  setShowWinModal(true);
                  triggerWinConfetti();
                }

                if (user) {
                  await updateBalance(totalWin, 'win', isWildTattoo ? 'wild-tattoo' : 'mystic-ink', { winningPositions: newWinningPositions, winningMults: newWinningMults });
                  await PrizeService.commitPrize(user.id, totalWin);
                }
                playSfx('win');
                if (freeSpins > 0) {
                   setTotalFreeSpinWin(prev => prev + totalWin);
                }
              }

              if (freeSpins > 0) {
                setFreeSpins(prev => prev - 1 + (wonFreeSpins ? 10 : 0));
                setFreeSpinMultiplier(prev => prev + 1);
              } else if (wonFreeSpins) {
                setFreeSpins(10);
                setFreeSpinMultiplier(1);
                setTotalFreeSpinWin(0);
              }

              setIsSpinning(false);
            }
          }, isTurbo ? 80 : 200);
        }
      }, isTurbo ? 80 : 200);

    }, spinDuration);
  };

  const buyFreeSpins = async () => {
    const cost = bet * 50;
    if (user && user.balance >= cost) {
      setShowBuyFeatureModal(false);
      await updateBalance(-cost, 'bet', isWildTattoo ? 'wild-tattoo' : 'mystic-ink', { isBuyFeature: true, cost });
      setFreeSpins(10);
      setFreeSpinMultiplier(1);
      setTotalFreeSpinWin(0);
      playSfx('win');
      setTimeout(spin, 500);
    }
  };

  useEffect(() => {
    if (showWinModal) {
      const timer = setTimeout(() => {
        setShowWinModal(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showWinModal]);

  useEffect(() => {
    if (!isSpinning) {
      if (freeSpins > 0) {
        const timer = setTimeout(spin, 1500);
        return () => clearTimeout(timer);
      } else if (autoPlay && user && user.balance >= bet) {
        const timer = setTimeout(spin, 1000);
        return () => clearTimeout(timer);
      } else if (autoPlay && user && user.balance < bet) {
        setAutoPlay(false);
      }
    }
  }, [autoPlay, isSpinning, user, bet, freeSpins]);

  if (!gameConfig?.active) {
    return <div className="text-center mt-20 text-red-500 font-bold text-sm">Jogo Indisponível</div>;
  }

  return (
    <>
      <style>{`
        @media (max-height: 850px) {
          .game-board-container {
            max-width: 380px !important;
            gap: 0.5rem !important;
          }
        }
        @media (max-height: 750px) {
          .game-board-container {
            max-width: 330px !important;
            gap: 0.375rem !important;
          }
          .game-board-container .glass-panel,
          .game-board-container .glass-card {
            padding: 0.375rem !important;
          }
        }
        @media (max-height: 680px) {
          .game-board-container {
            max-width: 290px !important;
            gap: 0.25rem !important;
          }
        }
      `}</style>
      {!isGameLoaded && (
        <GameLoader 
          onComplete={() => setIsGameLoaded(true)} 
          gameName={isWildTattoo ? "WILD TATTOO" : "MYSTIC INK"} 
          backgroundImage={gameConfig?.bgPage || gameConfig?.thumbnail} 
        />
      )}
      <AnimatePresence>
        {showBigWin && <BigWinModal amount={winAmount} onComplete={() => setShowBigWin(false)} />}
      </AnimatePresence>
 
      <div className={`fixed inset-0 text-white font-sans flex flex-col z-50 overflow-hidden ${isWildTattoo ? 'bg-gradient-to-b from-[#1a0709] via-[#0b0304] to-[#140608]' : 'bg-surface-dark'}`}>
        
        {/* Header */}
        <div className={`flex-none flex items-center justify-between px-4 py-2.5 bg-black/50 backdrop-blur-md border-b border-white/5 ${isWildTattoo ? 'h-14 bg-black/80 border-amber-950/20' : ''}`}>
          <div className="flex items-center gap-3">
            {isWildTattoo ? (
              <button 
                onClick={() => setShowExitModal(true)} 
                className="w-10 h-10 bg-[#3a3536] hover:bg-[#4a4546] active:scale-90 rounded-full flex items-center justify-center text-white/80 transition-all border border-white/10 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </button>
            ) : (
              <button onClick={() => setShowExitModal(true)} className="p-2 glass-card rounded-xl text-white/70 hover:text-white transition-all cursor-pointer">
                <ArrowLeft size={20} />
              </button>
            )}
            
            <h1 className={`text-lg font-black tracking-tighter uppercase italic ${isWildTattoo ? 'text-[13px] tracking-[0.05em] text-amber-200/90 font-sans not-italic font-semibold' : ''}`}>
              {isWildTattoo ? (
                "Yakuza Honor"
              ) : (
                <>Mystic <span className="text-brand-primary">Ink</span></>
              )}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`text-xs font-black text-white/40 uppercase tracking-widest ${isWildTattoo ? 'font-mono text-white/60 tracking-wider text-[11px]' : ''}`}>
              {currentTime}
            </span>
            <button onClick={() => setShowInfoModal(true)} className="p-2 glass-card rounded-xl text-white/70 hover:text-white transition-all">
              <Info size={20} />
            </button>
          </div>
        </div>
 
        {/* Main Game Area */}
        <motion.div 
          animate={{
            backgroundColor: freeSpins > 0 ? (isWildTattoo ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 0, 127, 0.05)') : 'rgba(0,0,0,0)',
            x: isShaking ? [-2, 2, -2, 2, 0] : 0,
            y: isShaking ? [-2, 2, -2, 2, 0] : 0
          }}
          transition={{ 
            backgroundColor: { duration: 1 },
            x: { repeat: Infinity, duration: 0.1 },
            y: { repeat: Infinity, duration: 0.1 }
          }}
          className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden"
        >
          {/* Background Glows */}
          <div className={`absolute top-1/4 -left-20 w-64 h-64 blur-[100px] rounded-full animate-pulse transition-colors duration-1000 ${freeSpins > 0 ? (isWildTattoo ? 'bg-amber-600/10' : 'bg-brand-secondary/20') : (isWildTattoo ? 'bg-red-900/10' : 'bg-brand-primary/10')}`} />
          <div className={`absolute bottom-1/4 -right-20 w-64 h-64 blur-[100px] rounded-full animate-pulse-slow transition-colors duration-1000 ${freeSpins > 0 ? (isWildTattoo ? 'bg-yellow-600/10' : 'bg-brand-primary/20') : (isWildTattoo ? 'bg-amber-900/10' : 'bg-brand-secondary/10')}`} />
 
          <div className="w-full max-w-[420px] flex flex-col gap-3 relative z-10 game-board-container">
            
            {/* Free Spins Indicator */}
            <AnimatePresence>
              {freeSpins > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute -top-12 left-0 right-0 flex justify-center"
                >
                  <div className={`px-6 py-1 rounded-full shadow-lg border border-white/20 ${isWildTattoo ? 'bg-amber-600 shadow-amber-500/35' : 'bg-brand-secondary shadow-[0_0_20px_rgba(255,0,127,0.5)]'}`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                      Free Spins Mode
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Top Multipliers (Only for Mystic Ink default mode) */}
            {!isWildTattoo && (
              <div className="glass-panel p-1 rounded-2xl border-brand-primary/20 shadow-2xl">
                <div className="grid grid-cols-5 gap-1">
                  {topMultipliers.map((m, i) => {
                    const isWinning = winningMults.includes(i);
                    return (
                      <div key={i} className={`relative h-12 sm:h-16 flex items-center justify-center rounded-xl overflow-hidden transition-all duration-500 ${isWinning ? 'bg-brand-primary/20 shadow-[0_0_20px_rgba(255,204,0,0.3)]' : 'bg-white/[0.02]'}`}>
                        <motion.span 
                          key={`${i}-${lockedMults[i]}`}
                          initial={!lockedMults[i] ? { y: "100%", filter: 'blur(4px)' } : { scale: 0.8 }}
                          animate={!lockedMults[i] ? { y: "-100%", filter: 'blur(4px)' } : { scale: 1, filter: 'blur(0px)' }}
                          transition={!lockedMults[i] ? { repeat: Infinity, duration: 0.15, ease: 'linear' } : { type: 'spring', bounce: 0.5 }}
                          className={`text-lg sm:text-2xl font-black italic tracking-tighter ${isWinning ? 'text-brand-primary drop-shadow-[0_0_10px_rgba(255,204,0,0.5)]' : 'text-white/20'}`}
                        >
                          x{m}
                        </motion.span>
                        {isWinning && (
                          <motion.div
                            layoutId="mult-glow"
                            className="absolute inset-0 border-2 border-brand-primary/50 rounded-xl"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Japanese Screen Roof Decorative Element (Only for Wild Tattoo) */}
            {isWildTattoo && (
              <div className="flex justify-between items-center px-1 mb-1 shadow-2xl">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-1 mx-0.5 h-6 bg-[#2a130f] border border-[#5a2e24] rounded flex gap-1 p-0.5 shadow-inner">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex-1 bg-black/40 border border-[#421d15]/40 rounded-sm" />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Reels Frame */}
            <div className={`glass-panel p-1.5 rounded-[2rem] shadow-3xl relative ${isWildTattoo ? 'border-amber-500/20 bg-[#260e10]/80' : 'border-white/10'}`}>
              {/* Decorative Frame Elements */}
              <div className={`absolute -top-1 -left-1 w-8 h-8 border-t-[3px] border-l-[3px] rounded-tl-xl ${isWildTattoo ? 'border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'border-brand-primary/50'}`} />
              <div className={`absolute -top-1 -right-1 w-8 h-8 border-t-[3px] border-r-[3px] rounded-tr-xl ${isWildTattoo ? 'border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'border-brand-primary/50'}`} />
              <div className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-[3px] border-l-[3px] rounded-bl-xl ${isWildTattoo ? 'border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'border-brand-primary/50'}`} />
              <div className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-[3px] border-r-[3px] rounded-br-xl ${isWildTattoo ? 'border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'border-brand-primary/50'}`} />

              <div className={`grid grid-cols-5 gap-1 rounded-[1.5rem] overflow-hidden bg-black/50 relative ${isWildTattoo ? 'p-0.5 border border-amber-950/40 bg-gradient-to-b from-[#1c080a] to-[#250b0d]' : ''}`}>
                <AnimatePresence>
                  {showWinModal && <WinCelebration amount={winAmount} onComplete={() => setShowWinModal(false)} />}
                </AnimatePresence>
                
                {Array.from({ length: COLS }).map((_, cIndex) => (
                  <ReelColumn
                    key={cIndex}
                    spinning={!lockedCols[cIndex]}
                    symbols={grid.map(row => row[cIndex])}
                    colIndex={cIndex}
                    winningPositions={winningPositions}
                    isTurbo={isTurbo}
                    isWildTattoo={isWildTattoo}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Multipliers (Only for Wild Tattoo mode - matches Yakuza Honor screen) */}
            {isWildTattoo && (
              <div className="bg-[#1c0a0c]/80 p-1 rounded-2xl border border-amber-600/20 shadow-2xl">
                <div className="grid grid-cols-5 gap-1">
                  {topMultipliers.map((m, i) => {
                    const isWinning = winningMults.includes(i);
                    return (
                      <div key={i} className={`relative h-11 flex flex-col items-center justify-center rounded-xl overflow-hidden transition-all duration-500 border ${isWinning ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-black/50 border-amber-950/40'}`}>
                        <span className={`text-[8px] uppercase font-bold tracking-wider ${isWinning ? 'text-amber-300' : 'text-amber-900/60'}`}>COL {i+1}</span>
                        <motion.span 
                          key={`${i}-${lockedMults[i]}`}
                          initial={!lockedMults[i] ? { y: "100%", filter: 'blur(4px)' } : { scale: 0.8 }}
                          animate={!lockedMults[i] ? { y: "-100%", filter: 'blur(4px)' } : { scale: 1, filter: 'blur(0px)' }}
                          transition={!lockedMults[i] ? { repeat: Infinity, duration: 0.15, ease: 'linear' } : { type: 'spring', bounce: 0.5 }}
                          className={`text-xs sm:text-sm font-black italic tracking-tighter ${isWinning ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'text-amber-700/40'}`}
                        >
                          x{m}
                        </motion.span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message Bar / Katana Central Multiplier and Buy Feature */}
            {isWildTattoo ? (
              <div className="relative h-28 w-full bg-gradient-to-r from-[#1b080a] via-[#351014] to-[#1b080a] border border-amber-500/25 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-between px-4">
                
                {/* Background glowing katana & aura */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                  <div className="w-4/5 h-16 bg-gradient-to-r from-amber-500/0 via-amber-500/30 to-amber-500/0 blur-xl animate-pulse" />
                  {/* Glowing Katana Sword SVG */}
                  <svg viewBox="0 0 400 60" className="absolute w-[90%] h-full">
                    {/* Hilt and Blade */}
                    <path d="M 40,30 L 360,30" stroke="#FFF" strokeWidth="2.5" filter="drop-shadow(0 0 4px #FBBF24)" />
                    <path d="M 30,30 Q 35,28 38,30" stroke="#CA8A04" strokeWidth="4" />
                    <path d="M 360,30 Q 365,30 370,32" stroke="#FFF" strokeWidth="2" />
                    {/* Golden sparks */}
                    <circle cx="150" cy="25" r="1.5" fill="#FFF" className="animate-ping" />
                    <circle cx="250" cy="35" r="1" fill="#FBBF24" />
                  </svg>
                </div>

                {/* Left decorative scroll guard */}
                <div className="relative z-10 w-8 h-14 opacity-75">
                  <svg viewBox="0 0 40 80" className="w-full h-full text-amber-600/40">
                    <path d="M 5,5 Q 35,5 35,40 Q 35,75 5,75" fill="none" stroke="currentColor" strokeWidth="3" />
                    <circle cx="5" cy="5" r="4" fill="currentColor" />
                    <circle cx="5" cy="75" r="4" fill="currentColor" />
                  </svg>
                </div>

                {/* Center: Massive Multiplier text & Win amount */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-1">
                  <div className="flex flex-col items-center">
                    {/* Huge glowing x2 or current multiplier */}
                    <span className="text-4xl sm:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-amber-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" style={{ WebkitTextStroke: '1px #000' }}>
                      x{freeSpins > 0 ? freeSpinMultiplier : (winningMults.length > 0 ? winningMults.reduce((acc, idx) => acc + topMultipliers[idx], 0) : 1)}
                    </span>
                    
                    {/* Winning value below */}
                    <span className="text-sm font-black text-[#fde047] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-0.5 tracking-wide">
                      {winAmount > 0 ? `R$ ${winAmount.toFixed(2)}` : '0.00'}
                    </span>
                  </div>
                </div>

                {/* Right: Comprar Funcionalidade green plaque button */}
                <button 
                  onClick={() => !isSpinning && freeSpins === 0 && setShowBuyFeatureModal(true)}
                  disabled={isSpinning || freeSpins > 0}
                  className="relative z-10 h-16 w-28 bg-[#15342a] hover:bg-[#1b4437] active:scale-95 disabled:grayscale disabled:opacity-40 rounded-lg flex flex-col items-center justify-center border-2 border-amber-500/40 shadow-xl transition-all cursor-pointer group overflow-hidden"
                >
                  {/* Subtle inner gold border */}
                  <div className="absolute inset-0.5 border border-amber-600/30 rounded" />
                  
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-400/90 group-hover:text-amber-300">
                    Comprar
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 group-hover:text-amber-100 mt-0.5">
                    Funcionalidade
                  </span>
                </button>
              </div>
            ) : (
              /* Default Mystic Ink Message Bar */
              <div className="h-10 flex items-center justify-center glass-panel rounded-full px-6 border-white/5">
                <AnimatePresence mode="wait">
                  {freeSpins > 0 ? (
                    <motion.p 
                      key="free-spins"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary animate-pulse"
                    >
                      Free Spins: {freeSpins} | Multiplier: x{freeSpinMultiplier}
                    </motion.p>
                  ) : (
                    <motion.p 
                      key="normal"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30"
                    >
                      Multiplicadores no topo!
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Stats Bar */}
            <div className={`grid grid-cols-3 gap-2 ${isWildTattoo ? 'px-1' : ''}`}>
              <div className={`p-2.5 flex items-center justify-center gap-2 rounded-xl border ${isWildTattoo ? 'bg-black/60 border-amber-950/40 shadow-lg' : 'glass-card'}`}>
                {isWildTattoo ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-500 fill-current shrink-0">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                ) : (
                  <Wallet size={10} className="text-white/40 shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className={`text-[7px] font-black uppercase tracking-widest ${isWildTattoo ? 'text-amber-600/60 leading-none mb-0.5' : 'text-white/20'}`}>Saldo</span>
                  <span className="text-[11px] font-black text-white truncate">R$ {user?.balance.toFixed(2)}</span>
                </div>
              </div>

              <div className={`p-2.5 flex items-center justify-center gap-2 rounded-xl border ${isWildTattoo ? 'bg-black/60 border-amber-500/25 shadow-lg' : 'glass-card border-brand-primary/20'}`}>
                {isWildTattoo ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-500 fill-current shrink-0">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <text x="12" y="15" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold">S</text>
                  </svg>
                ) : (
                  <Coins size={10} className="text-brand-primary shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className={`text-[7px] font-black uppercase tracking-widest ${isWildTattoo ? 'text-amber-400 leading-none mb-0.5' : 'text-brand-primary'}`}>Aposta</span>
                  <span className="text-[11px] font-black text-white truncate">R$ {bet.toFixed(2)}</span>
                </div>
              </div>

              <div className={`p-2.5 flex items-center justify-center gap-2 rounded-xl border ${isWildTattoo ? 'bg-black/60 border-amber-950/40 shadow-lg' : 'glass-card'}`}>
                {isWildTattoo ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-500 fill-current shrink-0">
                    <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    <text x="12" y="14" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="black" letterSpacing="0.5">WIN</text>
                  </svg>
                ) : (
                  <Coins size={10} className="text-white/40 shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className={`text-[7px] font-black uppercase tracking-widest ${isWildTattoo ? 'text-emerald-500/60 leading-none mb-0.5' : 'text-white/20'}`}>Ganho</span>
                  <span className="text-[11px] font-black text-emerald-400 truncate">R$ {winAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Controls Section */}
        <div className={`flex-none bg-black/60 backdrop-blur-2xl border-t border-white/5 p-4 pb-6 sm:p-5 sm:pb-8 ${isWildTattoo ? 'bg-[#0f0405]/95 border-amber-950/40' : ''}`}>
          {isWildTattoo ? (
            /* Custom Yakuza Honor / PG Soft style Control Panel */
            <div className="max-w-[420px] mx-auto flex items-center justify-between px-2">
              {/* Far-Left: Turbo Button */}
              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => setIsTurbo(!isTurbo)} 
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border ${isTurbo ? 'bg-[#ca8a04]/10 border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(202,138,4,0.3)]' : 'bg-black/40 border-amber-950/40 text-amber-700/60'}`}
                >
                  <Zap className={`w-5 h-5 ${isTurbo ? 'fill-current' : ''}`} />
                </button>
                <span className="text-[7px] font-black text-amber-600/70 uppercase tracking-widest">Turbo</span>
              </div>

              {/* Center Controls: Minus, Spin, Plus */}
              <div className="flex items-center gap-3.5">
                {/* Minus Button */}
                <button 
                  onClick={() => setBet(Math.max(gameConfig?.minBet || 0.5, bet - 0.5))} 
                  disabled={isSpinning || bet <= (gameConfig?.minBet || 0.5)}
                  className="w-10 h-10 bg-[#2b2526] hover:bg-[#3b3536] disabled:opacity-20 border border-amber-950/40 rounded-full flex items-center justify-center text-amber-400 transition-all shadow-md cursor-pointer"
                >
                  <Minus size={18} />
                </button>

                {/* Central Spin Button with swirling Tomoe */}
                <div className="relative">
                  {/* Spin button aura */}
                  <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-125 pointer-events-none" />
                  
                  <button 
                    onClick={spin} 
                    disabled={isSpinning || freeSpins > 0} 
                    className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#3b1215] via-[#a32e35] to-[#f43f5e] border-[3px] border-amber-400 flex items-center justify-center shadow-2xl active:scale-95 transition-all duration-300 disabled:grayscale disabled:opacity-50"
                  >
                    {/* Swirling Tomoe symbol */}
                    <motion.div
                      animate={isSpinning || freeSpins > 0 ? { rotate: 360 } : { rotate: 0 }}
                      transition={isSpinning || freeSpins > 0 ? { repeat: Infinity, duration: 1.2, ease: "linear" } : { duration: 0.5 }}
                      className="w-12 h-12 text-amber-100 flex items-center justify-center"
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                        <g transform="translate(50,50)">
                          {/* Three Comma swirl (Tomoe) */}
                          <path d="M 0,0 C -15,-5 -25,-25 -25,-40 C -25,-55 -10,-50 0,-50 C 25,-50 40,-25 40,0 C 40,25 25,40 0,40 C -10,40 -15,30 -15,20 C -15,10 -5,5 0,0 Z" transform="rotate(0)" />
                          <path d="M 0,0 C -15,-5 -25,-25 -25,-40 C -25,-55 -10,-50 0,-50 C 25,-50 40,-25 40,0 C 40,25 25,40 0,40 C -10,40 -15,30 -15,20 C -15,10 -5,5 0,0 Z" transform="rotate(120)" />
                          <path d="M 0,0 C -15,-5 -25,-25 -25,-40 C -25,-55 -10,-50 0,-50 C 25,-50 40,-25 40,0 C 40,25 25,40 0,40 C -10,40 -15,30 -15,20 C -15,10 -5,5 0,0 Z" transform="rotate(240)" />
                        </g>
                      </svg>
                    </motion.div>
                  </button>
                </div>

                {/* Plus Button */}
                <button 
                  onClick={() => setBet(Math.min(gameConfig?.maxBet || 100, bet + 0.5))} 
                  disabled={isSpinning || bet >= (gameConfig?.maxBet || 100)}
                  className="w-10 h-10 bg-[#2b2526] hover:bg-[#3b3536] disabled:opacity-20 border border-amber-950/40 rounded-full flex items-center justify-center text-amber-400 transition-all shadow-md cursor-pointer"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Far-Right: Auto Button */}
              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => setAutoPlay(!autoPlay)} 
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border ${autoPlay ? 'bg-[#ca8a04]/10 border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(202,138,4,0.3)]' : 'bg-black/40 border-amber-950/40 text-amber-700/60'}`}
                >
                  <Play className={`w-5 h-5 ${autoPlay ? 'fill-current' : ''}`} />
                </button>
                <span className="text-[7px] font-black text-amber-600/70 uppercase tracking-widest">Auto</span>
              </div>
            </div>
          ) : (
            /* Default Mystic Ink Control Panel */
            <div className="max-w-[420px] mx-auto flex items-center justify-between">
              
              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => setIsTurbo(!isTurbo)} 
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 ${isTurbo ? 'bg-brand-primary text-surface-dark shadow-lg shadow-brand-primary/20' : 'glass-card text-white/40'}`}
                >
                  <Zap className={`w-5 h-5 sm:w-6 sm:h-6 ${isTurbo ? 'fill-current' : ''}`} />
                </button>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Turbo</span>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-4">
                <button 
                  onClick={() => setBet(Math.max(gameConfig?.minBet || 0.5, bet - 0.5))} 
                  disabled={isSpinning || bet <= (gameConfig?.minBet || 0.5)}
                  className="w-8 h-8 sm:w-10 sm:h-10 glass-card rounded-lg sm:rounded-xl flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20 transition-all"
                >
                  <Minus size={16} className="sm:w-5 sm:h-5" />
                </button>

                <div className="relative group">
                  <div className="absolute inset-0 blur-2xl rounded-full scale-150 group-active:scale-110 transition-transform duration-500 bg-brand-primary/20" />
                  <button 
                    onClick={spin} 
                    disabled={isSpinning || freeSpins > 0} 
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center shadow-2xl active:scale-90 transition-all duration-300 disabled:grayscale disabled:opacity-50 bg-gradient-to-tr from-brand-primary to-brand-secondary shadow-brand-primary/30"
                  >
                    <RefreshCw className={`text-white ${isSpinning || freeSpins > 0 ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} w-10 h-10 sm:w-12 sm:h-12`} />
                  </button>
                </div>

                <button 
                  onClick={() => setBet(Math.min(gameConfig?.maxBet || 100, bet + 0.5))} 
                  disabled={isSpinning || bet >= (gameConfig?.maxBet || 100)}
                  className="w-8 h-8 sm:w-10 sm:h-10 glass-card rounded-lg sm:rounded-xl flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20 transition-all"
                >
                  <Plus size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => setAutoPlay(!autoPlay)} 
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 ${autoPlay ? 'bg-brand-secondary text-white shadow-lg shadow-brand-secondary/20' : 'glass-card text-white/40'}`}
                >
                  <Play className={`w-5 h-5 sm:w-6 sm:h-6 ${autoPlay ? 'fill-current' : ''}`} />
                </button>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Auto</span>
              </div>

            </div>
          )}
        </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowInfoModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a2456] border-2 border-[#B8860B] rounded-xl p-6 max-w-md w-full shadow-[0_0_30px_rgba(218,165,32,0.3)] max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-serif font-bold text-[#DAA520] mb-4 text-center border-b border-[#B8860B]/30 pb-2">Regras e Pagamentos</h2>
              
              <div className="space-y-6 text-sm text-white/90">
                <section>
                  <h3 className="text-lg font-bold text-[#f472b6] mb-2">1024 Formas de Ganhar</h3>
                  <p className="mb-2">Os ganhos são pagos para símbolos adjacentes da esquerda para a direita, começando pelo rolo mais à esquerda.</p>
                  <p>O prêmio é multiplicado pelo valor da aposta, pelo número de formas vencedoras e pelos multiplicadores do topo.</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[#f472b6] mb-2">Multiplicadores do Topo</h3>
                  <p>A cada giro, multiplicadores aleatórios deslizam no rolo superior. Se uma coluna participar de uma vitória, o multiplicador acima dela será somado e aplicado ao prêmio final!</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[#f472b6] mb-2">Rodadas Grátis</h3>
                  <p>Consiga 3 ou mais símbolos SCATTER em qualquer lugar para ativar 10 Rodadas Grátis.</p>
                  <p>Durante as Rodadas Grátis, um multiplicador global crescente é aplicado a todas as vitórias, aumentando a cada rodada!</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[#f472b6] mb-3">Tabela de Pagamentos (Multiplicadores Base)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a0514] p-3 rounded-lg border border-[#B8860B]/20">
                      <div className="flex justify-center mb-2">{renderSymbol('POTION')}</div>
                      <div className="text-center text-xs space-y-1">
                        <p>5x = 5.0</p>
                        <p>4x = 2.5</p>
                        <p>3x = 1.0</p>
                      </div>
                    </div>
                    <div className="bg-[#0a0514] p-3 rounded-lg border border-[#B8860B]/20">
                      <div className="flex justify-center mb-2">{renderSymbol('SCALES')}</div>
                      <div className="text-center text-xs space-y-1">
                        <p>5x = 4.0</p>
                        <p>4x = 2.0</p>
                        <p>3x = 0.8</p>
                      </div>
                    </div>
                    <div className="bg-[#0a0514] p-3 rounded-lg border border-[#B8860B]/20">
                      <div className="flex justify-center mb-2">{renderSymbol('A')}</div>
                      <div className="text-center text-xs space-y-1">
                        <p>5x = 3.0</p>
                        <p>4x = 1.5</p>
                        <p>3x = 0.5</p>
                      </div>
                    </div>
                    <div className="bg-[#0a0514] p-3 rounded-lg border border-[#B8860B]/20">
                      <div className="flex justify-center mb-2">{renderSymbol('K')}</div>
                      <div className="text-center text-xs space-y-1">
                        <p>5x = 2.5</p>
                        <p>4x = 1.2</p>
                        <p>3x = 0.4</p>
                      </div>
                    </div>
                    <div className="bg-[#0a0514] p-3 rounded-lg border border-[#B8860B]/20">
                      <div className="flex justify-center mb-2">{renderSymbol('Q')}</div>
                      <div className="text-center text-xs space-y-1">
                        <p>5x = 2.0</p>
                        <p>4x = 1.0</p>
                        <p>3x = 0.3</p>
                      </div>
                    </div>
                    <div className="bg-[#0a0514] p-3 rounded-lg border border-[#B8860B]/20">
                      <div className="flex justify-center mb-2">{renderSymbol('J')}</div>
                      <div className="text-center text-xs space-y-1">
                        <p>5x = 1.5</p>
                        <p>4x = 0.8</p>
                        <p>3x = 0.2</p>
                      </div>
                    </div>
                    <div className="bg-[#0a0514] p-3 rounded-lg border border-[#B8860B]/20">
                      <div className="flex justify-center mb-2">{renderSymbol('10')}</div>
                      <div className="text-center text-xs space-y-1">
                        <p>5x = 1.0</p>
                        <p>4x = 0.5</p>
                        <p>3x = 0.1</p>
                      </div>
                    </div>
                    <div className="bg-[#0a0514] p-3 rounded-lg border border-[#B8860B]/20">
                      <div className="flex justify-center mb-2">{renderSymbol('9')}</div>
                      <div className="text-center text-xs space-y-1">
                        <p>5x = 1.0</p>
                        <p>4x = 0.5</p>
                        <p>3x = 0.1</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-[#0a0514] p-4 rounded-lg border border-[#B8860B]/20">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-16 h-16 shrink-0">{renderSymbol('WILD')}</div>
                    <div>
                      <h4 className="font-bold text-[#DAA520]">Símbolo WILD</h4>
                      <p className="text-xs">Substitui todos os símbolos, exceto SCATTER.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="w-16 h-16 shrink-0">{renderSymbol('SCATTER')}</div>
                    <div>
                      <h4 className="font-bold text-[#DAA520]">Símbolo SCATTER</h4>
                      <p className="text-xs">3 ou mais ativam as Rodadas Grátis.</p>
                    </div>
                  </div>
                </section>
              </div>

              <button 
                onClick={() => setShowInfoModal(false)}
                className="mt-6 w-full py-3 bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-black font-bold rounded-lg shadow-lg hover:brightness-110 transition-all"
              >
                ENTENDI
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy Feature Modal */}
      <AnimatePresence>
        {showBuyFeatureModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-[110] flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setShowBuyFeatureModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1f090b] border-2 border-amber-500/40 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_35px_rgba(245,158,11,0.25)] text-center relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Decorative Japanese dragon pattern / lantern overlay */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
              
              <h2 className="text-xl font-black uppercase tracking-widest text-amber-400 mb-2 mt-2">
                Comprar Funcionalidade
              </h2>
              
              <p className="text-xs text-white/70 mb-5 leading-relaxed">
                Adquira <span className="text-amber-400 font-bold">10 Rodadas Grátis</span> com multiplicadores globais que aumentam a cada rodada!
              </p>

              <div className="bg-black/45 border border-amber-950/50 p-4 rounded-xl mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500/60 block mb-1">Preço Total</span>
                <span className="text-2xl font-black text-amber-400">
                  R$ {(bet * 50).toFixed(2)}
                </span>
                <span className="text-[10px] text-white/40 block mt-1">(50x o valor da aposta de R$ {bet.toFixed(2)})</span>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowBuyFeatureModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 font-bold rounded-xl transition-all border border-white/5"
                >
                  VOLTAR
                </button>
                {user && user.balance >= (bet * 50) ? (
                  <button 
                    onClick={buyFreeSpins}
                    className="flex-1 py-3 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:scale-95 text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-amber-900/20 transition-all"
                  >
                    CONFIRMAR
                  </button>
                ) : (
                  <button 
                    disabled
                    className="flex-1 py-3 bg-white/5 text-red-500/50 border border-red-950/30 font-black uppercase tracking-wider rounded-xl cursor-not-allowed"
                  >
                    SALDO INSuf.
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmExitModal
        isOpen={showExitModal}
        isSpinning={isSpinning || freeSpins > 0}
        onConfirm={() => navigate('/app')}
        onCancel={() => setShowExitModal(false)}
      />
    </div>
    </>
  );
}

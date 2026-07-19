import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import { db } from '../../data/db';
import { PrizeService } from '../../services/prizeService';
import { ArrowLeft, Info, HelpCircle, Coins, Zap, Minus, Plus, RefreshCw, Volume2, VolumeX, Menu, X, Star } from 'lucide-react';
import { GameLoader } from '../../components/GameLoader';

// Symbols definitions
const SYMBOLS_WEIGHTS = {
  '10': 25,
  'J': 20,
  'Q': 20,
  'K': 15,
  'A': 15,
  'NEEDLE': 12,
  'BOOTS': 10,
  'INK': 8,
  'MACHINE': 6,
  'HEART': 4,
  'WILD': 4,
  'SCATTER': 3
};

const WEIGHTED_SYMBOLS: string[] = [];
Object.entries(SYMBOLS_WEIGHTS).forEach(([symbol, weight]) => {
  for (let i = 0; i < weight; i++) {
    WEIGHTED_SYMBOLS.push(symbol);
  }
});

// Render the precise tattoo vector icons inside the reels
const renderTattooSymbol = (symbol: string, isWinning: boolean = false) => {
  const glowClass = isWinning ? 'drop-shadow-[0_0_12px_rgba(234,179,8,0.95)] scale-110 brightness-125' : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]';
  const containerClass = "flex flex-col items-center justify-center w-full h-full p-2 relative";

  switch (symbol) {
    case 'WILD':
      return (
        <div id="symbol-wild" className={`${containerClass} ${glowClass}`}>
          {/* Sailor Anchor Tattoo with WILD ribbon */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] animate-pulse">
            <defs>
              <linearGradient id="anchorGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF4B8" />
                <stop offset="50%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#854D0E" />
              </linearGradient>
              <linearGradient id="wildPink" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F472B6" />
                <stop offset="100%" stopColor="#DB2777" />
              </linearGradient>
            </defs>
            {/* Glowing circle back */}
            <circle cx="50" cy="50" r="30" fill="rgba(234,179,8,0.2)" />
            {/* Star back */}
            <path d="M 50 12 L 58 30 L 78 32 L 62 45 L 67 65 L 50 53 L 33 65 L 38 45 L 22 32 L 42 30 Z" fill="rgba(234,179,8,0.1)" stroke="#EAB308" strokeWidth="1" />
            {/* Anchor Ring */}
            <circle cx="50" cy="22" r="7" fill="none" stroke="url(#anchorGold)" strokeWidth="4" />
            {/* Anchor Shaft */}
            <line x1="50" y1="29" x2="50" y2="72" stroke="url(#anchorGold)" strokeWidth="6" />
            <line x1="38" y1="38" x2="62" y2="38" stroke="url(#anchorGold)" strokeWidth="4" />
            {/* Anchor Flukes */}
            <path d="M 24 50 C 24 72 76 72 76 50" fill="none" stroke="url(#anchorGold)" strokeWidth="6" strokeLinecap="round" />
            <path d="M 20 46 L 24 54 L 32 50 Z M 80 46 L 76 54 L 68 50 Z" fill="url(#anchorGold)" />
            {/* Center diamond */}
            <rect x="47" y="44" width="6" height="6" fill="#FFF" transform="rotate(45 50 47)" />
            {/* Pink Banner */}
            <path d="M 12 66 L 88 66 L 82 78 L 18 78 Z" fill="url(#wildPink)" stroke="#111" strokeWidth="1.5" />
            <text x="50" y="76" textAnchor="middle" fill="#FFF" fontSize="10" fontWeight="900" letterSpacing="2">WILD</text>
          </svg>
        </div>
      );

    case 'SCATTER':
      return (
        <div id="symbol-scatter" className={`${containerClass} ${glowClass}`}>
          {/* Japanese Oni Tattoo Mask */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="oniRed" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
              <linearGradient id="oniTeal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2DD4BF" />
                <stop offset="100%" stopColor="#0F766E" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="38" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.4)" strokeWidth="2" />
            {/* Horns */}
            <path d="M 32 30 C 24 15 14 18 16 5 C 25 8 32 18 34 26 Z" fill="#FDE047" stroke="#111" strokeWidth="1.5" />
            <path d="M 68 30 C 76 15 86 18 84 5 C 75 8 68 18 66 26 Z" fill="#FDE047" stroke="#111" strokeWidth="1.5" />
            {/* Face */}
            <path d="M 28 32 C 28 32 24 50 28 70 C 32 82 68 82 72 70 C 76 50 72 32 72 32 Z" fill="url(#oniRed)" stroke="#111" strokeWidth="2" />
            {/* Eyes */}
            <circle cx="40" cy="46" r="5" fill="#FDE047" stroke="#111" strokeWidth="1" />
            <circle cx="40" cy="46" r="1.5" fill="#000" />
            <circle cx="60" cy="46" r="5" fill="#FDE047" stroke="#111" strokeWidth="1" />
            <circle cx="60" cy="46" r="1.5" fill="#000" />
            {/* Fangs & Mouth */}
            <path d="M 38 65 Q 50 58 62 65" stroke="#FFF" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 36 60 L 38 68 L 42 62 Z M 64 60 L 62 68 L 58 62 Z" fill="#FFF" />
            {/* SCATTER Gold Plate */}
            <rect x="18" y="74" width="64" height="15" rx="4" fill="url(#oniTeal)" stroke="#FFF" strokeWidth="1.5" />
            <text x="50" y="85" textAnchor="middle" fill="#FFF" fontSize="8" fontWeight="900" letterSpacing="1">SCATTER</text>
          </svg>
        </div>
      );

    case 'HEART':
      return (
        <div id="symbol-heart" className={`${containerClass} ${glowClass}`}>
          {/* Classic Old School Sacred Heart wrapped with golden banner */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="heartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#7F1D1D" />
              </linearGradient>
              <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#CA8A04" />
              </linearGradient>
            </defs>
            {/* Sacred Flame */}
            <path d="M 50 8 C 45 18 55 24 50 32 C 55 24 45 18 50 8 Z" fill="#F97316" />
            <path d="M 50 14 C 47 20 53 24 50 29 C 52 24 48 20 50 14 Z" fill="#EF4444" />
            {/* Heart */}
            <path d="M 50 82 C 50 82 18 54 18 36 C 18 24 28 14 40 16 C 45 17 48 21 50 24 C 52 21 55 17 60 16 C 72 14 82 24 82 36 C 82 54 50 82 50 82 Z" fill="url(#heartGrad)" stroke="#111" strokeWidth="2" />
            {/* Dagger cutting heart */}
            <path d="M 28 24 L 72 68" stroke="#E2E8F0" strokeWidth="5" strokeLinecap="round" />
            <path d="M 25 21 L 31 27" stroke="#CA8A04" strokeWidth="4" />
            {/* Golden Ribbon Wrap */}
            <path d="M 12 48 Q 50 56 88 48 L 84 58 Q 50 66 16 58 Z" fill="url(#bannerGrad)" stroke="#111" strokeWidth="1.5" />
            <text x="50" y="56" textAnchor="middle" fill="#111" fontSize="7" fontWeight="900" letterSpacing="0.5">TRUE LOVE</text>
          </svg>
        </div>
      );

    case 'MACHINE':
      return (
        <div id="symbol-machine" className={`${containerClass} ${glowClass}`}>
          {/* Golden Rotary Tattoo Machine */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="machGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFbeb" />
                <stop offset="35%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="coilPurple" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#581C87" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="38" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
            {/* Frame */}
            <path d="M 22 45 L 35 22 L 65 22 L 72 38 L 55 45 Z" fill="url(#machGold)" stroke="#111" strokeWidth="2" />
            {/* Coils */}
            <rect x="36" y="28" width="10" height="14" rx="2" fill="url(#coilPurple)" stroke="#111" strokeWidth="1.5" />
            <rect x="48" y="28" width="10" height="14" rx="2" fill="url(#coilPurple)" stroke="#111" strokeWidth="1.5" />
            <line x1="36" y1="35" x2="58" y2="35" stroke="#FDE047" strokeWidth="2" />
            {/* Armature Bar */}
            <rect x="30" y="24" width="35" height="4" fill="#374151" stroke="#111" strokeWidth="1" />
            {/* Tube & Grip */}
            <path d="M 24 45 L 20 75 L 14 75 L 18 45 Z" fill="#9CA3AF" stroke="#111" strokeWidth="1.5" />
            {/* Tip & Needle */}
            <line x1="17" y1="75" x2="15" y2="88" stroke="#111" strokeWidth="2" />
            <circle cx="15" cy="88" r="1.5" fill="#EF4444" /> {/* red ink on tip */}
            {/* Binding Posts */}
            <circle cx="68" cy="28" r="4" fill="#6B7280" stroke="#111" strokeWidth="1" />
            <circle cx="68" cy="36" r="4" fill="#6B7280" stroke="#111" strokeWidth="1" />
          </svg>
        </div>
      );

    case 'INK':
      return (
        <div id="symbol-ink" className={`${containerClass} ${glowClass}`}>
          {/* Ink Bottle with skull logo */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="inkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="40%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#1E1B4B" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="38" fill="rgba(220,38,38,0.1)" stroke="rgba(220,38,38,0.2)" strokeWidth="1" />
            {/* Bottle cap */}
            <path d="M 44 20 L 56 20 L 54 28 L 46 28 Z" fill="#374151" stroke="#111" strokeWidth="1.5" />
            <path d="M 47 15 L 53 15 L 51 20 L 49 20 Z" fill="#9CA3AF" stroke="#111" strokeWidth="1" />
            {/* Bottle Body */}
            <path d="M 32 36 C 32 28 68 28 68 36 L 68 76 C 68 82 32 82 32 76 Z" fill="url(#inkGrad)" stroke="#111" strokeWidth="2" />
            {/* Ink Level line */}
            <path d="M 32 54 Q 50 56 68 54" fill="none" stroke="#EF4444" strokeWidth="2" />
            {/* White Label */}
            <rect x="38" y="44" width="24" height="24" rx="2" fill="#FFF" stroke="#111" strokeWidth="1.5" />
            {/* Tiny Skull on label */}
            <circle cx="50" cy="52" r="4" fill="#000" />
            <rect x="48" y="55" width="4" height="4" fill="#000" />
            {/* Splashes */}
            <circle cx="24" cy="42" r="3" fill="#EF4444" />
            <circle cx="74" cy="65" r="4" fill="#EF4444" />
          </svg>
        </div>
      );

    case 'BOOTS':
      return (
        <div id="symbol-boots" className={`${containerClass} ${glowClass}`}>
          {/* Black Combat/Tattoo Boots with yellow stitching & laces (perfect representation of the screenshot shoes!) */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <defs>
              <linearGradient id="bootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4B5563" />
                <stop offset="50%" stopColor="#1F2937" />
                <stop offset="100%" stopColor="#111827" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="38" fill="rgba(17,24,39,0.2)" />
            {/* Left Shoe */}
            <g transform="translate(-4, -4)">
              {/* Boot upper */}
              <path d="M 35 25 L 52 25 L 48 55 L 68 62 L 68 72 L 32 72 L 32 45 Z" fill="url(#bootGrad)" stroke="#111" strokeWidth="2" />
              {/* Sole */}
              <rect x="29" y="72" width="42" height="6" rx="2" fill="#111" stroke="#FBBF24" strokeWidth="1" />
              {/* Yellow Laces */}
              <line x1="44" y1="32" x2="48" y2="32" stroke="#FBBF24" strokeWidth="1.5" />
              <line x1="43" y1="38" x2="47" y2="38" stroke="#FBBF24" strokeWidth="1.5" />
              <line x1="42" y1="44" x2="46" y2="44" stroke="#FBBF24" strokeWidth="1.5" />
              <line x1="41" y1="50" x2="45" y2="50" stroke="#FBBF24" strokeWidth="1.5" />
              {/* Star accent */}
              <polygon points="36,40 38,44 42,44 39,47 40,51 36,49 32,51 33,47 30,44 34,44" fill="#FDE047" />
            </g>
            {/* Right Shoe behind */}
            <g transform="translate(14, 8) scale(0.9)">
              <path d="M 35 25 L 52 25 L 48 55 L 68 62 L 68 72 L 32 72 L 32 45 Z" fill="url(#bootGrad)" stroke="#111" strokeWidth="2" opacity="0.9" />
              <rect x="29" y="72" width="42" height="6" rx="2" fill="#111" stroke="#FBBF24" strokeWidth="1" />
              <line x1="44" y1="32" x2="48" y2="32" stroke="#FBBF24" strokeWidth="1.5" />
              <line x1="43" y1="38" x2="47" y2="38" stroke="#FBBF24" strokeWidth="1.5" />
              <line x1="42" y1="44" x2="46" y2="44" stroke="#FBBF24" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      );

    case 'NEEDLE':
      return (
        <div id="symbol-needle" className={`${containerClass} ${glowClass}`}>
          {/* Crossed Steel Tattoo Needles / Cartridges with purple/blue details */}
          <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
            <circle cx="50" cy="50" r="38" fill="rgba(148,163,184,0.15)" />
            {/* Cartridge 1 (Diagonal Left to Right) */}
            <g transform="translate(50,50) rotate(45) translate(-50,-50)">
              <rect x="44" y="20" width="12" height="45" rx="2" fill="#3B82F6" stroke="#111" strokeWidth="1.5" />
              <rect x="46" y="25" width="8" height="25" rx="1" fill="#E2E8F0" />
              {/* Metal Tip */}
              <path d="M 46 65 L 54 65 L 50 82 Z" fill="#94A3B8" stroke="#111" strokeWidth="1.5" />
              {/* Plunger */}
              <rect x="48" y="14" width="4" height="6" fill="#1F2937" />
              {/* Drops */}
              <circle cx="50" cy="86" r="2.5" fill="#3B82F6" />
            </g>
            {/* Cartridge 2 (Diagonal Right to Left) */}
            <g transform="translate(50,50) rotate(-45) translate(-50,-50)">
              <rect x="44" y="20" width="12" height="45" rx="2" fill="#8B5CF6" stroke="#111" strokeWidth="1.5" />
              <rect x="46" y="25" width="8" height="25" rx="1" fill="#E2E8F0" />
              {/* Metal Tip */}
              <path d="M 46 65 L 54 65 L 50 82 Z" fill="#94A3B8" stroke="#111" strokeWidth="1.5" />
              {/* Plunger */}
              <rect x="48" y="14" width="4" height="6" fill="#1F2937" />
              {/* Drops */}
              <circle cx="50" cy="86" r="2.5" fill="#8B5CF6" />
            </g>
          </svg>
        </div>
      );

    // Neon Card suits as seen in the boxing/bubble-gum screenshot
    case 'A':
      return (
        <div id="symbol-a" className={`${containerClass} ${glowClass} flex items-center justify-center`}>
          <span className="text-5xl sm:text-6xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-indigo-600 tracking-tighter filter drop-shadow-[0_4px_12px_rgba(139,92,246,0.8)]">
            A
          </span>
        </div>
      );

    case 'K':
      return (
        <div id="symbol-k" className={`${containerClass} ${glowClass} flex items-center justify-center`}>
          <span className="text-5xl sm:text-6xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-700 tracking-tighter filter drop-shadow-[0_4px_12px_rgba(59,130,246,0.8)]">
            K
          </span>
        </div>
      );

    case 'Q':
      return (
        <div id="symbol-q" className={`${containerClass} ${glowClass} flex items-center justify-center`}>
          <span className="text-5xl sm:text-6xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-b from-rose-400 to-red-600 tracking-tighter filter drop-shadow-[0_4px_12px_rgba(244,63,94,0.8)]">
            Q
          </span>
        </div>
      );

    case 'J':
      return (
        <div id="symbol-j" className={`${containerClass} ${glowClass} flex items-center justify-center`}>
          <span className="text-5xl sm:text-6xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-teal-600 tracking-tighter filter drop-shadow-[0_4px_12px_rgba(16,185,129,0.8)]">
            J
          </span>
        </div>
      );

    case '10':
      return (
        <div id="symbol-10" className={`${containerClass} ${glowClass} flex items-center justify-center`}>
          <span className="text-4xl sm:text-5xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-orange-500 tracking-tighter filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.8)]">
            10
          </span>
        </div>
      );

    default:
      return <div className="text-white text-lg font-bold">{symbol}</div>;
  }
};

const COLS = 5;
const ROWS = 3;

// Reel Column Component for Spinning Animation
const ReelColumnComponent: React.FC<{
  spinning: boolean;
  symbols: string[];
  colIndex: number;
  winningPositions: {r: number, c: number}[];
  isTurbo: string; // 'none' | 'turbo' | 'super' | 'instant'
}> = ({
  spinning,
  symbols,
  colIndex,
  winningPositions,
  isTurbo
}) => {
  // Generate a random array of blurred symbols to show while spinning
  const [spinSymbols] = useState(() => 
    Array.from({ length: 15 }, () => WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)])
  );

  return (
    <div className="flex flex-col h-full overflow-hidden relative backdrop-blur-sm border-r border-dashed border-white/10 last:border-r-0 bg-neutral-950/80">
      {/* Skeleton / Placeholder to maintain responsive sizing */}
      <div className="flex flex-col w-full invisible">
        {symbols.map((_, i) => (
          <div key={i} className="aspect-square w-full" />
        ))}
      </div>

      {spinning ? (
        <motion.div 
          className="flex flex-col absolute top-0 left-0 w-full"
          animate={{ y: ["-75%", "0%"] }}
          transition={{ 
            repeat: Infinity, 
            duration: isTurbo === 'super' ? 0.05 : isTurbo === 'turbo' ? 0.1 : 0.2, 
            ease: "linear" 
          }}
        >
          {[...spinSymbols, ...spinSymbols, ...spinSymbols, ...spinSymbols].map((sym, i) => {
            return (
              <div key={i} className="aspect-square flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center blur-[5px] opacity-45 scale-90">
                  {renderTattooSymbol(sym, false)}
                </div>
              </div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div 
          className="flex flex-col absolute top-0 left-0 w-full h-full"
          initial={{ y: "-15%" }}
          animate={{ y: "0%" }}
          transition={{ type: "spring", stiffness: 350, damping: 22, mass: 0.9 }}
        >
          {symbols.map((sym, rIndex) => {
            const isWinning = winningPositions.some(p => p.r === rIndex && p.c === colIndex);
            return (
              <div key={rIndex} className="aspect-square flex items-center justify-center border-b border-white/5 last:border-b-0">
                {renderTattooSymbol(sym, isWinning)}
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

// Big Win Modal Overlay Component
const BigWinCelebration = ({ amount, onComplete }: { amount: number; onComplete: () => void }) => {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = amount;
    const duration = 2500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + progress * (end - start);
      setDisplayAmount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(onComplete, 2000);
      }
    };

    requestAnimationFrame(animate);
  }, [amount, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
    >
      <div className="relative flex flex-col items-center p-8 text-center max-w-md">
        {/* Spotlights behind */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-48 h-48 bg-pink-500/20 blur-[80px] rounded-full animate-pulse" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-48 h-48 bg-cyan-500/20 blur-[80px] rounded-full animate-pulse" />

        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1.1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative z-10"
        >
          <h2 className="text-6xl sm:text-7xl font-black italic tracking-tighter text-gradient-gold drop-shadow-[0_0_35px_rgba(234,179,8,0.85)] uppercase animate-bounce">
            BIG WIN!
          </h2>
          <p className="text-pink-500 font-bold uppercase tracking-widest text-sm mt-1">TATTOO SUPREME</p>
        </motion.div>
        
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 z-10 bg-neutral-900/90 border border-amber-400/30 px-8 py-5 rounded-3xl shadow-[0_0_30px_rgba(251,191,36,0.15)]"
        >
          <p className="text-xs text-amber-400/80 uppercase font-mono tracking-widest mb-1">Prêmio Total</p>
          <p className="text-4xl sm:text-5xl font-black text-white font-mono">
            R$ {displayAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        {/* Floating Stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-400"
              initial={{ 
                x: Math.random() * 300 - 150, 
                y: 300, 
                scale: Math.random() * 0.5 + 0.5, 
                opacity: 1 
              }}
              animate={{ 
                y: -300, 
                x: Math.random() * 300 - 150, 
                rotate: 360, 
                opacity: 0 
              }}
              transition={{ 
                duration: Math.random() * 2 + 1.5, 
                repeat: Infinity,
                delay: Math.random() * 0.5
              }}
              style={{ left: '50%', top: '40%' }}
            >
              <Star size={16} fill="currentColor" />
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
      initial={{ scale: 0.6, opacity: 0, y: 10 }}
      animate={{ scale: 1.2, opacity: 1, y: -80 }}
      exit={{ scale: 1.6, opacity: 0, y: -150 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="absolute z-50 pointer-events-none bg-neutral-900/90 border border-green-500/40 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.3)] flex flex-col items-center justify-center"
      style={{ left: 'calc(50% - 70px)', bottom: '40%' }}
    >
      <span className="text-2xl sm:text-3xl font-black font-mono text-green-400 tracking-tight">
        +R$ {amount.toFixed(2)}
      </span>
      <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Excelente!</span>
    </motion.div>
  );
};

export function TattooSlot() {
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  const { playSfx, playGameMusic, stopGameMusic } = useAudio();

  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [gameConfig, setGameConfig] = useState<any>(null);
  
  // Base Bet configuration
  const [baseBet, setBaseBet] = useState(0.5);
  // Double Chance (Ante Bet +33% increase)
  const [doubleChance, setDoubleChance] = useState(false);
  
  // Active Bet calculated
  const activeBet = doubleChance ? parseFloat((baseBet * 1.33).toFixed(2)) : baseBet;

  // 5x3 Grid State
  const [grid, setGrid] = useState<string[][]>([
    ['10', 'Q', 'J', 'J', 'Q'],
    ['NEEDLE', 'INK', 'BOOTS', 'BOOTS', 'MACHINE'],
    ['A', 'K', '10', 'HEART', 'A']
  ]);

  // Spinning Statuses
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false, false, false]);

  // Wins and Highlights
  const [winningPositions, setWinningPositions] = useState<{r: number; c: number}[]>([]);
  const [winAmount, setWinAmount] = useState(0);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [showBigWin, setShowBigWin] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Settings
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoSpinsLeft, setAutoSpinsLeft] = useState(0);
  const [isTurbo, setIsTurbo] = useState<'none' | 'turbo' | 'super' | 'instant'>('none');
  const [currentTime, setCurrentTime] = useState('');

  // Free Spins State
  const [freeSpins, setFreeSpins] = useState(0);
  const [freeSpinsTotal, setFreeSpinsTotal] = useState(10);
  const [freeSpinsMultiplier, setFreeSpinsMultiplier] = useState(1);
  const [totalFreeSpinWin, setTotalFreeSpinWin] = useState(0);
  const [freeSpinsActive, setFreeSpinsActive] = useState(false);

  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showBetSelectionModal, setShowBetSelectionModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showBuyBonusModal, setShowBuyBonusModal] = useState(false);

  // Reference to monitor auto-spins
  const autoPlayRef = useRef(autoPlay);
  const autoSpinsLeftRef = useRef(autoSpinsLeft);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    autoSpinsLeftRef.current = autoSpinsLeft;
  }, [autoSpinsLeft]);

  // Initialize and load clock
  useEffect(() => {
    const fetchConfig = async () => {
      const config = await db.getGame('tattoo-slot');
      if (config) {
        setGameConfig(config);
        setBaseBet(config.minBet);
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
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);

    // Simulated network delay
    const loaderTimer = setTimeout(() => {
      setIsGameLoaded(true);
    }, 1500);

    return () => {
      stopGameMusic();
      clearInterval(timer);
      clearTimeout(loaderTimer);
    };
  }, []);

  // Handler for Autoplay loop
  useEffect(() => {
    if (autoPlay && autoSpinsLeft > 0 && !isSpinning && !freeSpinsActive) {
      const autoTimer = setTimeout(() => {
        spin();
      }, 800);
      return () => clearTimeout(autoTimer);
    } else if (autoPlay && autoSpinsLeft === 0) {
      setAutoPlay(false);
    }
  }, [autoPlay, autoSpinsLeft, isSpinning, freeSpinsActive]);

  // Handler for Free Spins loop
  useEffect(() => {
    if (freeSpinsActive && freeSpins > 0 && !isSpinning) {
      const freeSpinsTimer = setTimeout(() => {
        spin();
      }, 1000);
      return () => clearTimeout(freeSpinsTimer);
    } else if (freeSpinsActive && freeSpins === 0) {
      setFreeSpinsActive(false);
      // Show big modal for total free spin win if > 0
      if (totalFreeSpinWin > 0) {
        setShowBigWin(true);
      }
    }
  }, [freeSpinsActive, freeSpins, isSpinning]);

  // Change base bet
  const adjustBet = (direction: 'up' | 'down') => {
    if (isSpinning) return;
    playSfx('click');
    const bets = [0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0];
    const currentIndex = bets.indexOf(baseBet);
    if (direction === 'up' && currentIndex < bets.length - 1) {
      setBaseBet(bets[currentIndex + 1]);
    } else if (direction === 'down' && currentIndex > 0) {
      setBaseBet(bets[currentIndex - 1]);
    }
  };

  // Generate grid with target winnings
  const generateGrid = (target: number) => {
    // If target is high, place a premium win of Tattoo Machines or Ink bottles
    if (target >= baseBet * 10) {
      const premiumSyms = ['MACHINE', 'INK', 'HEART', 'BOOTS'];
      const winSym = premiumSyms[Math.floor(Math.random() * premiumSyms.length)];
      
      const newGrid = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)])
      );

      // Distribute winSym in every column to trigger multiple ways
      for (let c = 0; c < COLS; c++) {
        const r = Math.floor(Math.random() * ROWS);
        newGrid[r][c] = winSym;
      }
      
      // Inject WILD in column 3 to spice it up
      newGrid[Math.floor(Math.random() * ROWS)][2] = 'WILD';

      // If Scatter is triggered
      if (Math.random() < 0.2 || doubleChance) {
        newGrid[Math.floor(Math.random() * ROWS)][0] = 'SCATTER';
        newGrid[Math.floor(Math.random() * ROWS)][4] = 'SCATTER';
      }

      return newGrid;
    }
    // If target is a medium win, place 3 or 4 letter matches
    else if (target > 0) {
      const letterSyms = ['A', 'K', 'Q', 'J', '10'];
      const winSym = letterSyms[Math.floor(Math.random() * letterSyms.length)];
      const matchCount = Math.floor(Math.random() * 2) + 3; // 3 or 4 matches

      const newGrid = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)])
      );

      for (let c = 0; c < matchCount; c++) {
        const r = Math.floor(Math.random() * ROWS);
        newGrid[r][c] = winSym;
      }

      // Fill remaining columns with other symbols to ensure no bigger wins
      if (matchCount < COLS) {
        for (let r = 0; r < ROWS; r++) {
          if (newGrid[r][matchCount] === winSym || newGrid[r][matchCount] === 'WILD') {
            newGrid[r][matchCount] = winSym === 'A' ? '10' : 'A';
          }
        }
      }

      return newGrid;
    }
    // No-win scenario
    else {
      // Keep generating until no ways to win exist
      let attempts = 0;
      let newGrid: string[][] = [];
      
      while (attempts < 10) {
        newGrid = Array.from({ length: ROWS }, () =>
          Array.from({ length: COLS }, () => WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)])
        );

        // Break potential matches by ensuring column 3 doesn't match columns 1 & 2
        const col1Syms = newGrid.map(row => row[0]);
        const col2Syms = newGrid.map(row => row[1]);
        
        let hasPotential = false;
        newGrid.forEach((row, rIdx) => {
          const sym = row[2];
          if (col1Syms.includes(sym) || col2Syms.includes(sym) || sym === 'WILD') {
            hasPotential = true;
            // Overwrite with an absolute low-value card suit
            newGrid[rIdx][2] = '10';
          }
        });

        if (!hasPotential) break;
        attempts++;
      }

      // Add scatter symbols if double chance or randomized
      if (Math.random() < 0.1 || (doubleChance && Math.random() < 0.25)) {
        newGrid[Math.floor(Math.random() * ROWS)][0] = 'SCATTER';
        newGrid[Math.floor(Math.random() * ROWS)][2] = 'SCATTER';
      }

      return newGrid;
    }
  };

  // Main Spin Core Function
  const spin = async () => {
    if (isSpinning) return;
    
    // Check balance
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

    // Deduct Balance
    if (!freeSpinsActive) {
      await updateBalance(-cost, 'bet', 'tattoo-slot', { bet: cost });
    }

    playSfx('spin');

    // Query target prize
    let currentTarget = 0;
    try {
      if (user) {
        const { amount } = await PrizeService.getTargetPrize(user.id, 'slots');
        currentTarget = amount;
      }
    } catch (err) {
      console.error("Error retrieving prize:", err);
    }

    // Generate grid
    const finalGrid = generateGrid(currentTarget);

    // Instant stop bypasses spinning
    if (isTurbo === 'instant') {
      setGrid(finalGrid);
      evaluateWinnings(finalGrid);
      return;
    }

    // Trigger spinning animation for all columns
    setSpinningCols([true, true, true, true, true]);

    // Animate grid change
    setGrid(finalGrid);

    // Stagger column stops
    const durations = isTurbo === 'super' 
      ? [100, 150, 200, 250, 300]
      : isTurbo === 'turbo'
        ? [250, 350, 450, 550, 650]
        : [500, 800, 1100, 1400, 1700];

    durations.forEach((delay, idx) => {
      setTimeout(() => {
        setSpinningCols(prev => {
          const next = [...prev];
          next[idx] = false;
          return next;
        });
        playSfx('click');

        // On the final column stop, evaluate
        if (idx === COLS - 1) {
          evaluateWinnings(finalGrid);
        }
      }, delay);
    });
  };

  // Evaluate final grid ways to win
  const evaluateWinnings = async (finalGrid: string[][]) => {
    const PAYTABLE: Record<string, number[]> = {
      'HEART': [0, 0, 0, 2.5, 5.0, 12.0],
      'MACHINE': [0, 0, 0, 2.0, 4.0, 8.0],
      'INK': [0, 0, 0, 1.5, 3.0, 6.0],
      'BOOTS': [0, 0, 0, 1.2, 2.5, 5.0],
      'NEEDLE': [0, 0, 0, 1.0, 2.0, 4.0],
      'A': [0, 0, 0, 0.6, 1.2, 2.5],
      'K': [0, 0, 0, 0.5, 1.0, 2.0],
      'Q': [0, 0, 0, 0.4, 0.8, 1.6],
      'J': [0, 0, 0, 0.3, 0.6, 1.2],
      '10': [0, 0, 0, 0.2, 0.4, 0.8],
    };

    let totalWin = 0;
    let newWinningPositions: {r: number; c: number}[] = [];

    // Count scatter symbols
    let scatterCount = 0;
    finalGrid.forEach(row => {
      row.forEach(symbol => {
        if (symbol === 'SCATTER') scatterCount++;
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
          break; // Must be consecutive from column 1
        }
      }

      if (matchCount >= 3) {
        const payoutMultiplier = PAYTABLE[symbol][matchCount];
        if (payoutMultiplier > 0) {
          const winMultiplier = freeSpinsActive ? freeSpinsMultiplier : 1;
          const cashWin = baseBet * payoutMultiplier * ways * winMultiplier;
          totalWin += cashWin;

          // Push positions
          tempPositions.forEach(pos => {
            if (pos.c < matchCount && !newWinningPositions.some(p => p.r === pos.r && p.c === pos.c)) {
              newWinningPositions.push(pos);
            }
          });
        }
      }
    });

    // Payout logic
    if (totalWin > 0) {
      setWinningPositions(newWinningPositions);
      setWinAmount(totalWin);

      // Check if Big Win (25x bet)
      if (totalWin >= baseBet * 25) {
        setShowBigWin(true);
        setIsShaking(true);
      } else {
        setShowWinCelebration(true);
      }

      if (user) {
        await updateBalance(totalWin, 'win', 'tattoo-slot', { winningPositions: newWinningPositions });
        await PrizeService.commitPrize(user.id, totalWin);
      }
      playSfx('win');

      if (freeSpinsActive) {
        setTotalFreeSpinWin(prev => prev + totalWin);
      }
    }

    // Handle free spins trigger
    if (scatterTriggered) {
      playSfx('win');
      if (freeSpinsActive) {
        setFreeSpins(prev => prev + 10);
        setFreeSpinsTotal(prev => prev + 10);
      } else {
        setFreeSpins(10);
        setFreeSpinsTotal(10);
        setTotalFreeSpinWin(0);
        setFreeSpinsMultiplier(1);
        setFreeSpinsActive(true);
        setAutoPlay(false); // Stop standard autoplay
      }
    }

    // Decrement free spins or autoplay
    if (freeSpinsActive && freeSpins > 0) {
      setFreeSpins(prev => prev - 1);
      // Increment free spins multiplier on every win during free spins
      if (totalWin > 0) {
        setFreeSpinsMultiplier(prev => prev + 1);
      }
    } else if (autoPlay && autoSpinsLeft > 0) {
      setAutoSpinsLeft(prev => prev - 1);
    }

    setIsSpinning(false);
  };

  // Buy Free Spins Feature
  const buyFreeSpinsFeature = async (superMode: boolean) => {
    if (isSpinning || freeSpinsActive) return;
    const cost = baseBet * (superMode ? 300 : 100);

    if (!user || user.balance < cost) {
      alert('Saldo insuficiente para comprar rodadas grátis.');
      return;
    }

    playSfx('click');
    // Deduct cost
    await updateBalance(-cost, 'bet', 'tattoo-slot', { buyFreeSpins: true, superMode, cost });

    // Set free spins state
    setFreeSpins(10);
    setFreeSpinsTotal(10);
    setFreeSpinsMultiplier(superMode ? 5 : 1);
    setTotalFreeSpinWin(0);
    setFreeSpinsActive(true);
  };

  return (
    <div className="h-screen max-h-screen bg-black text-white relative font-sans flex flex-col justify-between overflow-hidden select-none">
      {/* Absolute Header with Glowing Lights */}
      <div className="absolute top-0 left-0 right-0 h-44 pointer-events-none z-0 overflow-hidden">
        {/* Pink Spotlight (Left) */}
        <div className="absolute -top-10 left-[10%] w-[40vw] h-[40vw] bg-pink-600/25 blur-[100px] rounded-full animate-pulse" />
        {/* Blue Spotlight (Right) */}
        <div className="absolute -top-10 right-[10%] w-[40vw] h-[40vw] bg-cyan-600/25 blur-[100px] rounded-full animate-pulse" />
        
        {/* Grid lines or retro scan lines */}
        <div className="absolute inset-0 bg-radial-vignette opacity-30" />
      </div>

      <AnimatePresence>
        {!isGameLoaded && (
          <GameLoader gameId="tattoo-slot" onComplete={() => setIsGameLoaded(true)} />
        )}
      </AnimatePresence>

      {/* Main Game Interface */}
      <div className="flex-1 max-w-md sm:max-w-lg mx-auto w-full px-3 py-1.5 flex flex-col justify-between relative z-10 overflow-hidden">
        
        {/* TOP BAR / NAVIGATION */}
        <div className="flex justify-between items-center w-full mb-1.5">
          <button 
            id="btn-lobby"
            onClick={() => {
              playSfx('click');
              navigate('/app');
            }}
            className="flex flex-col items-center justify-center bg-black/60 border border-white/10 hover:border-white/30 rounded-full w-11 h-11 cursor-pointer transition-all active:scale-95"
          >
            <ArrowLeft size={16} className="text-white" />
            <span className="text-[8px] uppercase tracking-wider text-white/70 font-bold mt-0.5">Lobby</span>
          </button>

          {/* Logo container */}
          <div className="flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
              TATTOO SLOT
            </h1>
            <div className="bg-gradient-to-r from-orange-500 to-red-600 px-2 py-0.5 rounded-full mt-0.5 border border-orange-400/25">
              <span className="text-[8px] font-black tracking-widest text-white uppercase">BONUS ROUND</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              id="btn-info"
              onClick={() => {
                playSfx('click');
                setShowInfoModal(true);
              }}
              className="bg-black/60 border border-white/10 hover:border-white/30 rounded-full w-11 h-11 flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Info size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* FREE SPINS BAR */}
        {freeSpinsActive && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-red-600/90 via-purple-600/90 to-blue-600/90 border border-amber-400/40 px-3 py-1.5 rounded-xl mb-1.5 text-center shadow-[0_0_15px_rgba(234,179,8,0.15)] flex justify-between items-center"
          >
            <div className="text-left">
              <p className="text-[8px] text-white/70 font-black uppercase tracking-widest">Rodadas Grátis</p>
              <p className="text-base font-mono font-black">{freeSpins} / {freeSpinsTotal}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-amber-300 font-black uppercase tracking-widest">Multiplicador</p>
              <p className="text-lg font-black text-amber-300">x{freeSpinsMultiplier}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-white/70 font-black uppercase tracking-widest">Ganho Total</p>
              <p className="text-base font-mono font-black text-green-400">R$ {totalFreeSpinWin.toFixed(2)}</p>
            </div>
          </motion.div>
        )}

        {/* REELS AREA */}
        <div className="w-full flex flex-col justify-center">
          
          {/* BOXING RING ROPE FRAME */}
          <div className="bg-neutral-900 border-[6px] border-double border-red-600 rounded-3xl p-1 shadow-[0_0_35px_rgba(0,0,0,0.9)] relative overflow-hidden">
            
            {/* Outer boundary with stripes */}
            <div className="absolute inset-0 border-4 border-blue-600 rounded-2xl pointer-events-none z-20" />
            <div className="absolute top-0 bottom-0 left-0 right-0 border-2 border-white pointer-events-none z-20" />

            {/* 5x3 Reels Grid */}
            <div 
              className={`grid grid-cols-5 bg-neutral-950/90 rounded-xl overflow-hidden transition-all duration-100 ${
                isShaking ? 'animate-shake' : ''
              }`}
            >
              {Array.from({ length: COLS }).map((_, colIdx) => (
                <ReelColumnComponent
                  key={colIdx}
                  spinning={spinningCols[colIdx]}
                  symbols={grid.map(row => row[colIdx])}
                  colIndex={colIdx}
                  winningPositions={winningPositions}
                  isTurbo={isTurbo}
                />
              ))}
            </div>
          </div>

          {/* Glowing yellow subtitle bar */}
          <div className="mt-2 text-center">
            <span className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black font-black text-[9px] uppercase tracking-[0.2em] px-4 py-0.5 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.25)] inline-block">
              FAÇA AS SUAS APOSTAS!
            </span>
          </div>
        </div>

        {/* QUICK ACCESS ACTIONS ROW */}
        <div className="grid grid-cols-2 gap-2 w-full my-1.5">
          {/* Ante Bet */}
          <button
            id="btn-ante-switch"
            onClick={() => {
              if (isSpinning || freeSpinsActive) return;
              playSfx('click');
              setDoubleChance(prev => !prev);
            }}
            disabled={isSpinning || freeSpinsActive}
            className={`py-2 px-3 rounded-2xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              doubleChance
                ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-neutral-900 border-white/10 text-white/50 hover:bg-neutral-800'
            }`}
          >
            <Zap size={11} className={doubleChance ? "text-white animate-pulse" : "text-purple-400"} />
            Ante Bet {doubleChance ? 'ON' : 'OFF'}
          </button>

          {/* Buy Bonus Feature */}
          <button
            id="btn-buy-bonus-trigger"
            onClick={() => {
              playSfx('click');
              setShowBuyBonusModal(true);
            }}
            disabled={isSpinning || freeSpinsActive}
            className="py-2 px-3 rounded-2xl border border-amber-500/30 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <Coins size={11} className="text-amber-400" />
            Comprar Rodadas
          </button>
        </div>

        {/* GAME CONTROL CONSOLE */}
        <div className="bg-neutral-900/90 border border-white/5 rounded-3xl p-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex flex-col items-center gap-3">
          
          <div className="w-full flex justify-between items-center gap-2">
            
            {/* Left Actions: Info, Autoplay, Speed */}
            <div className="flex gap-1.5">
              <button
                id="btn-autoplay"
                onClick={() => {
                  playSfx('click');
                  if (autoPlay) {
                    setAutoPlay(false);
                    setAutoSpinsLeft(0);
                  } else {
                    setAutoPlay(true);
                    setAutoSpinsLeft(25);
                  }
                }}
                disabled={isSpinning || freeSpinsActive}
                className={`w-10 h-10 rounded-full border flex flex-col items-center justify-center cursor-pointer transition-all ${
                  autoPlay 
                    ? 'bg-orange-600 border-orange-400 text-white animate-spin'
                    : 'bg-black/60 border-white/10 hover:border-white/30 text-white/80'
                }`}
              >
                <RefreshCw size={14} />
                <span className="text-[7px] font-mono mt-0.5">
                  {autoPlay ? autoSpinsLeft : 'Auto'}
                </span>
              </button>

              <button
                id="btn-turbo"
                onClick={() => {
                  playSfx('click');
                  const stages: ('none' | 'turbo' | 'super' | 'instant')[] = ['none', 'turbo', 'super', 'instant'];
                  const nextIndex = (stages.indexOf(isTurbo) + 1) % stages.length;
                  setIsTurbo(stages[nextIndex]);
                }}
                className={`w-10 h-10 rounded-full border flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isTurbo !== 'none'
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-black/60 border-white/10 hover:border-white/30 text-white/80'
                }`}
              >
                <Zap size={14} />
                <span className="text-[7px] font-mono mt-0.5 uppercase">
                  {isTurbo === 'none' ? 'Normal' : isTurbo}
                </span>
              </button>
            </div>

            {/* Middle: Big Spin Button with minus and plus controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Minus Bet */}
              <button
                id="btn-bet-minus"
                onClick={() => adjustBet('down')}
                disabled={isSpinning || freeSpinsActive}
                className="bg-black/70 border border-white/10 hover:border-white/30 disabled:opacity-30 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Minus size={14} className="text-white" />
              </button>

              {/* SPIN TRIGGERS */}
              <button
                id="btn-spin"
                onClick={spin}
                disabled={isSpinning}
                className="relative bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-full w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-75 transition-all duration-300 active:scale-90"
              >
                <motion.div 
                  className="absolute inset-1 border border-dashed border-white/40 rounded-full"
                  animate={{ rotate: isSpinning ? 360 : 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
                
                {/* Tattoo machine / skull indicator in center */}
                <svg viewBox="0 0 100 100" className="w-8 h-8 text-black fill-current">
                  <path d="M 50 15 C 30 15 15 30 15 50 C 15 70 30 85 50 85 C 70 85 85 70 85 50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                  <polygon points="85,42 93,52 77,52" fill="currentColor" />
                  {/* Miniature skull inside */}
                  <circle cx="50" cy="46" r="8" fill="currentColor" />
                  <rect x="46" cy="51" width="8" height="8" fill="currentColor" />
                  <circle cx="47" cy="45" r="2" fill="#FFF" />
                  <circle cx="53" cy="45" r="2" fill="#FFF" />
                </svg>
              </button>

              {/* Plus Bet */}
              <button
                id="btn-bet-plus"
                onClick={() => adjustBet('up')}
                disabled={isSpinning || freeSpinsActive}
                className="bg-black/70 border border-white/10 hover:border-white/30 disabled:opacity-30 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Plus size={14} className="text-white" />
              </button>

            </div>

            {/* Right Actions: Bet Selector & Audio / Menu */}
            <div className="flex gap-1.5">
              <button
                id="btn-bet-selector"
                onClick={() => {
                  playSfx('click');
                  setShowBetSelectionModal(true);
                }}
                disabled={isSpinning || freeSpinsActive}
                className="w-10 h-10 rounded-full border bg-black/60 border-white/10 hover:border-white/30 text-white/80 flex flex-col items-center justify-center cursor-pointer active:scale-95"
              >
                <Coins size={14} />
                <span className="text-[7px] font-mono mt-0.5">Fichas</span>
              </button>

              <button
                id="btn-menu"
                onClick={() => {
                  playSfx('click');
                  setShowMenuModal(true);
                }}
                className="w-10 h-10 rounded-full border bg-black/60 border-white/10 hover:border-white/30 text-white/80 flex flex-col items-center justify-center cursor-pointer active:scale-95"
              >
                <Menu size={14} />
                <span className="text-[7px] font-mono mt-0.5">Opções</span>
              </button>
            </div>

          </div>

          {/* BALANCE AND CREDIT GRID */}
          <div className="w-full grid grid-cols-2 gap-2 border-t border-white/5 pt-2">
            <div className="bg-black/30 px-3 py-1.5 rounded-xl text-left border border-white/5">
              <span className="text-[8px] text-white/40 uppercase block font-bold">Crédito</span>
              <span className="text-xs sm:text-sm font-black font-mono text-yellow-400">
                R$ {user?.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </span>
            </div>
            
            <div className="bg-black/30 px-3 py-1.5 rounded-xl text-right border border-white/5">
              <span className="text-[8px] text-white/40 uppercase block font-bold">Aposta Ativa</span>
              <span className="text-xs sm:text-sm font-black font-mono text-cyan-400">
                R$ {activeBet.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

        </div>

        {/* Win / Big Win Overlays */}
        <AnimatePresence>
          {showBigWin && (
            <BigWinCelebration
              amount={winAmount}
              onComplete={() => {
                setShowBigWin(false);
                setIsShaking(false);
              }}
            />
          )}

          {showWinCelebration && (
            <WinCelebrationIndicator amount={winAmount} />
          )}
        </AnimatePresence>

      </div>

      {/* GAME FOOTER DEVELOPER METADATA */}
      <div className="bg-neutral-950 border-t border-white/5 py-1 text-center">
        <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
          TATTOO STUDIO - {currentTime} - #1784479510462090
        </p>
      </div>

      {/* INFORMATION / PAYTABLE MODAL */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 border border-white/10 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 text-white relative"
            >
              <button 
                onClick={() => {
                  playSfx('click');
                  setShowInfoModal(false);
                }}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-black text-amber-400 mb-4 uppercase tracking-tight">
                Instruções & Tabela de Pagamentos
              </h2>

              <p className="text-xs text-white/70 mb-4 leading-relaxed">
                <strong>Tattoo Slot</strong> é um jogo de slots dinâmico com 5 colunas e 3 linhas, que utiliza o sistema de <strong>Caminhos de Vitória (Ways to Win)</strong>. Símbolos adjacentes idênticos de esquerda para a direita, começando na primeira coluna, premiam vitória!
              </p>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-purple-400 uppercase tracking-wider border-b border-white/5 pb-1">
                  Símbolos Especiais
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex gap-2 items-center bg-black/30 p-2.5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 flex-shrink-0 bg-neutral-950 rounded-xl overflow-hidden">
                      {renderTattooSymbol('WILD')}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">WILD</p>
                      <p className="text-[9px] text-white/60">Substitui todos os símbolos exceto SCATTER.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center bg-black/30 p-2.5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 flex-shrink-0 bg-neutral-950 rounded-xl overflow-hidden">
                      {renderTattooSymbol('SCATTER')}
                    </div>
                    <div>
                      <p className="text-xs font-black text-teal-300">SCATTER</p>
                      <p className="text-[9px] text-white/60">3 ou mais ativam 10 Rodadas Grátis!</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider border-b border-white/5 pb-1">
                  Multiplicadores de Símbolo (Multiplicado pela Aposta Base)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-black/35 p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-red-500 block">TRUE LOVE (HEART)</span>
                    <span className="text-[10px] text-white/50 block font-mono">5x: 12.0 | 4x: 5.0 | 3x: 2.5</span>
                  </div>
                  <div className="bg-black/35 p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-yellow-500 block">MÁQUINA</span>
                    <span className="text-[10px] text-white/50 block font-mono">5x: 8.0 | 4x: 4.0 | 3x: 2.0</span>
                  </div>
                  <div className="bg-black/35 p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-rose-500 block">TINTA</span>
                    <span className="text-[10px] text-white/50 block font-mono">5x: 6.0 | 4x: 3.0 | 3x: 1.5</span>
                  </div>
                  <div className="bg-black/35 p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-gray-400 block">BOTAS</span>
                    <span className="text-[10px] text-white/50 block font-mono">5x: 5.0 | 4x: 2.5 | 3x: 1.2</span>
                  </div>
                  <div className="bg-black/35 p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-blue-400 block">AGULHA</span>
                    <span className="text-[10px] text-white/50 block font-mono">5x: 4.0 | 4x: 2.0 | 3x: 1.0</span>
                  </div>
                  <div className="bg-black/35 p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-purple-400 block">REALEZA (A, K, Q...)</span>
                    <span className="text-[10px] text-white/50 block font-mono">Até 2.5x por vitória</span>
                  </div>
                </div>

                <h3 className="text-sm font-black text-purple-400 uppercase tracking-wider border-b border-white/5 pb-1">
                  Rodadas Grátis de Bônus
                </h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Durante as rodadas grátis, cada rodada vitoriosa incrementa o <strong>multiplicador global de bônus em +1x</strong>. Esse multiplicador é aplicado sobre todas as vitórias subsequentes, garantindo um potencial colossal de ganhos acumulados!
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK BET SELECTION MODAL */}
      <AnimatePresence>
        {showBetSelectionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 border border-white/10 rounded-3xl max-w-sm w-full p-6 text-white relative"
            >
              <button 
                onClick={() => {
                  playSfx('click');
                  setShowBetSelectionModal(false);
                }}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-black text-amber-400 mb-4 uppercase tracking-tight text-center">
                Selecionar Aposta Base
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {[0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0].map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      playSfx('click');
                      setBaseBet(b);
                      setShowBetSelectionModal(false);
                    }}
                    className={`py-3 rounded-2xl font-black font-mono text-sm border transition-all ${
                      baseBet === b
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-neutral-950 border-white/5 hover:bg-neutral-800 text-white'
                    }`}
                  >
                    R$ {b.toFixed(2)}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MENU MODAL */}
      <AnimatePresence>
        {showMenuModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 border border-white/10 rounded-3xl max-w-sm w-full p-6 text-white relative"
            >
              <button 
                onClick={() => {
                  playSfx('click');
                  setShowMenuModal(false);
                }}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-black text-amber-400 mb-6 uppercase tracking-tight text-center">
                Opções do Jogo
              </h2>

              <div className="space-y-4">
                <div className="bg-black/35 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black uppercase">Taxa de RTP</p>
                    <p className="text-[10px] text-white/50">Retorno Teórico ao Jogador</p>
                  </div>
                  <span className="text-sm font-black font-mono text-green-400">98.0%</span>
                </div>

                <div className="bg-black/35 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black uppercase">Volatilidade</p>
                    <p className="text-[10px] text-white/50">Frequência e escala de prêmios</p>
                  </div>
                  <span className="text-sm font-black font-mono text-red-400">MUITO ALTA</span>
                </div>

                <div className="bg-black/35 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black uppercase">Parceria Oficial</p>
                    <p className="text-[10px] text-white/50">Desenvolvedor Certificado</p>
                  </div>
                  <span className="text-xs font-black font-mono text-yellow-400">PRAGMATIC TATTOO</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BUY BONUS MODAL */}
      <AnimatePresence>
        {showBuyBonusModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 border border-amber-500/20 rounded-3xl max-w-sm w-full p-6 text-white relative shadow-[0_0_30px_rgba(245,158,11,0.15)]"
            >
              <button 
                onClick={() => {
                  playSfx('click');
                  setShowBuyBonusModal(false);
                }}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-black text-amber-400 mb-2 uppercase tracking-tight text-center">
                Comprar Recurso
              </h2>
              <p className="text-[10px] text-white/50 text-center mb-4 leading-tight">
                Ative imediatamente a rodada bônus com multiplicadores progressivos!
              </p>

              <div className="flex flex-col gap-3">
                {/* Normal Free Spins */}
                <button
                  id="btn-buy-normal-modal"
                  onClick={() => {
                    buyFreeSpinsFeature(false);
                    setShowBuyBonusModal(false);
                  }}
                  disabled={isSpinning || freeSpinsActive}
                  className="bg-gradient-to-r from-neutral-950 to-neutral-900 hover:from-neutral-900 hover:to-neutral-800 border border-amber-500/20 disabled:opacity-50 p-4 rounded-2xl text-center cursor-pointer transition-all active:scale-95 text-white"
                >
                  <p className="text-[8px] text-amber-400 font-bold uppercase tracking-widest">PADRÃO (10X)</p>
                  <p className="text-xs font-black uppercase mt-0.5">RODADAS GRÁTIS</p>
                  <p className="text-sm font-black text-amber-400 font-mono mt-1">
                    R$ {(baseBet * 100).toFixed(2)}
                  </p>
                </button>

                {/* Super Free Spins */}
                <button
                  id="btn-buy-super-modal"
                  onClick={() => {
                    buyFreeSpinsFeature(true);
                    setShowBuyBonusModal(false);
                  }}
                  disabled={isSpinning || freeSpinsActive}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 border border-amber-400/40 disabled:opacity-50 p-4 rounded-2xl text-center cursor-pointer transition-all active:scale-95 text-white shadow-[0_4px_15px_rgba(245,158,11,0.2)]"
                >
                  <p className="text-[8px] text-white font-bold uppercase tracking-widest">SUPER (5X MULTIPLICADOR INICIAL)</p>
                  <p className="text-xs font-black uppercase mt-0.5">SUPER SPIN BONUS</p>
                  <p className="text-sm font-black text-white font-mono mt-1">
                    R$ {(baseBet * 300).toFixed(2)}
                  </p>
                </button>
              </div>

              <p className="text-[8px] text-white/40 text-center leading-tight mt-4">
                Os ganhos do bônus são baseados na sua aposta selecionada.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

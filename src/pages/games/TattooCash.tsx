import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import { db } from '../../data/db';
import { PrizeService } from '../../services/prizeService';
import { ArrowLeft, Info, Wallet, Coins, Zap, Minus, Plus, Play, RefreshCw, X } from 'lucide-react';
import { GameLoader } from '../../components/GameLoader';

// Definition of types for the banknotes
interface Banknote {
  id: string;
  type: 'cash' | 'free_spins' | 'multiplier' | 'blank' | 'activator';
  value: number; // For cash: multiplier of bet, for free_spins: spin count, for multiplier: multiplier value
  label: string; // e.g. "R$ 5.00" or "5 FREE SPINS" or "x10"
  color: string; // Tailwind gradient / color classes
  artType?: 'skull' | 'rose' | 'dragon' | 'machine' | 'adriano' | 'tiger';
}

const CASH_VALUES = [0.5, 1, 2, 5, 10, 50, 100];
const MULTIPLIERS = [2, 3, 5, 10, 50, 100];

// Generated banknote designs
const generateLeftNotes = (bet: number): Banknote[] => [
  { id: 'l1', type: 'cash', value: 0.5, label: `R$ ${(bet * 0.5).toFixed(2)}`, color: 'from-blue-600/90 to-cyan-500/90', artType: 'skull' },
  { id: 'l2', type: 'cash', value: 1, label: `R$ ${(bet * 1).toFixed(2)}`, color: 'from-emerald-600/90 to-teal-500/90', artType: 'rose' },
  { id: 'l3', type: 'cash', value: 2, label: `R$ ${(bet * 2).toFixed(2)}`, color: 'from-purple-600/90 to-indigo-500/90', artType: 'tiger' },
  { id: 'l4', type: 'cash', value: 5, label: `R$ ${(bet * 5).toFixed(2)}`, color: 'from-amber-600/90 to-orange-500/90', artType: 'dragon' },
  { id: 'l5', type: 'cash', value: 10, label: `R$ ${(bet * 10).toFixed(2)}`, color: 'from-rose-600/90 to-pink-500/90', artType: 'machine' },
  { id: 'l6', type: 'cash', value: 50, label: `R$ ${(bet * 50).toFixed(2)}`, color: 'from-yellow-500 to-amber-500', artType: 'adriano' },
  { id: 'l7', type: 'cash', value: 100, label: `R$ ${(bet * 100).toFixed(2)}`, color: 'from-fuchsia-600 to-rose-500', artType: 'adriano' },
];

const generateRightNotes = (bet: number): Banknote[] => [
  { id: 'r1', type: 'cash', value: 0.5, label: `R$ ${(bet * 0.5).toFixed(2)}`, color: 'from-blue-600/90 to-cyan-500/90', artType: 'skull' },
  { id: 'r2', type: 'cash', value: 2, label: `R$ ${(bet * 2).toFixed(2)}`, color: 'from-purple-600/90 to-indigo-500/90', artType: 'tiger' },
  { id: 'r3', type: 'multiplier', value: 2, label: 'x2', color: 'from-orange-500 to-red-600', artType: 'dragon' },
  { id: 'r4', type: 'multiplier', value: 5, label: 'x5', color: 'from-amber-500 to-orange-600', artType: 'rose' },
  { id: 'r5', type: 'multiplier', value: 10, label: 'x10', color: 'from-yellow-400 to-amber-500', artType: 'machine' },
  { id: 'r6', type: 'multiplier', value: 100, label: 'x100', color: 'from-pink-500 to-rose-600', artType: 'adriano' },
];

const CENTER_ACTIVATORS: Banknote[] = [
  { id: 'c1', type: 'activator', value: 1, label: 'PAGUE COIN', color: 'from-yellow-400 via-amber-400 to-yellow-600', artType: 'machine' },
  { id: 'c2', type: 'free_spins', value: 5, label: '5 FREE SPINS', color: 'from-teal-400 via-emerald-400 to-teal-600', artType: 'adriano' },
  { id: 'c3', type: 'blank', value: 0, label: 'TATUAGEM', color: 'from-neutral-800 to-neutral-750', artType: 'skull' },
  { id: 'c4', type: 'blank', value: 0, label: 'ROSAS', color: 'from-neutral-800 to-neutral-750', artType: 'rose' },
];

export function TattooCash() {
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  const { playSfx, playGameMusic, stopGameMusic } = useAudio();

  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [gameConfig, setGameConfig] = useState<any>(null);
  const [bet, setBet] = useState(0.5);

  // Reels columns symbols
  const [reelLeft, setReelLeft] = useState<Banknote[]>([]);
  const [reelCenter, setReelCenter] = useState<Banknote[]>([]);
  const [reelRight, setReelRight] = useState<Banknote[]>([]);

  // Spin active flags
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinLeft, setSpinLeft] = useState(false);
  const [spinCenter, setSpinCenter] = useState(false);
  const [spinRight, setSpinRight] = useState(false);

  // Win stats
  const [winAmount, setWinAmount] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showBigWin, setShowBigWin] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [winningLine, setWinningLine] = useState(false);
  
  // Autoplay & Turbo
  const [autoPlay, setAutoPlay] = useState(false);
  const [isTurbo, setIsTurbo] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  
  // Free spins
  const [freeSpins, setFreeSpins] = useState(0);
  const [totalFreeSpinWin, setTotalFreeSpinWin] = useState(0);
  const [showBuyFeatureModal, setShowBuyFeatureModal] = useState(false);

  // Initial load
  useEffect(() => {
    const fetchConfig = async () => {
      const config = await db.getGame('tattoo-cash');
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
      setCurrentTime(`${hrs}:${mins}:${secs}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Initial Reel State
    const leftOpts = generateLeftNotes(0.5);
    const rightOpts = generateRightNotes(0.5);
    setReelLeft([leftOpts[0], leftOpts[1], leftOpts[2]]);
    setReelCenter([CENTER_ACTIVATORS[2], CENTER_ACTIVATORS[0], CENTER_ACTIVATORS[3]]);
    setReelRight([rightOpts[0], rightOpts[1], rightOpts[2]]);

    return () => {
      stopGameMusic();
      clearInterval(timer);
    };
  }, []);

  // Format currencies gracefully
  const formatBRL = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  // Helper to draw lovely banknote SVGs based on their artType
  const renderBanknoteArt = (art?: string) => {
    switch (art) {
      case 'skull':
        return (
          <svg viewBox="0 0 100 100" className="w-14 h-14 text-white/20 fill-current opacity-70">
            <path d="M50 15c-15.5 0-25 10.5-25 24 0 7.8 3.5 14.5 9 18.5v12.5c0 3.3 2.7 6 6 6h20c3.3 0 6-2.7 6-6V57.5c5.5-4 9-10.7 9-18.5 0-13.5-9.5-24-25-24zm-8 20c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4zm16 0c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4zM50 55c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" />
          </svg>
        );
      case 'rose':
        return (
          <svg viewBox="0 0 100 100" className="w-14 h-14 text-white/20 fill-current opacity-70">
            <path d="M50 15c-8 0-15 6-15 14 0 12 15 26 15 26s15-14 15-26c0-8-7-14-15-14zm-4 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm10-5c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zM32 50c-5 3-8 9-8 15 0 11 9 20 20 20s20-9 20-20c0-6-3-12-8-15-4-3-8-5-12-5s-8 2-12 5z" />
          </svg>
        );
      case 'tiger':
        return (
          <svg viewBox="0 0 100 100" className="w-14 h-14 text-white/20 fill-current opacity-70">
            <path d="M50 15C30.7 15 15 30.7 15 50s15.7 35 35 35 35-15.7 35-35S69.3 15 50 15zm10 25c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm-20 0c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm10 32c-8.3 0-15-6.7-15-15h30c0 8.3-6.7 15-15 15z" />
          </svg>
        );
      case 'machine':
        return (
          <svg viewBox="0 0 100 100" className="w-14 h-14 text-amber-400/30 fill-current opacity-85 animate-pulse">
            <path d="M45 15h10v20H45zM35 35h30v10H35zm10 10h10v30H45zm-15 5h10v5H30zm30 0h10v5H60zm-20 25h20v5H40z" />
            <circle cx="50" cy="50" r="4" fill="currentColor" />
          </svg>
        );
      case 'adriano':
        return (
          <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto text-amber-200 opacity-90">
            {/* Elegant caricature of Adriano the Tattooist */}
            {/* Glasses */}
            <rect x="25" y="38" width="22" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="3.5" />
            <rect x="53" y="38" width="22" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="3.5" />
            <line x1="47" y1="45" x2="53" y2="45" stroke="currentColor" strokeWidth="4.5" />
            {/* Mustache */}
            <path d="M 32,65 Q 42,55 50,65 Q 58,55 68,65 Q 50,75 32,65 Z" fill="currentColor" />
            {/* Hair/Cap */}
            <path d="M 20,32 Q 50,15 80,32 L 80,25 Q 50,10 20,25 Z" fill="currentColor" />
            {/* Beard line */}
            <path d="M 25,55 Q 50,90 75,55" fill="none" stroke="currentColor" strokeWidth="3" />
            {/* Cool tattoo on neck */}
            <path d="M 45,78 L 55,78 L 50,85 Z" fill="#ef4444" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-14 h-14 text-white/10 fill-current opacity-40">
            <circle cx="50" cy="50" r="30" />
          </svg>
        );
    }
  };

  // Generate a random banknote for a specific reel
  const getRandomNote = (side: 'left' | 'right' | 'center', currentBet: number): Banknote => {
    if (side === 'left') {
      const notes = generateLeftNotes(currentBet);
      return notes[Math.floor(Math.random() * notes.length)];
    } else if (side === 'right') {
      const notes = generateRightNotes(currentBet);
      return notes[Math.floor(Math.random() * notes.length)];
    } else {
      // 60% blank tattoo, 30% paying coin, 10% free spins
      const rand = Math.random();
      if (rand < 0.55) {
        return CENTER_ACTIVATORS[2 + Math.floor(Math.random() * 2)]; // skull/rose blanks
      } else if (rand < 0.88) {
        return CENTER_ACTIVATORS[0]; // pagar coin
      } else {
        return CENTER_ACTIVATORS[1]; // free spins
      }
    }
  };

  // Main spin mechanism integrated with RTP system
  const spin = async () => {
    if (isSpinning) return;
    if (freeSpins === 0 && (!user || user.balance < bet)) return;

    setIsSpinning(true);
    setWinAmount(0);
    setWinningLine(false);
    setShowWinModal(false);
    setShowBigWin(false);

    // Active spin flags to enable blur/motion
    setSpinLeft(true);
    setSpinCenter(true);
    setSpinRight(true);

    // Deduct balance
    if (freeSpins === 0) {
      await updateBalance(-bet, 'bet', 'tattoo-cash', { bet });
    }

    playSfx('spin');

    // Get target prize from Server PrizeService (comply with global platform control!)
    let target = 0;
    try {
      if (user) {
        const { amount } = await PrizeService.getTargetPrize(user.id, 'slots');
        target = amount;
      }
    } catch (e) {
      console.error("Error fetching target prize:", e);
    }

    // Determine outcome based on target prize
    let finalLeft: Banknote;
    let finalCenter: Banknote;
    let finalRight: Banknote;

    const leftOpts = generateLeftNotes(bet);
    const rightOpts = generateRightNotes(bet);

    if (target > 0) {
      // WINNING ROUND! Let's build a match based on the target value.
      // E.g. Reel 2 has 'PAGUE COIN' and Reel 1 and Reel 3 add up to target.
      // Or Reel 2 has 'FREE SPINS' and Reel 1/3 have multiplier.
      const winChance = Math.random();

      if (winChance < 0.25 && freeSpins === 0) {
        // TRIGGER FREE SPINS!
        finalCenter = CENTER_ACTIVATORS[1]; // 5 Free Spins activator
        finalLeft = leftOpts[Math.floor(Math.random() * leftOpts.length)];
        finalRight = rightOpts[Math.floor(Math.random() * rightOpts.length)];
        // Award free spins
        setTimeout(() => {
          setFreeSpins(5);
        }, 2000);
      } else {
        // CASH PAYOUT
        finalCenter = CENTER_ACTIVATORS[0]; // Pague Activator coin
        
        // Let's divide target into left and right notes
        // Find left note that matches or is closest
        let closestLeft = leftOpts[0];
        let closestRight = rightOpts[0];
        let bestDiff = Math.abs((closestLeft.value + closestRight.value) * bet - target);

        for (const l of leftOpts) {
          for (const r of rightOpts) {
            let combinedValue = 0;
            if (r.type === 'multiplier') {
              combinedValue = (l.value * r.value) * bet;
            } else {
              combinedValue = (l.value + r.value) * bet;
            }
            const diff = Math.abs(combinedValue - target);
            if (diff < bestDiff) {
              bestDiff = diff;
              closestLeft = l;
              closestRight = r;
            }
          }
        }

        finalLeft = closestLeft;
        finalRight = closestRight;
      }
    } else {
      // LOSING SPIN! Center reel is a blank
      finalCenter = CENTER_ACTIVATORS[2 + Math.floor(Math.random() * 2)];
      finalLeft = leftOpts[Math.floor(Math.random() * leftOpts.length)];
      finalRight = rightOpts[Math.floor(Math.random() * rightOpts.length)];
    }

    // Reel spin timings
    const duration = isTurbo ? 150 : 600;

    // Reel Left stop
    setTimeout(() => {
      setReelLeft(prev => [getRandomNote('left', bet), finalLeft, getRandomNote('left', bet)]);
      setSpinLeft(false);
      playSfx('click');
    }, duration);

    // Reel Center stop
    setTimeout(() => {
      setReelCenter(prev => [getRandomNote('center', bet), finalCenter, getRandomNote('center', bet)]);
      setSpinCenter(false);
      playSfx('click');
    }, duration + 300);

    // Reel Right stop
    setTimeout(() => {
      setReelRight(prev => [getRandomNote('right', bet), finalRight, getRandomNote('right', bet)]);
      setSpinRight(false);
      playSfx('click');

      // Finalize outcome and compute payouts!
      setTimeout(async () => {
        let currentWin = 0;
        let isWin = false;

        if (finalCenter.type === 'activator') {
          isWin = true;
          if (finalRight.type === 'multiplier') {
            currentWin = (finalLeft.value * finalRight.value) * bet;
          } else {
            currentWin = (finalLeft.value + finalRight.value) * bet;
          }
        } else if (finalCenter.type === 'free_spins') {
          isWin = true;
          // Free spins triggered!
          playSfx('bonus_trigger');
        }

        if (currentWin > 0) {
          setWinningLine(true);
          setWinAmount(currentWin);
          
          if (freeSpins > 0) {
            setTotalFreeSpinWin(prev => prev + currentWin);
          }

          // Add transaction to DB and credit balance
          await updateBalance(currentWin, 'win', 'tattoo-cash', { winAmount: currentWin });
          
          playSfx('win');

          // Win Celebration sizing
          if (currentWin >= bet * 20) {
            setShowBigWin(true);
          } else {
            setShowWinModal(true);
          }
        }

        // Handle Free Spins decrement
        if (freeSpins > 0) {
          setFreeSpins(prev => prev - 1);
        }

        setIsSpinning(false);
      }, 300);

    }, duration + 600);
  };

  // Automatically trigger spin in autoplay or free spins
  useEffect(() => {
    if (!isSpinning && (autoPlay || freeSpins > 0)) {
      const delay = freeSpins > 0 ? 1500 : 1000;
      const timer = setTimeout(() => {
        // If free spins are active, spin is free. Otherwise, must have enough balance
        if (freeSpins > 0 || (user && user.balance >= bet)) {
          spin();
        } else {
          setAutoPlay(false);
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isSpinning, autoPlay, freeSpins]);

  // Buy free spins feature modal handler
  const buyFeature = async () => {
    const cost = bet * 50;
    if (!user || user.balance < cost) return;

    setShowBuyFeatureModal(false);
    await updateBalance(-cost, 'bet', 'tattoo-cash', { bet: cost, isBuyFeature: true });
    
    // Play sound and immediately launch 5 free spins
    playSfx('bonus_trigger');
    setFreeSpins(5);
    setTotalFreeSpinWin(0);
    spin();
  };

  return (
    <div className="fixed inset-0 text-white font-sans flex flex-col z-50 overflow-hidden bg-gradient-to-b from-[#09151e] via-[#02070d] to-[#040e15]">
      
      {/* Top Header Bar */}
      <div className="flex-none flex items-center justify-between px-4 py-2.5 bg-black/60 backdrop-blur-md border-b border-[#0f2e46]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/app')} 
            className="w-10 h-10 bg-[#122b3d] hover:bg-[#1a3e56] active:scale-90 rounded-full flex items-center justify-center text-cyan-400/90 transition-all border border-cyan-500/20 shadow-md"
            id="back-home-button"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-[13px] tracking-[0.1em] text-cyan-400 font-bold uppercase" id="game-title">
              TATTOO CASH
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-cyan-500/80 tracking-widest">{currentTime}</span>
          <button 
            onClick={() => setShowInfoModal(true)} 
            className="p-2 bg-[#122b3d] border border-cyan-500/20 text-cyan-400 rounded-xl hover:bg-[#1a3e56] transition-all"
            id="info-button"
          >
            <Info size={18} />
          </button>
        </div>
      </div>

      {/* Main scrolling marquee banner */}
      <div className="bg-[#030d14] py-1 border-b border-cyan-500/10 flex items-center justify-center overflow-hidden">
        <div className="flex items-center gap-4 text-cyan-400 text-[10px] uppercase font-black tracking-widest animate-pulse">
          <span>⚡ e de empurrar! ⚡</span>
          <span className="opacity-50">✦</span>
          <span>tattoo cash machine</span>
          <span className="opacity-50">✦</span>
          <span>⚡ e de empurrar! ⚡</span>
        </div>
      </div>

      {/* Main Reels stage */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-2 relative">
        
        {/* Glow behind machine */}
        <div className="absolute w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[390px] flex flex-col gap-3 relative">
          
          {/* Top Decorative Roof Screen */}
          <div className="flex justify-between items-center px-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 mx-0.5 h-4 bg-gradient-to-b from-[#11324c] to-[#071926] border border-[#1b4b71] rounded-sm flex gap-0.5 p-0.5 shadow-md">
                <div className="flex-1 bg-black/40 rounded-sm" />
                <div className="flex-1 bg-cyan-500/20 rounded-sm" />
              </div>
            ))}
          </div>

          {/* Golden/Cyan Frame wrapper for Reels */}
          <div className="bg-gradient-to-b from-[#082236] to-[#030d17] p-2.5 rounded-[2rem] border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative">
            
            {/* Top glass reflection overlay */}
            <div className="absolute inset-x-4 top-1 h-12 bg-white/5 rounded-t-[1.5rem] pointer-events-none z-10" />

            {/* Reel columns grid */}
            <div className="grid grid-cols-3 gap-1.5 bg-black/80 p-1.5 rounded-[1.5rem] overflow-hidden relative border border-cyan-950/50">
              
              {/* Highlight center winning row guide line */}
              <div className="absolute inset-y-0 left-0 right-0 h-28 my-auto border-y border-cyan-500/25 bg-cyan-500/5 pointer-events-none z-10 flex items-center justify-between px-1">
                <div className="w-2.5 h-5 bg-cyan-500 rounded-r-md animate-pulse shadow-[0_0_8px_cyan]" />
                <div className="w-2.5 h-5 bg-cyan-500 rounded-l-md animate-pulse shadow-[0_0_8px_cyan]" />
              </div>

              {/* REEL 1 (LEFT COLUMN) */}
              <div className="h-72 overflow-hidden relative bg-black/40 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                <motion.div 
                  animate={spinLeft ? { y: [-120, 120] } : { y: 0 }}
                  transition={spinLeft ? { repeat: Infinity, duration: 0.15, ease: "linear" } : { type: "spring", stiffness: 100, damping: 15 }}
                  className="flex flex-col gap-3 items-center py-2"
                >
                  {reelLeft.map((note, idx) => (
                    <div 
                      key={`${note.id}-${idx}`}
                      className={`w-[95px] h-20 rounded-lg p-1.5 bg-gradient-to-br ${note.color} border border-white/20 flex flex-col justify-between items-center shadow-lg relative overflow-hidden`}
                    >
                      <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full border border-white/5 bg-white/5" />
                      <span className="text-[7px] text-white/50 tracking-wider font-bold self-start leading-none uppercase">LT CASH</span>
                      {renderBanknoteArt(note.artType)}
                      <span className="text-[11px] font-black tracking-tighter text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)] z-10">
                        {note.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* REEL 2 (CENTER COLUMN) */}
              <div className="h-72 overflow-hidden relative bg-black/40 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                <motion.div 
                  animate={spinCenter ? { y: [120, -120] } : { y: 0 }}
                  transition={spinCenter ? { repeat: Infinity, duration: 0.15, ease: "linear" } : { type: "spring", stiffness: 100, damping: 15 }}
                  className="flex flex-col gap-3 items-center py-2"
                >
                  {reelCenter.map((note, idx) => (
                    <div 
                      key={`${note.id}-${idx}`}
                      className={`w-[95px] h-20 rounded-lg p-1.5 bg-gradient-to-br ${note.color} border border-white/20 flex flex-col justify-between items-center shadow-lg relative overflow-hidden`}
                    >
                      {note.type === 'activator' && (
                        <div className="absolute inset-0 bg-yellow-400/10 animate-pulse pointer-events-none" />
                      )}
                      <span className="text-[7px] text-white/50 tracking-wider font-bold self-start leading-none uppercase">LT COIN</span>
                      {renderBanknoteArt(note.artType)}
                      <span className={`text-[9px] font-black tracking-tight text-center leading-none text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)] z-10 ${note.type === 'free_spins' ? 'text-teal-200' : ''}`}>
                        {note.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* REEL 3 (RIGHT COLUMN) */}
              <div className="h-72 overflow-hidden relative bg-black/40 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                <motion.div 
                  animate={spinRight ? { y: [-120, 120] } : { y: 0 }}
                  transition={spinRight ? { repeat: Infinity, duration: 0.15, ease: "linear" } : { type: "spring", stiffness: 100, damping: 15 }}
                  className="flex flex-col gap-3 items-center py-2"
                >
                  {reelRight.map((note, idx) => (
                    <div 
                      key={`${note.id}-${idx}`}
                      className={`w-[95px] h-20 rounded-lg p-1.5 bg-gradient-to-br ${note.color} border border-white/20 flex flex-col justify-between items-center shadow-lg relative overflow-hidden`}
                    >
                      <span className="text-[7px] text-white/50 tracking-wider font-bold self-start leading-none uppercase">LT VALUE</span>
                      {renderBanknoteArt(note.artType)}
                      <span className="text-[11px] font-black tracking-tighter text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)] z-10">
                        {note.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>

            </div>
          </div>

          {/* Central Feature Purchase Banner */}
          <div className="bg-gradient-to-r from-[#0a1e2f] via-[#103450] to-[#0a1e2f] border border-cyan-500/20 rounded-2xl p-2.5 relative overflow-hidden flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase text-cyan-400 tracking-wider">
                COMPRAR RECURSO
              </span>
              <span className="text-[8px] text-white/50 uppercase tracking-widest mt-0.5">
                5 Rodadas Grátis
              </span>
            </div>
            <button 
              onClick={() => !isSpinning && freeSpins === 0 && setShowBuyFeatureModal(true)}
              disabled={isSpinning || freeSpins > 0}
              className="h-10 px-4 bg-[#0e5c43] hover:bg-[#147a59] disabled:grayscale disabled:opacity-40 rounded-xl text-xs uppercase font-black tracking-widest text-emerald-200 border border-emerald-400/30 shadow-md transition-all cursor-pointer"
              id="buy-feature-button"
            >
              Comprar
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 px-1">
            <div className="p-2 bg-black/60 border border-cyan-500/10 rounded-xl flex items-center justify-center gap-2 shadow-lg">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-cyan-500 fill-current shrink-0">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2-.9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
              <div className="flex flex-col min-w-0">
                <span className="text-[7px] text-cyan-500/60 uppercase tracking-widest font-bold leading-none mb-0.5">Saldo</span>
                <span className="text-[11px] font-black text-white truncate">{formatBRL(user?.balance || 0)}</span>
              </div>
            </div>

            <div className="p-2 bg-black/60 border border-cyan-500/25 rounded-xl flex items-center justify-center gap-2 shadow-lg">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-cyan-400 fill-current shrink-0">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <text x="12" y="15" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold">S</text>
              </svg>
              <div className="flex flex-col min-w-0">
                <span className="text-[7px] text-cyan-400 uppercase tracking-widest font-bold leading-none mb-0.5">Aposta</span>
                <span className="text-[11px] font-black text-white truncate">{formatBRL(bet)}</span>
              </div>
            </div>

            <div className="p-2 bg-black/60 border border-cyan-500/10 rounded-xl flex items-center justify-center gap-2 shadow-lg">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-cyan-500 fill-current shrink-0">
                <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                <text x="12" y="14" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="black" letterSpacing="0.5">WIN</text>
              </svg>
              <div className="flex flex-col min-w-0">
                <span className="text-[7px] text-cyan-500/60 uppercase tracking-widest font-bold leading-none mb-0.5">Ganho</span>
                <span className="text-[11px] font-black text-emerald-400 truncate">{formatBRL(winAmount)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Free Spins Alert Panel */}
      {freeSpins > 0 && (
        <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-teal-900 py-2 border-t border-b border-teal-500/30 flex flex-col items-center justify-center">
          <span className="text-teal-400 font-bold text-xs tracking-widest uppercase">
            RODADAS GRÁTIS ATIVAS
          </span>
          <span className="text-white font-black text-lg">
            {freeSpins} restando • Ganho Total: {formatBRL(totalFreeSpinWin)}
          </span>
        </div>
      )}

      {/* Control Panel Buttons */}
      <div className="flex-none bg-[#020910] border-t border-cyan-950/80 p-4 pb-8">
        <div className="max-w-[420px] mx-auto flex items-center justify-between px-3">
          
          {/* Turbo button */}
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => setIsTurbo(!isTurbo)} 
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border ${isTurbo ? 'bg-[#ca8a04]/10 border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(202,138,4,0.3)]' : 'bg-black/40 border-cyan-950 text-cyan-800'}`}
              id="turbo-button"
            >
              <Zap className={`w-5 h-5 ${isTurbo ? 'fill-current' : ''}`} />
            </button>
            <span className="text-[7px] font-black text-cyan-600/70 uppercase tracking-widest">Turbo</span>
          </div>

          {/* Central Controls: Minus, Spin, Plus */}
          <div className="flex items-center gap-4">
            
            {/* Minus Button */}
            <button 
              onClick={() => setBet(Math.max(gameConfig?.minBet || 0.5, bet - 0.5))} 
              disabled={isSpinning || bet <= (gameConfig?.minBet || 0.5) || freeSpins > 0}
              className="w-10 h-10 bg-[#12283a] hover:bg-[#1a3e56] disabled:opacity-20 border border-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 transition-all shadow-md cursor-pointer"
              id="bet-minus-button"
            >
              <Minus size={18} />
            </button>

            {/* Main Spin Button */}
            <div className="relative">
              {/* Radial background aura */}
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-125 pointer-events-none" />
              
              <button 
                onClick={spin} 
                disabled={isSpinning || freeSpins > 0} 
                className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#051e31] via-[#0b3c5e] to-[#0ea5e9] border-[3px] border-cyan-400 flex items-center justify-center shadow-2xl active:scale-95 transition-all duration-300 disabled:grayscale disabled:opacity-50"
                id="main-spin-button"
              >
                {/* Swirling Tomoe tattoo swirl style */}
                <motion.div
                  animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
                  transition={isSpinning ? { repeat: Infinity, duration: 1.2, ease: "linear" } : { duration: 0.5 }}
                  className="w-12 h-12 text-cyan-100 flex items-center justify-center"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                    <g transform="translate(50,50)">
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
              disabled={isSpinning || bet >= (gameConfig?.maxBet || 100) || freeSpins > 0}
              className="w-10 h-10 bg-[#12283a] hover:bg-[#1a3e56] disabled:opacity-20 border border-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 transition-all shadow-md cursor-pointer"
              id="bet-plus-button"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Autoplay toggle */}
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => setAutoPlay(!autoPlay)} 
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border ${autoPlay ? 'bg-[#ca8a04]/10 border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(202,138,4,0.3)]' : 'bg-black/40 border-cyan-950 text-cyan-800'}`}
              id="autoplay-button"
            >
              <Play className={`w-5 h-5 ${autoPlay ? 'fill-current' : ''}`} />
            </button>
            <span className="text-[7px] font-black text-cyan-600/70 uppercase tracking-widest">Auto</span>
          </div>

        </div>
      </div>

      {/* MODAL: Buy Feature Confirm */}
      <AnimatePresence>
        {showBuyFeatureModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" id="buy-feature-modal">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b1b28] border-2 border-cyan-500/40 rounded-3xl p-6 w-full max-w-[340px] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3 mb-4">
                <span className="font-bold text-cyan-400 uppercase tracking-wider text-sm">
                  Comprar Rodadas
                </span>
                <button onClick={() => setShowBuyFeatureModal(false)} className="text-white/40 hover:text-white" id="close-buy-modal">
                  <X size={20} />
                </button>
              </div>

              <div className="text-center py-2 flex flex-col gap-2">
                <span className="text-xs text-white/70">
                  Deseja ativar 5 Rodadas Grátis no valor de:
                </span>
                <span className="text-2xl font-black text-cyan-400">
                  {formatBRL(bet * 50)}
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest">
                  (50x o valor da aposta atual)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button 
                  onClick={() => setShowBuyFeatureModal(false)}
                  className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase transition-all"
                  id="cancel-buy-button"
                >
                  Cancelar
                </button>
                <button 
                  onClick={buyFeature}
                  disabled={user && user.balance < (bet * 50)}
                  className="py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-25 rounded-xl text-xs font-black uppercase text-white transition-all shadow-lg"
                  id="confirm-buy-button"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Game Info Rules */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" id="info-modal">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-[#0b1b28] border border-cyan-500/20 rounded-3xl p-6 w-full max-w-[360px] max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3 mb-4">
                <span className="font-bold text-cyan-400 uppercase tracking-widest text-xs">
                  COMO JOGAR TATTOO CASH
                </span>
                <button onClick={() => setShowInfoModal(false)} className="text-white/40 hover:text-white" id="close-info-modal">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-4 text-xs text-white/80 leading-relaxed">
                <div>
                  <h3 className="text-cyan-400 font-bold mb-1 uppercase tracking-wider">Mecânica do Jogo</h3>
                  <p>
                    Tattoo Cash é um slot de 3 rolos temático. Cada rolo possui funções exclusivas:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 pl-1 text-white/70">
                    <li><strong className="text-white">Rolo Esquerdo:</strong> Contém cédulas com valores monetários.</li>
                    <li><strong className="text-white">Rolo Central:</strong> Contém símbolos de ativação (Máquinas de Tatuagem / Moedas de Coleta, Free Spins, ou figuras decorativas).</li>
                    <li><strong className="text-white">Rolo Direito:</strong> Contém cédulas com valores adicionais ou Multiplicadores de ganho.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-cyan-400 font-bold mb-1 uppercase tracking-wider">Como Ganhar</h3>
                  <p>
                    O ganho é ativado quando o rolo central exibe o símbolo de ativação <strong className="text-yellow-400">PAGUE COIN</strong>.
                    Quando ativado, os valores das cédulas do rolo esquerdo e direito são combinados e pagos imediatamente!
                  </p>
                  <p className="mt-2">
                    Se o rolo direito exibir um multiplicador (ex: x5), o valor da cédula da esquerda é multiplicado por esse valor para calcular o ganho total!
                  </p>
                </div>

                <div>
                  <h3 className="text-cyan-400 font-bold mb-1 uppercase tracking-wider">Rodadas Grátis</h3>
                  <p>
                    Consiga o símbolo <strong className="text-teal-400">5 FREE SPINS</strong> no rolo central para acionar 5 Rodadas Grátis. Durante as rodadas grátis, todos os prêmios são pagos em dobro e a emoção é máxima!
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowInfoModal(false)}
                className="mt-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-xs rounded-xl transition-all shadow-lg"
                id="understand-info-button"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Explosion overlay for standard win */}
      <AnimatePresence>
        {showWinModal && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40" id="win-celebration">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-black/85 border-2 border-cyan-400 px-8 py-5 rounded-3xl flex flex-col items-center shadow-[0_0_50px_rgba(6,182,212,0.6)]"
            >
              <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-[0.2em] animate-bounce">
                VITÓRIA!
              </span>
              <span className="text-3xl font-black text-white mt-1">
                +{formatBRL(winAmount)}
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Big Win Celebration Splash screen */}
      <AnimatePresence>
        {showBigWin && (
          <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-6" id="big-win-overlay">
            <motion.div 
              initial={{ scale: 0.3, rotate: -10 }}
              animate={{ scale: [0.3, 1.1, 1], rotate: 0 }}
              exit={{ scale: 0.3, opacity: 0 }}
              className="flex flex-col items-center text-center max-w-[340px]"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="absolute -inset-10 bg-gradient-to-r from-cyan-500 via-amber-500 to-cyan-500 rounded-full opacity-30 blur-2xl pointer-events-none"
                />
                
                <h2 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-cyan-400 to-cyan-600 drop-shadow-[0_4px_12px_rgba(6,182,212,0.6)] uppercase">
                  MEGA GANHO!
                </h2>
              </div>

              {/* Character drawing */}
              <div className="my-6">
                {renderBanknoteArt('adriano')}
              </div>

              <span className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                {formatBRL(winAmount)}
              </span>

              <button 
                onClick={() => setShowBigWin(false)}
                className="mt-8 px-8 py-3 bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                id="collect-big-win-button"
              >
                Coletar Prêmio
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

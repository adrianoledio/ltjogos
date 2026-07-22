import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import { db } from '../../data/db';
import { PrizeService } from '../../services/prizeService';
import { Info, Coins, RefreshCw, X, ChevronLeft, Volume2, VolumeX, Flame, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmExitModal } from '../../components/ConfirmExitModal';
import { triggerWinConfetti, triggerBigWinConfetti } from '../../lib/confetti';

interface WheelSlice {
  id: number;
  label: string;
  value: number; // Multiplier of bet
  color: string; // Gradient color description for defs
  textColor: string;
  subText?: string;
  isIphone?: boolean;
}

// 16 exciting and well-balanced slices for maximum engagement (incorporating near-wins & salvage payouts)
const WHEEL_SLICES: WheelSlice[] = [
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

export function RoulettaInk() {
  const navigate = useNavigate();
  const { user, updateBalance, refreshUser } = useAuth();
  const { playSfx, playGameMusic, stopGameMusic, isMuted, toggleMute } = useAudio();

  const [bet, setBet] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showBigWin, setShowBigWin] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // FEVER MODE & STREAKS
  const [feverSpins, setFeverSpins] = useState(0);
  const [isFeverActive, setIsFeverActive] = useState(false);

  // GAMBLE MINI-GAME STATE
  const [showGambleModal, setShowGambleModal] = useState(false);
  const [gambleAmount, setGambleAmount] = useState(0);
  const [isGambling, setIsGambling] = useState(false);
  const [gambleResult, setGambleResult] = useState<'won' | 'lost' | null>(null);
  const [selectedBottle, setSelectedBottle] = useState<'black' | 'red' | null>(null);

  // Play high-fidelity synthesized retro casino sounds
  const playSpinnerSound = () => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const totalClicks = 55; // more clicks for 16 slices
      const duration = 5.0; // seconds
      const now = ctx.currentTime;
      
      for (let i = 0; i < totalClicks; i++) {
        const ratio = i / totalClicks;
        // decelerating click sequence
        const playTime = now + duration * Math.pow(ratio, 2.0);
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        // Pitch rises slightly then drops to mimic physical deceleration sound effects
        const freq = i < totalClicks * 0.4 ? 500 + (ratio * 300) : 800 - (ratio * 550);
        osc.frequency.setValueAtTime(freq, playTime);
        
        gain.gain.setValueAtTime(0, playTime);
        gain.gain.linearRampToValueAtTime(0.08, playTime + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.012);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(playTime);
        osc.stop(playTime + 0.02);
      }
      
      setTimeout(() => {
        try {
          ctx.close();
        } catch (e) {}
      }, 5500);
    } catch (e) {
      console.warn('Spinner sound failed', e);
    }
  };

  const playFeverSound = () => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.8);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.8);
      
      setTimeout(() => ctx.close(), 1000);
    } catch (e) {}
  };

  const playGambleResultSound = (won: boolean) => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      if (won) {
        // Double sweet ding-dong synth
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.15); // E5
        osc2.frequency.setValueAtTime(783.99, now); // G5
        osc2.frequency.setValueAtTime(1046.50, now + 0.15); // C6
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
      } else {
        // Sad buzzer drop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.5);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.5);
      }
      setTimeout(() => ctx.close(), 1000);
    } catch (e) {}
  };

  // Start casino audio on mount
  useEffect(() => {
    playGameMusic('casino_music');
    return () => stopGameMusic();
  }, []);

  // Live winners simulator
  const [winnersList, setWinnersList] = useState<Array<{ name: string; prize: number; time: string }>>([
    { name: 'Lucas_sp', prize: 20, time: 'há 4s' },
    { name: 'Aline_tatuada', prize: 100, time: 'há 15s' },
    { name: 'Matheus_ink', prize: 50, time: 'há 45s' },
    { name: 'Carol_draw', prize: 15, time: 'há 1m' },
    { name: 'Rodrigo_tattoo', prize: 500, time: 'há 2m' },
  ]);

  useEffect(() => {
    const winnersInterval = setInterval(() => {
      const names = ['Adriano', 'Juliana', 'Felipe', 'Mariana', 'Thiago', 'Bruna', 'Gustavo', 'Camila', 'Vinicius', 'Leticia'];
      const prizes = [1, 2, 5, 10, 15, 20, 50, 100, 250, 500];
      const randomName = names[Math.floor(Math.random() * names.length)] + `_${Math.floor(Math.random() * 90 + 10)}`;
      const randomPrize = prizes[Math.floor(Math.random() * prizes.length)] * bet;

      setWinnersList(prev => [
        { name: randomName, prize: randomPrize, time: 'agora mesmo' },
        ...prev.slice(0, 4)
      ]);
    }, 11000);

    return () => clearInterval(winnersInterval);
  }, [bet]);

  const spinWheel = async () => {
    if (isSpinning) return;
    if (!user || user.balance < bet) {
      toast.error('Saldo insuficiente para girar!');
      return;
    }

    setIsSpinning(true);
    setWinAmount(0);
    setShowWinModal(false);
    setShowBigWin(false);
    setShowGambleModal(false);

    // Deduct bet from balance
    await updateBalance(-bet, 'bet', 'rouletta-ink', { bet });
    playSpinnerSound();

    // Fetch authorized prize target from system settings
    let targetPrize = 0;
    try {
      const result = await PrizeService.getTargetPrize(user.id, 'roletas');
      targetPrize = result.amount;
    } catch (error) {
      console.error('Error fetching target prize:', error);
    }

    // Determine slice index based on the targeted multiplier
    let targetMultiplier = targetPrize / bet;
    
    // Adjust targetMultiplier if Fever Mode is active (payout is multiplied by 1.5)
    if (isFeverActive) {
      targetMultiplier = targetMultiplier / 1.5;
    }

    let targetSliceIndex = 5; // default to NADA
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

    // Apply Fever Mode Multiplier if active
    if (isFeverActive && actualPayout > 0) {
      actualPayout = Math.round(actualPayout * 1.5 * 10) / 10;
    }

    const sliceAngle = 360 / WHEEL_SLICES.length;
    const currentSpins = Math.floor(wheelRotation / 360);
    const baseRotation = (currentSpins + 6) * 360; 
    
    // Beautiful random natural rotation offset within the slice boundaries
    const targetAngle = baseRotation - (targetSliceIndex * sliceAngle) + (Math.random() * (sliceAngle - 6) - (sliceAngle / 2 - 3));

    setWheelRotation(targetAngle);

    // Timing wheel deceleration (5 seconds)
    setTimeout(async () => {
      setIsSpinning(false);
      setWinAmount(actualPayout);

      // Manage Fever state progression
      if (isFeverActive) {
        // Fever spin completes, reset
        setIsFeverActive(false);
        setFeverSpins(0);
      } else {
        // Increment fever spins progress towards fever mode
        setFeverSpins(prev => {
          const next = prev + 1;
          if (next >= 5) {
            setIsFeverActive(true);
            playFeverSound();
            toast.success('🔥 MODO FEBRE ATIVADO! PRÓXIMO GIRO PAGARÁ +50%! 🔥', {
              duration: 4000
            });
            return 5;
          }
          return next;
        });
      }

      if (actualPayout > 0) {
        if (!isMuted) playSfx('win');
        await updateBalance(actualPayout, 'win', 'rouletta-ink', { winAmount: actualPayout });
        await PrizeService.commitPrize(user.id, actualPayout);

        // Update winners list
        setWinnersList(prev => [
          { name: user.name, prize: actualPayout, time: 'agora mesmo' },
          ...prev.slice(0, 4)
        ]);

        // Show standard win or big win celebration
        if (actualPayout >= bet * 15) {
          setShowBigWin(true);
          triggerBigWinConfetti();
        } else {
          setShowWinModal(true);
          triggerWinConfetti();
        }

        // Prepare Double or Nothing gamble opportunity
        setGambleAmount(actualPayout);
        setGambleResult(null);
        setSelectedBottle(null);
        
        // Open gamble choice modal after a brief victory pause
        setTimeout(() => {
          setShowGambleModal(true);
        }, 1200);

      } else {
        if (!isMuted) playSfx('click');
        toast.info('Não foi dessa vez! Tente novamente!');
      }
      if (refreshUser) refreshUser();
    }, 5000);
  };

  // HANDLE DOUBLE OR NOTHING GAMBLE MECHANICS
  const handleGamble = async (color: 'black' | 'red') => {
    if (isGambling || gambleAmount <= 0) return;
    
    setIsGambling(true);
    setSelectedBottle(color);
    setGambleResult(null);

    // Play suspense sound effects
    if (!isMuted) playSfx('click');

    setTimeout(async () => {
      const outcomeIsWin = Math.random() < 0.48; // Fair 48% casino flip probability
      
      if (outcomeIsWin) {
        const reward = gambleAmount; // Add another 1x of original amount
        setGambleResult('won');
        setGambleAmount(prev => prev * 2);
        playGambleResultSound(true);
        
        // Add extra reward to balance
        await updateBalance(reward, 'win', 'rouletta-ink-gamble', { gambleWon: reward });
        toast.success(`🎉 Acertou! Dobrou para R$ ${(gambleAmount * 2).toFixed(2)}!`);
      } else {
        setGambleResult('lost');
        playGambleResultSound(false);
        
        // Deduct lost amount (since they had already been paid, we deduct the stake they gambled)
        await updateBalance(-gambleAmount, 'bet', 'rouletta-ink-gamble-loss', { gambleLost: gambleAmount });
        toast.error(`💔 Xi, a garrafa quebrou! Você perdeu o prêmio.`);
        
        setGambleAmount(0);
        setTimeout(() => {
          setShowGambleModal(false);
        }, 1500);
      }
      setIsGambling(false);
      if (refreshUser) refreshUser();
    }, 1800);
  };

  const collectGambleWinnings = () => {
    setShowGambleModal(false);
    toast.success(`💰 Parabéns! Você coletou R$ ${gambleAmount.toFixed(2)}!`);
    if (refreshUser) refreshUser();
  };

  const formatBRL = (val: number) => {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const selectQuickBet = (amount: number) => {
    if (isSpinning) return;
    setBet(amount);
    if (!isMuted) playSfx('click');
  };

  return (
    <div className="fixed inset-0 text-white font-sans flex flex-col z-50 overflow-hidden bg-[#05080f] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0d182b] via-[#04070c] to-[#010204]">
      
      {/* Dynamic SVG Gradient definitions for the wheel wedges */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          {WHEEL_SLICES.map((slice, i) => {
            const fromColor = slice.color.match(/from-\[([^\]]+)\]/)?.[1] || '#1e293b';
            const toColor = slice.color.match(/to-\[([^\]]+)\]/)?.[1] || '#0f172a';
            return (
              <linearGradient id={`slice-grad-${i}`} key={i} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={fromColor} />
                <stop offset="100%" stopColor={toColor} />
              </linearGradient>
            );
          })}
        </defs>
      </svg>

      {/* Top Header Bar */}
      <div className="flex-none flex items-center justify-between px-4 py-2.5 bg-black/40 backdrop-blur-md border-b border-[#111e35] z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowExitModal(true)} 
            className="w-10 h-10 bg-[#121f35] hover:bg-[#1b2f4e] active:scale-95 rounded-full flex items-center justify-center text-cyan-400 transition-all border border-cyan-500/20 shadow-md cursor-pointer"
            id="back-home-button"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[13px] tracking-[0.12em] text-cyan-400 font-black uppercase flex items-center gap-1" id="game-title">
              ROULETTA INK <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">X16</span>
            </h1>
            <span className="text-[8px] text-white/40 font-mono tracking-wider">ULTRA PREMIUM WHEEL</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Balance display */}
          <div className="bg-[#121f35]/80 border border-cyan-500/10 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-inner">
            <Coins size={14} className="text-yellow-400" />
            <span className="text-xs font-black text-white">{formatBRL(user?.balance || 0)}</span>
          </div>

          {/* Audio toggle */}
          <button 
            onClick={toggleMute}
            className="w-9 h-9 bg-[#121f35] hover:bg-[#1b2f4e] text-cyan-400/80 rounded-xl flex items-center justify-center transition-all border border-cyan-500/10"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button 
            onClick={() => setShowInfoModal(true)} 
            className="w-9 h-9 bg-[#121f35] hover:bg-[#1b2f4e] text-cyan-400 rounded-xl flex items-center justify-center transition-all border border-cyan-500/15"
            id="info-button"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Main Wheel Viewport */}
      <div className="flex-1 flex flex-col justify-between items-center p-3 relative overflow-y-auto scrollbar-hide">
        
        {/* Glow Effects behind everything */}
        <div className="absolute w-[380px] h-[380px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none top-1/4" />
        <div className="absolute w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none top-1/3" />

        {/* Top Promotional Header Stats & Fever Mode Thermometer */}
        <div className="w-full max-w-[420px] flex flex-col items-center text-center gap-1 mt-1 shrink-0 z-10">
          
          {/* Fever Progress Bar Container */}
          <div className={`w-full max-w-[280px] rounded-xl px-3 py-1.5 transition-all flex flex-col gap-1 border ${isFeverActive ? 'bg-gradient-to-r from-red-950/40 via-orange-900/40 to-red-950/40 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-slate-900/40 border-white/5'}`}>
            <div className="flex items-center justify-between text-[9px] font-bold">
              <span className={`flex items-center gap-1 uppercase tracking-wider ${isFeverActive ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`}>
                <Flame size={12} className={isFeverActive ? 'text-orange-500 animate-bounce' : 'text-slate-500'} />
                {isFeverActive ? 'MODO FEBRE ATIVO!' : 'FEVER BOOSTER'}
              </span>
              <span className={isFeverActive ? 'text-orange-400' : 'text-cyan-400'}>
                {isFeverActive ? '+50% EXTRA' : `${feverSpins}/5 Giros`}
              </span>
            </div>
            
            {/* Thermometer line */}
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
              <motion.div 
                animate={{ width: isFeverActive ? '100%' : `${feverSpins * 20}%` }}
                className={`h-full rounded-full ${isFeverActive ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-red-500 shadow-[0_0_8px_#f97316]' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'}`}
              />
            </div>
          </div>

          <div className="mt-1">
            <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-amber-500/80">PRÊMIO MÁXIMO</span>
            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_2px_10px_rgba(234,179,8,0.2)]">
              {formatBRL(bet * 1000)}
            </h2>
          </div>
        </div>

        {/* Interactive 16-Slice Roulette Wheel Machine */}
        <div className="relative w-[310px] h-[310px] sm:w-[350px] sm:h-[350px] flex items-center justify-center my-3 shrink-0">
          
          {/* External Sparkling Frame with custom spinning indicator highlights */}
          <div className="absolute inset-0 rounded-full border-[6px] border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.2),_inset_0_0_20px_rgba(0,0,0,0.8)] bg-[#070c16]/95 pointer-events-none" />

          {/* Golden Outer Ring Dots */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 22.5 * Math.PI) / 180;
            const r = 148; // radius
            const x = 150 + r * Math.cos(angle);
            const y = 150 + r * Math.sin(angle);
            return (
              <div 
                key={i} 
                className={`absolute w-1.5 h-1.5 rounded-full border border-black z-10 transition-all ${isSpinning ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' : 'bg-yellow-400 shadow-[0_0_5px_#eab308]'} ${isFeverActive ? '!bg-orange-500 !shadow-[0_0_8px_#f97316]' : ''}`}
                style={{ 
                  left: `calc(50% + ${Math.cos(angle) * (148 + (i % 2 * 2))}px - 3px)`, 
                  top: `calc(50% + ${Math.sin(angle) * (148 + (i % 2 * 2))}px - 3px)`,
                }} 
              />
            );
          })}

          {/* Diamond Indicator Pointer at the top */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-10 z-30 drop-shadow-[0_4px_12px_rgba(14,165,233,0.6)]">
            <svg viewBox="0 0 40 50" className="w-full h-full fill-cyan-400 filter drop-shadow">
              <path d="M20 5 L35 25 L20 45 L5 25 Z" />
              <circle cx="20" cy="25" r="5" fill="#ffffff" />
            </svg>
          </div>

          {/* Golden Ring Wheel Wrap */}
          <div className="w-[285px] h-[285px] sm:w-[325px] sm:h-[325px] rounded-full p-1.5 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.35)] relative overflow-hidden flex items-center justify-center">
            
            {/* Spinning Wheel Face */}
            <motion.div
              animate={{ rotate: wheelRotation }}
              transition={isSpinning ? { duration: 5, ease: [0.15, 0.85, 0.35, 1] } : { duration: 0 }}
              className="w-full h-full rounded-full bg-slate-950 relative overflow-hidden border border-amber-400/40 shadow-inner"
            >
              {/* Dynamic Sectors Drawing */}
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {WHEEL_SLICES.map((slice, i) => {
                  const angle = 360 / WHEEL_SLICES.length; // 22.5
                  const startAngle = i * angle - angle / 2 - 90;
                  const endAngle = (i + 1) * angle - angle / 2 - 90;
                  const rad1 = (startAngle * Math.PI) / 180;
                  const rad2 = (endAngle * Math.PI) / 180;
                  const x1 = 100 + 100 * Math.cos(rad1);
                  const y1 = 100 + 100 * Math.sin(rad1);
                  const x2 = 100 + 100 * Math.cos(rad2);
                  const y2 = 100 + 100 * Math.sin(rad2);
                  
                  // Text coordinates on sector center
                  const midAngle = startAngle + angle / 2;
                  const textRad = (midAngle * Math.PI) / 180;
                  const textDist = 72; // pushed closer to edge for maximum legibility in 16 wedges
                  const tx = 100 + textDist * Math.cos(textRad);
                  const ty = 100 + textDist * Math.sin(textRad);

                  // Calculate exact money value for real-time enticement
                  const cashVal = slice.value * bet;
                  const dynamicLabel = slice.isIphone 
                    ? 'IPHONE' 
                    : slice.value === 0 
                      ? 'NADA' 
                      : slice.value < 1 
                        ? `R$ ${cashVal.toFixed(2)}` 
                        : `R$ ${Math.floor(cashVal)}`;

                  return (
                    <g key={slice.id}>
                      {/* Segment wedge path */}
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                        fill={`url(#slice-grad-${i})`}
                        stroke="#eab308"
                        strokeOpacity="0.25"
                        strokeWidth="0.75px"
                      />
                      
                      {/* Sector Divider Line */}
                      <line x1="100" y1="100" x2={x1} y2={y1} stroke="#eab308" strokeOpacity="0.25" strokeWidth="0.5" />

                      {/* Text label */}
                      <g transform={`translate(${tx}, ${ty}) rotate(${midAngle + 90})`}>
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={slice.textColor}
                          className="font-black tracking-tighter"
                          style={{
                            fontSize: dynamicLabel.length > 7 ? '4px' : '4.8px',
                            fontWeight: 900,
                            fill: '#ffffff',
                            textShadow: '1px 1px 1px rgba(0,0,0,0.95)'
                          }}
                        >
                          {dynamicLabel}
                        </text>
                        {slice.subText && (
                          <text
                            y="7"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#ffffff"
                            style={{ 
                              fontSize: '3px', 
                              fontWeight: 'bold', 
                              fill: i % 2 === 0 ? '#ffedd5' : '#e0f2fe',
                              opacity: 0.8,
                              textShadow: '1px 1px 1px rgba(0,0,0,0.9)'
                            }}
                          >
                            {slice.subText}
                          </text>
                        )}
                      </g>
                    </g>
                  );
                })}
                {/* Central dark ring glass mask */}
                <circle cx="100" cy="100" r="32" fill="#000000" fillOpacity="0.5" />
              </svg>
            </motion.div>

            {/* Inner Golden Center Cap with shiny interactive blue GIRAR button */}
            <button
              onClick={spinWheel}
              disabled={isSpinning}
              className={`absolute w-20 h-20 rounded-full bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] border-4 border-yellow-500 flex flex-col items-center justify-center active:scale-95 transition-transform z-20 cursor-pointer disabled:grayscale disabled:opacity-90 shadow-[0_0_15px_rgba(14,165,233,0.5)]`}
            >
              <span className="text-[12px] font-black uppercase text-white tracking-wider drop-shadow-md leading-none mb-0.5 animate-pulse">
                GIRAR
              </span>
              <span className="text-[6.5px] font-bold text-cyan-100 tracking-widest uppercase">
                {formatBRL(bet)}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Panel Wrapper */}
        <div className="w-full max-w-[420px] flex flex-col gap-3.5 z-10 shrink-0">
          
          {/* Quick Bet Picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest text-center flex items-center justify-center gap-1">
              <TrendingUp size={10} className="text-cyan-400" />
              Selecione o valor do Giro
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 5, 10].map((amt) => (
                <button
                  key={amt}
                  onClick={() => selectQuickBet(amt)}
                  disabled={isSpinning}
                  className={`py-2 px-1 text-xs font-black uppercase rounded-xl transition-all border ${bet === amt ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.25)]' : 'bg-[#0f172a]/90 hover:bg-[#1e293b] text-white/70 border-white/5'}`}
                >
                  R$ {amt}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-0.5">
              {[20, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => selectQuickBet(amt)}
                  disabled={isSpinning}
                  className={`py-2 px-1 text-xs font-black uppercase rounded-xl transition-all border ${bet === amt ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.25)]' : 'bg-[#0f172a]/90 hover:bg-[#1e293b] text-white/70 border-white/5'}`}
                >
                  R$ {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Golden Spin Button Trigger */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={spinWheel}
              disabled={isSpinning || (user?.balance || 0) < bet}
              className={`w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d97706] to-[#fbbf24] hover:from-[#b45309] hover:to-[#f59e0b] disabled:grayscale disabled:opacity-40 font-black text-xs text-slate-900 uppercase tracking-wider shadow-[0_4px_20px_rgba(217,119,6,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer`}
              id="main-spin-button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
              GIRAR • {formatBRL(bet)}
            </button>
            <span className="text-[8px] text-white/40 text-center font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-emerald-400 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              Pagamento via PIX • +18 • Jogue com responsabilidade
            </span>
          </div>

          {/* ÚLTIMOS GANHADORES (LIVE FEED) */}
          <div className="bg-[#0b1222]/80 border border-white/5 rounded-2xl p-3 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
              <span className="text-[9px] font-black uppercase text-white/60 tracking-wider flex items-center gap-2">
                <Coins className="text-[#FFCC00] w-3 h-3 animate-bounce" />
                Últimos Ganhadores
              </span>
              <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                ao vivo
              </span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[85px] overflow-hidden">
              <AnimatePresence>
                {winnersList.map((win, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    key={`${win.name}-${idx}`}
                    className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-white/5 border border-transparent hover:border-cyan-500/10 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center text-[7px] text-white/80 font-bold uppercase">
                        {win.name.slice(0, 2)}
                      </div>
                      <span className="text-[10px] font-semibold text-white/90">{win.name}</span>
                      <span className="text-[8px] text-white/30">• {win.time}</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 font-mono">
                      +{formatBRL(win.prize)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: Rules Info */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" id="info-modal">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-[#0b1626] border border-cyan-500/25 rounded-3xl p-6 w-full max-w-[350px] shadow-2xl flex flex-col relative"
            >
              <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3 mb-4">
                <span className="font-black text-cyan-400 uppercase tracking-widest text-[11px]">
                  COMO JOGAR ROULETTA INK
                </span>
                <button onClick={() => setShowInfoModal(false)} className="text-white/40 hover:text-white" id="close-info-modal">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-4 text-xs text-white/80 leading-relaxed max-h-[60vh] overflow-y-auto pl-1">
                <div>
                  <h3 className="text-amber-400 font-black mb-1 uppercase tracking-wider text-[10px]">Roda Ultra de 16 Fatias</h3>
                  <p>
                    A Rouletta Ink agora possui 16 fatias de alta fidelidade com multiplicadores variados e recompensas de salvamento. Defina seu valor de giro e gire.
                  </p>
                </div>

                <div>
                  <h3 className="text-orange-400 font-black mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Flame size={12} className="inline" /> Modo Febre
                  </h3>
                  <p>
                    Cada giro completa seu Booster de Febre. No 5º giro consecutivo, o **Modo Febre** é ativado, garantindo um multiplicador de **+50% EXTRA** sobre qualquer ganho!
                  </p>
                </div>

                <div>
                  <h3 className="text-purple-400 font-black mb-1 uppercase tracking-wider text-[10px]">Multiplicador Dobro ou Nada</h3>
                  <p>
                    Ao vencer qualquer prêmio, você tem a opção de desafiar sua sorte no mini-game **Duplicar Tinta**. Escolha a garrafa preta ou vermelha para duplicar instantaneamente seu ganho!
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-400 font-black mb-1 uppercase tracking-wider text-[10px]">Tabela de Multiplicadores</h3>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-white/60">
                    <li><strong className="text-white">MEGA JACKPOT:</strong> Paga <strong className="text-amber-400">1000x</strong>!</li>
                    <li><strong className="text-white">EPIC/MEGA WIN:</strong> Paga <strong className="text-purple-400">500x / 250x</strong>!</li>
                    <li><strong className="text-white">IPHONE 15:</strong> Multiplicador especial de <strong className="text-pink-400">500x</strong>!</li>
                    <li><strong className="text-white">Cédulas Regulares:</strong> Multiplicam a aposta de 2x a 100x.</li>
                    <li><strong className="text-white">Quase/Salvo:</strong> Recupera 0.1x ou 0.5x da aposta para continuar jogando!</li>
                  </ul>
                </div>
              </div>

              <button 
                onClick={() => setShowInfoModal(false)}
                className="mt-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-black uppercase text-xs rounded-xl transition-all shadow-lg shadow-yellow-500/10"
                id="understand-info-button"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: Interactive Double-or-Nothing Tattoo Ink Gamble Mini-Game */}
      <AnimatePresence>
        {showGambleModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="gamble-modal">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b1220] border-2 border-purple-500/30 rounded-3xl p-6 w-full max-w-[360px] shadow-[0_0_35px_rgba(139,92,246,0.2)] flex flex-col items-center relative text-center"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={collectGambleWinnings} 
                  className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[9px] font-black text-purple-400 uppercase tracking-[0.25em] mb-1">
                <Sparkles size={12} className="animate-spin" />
                Desafio Multiplicador
              </div>

              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                DOBRO OU NADA?
              </h2>
              
              <p className="text-[11px] text-white/60 mt-1 max-w-[250px]">
                Escolha a garrafa de tinta correta para duplicar o seu prêmio acumulado!
              </p>

              {/* Stake visualization */}
              <div className="my-5 py-2.5 px-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1 w-full max-w-[280px]">
                <span className="text-[9px] text-white/40 uppercase font-bold">Prêmio Atual</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {formatBRL(gambleAmount)}
                </span>
                
                {gambleAmount > 0 && !gambleResult && (
                  <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-semibold mt-1">
                    <span>Ganhos possíveis:</span>
                    <strong className="text-amber-400 font-bold font-mono">{formatBRL(gambleAmount * 2)}</strong>
                  </div>
                )}
              </div>

              {/* Interactive Bottles Selection */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-[280px] my-4">
                
                {/* BLACK INK BOTTLE */}
                <button
                  disabled={isGambling || !!gambleResult}
                  onClick={() => handleGamble('black')}
                  className={`relative py-5 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-95 cursor-pointer ${selectedBottle === 'black' ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.25)]' : 'border-slate-800 bg-slate-900/40 hover:border-cyan-500/40'}`}
                >
                  <motion.div
                    animate={isGambling && selectedBottle === 'black' ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1.5, repeat: isGambling ? Infinity : 0 }}
                    className="w-16 h-16 flex items-center justify-center text-4xl mb-2 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                  >
                    🖤
                  </motion.div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">Tinta Preta</span>
                  <span className="text-[8px] font-bold text-cyan-400/80 uppercase mt-0.5">Atitude Dark</span>
                </button>

                {/* RED INK BOTTLE */}
                <button
                  disabled={isGambling || !!gambleResult}
                  onClick={() => handleGamble('red')}
                  className={`relative py-5 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-95 cursor-pointer ${selectedBottle === 'red' ? 'border-red-500 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.25)]' : 'border-slate-800 bg-slate-900/40 hover:border-red-500/40'}`}
                >
                  <motion.div
                    animate={isGambling && selectedBottle === 'red' ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1.5, repeat: isGambling ? Infinity : 0 }}
                    className="w-16 h-16 flex items-center justify-center text-4xl mb-2 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                  >
                    ❤️
                  </motion.div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">Tinta Vermelha</span>
                  <span className="text-[8px] font-bold text-red-400/80 uppercase mt-0.5">Tattoo Fogo</span>
                </button>

              </div>

              {/* Feedback and collection triggers */}
              <div className="w-full max-w-[280px] mt-4 flex flex-col gap-2">
                {isGambling && (
                  <span className="text-xs text-purple-300 font-bold animate-pulse uppercase tracking-wider">
                    Misturando tintas na máquina... 🎨
                  </span>
                )}

                {gambleResult === 'won' && (
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs text-green-400 font-black uppercase tracking-wider animate-bounce">
                      ✨ ACERTOU EM CHEIO! ✨
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setGambleResult(null);
                          setSelectedBottle(null);
                        }}
                        className="py-3 px-2 bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all text-[10px] font-black uppercase rounded-xl tracking-wider text-white cursor-pointer"
                      >
                        Dobrar de Novo
                      </button>
                      <button
                        onClick={collectGambleWinnings}
                        className="py-3 px-2 bg-gradient-to-r from-green-500 to-emerald-600 active:scale-95 transition-all text-[10px] font-black uppercase rounded-xl tracking-wider text-slate-950 cursor-pointer"
                      >
                        Coletar Ganhos
                      </button>
                    </div>
                  </div>
                )}

                {gambleResult === 'lost' && (
                  <span className="text-xs text-red-500 font-black uppercase tracking-wider">
                    Garrafa errada! Tente de novo no próximo giro!
                  </span>
                )}

                {!isGambling && !gambleResult && (
                  <button
                    onClick={collectGambleWinnings}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[11px] rounded-xl tracking-wider transition-all"
                  >
                    Não arriscar • Coletar {formatBRL(gambleAmount)}
                  </button>
                )}
              </div>
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
              className="bg-black/90 border-2 border-yellow-500 px-8 py-5 rounded-3xl flex flex-col items-center shadow-[0_0_50px_rgba(234,179,8,0.5)]"
            >
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-[0.2em] animate-bounce">
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
          <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-6" id="big-win-overlay">
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
                  className="absolute -inset-10 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500 rounded-full opacity-30 blur-2xl pointer-events-none"
                />
                
                <h2 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-600 drop-shadow-[0_4px_12px_rgba(234,179,8,0.6)] uppercase">
                  GANHO INCRÍVEL!
                </h2>
              </div>

              <div className="my-6">
                <div className="relative w-24 h-24 rounded-full bg-slate-900 border-4 border-yellow-400 flex items-center justify-center shadow-2xl animate-bounce">
                  <Coins className="w-12 h-12 text-yellow-400 animate-spin" />
                </div>
              </div>

              <span className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                {formatBRL(winAmount)}
              </span>

              <button 
                onClick={() => setShowBigWin(false)}
                className="mt-8 px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg"
                id="collect-big-win-button"
              >
                Coletar Prêmio
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmExitModal
        isOpen={showExitModal}
        isSpinning={isSpinning}
        onConfirm={() => navigate('/app')}
        onCancel={() => setShowExitModal(false)}
      />

    </div>
  );
}

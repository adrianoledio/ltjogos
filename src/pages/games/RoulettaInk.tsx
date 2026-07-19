import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import { db } from '../../data/db';
import { PrizeService } from '../../services/prizeService';
import { ArrowLeft, Info, Wallet, Coins, Play, RefreshCw, X, ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

interface WheelSlice {
  id: number;
  label: string;
  value: number; // Multiplier of bet
  color: string; // Gradient style
  textColor: string;
  subText?: string;
  isIphone?: boolean;
}

const WHEEL_SLICES: WheelSlice[] = [
  { id: 0, label: 'R$ 1.000', value: 1000, color: 'from-[#0ea5e9] to-[#0284c7]', textColor: '#ffffff', subText: 'PRÊMIO MÁX' },
  { id: 1, label: 'IPHONE', value: 500, color: 'from-[#a855f7] to-[#7c3aed]', textColor: '#ffffff', subText: 'PRO', isIphone: true },
  { id: 2, label: 'R$ 100', value: 100, color: 'from-[#0ea5e9] to-[#0284c7]', textColor: '#ffffff' },
  { id: 3, label: 'R$ 50', value: 50, color: 'from-[#eab308] to-[#ca8a04]', textColor: '#1e293b' },
  { id: 4, label: 'R$ 20', value: 20, color: 'from-[#22c55e] to-[#16a34a]', textColor: '#ffffff' },
  { id: 5, label: 'NADA', value: 0, color: 'from-[#1e293b] to-[#0f172a]', textColor: '#94a3b8', subText: 'TENTE DE NOVO' },
  { id: 6, label: 'R$ 1', value: 1, color: 'from-[#f97316] to-[#ea580c]', textColor: '#ffffff' },
  { id: 7, label: 'R$ 500', value: 500, color: 'from-[#e11d48] to-[#be123c]', textColor: '#ffffff' },
];

export function RoulettaInk() {
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  const { playSfx, playGameMusic, stopGameMusic, isMuted, toggleMute } = useAudio();

  const [bet, setBet] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showBigWin, setShowBigWin] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const playSpinnerSound = () => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const totalClicks = 40;
      const duration = 4.8; // seconds
      const now = ctx.currentTime;
      
      for (let i = 0; i < totalClicks; i++) {
        const ratio = i / totalClicks;
        // Ease-out curve to decelerate clicks
        const playTime = now + duration * Math.pow(ratio, 1.8);
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        const freq = 650 - ratio * 350; // Descending frequencies
        osc.frequency.setValueAtTime(freq, playTime);
        
        gain.gain.setValueAtTime(0, playTime);
        gain.gain.linearRampToValueAtTime(0.06, playTime + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.015);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(playTime);
        osc.stop(playTime + 0.025);
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

  // Audio state
  useEffect(() => {
    playGameMusic('casino_music'); // fallback
    return () => stopGameMusic();
  }, []);

  // Winners feed simulator
  const [winnersList, setWinnersList] = useState<Array<{ name: string; prize: number; time: string }>>([
    { name: 'Lucas', prize: 20, time: 'há 48s' },
    { name: 'Aline_tatuada', prize: 100, time: 'há 1m' },
    { name: 'Matheus', prize: 50, time: 'há 2m' },
    { name: 'Carol_01', prize: 1, time: 'há 3m' },
    { name: 'Rodrigo', prize: 500, time: 'há 4m' },
  ]);

  useEffect(() => {
    const winnersInterval = setInterval(() => {
      const names = ['Adriano', 'Juliana', 'Felipe', 'Mariana', 'Thiago', 'Bruna', 'Gustavo', 'Camila', 'Vinicius', 'Leticia'];
      const prizes = [1, 20, 20, 50, 50, 100, 100, 500];
      const randomName = names[Math.floor(Math.random() * names.length)] + `_${Math.floor(Math.random() * 90 + 10)}`;
      const randomPrize = prizes[Math.floor(Math.random() * prizes.length)] * bet;

      setWinnersList(prev => [
        { name: randomName, prize: randomPrize, time: 'agora mesmo' },
        ...prev.slice(0, 4)
      ]);
    }, 15000);

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
    const targetMultiplier = targetPrize / bet;
    let targetSliceIndex = 5; // default to NADA

    // Let's find slice with value closest to targetMultiplier
    let minDiff = Infinity;
    WHEEL_SLICES.forEach((slice, idx) => {
      const diff = Math.abs(slice.value - targetMultiplier);
      if (diff < minDiff) {
        minDiff = diff;
        targetSliceIndex = idx;
      }
    });

    const targetSlice = WHEEL_SLICES[targetSliceIndex];
    const actualPayout = targetSlice.value * bet;

    // Calculate rotation angle to align the top indicator (pointer is at 90 deg / 12 o'clock)
    // Slices are laid out clockwise starting from top:
    // angle for slice i = i * (360 / 8)
    // To land on slice i at the top (Pointer is at top, i.e., 0 degrees offset),
    // we need to rotate by - (i * 45) degrees plus random offset within slice to look natural
    const sliceAngle = 360 / WHEEL_SLICES.length;
    // Cumulative rotation to ensure continuous and beautiful spinner animations on subsequent spins
    const currentSpins = Math.floor(wheelRotation / 360);
    const baseRotation = (currentSpins + 5) * 360; 
    const targetAngle = baseRotation - (targetSliceIndex * sliceAngle) + (Math.random() * (sliceAngle - 10) - (sliceAngle / 2 - 5));

    setWheelRotation(targetAngle);

    // Timing wheel deceleration
    setTimeout(async () => {
      setIsSpinning(false);
      setWinAmount(actualPayout);

      if (actualPayout > 0) {
        if (!isMuted) playSfx('win');
        await updateBalance(actualPayout, 'win', 'rouletta-ink', { winAmount: actualPayout });
        await PrizeService.commitPrize(user.id, actualPayout);

        // Update winner lists
        setWinnersList(prev => [
          { name: user.name, prize: actualPayout, time: 'agora mesmo' },
          ...prev.slice(0, 4)
        ]);

        if (actualPayout >= bet * 10) {
          setShowBigWin(true);
        } else {
          setShowWinModal(true);
        }
      } else {
        if (!isMuted) playSfx('click');
        toast.info('Não foi dessa vez! Tente novamente!');
      }
    }, 5000); // 5 seconds spin animation
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
    <div className="fixed inset-0 text-white font-sans flex flex-col z-50 overflow-hidden bg-[#070b12] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111c30] via-[#05080e] to-[#020306]">
      
      {/* Top Header Bar */}
      <div className="flex-none flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-md border-b border-[#111e35] z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/app')} 
            className="w-10 h-10 bg-[#121f35] hover:bg-[#1b2f4e] active:scale-95 rounded-full flex items-center justify-center text-cyan-400 transition-all border border-cyan-500/20 shadow-md"
            id="back-home-button"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[13px] tracking-[0.12em] text-cyan-400 font-black uppercase" id="game-title">
              ROULETTA INK
            </h1>
            <span className="text-[8px] text-white/40 font-mono tracking-wider">PREMIUM WHEEL</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
      <div className="flex-1 flex flex-col justify-between items-center p-4 relative overflow-y-auto scrollbar-hide">
        
        {/* Glow Effects behind everything */}
        <div className="absolute w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none top-1/4" />
        <div className="absolute w-[280px] h-[280px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none top-1/3" />

        {/* Top Promotional Header Stats */}
        <div className="w-full max-w-[420px] flex flex-col items-center text-center gap-1 mt-1 shrink-0 z-10">
          <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-amber-500/80">PRÊMIO MÁXIMO</span>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_2px_10px_rgba(234,179,8,0.2)]">
            {formatBRL(bet * 1000)}
          </h2>
        </div>

        {/* Interactive Roulette Wheel Machine Container */}
        <div className="relative w-[310px] h-[310px] sm:w-[340px] sm:h-[340px] flex items-center justify-center my-4 shrink-0">
          
          {/* External Sparkling Frame */}
          <div className="absolute inset-0 rounded-full border-4 border-yellow-500/20 shadow-[0_0_40px_rgba(234,179,8,0.15)] bg-black/60 backdrop-blur-sm pointer-events-none" />

          {/* Diamond Indicator (Pointer at top) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-10 z-30 drop-shadow-[0_4px_12px_rgba(14,165,233,0.6)]">
            <svg viewBox="0 0 40 50" className="w-full h-full fill-cyan-400 filter drop-shadow">
              <path d="M20 5 L35 25 L20 45 L5 25 Z" />
              <circle cx="20" cy="25" r="5" fill="#ffffff" />
            </svg>
          </div>

          {/* Golden Ring Wheel Wrap */}
          <div className="w-[285px] h-[285px] sm:w-[315px] sm:h-[315px] rounded-full p-2 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 shadow-[0_0_25px_rgba(234,179,8,0.35)] relative overflow-hidden flex items-center justify-center">
            
            {/* Spinning Wheel Face */}
            <motion.div
              animate={{ rotate: wheelRotation }}
              transition={isSpinning ? { duration: 5, ease: [0.15, 0.85, 0.35, 1] } : { duration: 0 }}
              className="w-full h-full rounded-full bg-slate-900 relative overflow-hidden border border-amber-400/40 shadow-inner"
            >
              {/* Dynamic Sectors Drawing */}
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {WHEEL_SLICES.map((slice, i) => {
                  const angle = 360 / WHEEL_SLICES.length;
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
                  const textDist = 65; // radius distance for label
                  const tx = 100 + textDist * Math.cos(textRad);
                  const ty = 100 + textDist * Math.sin(textRad);

                  return (
                    <g key={slice.id}>
                      {/* Segment wedge path */}
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                        className={`fill-current text-slate-800 ${slice.color.replace('from-[', 'text-[')}`}
                        style={{
                          fill: i % 2 === 0 ? '#101726' : '#0a0e1a',
                          stroke: '#d97706',
                          strokeWidth: '0.5px'
                        }}
                      />
                      
                      {/* Sector Divider Line */}
                      <line x1="100" y1="100" x2={x1} y2={y1} stroke="#eab308" strokeOpacity="0.2" strokeWidth="1" />

                      {/* Text label */}
                      <g transform={`translate(${tx}, ${ty}) rotate(${midAngle + 90})`}>
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={slice.textColor}
                          className="text-[8px] font-black tracking-tight"
                          style={{
                            fontSize: slice.label.length > 7 ? '6px' : '7.5px',
                            fontWeight: 900,
                            fill: i % 2 === 0 ? '#f3f4f6' : '#fbbf24',
                          }}
                        >
                          {slice.label}
                        </text>
                        {slice.subText && (
                          <text
                            y="8"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#94a3b8"
                            style={{ fontSize: '4.5px', fontWeight: 'bold', fill: '#94a3b8' }}
                          >
                            {slice.subText}
                          </text>
                        )}
                      </g>
                    </g>
                  );
                })}
                {/* Central shining circle mask */}
                <circle cx="100" cy="100" r="32" fill="#000000" fillOpacity="0.4" />
              </svg>
            </motion.div>

            {/* Inner Golden Center Cap with shiny blue GIRAR button */}
            <button
              onClick={spinWheel}
              disabled={isSpinning}
              className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] border-4 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5),_inset_0_2px_6px_rgba(255,255,255,0.4)] flex flex-col items-center justify-center active:scale-95 transition-transform z-20 cursor-pointer disabled:grayscale disabled:opacity-90"
              style={{ boxShadow: '0 0 15px rgba(14,165,233,0.5)' }}
            >
              <span className="text-[12px] font-black uppercase text-white tracking-wider drop-shadow-md leading-none mb-0.5">
                GIRAR
              </span>
              <span className="text-[6.5px] font-bold text-cyan-100 tracking-widest uppercase">
                {formatBRL(bet)}
              </span>
            </button>
          </div>
          
          {/* Golden Outer Decorative Dots */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const r = 148; // radius
            const x = 150 + r * Math.cos(angle);
            const y = 150 + r * Math.sin(angle);
            return (
              <div 
                key={i} 
                className={`absolute w-1.5 h-1.5 rounded-full bg-yellow-400 border border-black z-10 shadow-[0_0_5px_#eab308] ${isSpinning ? 'animate-ping' : ''}`}
                style={{ 
                  left: `${x}px`, 
                  top: `${y}px`,
                  animationDelay: `${i * 100}ms`
                }} 
              />
            );
          })}
        </div>

        {/* Bottom Panel Wrapper */}
        <div className="w-full max-w-[420px] flex flex-col gap-4 z-10 shrink-0">
          
          {/* Quick Bet Picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest text-center">Selecione o valor do Giro</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 5, 10, 20, 50, 100].slice(0, 4).map((amt) => (
                <button
                  key={amt}
                  onClick={() => selectQuickBet(amt)}
                  disabled={isSpinning}
                  className={`py-2 px-1 text-xs font-black uppercase rounded-xl transition-all border ${bet === amt ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.25)]' : 'bg-[#0f172a] hover:bg-[#1e293b] text-white/70 border-white/5'}`}
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
                  className={`py-2 px-1 text-xs font-black uppercase rounded-xl transition-all border ${bet === amt ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.25)]' : 'bg-[#0f172a] hover:bg-[#1e293b] text-white/70 border-white/5'}`}
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d97706] to-[#fbbf24] hover:from-[#b45309] hover:to-[#f59e0b] disabled:grayscale disabled:opacity-40 font-black text-sm text-slate-900 uppercase tracking-wider shadow-[0_4px_20px_rgba(217,119,6,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              id="main-spin-button"
            >
              <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              GIRAR • {formatBRL(bet)}
            </button>
            <span className="text-[8px] text-white/40 text-center font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-emerald-400 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              Pagamento via PIX • +18 • Jogue com responsabilidade
            </span>
          </div>

          {/* ÚLTIMOS GANHADORES (LIVE) */}
          <div className="bg-[#0b1222]/80 border border-white/5 rounded-2xl p-3 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
              <span className="text-[9px] font-black uppercase text-white/60 tracking-wider flex items-center gap-2">
                <Coins className="text-[#FFCC00] w-3 h-3" />
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
                    className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-white/5 border border-transparent hover:border-white/5 transition-all"
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
                  <h3 className="text-amber-400 font-black mb-1 uppercase tracking-wider text-[10px]">Mecânica de Jogo</h3>
                  <p>
                    A Rouletta Ink é um jogo de sorte e multiplicadores de alta fidelidade. Defina seu valor de giro e gire a roda da sorte.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-400 font-black mb-1 uppercase tracking-wider text-[10px]">Como Ganhar</h3>
                  <p>
                    Quando a roleta parar, o prêmio indicado pela seta azul será creditado instantaneamente na sua conta. Cada prêmio representa um multiplicador sobre a sua aposta selecionada:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-white/60">
                    <li><strong className="text-white">PRÊMIO MÁX:</strong> Multiplicador de <strong className="text-amber-400">1000x</strong>!</li>
                    <li><strong className="text-white">IPHONE PRO:</strong> Paga <strong className="text-purple-400">500x</strong>!</li>
                    <li><strong className="text-white">Outros prêmios:</strong> Cédulas multiplicam o valor da aposta (ex: R$ 100 com giro de R$ 2,00 paga R$ 200,00!).</li>
                    <li><strong className="text-white">NADA:</strong> Retorna 0.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-400 font-black mb-1 uppercase tracking-wider text-[10px]">Garantia de Fair Play</h3>
                  <p>
                    Resultados auditados e gerados em tempo real de acordo com as regras de RTP do sistema de controle de prêmios.
                  </p>
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
                {/* Caricature design of Adriano/Wheel elements inside */}
                <div className="relative w-24 h-24 rounded-full bg-slate-900 border-4 border-yellow-400 flex items-center justify-center shadow-2xl animate-bounce">
                  <Coins className="w-12 h-12 text-yellow-400" />
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

    </div>
  );
}

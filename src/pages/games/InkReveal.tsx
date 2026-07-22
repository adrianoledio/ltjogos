import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import { db, GameConfig } from '../../data/db';
import { PrizeService } from '../../services/prizeService';
import { 
  ArrowLeft, 
  Info, 
  X, 
  Sparkles, 
  Trophy, 
  Coins, 
  Skull, 
  Flame, 
  Crown, 
  Heart, 
  Gem, 
  Star, 
  Anchor, 
  Eraser, 
  Zap, 
  User, 
  Compass, 
  Play 
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmExitModal } from '../../components/ConfirmExitModal';
import { triggerWinConfetti, triggerBigWinConfetti } from '../../lib/confetti';

// Tattoo symbols details for the scratch card
interface TattooSymbol {
  id: string;
  name: string;
  label: string;
  color: string;
  glow: string;
  icon: (props: any) => React.JSX.Element;
  desc: string;
}

const TATTOO_SYMBOLS: TattooSymbol[] = [
  {
    id: 'crown',
    name: 'Coroa Imperial',
    label: 'COROA',
    color: '#FFCC00',
    glow: 'rgba(255, 204, 0, 0.6)',
    icon: (props) => <Crown {...props} />,
    desc: 'Bônus Supremo - Multiplica prêmios máximos!'
  },
  {
    id: 'rose',
    name: 'Rosa Neon',
    label: 'ROSA',
    color: '#FF007F',
    glow: 'rgba(255, 0, 127, 0.6)',
    icon: (props) => <Flame {...props} />,
    desc: 'Sessão Premium - Créditos de alto escalão!'
  },
  {
    id: 'skull',
    name: 'Caveira Real',
    label: 'CAVEIRA',
    color: '#10B981',
    glow: 'rgba(16, 185, 129, 0.6)',
    icon: (props) => <Skull {...props} />,
    desc: 'Old School lendário - Altas recompensas!'
  },
  {
    id: 'heart',
    name: 'Coração Sagrado',
    label: 'CORAÇÃO',
    color: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.6)',
    icon: (props) => <Heart {...props} />,
    desc: 'Tatuagem clássica - Ganhos excelentes!'
  },
  {
    id: 'dagger',
    name: 'Punhal de Prata',
    label: 'PUNHAL',
    color: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.6)',
    icon: (props) => <Compass {...props} />, // Using compass or standard shape as a cool dagger stand-in
    desc: 'Símbolo de precisão - Bons lucros!'
  },
  {
    id: 'diamond',
    name: 'Diamante Brilhante',
    label: 'DIAMANTE',
    color: '#06B6D4',
    glow: 'rgba(6, 182, 212, 0.6)',
    icon: (props) => <Gem {...props} />,
    desc: 'Raridade e sorte - Prêmios intermediários!'
  },
  {
    id: 'star',
    name: 'Estrela Guia',
    label: 'ESTRELA',
    color: '#F97316',
    glow: 'rgba(249, 115, 22, 0.6)',
    icon: (props) => <Star {...props} />,
    desc: 'Direção certa - Retornos garantidos!'
  },
  {
    id: 'anchor',
    name: 'Âncora de Ferro',
    label: 'ÂNCORA',
    color: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.6)',
    icon: (props) => <Anchor {...props} />,
    desc: 'Estabilidade - Prêmios de entrada!'
  }
];

interface ScratchCellState {
  id: number;
  symbol: TattooSymbol;
  revealed: boolean;
  isWinning: boolean;
  prizeLabel: string;
}

export function InkReveal() {
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  const { playSfx } = useAudio();

  const [gameState, setGameState] = useState<'idle' | 'purchased' | 'scratching' | 'revealed'>('idle');
  const [bet, setBet] = useState<number>(2.00);
  const [grid, setGrid] = useState<ScratchCellState[]>([]);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isGameLoaded, setIsGameLoaded] = useState<boolean>(false);
  const [isScratchingAll, setIsScratchingAll] = useState<boolean>(false);

  // Load times and handle loader transitions
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const loadTimeout = setTimeout(() => {
      setIsGameLoaded(true);
    }, 800);

    return () => {
      clearInterval(timer);
      clearTimeout(loadTimeout);
    };
  }, []);

  // Quick select bet options
  const betOptions = [1.00, 2.00, 5.00, 10.00, 20.00, 50.00];

  // Initialize cells helper
  const generateScratchCard = (targetPrize: number) => {
    const chosenCells: ScratchCellState[] = [];
    
    if (targetPrize > 0) {
      // 1. It is a WINNING round. Choose a random winning symbol.
      const winningSymbol = TATTOO_SYMBOLS[Math.floor(Math.random() * TATTOO_SYMBOLS.length)];
      
      // We need exactly 3 of this winning symbol
      const winPositions = new Set<number>();
      while (winPositions.size < 3) {
        winPositions.add(Math.floor(Math.random() * 9));
      }

      // Populate grid
      for (let i = 0; i < 9; i++) {
        if (winPositions.has(i)) {
          chosenCells.push({
            id: i,
            symbol: winningSymbol,
            revealed: false,
            isWinning: true,
            prizeLabel: `R$ ${targetPrize.toFixed(2)}`
          });
        } else {
          // Fill other 6 cells with other symbols, making sure NO OTHER symbol has 3 occurrences
          // We can select random symbols that are NOT the winning symbol, and track occurrences
          let randomSymbol = winningSymbol;
          while (randomSymbol.id === winningSymbol.id) {
            randomSymbol = TATTOO_SYMBOLS[Math.floor(Math.random() * TATTOO_SYMBOLS.length)];
          }
          
          chosenCells.push({
            id: i,
            symbol: randomSymbol,
            revealed: false,
            isWinning: false,
            prizeLabel: `R$ ${(bet * (0.5 + Math.random() * 2)).toFixed(2)}`
          });
        }
      }

      // To guarantee no other symbol has 3 occurrences in the remaining 6 slots:
      const counts: Record<string, number> = {};
      for (let i = 0; i < 9; i++) {
        if (chosenCells[i].isWinning) continue;
        
        let sym = chosenCells[i].symbol;
        counts[sym.id] = (counts[sym.id] || 0) + 1;
        
        if (counts[sym.id] >= 3) {
          // Replace it with another symbol that has < 2 occurrences and is not the winner
          let replacement = TATTOO_SYMBOLS.find(s => s.id !== winningSymbol.id && (counts[s.id] || 0) < 2);
          if (!replacement) {
            replacement = TATTOO_SYMBOLS[(TATTOO_SYMBOLS.indexOf(winningSymbol) + 1) % TATTOO_SYMBOLS.length];
          }
          chosenCells[i].symbol = replacement;
          counts[replacement.id] = (counts[replacement.id] || 0) + 1;
        }
      }

    } else {
      // 2. It is a LOSING round. Ensure NO symbol appears 3 or more times.
      const symbolPool: TattooSymbol[] = [];
      // Let's take all symbols and clone them twice
      TATTOO_SYMBOLS.forEach(s => {
        symbolPool.push(s);
        symbolPool.push(s);
      });

      // Shuffle pool
      for (let i = symbolPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbolPool[i], symbolPool[j]] = [symbolPool[j], symbolPool[i]];
      }

      for (let i = 0; i < 9; i++) {
        chosenCells.push({
          id: i,
          symbol: symbolPool[i],
          revealed: false,
          isWinning: false,
          prizeLabel: `R$ ${(bet * (0.1 + Math.random() * 1.5)).toFixed(2)}`
        });
      }
    }

    return chosenCells;
  };

  // Buy Scratch Card action
  const buyScratchCard = async () => {
    if (!user) {
      toast.error('Por favor, faça login para jogar.');
      return;
    }

    if (user.balance < bet) {
      toast.error('Saldo Insuficiente!', {
        description: 'Faça um depósito para continuar se divertindo!',
        action: {
          label: 'Depositar',
          onClick: () => navigate('/app/wallet')
        }
      });
      return;
    }

    try {
      playSfx('spin');
      
      // Deduct bet amount from user's balance
      await updateBalance(-bet, 'bet', 'ink-reveal', { bet });
      
      // Call PrizeService to determine outcome matching admin parameters and RTP
      const targetPrize = await PrizeService.getTargetPrize(user.id, 'slots');
      const wonAmount = targetPrize.amount;

      // Generate the grid with this predetermined won amount
      const newGrid = generateScratchCard(wonAmount);

      setGrid(newGrid);
      setWinAmount(wonAmount);
      setGameState('purchased');
      setIsScratchingAll(false);
      toast.success('Cartela adquirida com sucesso!', {
        description: 'Raspe as 9 áreas com o dedo/mouse para revelar!'
      });

    } catch (err: any) {
      console.error('Error starting game:', err);
      toast.error('Erro ao comprar cartela. Tente novamente.');
    }
  };

  // Handles cell reveal callback when a cell gets scratched or clicked
  const handleCellReveal = (cellId: number) => {
    if (gameState !== 'purchased' && gameState !== 'scratching') return;
    
    // Set state to scratching on first scrape
    if (gameState === 'purchased') {
      setGameState('scratching');
    }

    setGrid(prev => {
      const next = prev.map(cell => cell.id === cellId ? { ...cell, revealed: true } : cell);
      
      // Play a quick tick/scratch SFX
      playSfx('click');

      // Check if all cells are now revealed
      const allRevealed = next.every(cell => cell.revealed);
      if (allRevealed) {
        finalizeGame(next);
      }

      return next;
    });
  };

  // Automatically scratch/reveal all cells for quick play
  const scratchAllCells = async () => {
    if (gameState !== 'purchased' && gameState !== 'scratching') return;
    setIsScratchingAll(true);
    setGameState('scratching');

    // Reveal cells sequentially with a small stagger effect
    for (let i = 0; i < grid.length; i++) {
      if (!grid[i].revealed) {
        await new Promise(resolve => setTimeout(resolve, 150));
        playSfx('click');
        setGrid(prev => {
          const updated = prev.map(c => c.id === i ? { ...c, revealed: true } : c);
          
          if (i === grid.length - 1) {
            finalizeGame(updated);
          }
          return updated;
        });
      }
    }
    setIsScratchingAll(false);
  };

  // Complete game round, credit user balance, and trigger modals
  const finalizeGame = async (finalGrid: ScratchCellState[]) => {
    setGameState('revealed');
    
    if (winAmount > 0) {
      // It was a WIN!
      // Add transaction to DB and credit balance
      if (user) {
        await updateBalance(winAmount, 'win', 'ink-reveal', { bet, winAmount });
        await PrizeService.commitPrize(user.id, winAmount);
      }
      
      playSfx('win');
      if (winAmount >= bet * 10) {
        triggerBigWinConfetti();
      } else {
        triggerWinConfetti();
      }
      setTimeout(() => {
        setShowWinModal(true);
      }, 600);
    } else {
      // LOSS
      playSfx('lose');
      toast.info('Não foi dessa vez!', {
        description: 'Tente a sua sorte na próxima cartela!'
      });
    }
  };

  if (!isGameLoaded) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-4">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
          <p className="text-sm font-black tracking-widest text-yellow-500 uppercase animate-pulse">Carregando Ink Reveal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 relative overflow-hidden flex flex-col items-center font-sans">
      
      {/* Visual background atmospheric backdrop */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-15 mix-blend-color-dodge filter blur-lg" 
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1560707854-fb9a10eea18b?q=80&w=1920&auto=format&fit=crop')` }} 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-0 pointer-events-none" />

      {/* App wrapper */}
      <div className="w-full max-w-[440px] px-4 flex flex-col relative z-10 flex-1 justify-between py-2">
        
        {/* Navigation bar */}
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <button onClick={() => setShowExitModal(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-yellow-400 font-extrabold tracking-widest text-sm uppercase">INK REVEAL</span>
            <span className="text-[8px] font-bold text-white/40 tracking-wider">RASPADINHA DE COMBINAR 3</span>
          </div>

          <button onClick={() => setShowInfoModal(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
            <Info size={18} />
          </button>
        </div>

        {/* Balance Display */}
        <div className="mt-3 bg-neutral-900/80 border border-white/5 rounded-2xl p-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-500/10 rounded-lg">
              <Coins className="text-yellow-400" size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Seu Saldo</p>
              <p className="text-sm font-black text-white font-mono">
                R$ {user?.balance.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/app/wallet')}
            className="px-3 py-1.5 bg-yellow-500 text-black font-extrabold text-[10px] rounded-lg hover:bg-yellow-400 transition-colors uppercase tracking-wider"
          >
            Depositar
          </button>
        </div>

        {/* Play Area / Scratchcard Holder */}
        <div className="relative mt-4 flex flex-col items-center flex-1 justify-center">
          
          {gameState === 'idle' ? (
            // Cartela Purchase Overlay
            <div className="w-full aspect-square bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-[30px] border-2 border-white/10 shadow-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.1)_0%,transparent_70%)] pointer-events-none" />
              
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mb-4 text-yellow-400 shadow-inner group-hover:scale-105 transition-transform relative z-10">
                <Sparkles size={32} />
              </div>
              
              <h3 className="text-lg font-black text-white uppercase tracking-widest mb-1 relative z-10">COMPRE SUA CARTELA</h3>
              <p className="text-xs text-white/60 max-w-[280px] mb-6 relative z-10">
                Selecione sua aposta abaixo e raspe 9 áreas para encontrar 3 símbolos de tatuagem iguais!
              </p>
              
              <button
                onClick={buyScratchCard}
                className="w-full max-w-[240px] py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_4px_15px_rgba(234,179,8,0.3)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.4)] transition-all flex items-center justify-center gap-2 relative z-10"
              >
                <Play size={14} fill="currentColor" />
                ADQUIRIR POR R$ {bet.toFixed(2)}
              </button>
            </div>
          ) : (
            // Active Scratchcard Grid
            <div className="w-full aspect-square bg-[#0c0812] rounded-[30px] border-2 border-white/10 shadow-2xl p-3 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#1c142c]/20 to-transparent pointer-events-none" />
              
              {/* Scratch Grid */}
              <div className="grid grid-cols-3 gap-2.5 flex-1 h-full">
                {grid.map((cell) => (
                  <div 
                    key={cell.id} 
                    className={`relative rounded-2xl overflow-hidden aspect-square border transition-all duration-300 ${
                      cell.revealed 
                        ? cell.isWinning 
                          ? 'bg-gradient-to-b from-yellow-500/10 to-amber-500/5 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                          : 'bg-neutral-900/60 border-white/5'
                        : 'border-white/10'
                    }`}
                  >
                    {/* Underlying Tattoo Symbol */}
                    <AnimatePresence>
                      {cell.revealed && (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-0 flex flex-col items-center justify-center p-2"
                        >
                          <div 
                            className="p-1.5 rounded-xl mb-1 flex items-center justify-center"
                            style={{ 
                              color: cell.symbol.color,
                              filter: `drop-shadow(0 0 6px ${cell.symbol.glow})`
                            }}
                          >
                            {cell.symbol.icon({ size: 28, className: "animate-pulse" })}
                          </div>
                          <span className="text-[8px] font-black tracking-widest text-white/50 uppercase truncate max-w-full">
                            {cell.symbol.label}
                          </span>
                          {cell.isWinning && (
                            <span className="text-[9px] font-bold text-yellow-400 mt-0.5 animate-bounce font-mono">
                              {cell.prizeLabel}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Canvas Scratch Layer */}
                    {!cell.revealed && (
                      <ScratchOverlay 
                        cellId={cell.id} 
                        onReveal={() => handleCellReveal(cell.id)} 
                        isScratchingAll={isScratchingAll}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="mt-4 flex flex-col gap-3">
          {gameState === 'idle' ? (
            // Bet values selector
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center mb-2">
                Selecione o valor da cartela
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {betOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      playSfx('click');
                      setBet(opt);
                    }}
                    className={`py-2 rounded-xl text-[10px] font-black font-mono transition-all ${
                      bet === opt 
                        ? 'bg-yellow-500 text-black border border-yellow-400 scale-105 shadow-[0_0_8px_rgba(234,179,8,0.3)]' 
                        : 'bg-neutral-900 text-white/60 border border-white/5 hover:border-white/10'
                    }`}
                  >
                    R$ {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Reset / Scratch All controls
            <div className="flex gap-2.5">
              <button
                onClick={scratchAllCells}
                disabled={gameState === 'revealed' || isScratchingAll}
                className="flex-1 py-3.5 bg-neutral-900 border border-white/10 hover:border-white/20 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <Eraser size={14} />
                {isScratchingAll ? 'Raspando...' : 'Raspar Tudo'}
              </button>

              {gameState === 'revealed' && (
                <button
                  onClick={() => {
                    playSfx('click');
                    setGameState('idle');
                    setGrid([]);
                  }}
                  className="flex-1 py-3.5 bg-yellow-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:bg-yellow-400 transition-all flex items-center justify-center gap-1"
                >
                  <Zap size={14} fill="currentColor" />
                  Jogar Novamente
                </button>
              )}
            </div>
          )}
        </div>

        {/* Decorative / Informative list of symbols underneath */}
        <div className="mt-4 bg-neutral-950/80 border border-white/5 rounded-2xl p-3.5 shadow-md">
          <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Trophy size={10} />
            Guia de Prêmios (Combine 3)
          </p>
          <div className="grid grid-cols-2 gap-2 text-[9px] text-white/60">
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
              <Crown size={12} className="text-yellow-400" />
              <span>Coroa Imperial: Multiplica Máximo</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
              <Flame size={12} className="text-pink-500" />
              <span>Rosa Neon: Payout Premium</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
              <Skull size={12} className="text-emerald-400" />
              <span>Caveira Real: Retorno Grande</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
              <Heart size={12} className="text-red-500" />
              <span>Coração Sagrado: Retorno Médio</span>
            </div>
          </div>
        </div>

        {/* Footer time indicator */}
        <div className="flex items-center justify-between py-1 px-1 mt-2 text-[8px] text-white/20 font-mono">
          <span>SESSÃO PROTEGIDA</span>
          <span>{currentTime}</span>
        </div>

      </div>

      {/* Rules / Information Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
              
              <h3 className="text-base font-black text-yellow-400 mb-3 tracking-widest uppercase">REGRAS DO JOGO</h3>
              <div className="space-y-3.5 text-xs text-white/80 overflow-y-auto max-h-[300px] pr-2 leading-relaxed">
                <p>O <strong>Ink Reveal</strong> é um jogo clássico de raspadinha de combinar 3 com temática de estúdio de tatuagem.</p>
                <p><strong>Como Jogar:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Selecione o valor de aposta desejado e clique em <strong>Adquirir Cartela</strong>.</li>
                  <li>Use o mouse ou arraste o dedo nas 9 células cinzas para "limpar" a película protetora.</li>
                  <li>Você também pode clicar no botão <strong>Raspar Tudo</strong> para revelar todas as áreas de forma rápida.</li>
                  <li>Se encontrar <strong>3 símbolos de tatuagem idênticos</strong> na mesma cartela, você vence! O prêmio em créditos de tatuagem será creditado em sua conta imediatamente.</li>
                </ul>
                <p className="text-[10px] text-white/40 italic">Este jogo respeita os limites e as configurações de RTP ativas no painel administrativo.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Satisfying Win Modal */}
      <AnimatePresence>
        {showWinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.7, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.7, rotate: -5 }}
              className="bg-gradient-to-b from-[#181124] to-[#0c0812] border-2 border-yellow-400 rounded-3xl p-6 max-w-xs w-full shadow-[0_0_40px_rgba(234,179,8,0.3)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500" />
              
              <button
                onClick={() => setShowWinModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
              
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 border border-yellow-500/40 flex items-center justify-center text-yellow-400 mb-4 animate-bounce">
                <Trophy size={32} />
              </div>

              <h2 className="text-xl font-black text-yellow-400 uppercase tracking-widest mb-1">PARABÉNS!</h2>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-4">Você completou um Combine 3!</p>
              
              <div className="bg-white/5 border border-white/5 rounded-2xl py-4 px-2 mb-5">
                <p className="text-xs text-white/60 mb-1">Crédito Adicionado</p>
                <p className="text-2xl font-black text-emerald-400 font-mono tracking-tight animate-pulse">
                  + R$ {winAmount.toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => setShowWinModal(false)}
                className="w-full py-3 bg-yellow-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-yellow-400 shadow-md hover:scale-105 transition-all"
              >
                Confirmar Crédito
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmExitModal
        isOpen={showExitModal}
        isSpinning={gameState === 'purchased' || gameState === 'scratching'}
        onConfirm={() => navigate('/app')}
        onCancel={() => setShowExitModal(false)}
      />

    </div>
  );
}

// Interactive Scratching Canvas Component
interface ScratchOverlayProps {
  cellId: number;
  onReveal: () => void;
  isScratchingAll: boolean;
}

function ScratchOverlay({ cellId, onReveal, isScratchingAll }: ScratchOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const revealedTriggered = useRef(false);
  const drawCount = useRef(0);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);
  const isInitialized = useRef(false);

  // Set up the canvas graphics with ResizeObserver to handle dynamic sizes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initCanvas = (width: number, height: number) => {
      if (width === 0 || height === 0) return;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill with a gorgeous high-quality dark-metallic / silver charcoal texture
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#2e2938');
      gradient.addColorStop(0.5, '#1e1a26');
      gradient.addColorStop(1, '#131118');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw stylish overlay decorations (e.g. vintage gothic/tattoo look)
      ctx.strokeStyle = 'rgba(255, 204, 0, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, width - 8, height - 8);

      // Subtle center mark "INK" text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('INK', width / 2, height / 2);

      isInitialized.current = true;
    };

    // Use ResizeObserver to get precise dimensions when container layout is complete
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Only initialize on first layout with real dimensions
        if (width > 0 && height > 0 && !isInitialized.current) {
          initCanvas(width, height);
        }
      }
    });

    resizeObserver.observe(canvas);

    // Initial check
    const w = canvas.offsetWidth || canvas.clientWidth || 0;
    const h = canvas.offsetHeight || canvas.clientHeight || 0;
    if (w > 0 && h > 0) {
      initCanvas(w, h);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Reveal the canvas completely when "Scratch All" is requested
  useEffect(() => {
    if (isScratchingAll && !revealedTriggered.current) {
      revealedTriggered.current = true;
      onReveal();
    }
  }, [isScratchingAll, onReveal]);

  // Scratch Drawing Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if (e.type.startsWith('touch')) {
      const touchEvent = e as React.TouchEvent;
      const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      const mouseEvent = e as React.MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    lastPosition.current = { x, y };

    scratch(e);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPosition.current = null;
    checkScratchPercentage();
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || revealedTriggered.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if (e.type.startsWith('touch')) {
      const touchEvent = e as React.TouchEvent;
      const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      const mouseEvent = e as React.MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 28; // Large eraser circle size for good scratch coverage

    ctx.beginPath();
    if (lastPosition.current) {
      ctx.moveTo(lastPosition.current.x, lastPosition.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    lastPosition.current = { x, y };

    drawCount.current += 1;
    // Check percentage every 15 drawing steps
    if (drawCount.current % 15 === 0) {
      checkScratchPercentage();
    }
  };

  const checkScratchPercentage = () => {
    if (revealedTriggered.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const pixels = imgData.data;
      let transparentCount = 0;

      // Sample every 4th pixel to make computation extremely lightweight
      for (let i = 3; i < pixels.length; i += 16) {
        if (pixels[i] === 0) {
          transparentCount++;
        }
      }

      const totalSamples = pixels.length / 16;
      const scratchedPercent = (transparentCount / totalSamples) * 100;

      if (scratchedPercent > 45) {
        revealedTriggered.current = true;
        onReveal();
      }
    } catch (err) {
      // Fallback in case of CORS or browser limits
      console.warn('Canvas scratch calculation failed:', err);
    }
  };

  // Alternative fallback clicking
  const handleFallbackClick = () => {
    if (!revealedTriggered.current) {
      revealedTriggered.current = true;
      onReveal();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={scratch}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={scratch}
      onTouchEnd={stopDrawing}
      onClick={handleFallbackClick}
      className="absolute inset-0 w-full h-full cursor-crosshair touch-none transition-opacity duration-300 hover:opacity-95"
    />
  );
}

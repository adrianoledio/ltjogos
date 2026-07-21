import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

const NAMES = ['Matheus', 'Karina', 'Felipe', 'Bruna', 'Thiago', 'Lucas', 'Ana', 'Pedro', 'Mariana', 'Gabriel'];
const GAMES = ['Tattoo Slot', 'Ink Reveal', 'Mystic Ink', 'Rouletta Ink', 'Tattoo Cash', 'Calavera Ink', 'Yakuza Ink'];

interface Win {
  id: number;
  user: string;
  game: string;
  amount: number;
}

export const RecentWinsFeed: React.FC = () => {
  const [wins, setWins] = useState<Win[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial batch delay simulation for smooth skeleton display
    const timer = setTimeout(() => {
      const initialWins = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() - i,
        user: NAMES[Math.floor(Math.random() * NAMES.length)],
        game: GAMES[Math.floor(Math.random() * GAMES.length)],
        amount: Math.random() * 500 + 50,
      }));
      setWins(initialWins);
      setIsLoading(false);
    }, 600);

    // Add new win every 3 seconds
    const interval = setInterval(() => {
      const newWin: Win = {
        id: Date.now(),
        user: NAMES[Math.floor(Math.random() * NAMES.length)],
        game: GAMES[Math.floor(Math.random() * GAMES.length)],
        amount: Math.random() * 500 + 50,
      };
      setWins((prev) => [newWin, ...prev.slice(0, 9)]);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="bg-gradient-to-r from-[#151020] to-[#0a0510] rounded-xl p-0.5 border border-white/10 shadow-2xl overflow-hidden relative">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-black/20">
        <h2 className="text-[10px] font-bold flex items-center gap-2 text-white/90 uppercase tracking-wider">
          <Trophy className="text-[#FFCC00]" size={12} />
          Ganhos Recentes
        </h2>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] font-bold text-green-500">AO VIVO</span>
        </div>
      </div>

      <div className="relative h-[150px] overflow-hidden p-2">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner size="sm" text="CARREGANDO..." />
          </div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {wins.map((win) => (
                <motion.div
                  key={win.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-[8px] font-black text-brand-primary">
                      {win.user.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white leading-tight">{win.user}</p>
                      <p className="text-[8px] text-white/40">{win.game}</p>
                    </div>
                  </div>
                  <p className="font-mono font-black text-emerald-400 text-[10px]">
                    + R$ {win.amount.toFixed(2)}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
};

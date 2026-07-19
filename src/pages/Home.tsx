import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { db, GameConfig } from '../data/db';
import { Play, Trophy, Sparkles, Star, RotateCw } from 'lucide-react';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { CategoryFilter } from '../components/home/CategoryFilter';

const GameCard: React.FC<{ game: GameConfig, aspect?: string, compact?: boolean, badge?: string }> = ({ game, aspect = 'aspect-[3/4]', compact = false, badge }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    whileHover={{ y: -8, scale: 1.02 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="relative group"
  >
    <Link
      to={`/app/games/${game.id}`}
      className={`block ${aspect} glass-card overflow-hidden group-hover:border-brand-primary/30 transition-all duration-500 relative z-10`}
    >
      {/* Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={game.thumbnail}
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-black/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity duration-500" />
      </div>

      {/* Badge */}
      {badge && (
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-brand-secondary to-brand-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-xl z-20 animate-pulse">
          {badge}
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
        <h3 className="text-[10px] font-bold text-white leading-tight truncate drop-shadow-md group-hover:text-brand-primary transition-colors uppercase tracking-widest">{game.name}</h3>
      </div>
      
      {/* Hover Overlay Glow */}
      <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-30" />
    </Link>
  </motion.div>
);

export function Home() {
  const [games, setGames] = useState<GameConfig[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchGames = async () => {
      const allGames = await db.getGames();
      setGames(allGames.filter((g) => g.active));
    };
    fetchGames();
  }, []);

  const filteredGames = activeCategory === 'all' 
    ? games 
    : activeCategory === 'popular' 
      ? games.slice(0, 6) 
      : games.filter(g => g.category === activeCategory);

  return (
    <div className="flex flex-col h-full -m-4 overflow-hidden">
      
      {/* Hero Section */}
      <section className="shrink-0 p-4 pb-0">
        <div className="glass-card overflow-hidden h-[160px] sm:h-auto">
          <HeroCarousel />
        </div>
      </section>

      {/* Categories */}
      <section className="shrink-0 py-4 px-4">
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      </section>

      {/* Game Grid */}
      <section className="flex-1 overflow-y-auto px-4 pt-2 pb-24 scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-black flex items-center gap-3 text-white tracking-widest uppercase">
            {activeCategory === 'all' && <Gamepad2 className="text-brand-primary" size={18} />}
            {activeCategory === 'slots' && <Sparkles className="text-brand-secondary" size={18} />}
            {activeCategory === 'roletas' && <RotateCw className="text-[#FFCC00]" size={18} />}
            
            <span className="text-gradient">
              {activeCategory === 'all' ? 'Todos os Jogos' : activeCategory === 'slots' ? 'Slots' : 'Roletas'}
            </span>
          </h2>
          <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-1 rounded-lg border border-white/5 uppercase tracking-widest">
            {filteredGames.length} Jogos
          </span>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-3 gap-3 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game, i) => (
              <GameCard 
                key={game.id} 
                game={game} 
                badge={i < 3 && activeCategory === 'all' ? 'NEW' : undefined}
                compact={true}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredGames.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-white/30">
            <Gamepad2 size={32} className="mb-2 opacity-50" />
            <p className="text-xs font-medium">Nenhum jogo encontrado.</p>
          </div>
        )}

        {/* Live Winners Ticker - Inside scrollable area but at the end */}
        <div className="mt-8 pb-4">
          <section className="bg-gradient-to-r from-[#151020] to-[#0a0510] rounded-xl p-0.5 border border-white/10 shadow-2xl overflow-hidden relative group">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-black/20">
              <h2 className="text-[10px] font-bold flex items-center gap-2 text-white/90 uppercase tracking-wider">
                <Trophy className="text-[#FFCC00]" size={12} />
                Ganhadores
              </h2>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-bold text-green-500">AO VIVO</span>
              </div>
            </div>

            <div className="relative h-[120px] overflow-hidden">
              <motion.div
                animate={{ y: [0, -500] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="space-y-1 p-1"
              >
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-transparent">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[8px] text-white/70">
                        {['JP', 'AN', 'MR', 'LC', 'BR'][i % 5]}
                      </div>
                      <span className="text-[10px] font-bold text-white truncate w-16">User_{Math.floor(Math.random() * 999)}</span>
                    </div>
                    <p className="font-mono font-bold text-emerald-400 text-[10px]">+ R$ {(Math.random() * 500).toFixed(2)}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

// Helper for icon
function Gamepad2({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="6" x2="10" y1="12" y2="12" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" />
      <line x1="18" x2="18.01" y1="11" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}

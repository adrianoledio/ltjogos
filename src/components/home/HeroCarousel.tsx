import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, GameConfig } from '../../data/db';

const FALLBACK_SLIDES = [
  {
    id: 'mystic-ink',
    image: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=1920&auto=format&fit=crop',
    title: 'Mystic Ink',
    subtitle: 'Slots • RTP de 95% • Jogue com seus créditos de tatuagem!',
    cta: 'JOGAR AGORA',
    color: 'from-purple-950/90 to-black/90',
    link: '/app/games/mystic-ink'
  },
  {
    id: 'tattoo-slot',
    image: 'https://images.unsplash.com/photo-1598252571565-794637d7a2ee?q=80&w=1920&auto=format&fit=crop',
    title: 'Tattoo Slot',
    subtitle: 'Slots • RTP de 98% • Obtenha combinações lendárias',
    cta: 'JOGAR AGORA',
    color: 'from-red-950/90 to-black/90',
    link: '/app/games/tattoo-slot'
  }
];

export function HeroCarousel() {
  const [activeGames, setActiveGames] = useState<GameConfig[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const allGames = await db.getGames();
        const active = allGames.filter(g => g.active);
        setActiveGames(active);
      } catch (error) {
        console.error('Error loading active games for carousel:', error);
      }
    };
    loadGames();
    
    // Check for updates to show new active games instantly if configured in admin panel
    const interval = setInterval(loadGames, 5000);
    return () => clearInterval(interval);
  }, []);

  // Map active games to dynamic slides
  const slides = activeGames.length > 0 
    ? activeGames.map((game) => {
        // Assign beautiful theme-matching gradients
        let gradientColor = 'from-brand-primary/10 to-black/90';
        if (game.id === 'mystic-ink') gradientColor = 'from-purple-950/90 to-black/90';
        else if (game.id === 'wild-tattoo') gradientColor = 'from-emerald-950/90 to-black/90';
        else if (game.id === 'calavera-ink') gradientColor = 'from-rose-950/90 to-black/90';
        else if (game.id === 'tattoo-cash') gradientColor = 'from-blue-950/90 to-black/90';
        else if (game.id === 'tattoo-slot') gradientColor = 'from-red-950/90 to-black/90';
        else if (game.id === 'rouletta-ink') gradientColor = 'from-amber-950/90 to-black/90';

        const categoryLabel = game.category === 'slots' ? 'Slots' : 'Roletas';

        return {
          id: game.id,
          image: game.bgPage || game.thumbnail || 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=1920&auto=format&fit=crop',
          title: game.name.toUpperCase(),
          subtitle: `${categoryLabel} • RTP de ${game.rtp}% • Aposta Mínima: R$ ${game.minBet.toFixed(2)}`,
          cta: 'JOGAR AGORA',
          color: gradientColor,
          link: `/app/games/${game.id}`
        };
      })
    : FALLBACK_SLIDES;

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const next = () => {
    if (slides.length === 0) return;
    setCurrent((prev) => (prev + 1) % slides.length);
  };
  
  const prev = () => {
    if (slides.length === 0) return;
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (slides.length === 0) {
    return (
      <div className="w-full aspect-[21/7] md:aspect-[3/1] bg-surface-dark/50 animate-pulse rounded-2xl flex items-center justify-center">
        <span className="text-white/20 text-xs font-bold uppercase tracking-widest">Carregando Banners...</span>
      </div>
    );
  }

  const currentSlide = slides[current] || slides[0];

  return (
    <div className="relative w-full aspect-[21/7] md:aspect-[3/1] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
      <AnimatePresence mode="wait" custom={current}>
        <motion.div
          key={current}
          custom={current}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Link to={currentSlide.link} className="absolute inset-0 block cursor-pointer">
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${currentSlide.color} opacity-60 mix-blend-multiply`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
            
            <div className="absolute inset-0 flex flex-col justify-end p-3.5 md:p-10">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  <p className="text-[8px] md:text-xs font-black uppercase text-brand-primary tracking-widest">Jogo Ativo ⚡</p>
                </div>
                <h2 className="text-sm md:text-4xl font-black text-white mb-0.5 md:mb-1.5 leading-tight drop-shadow-lg uppercase tracking-tight">
                  {currentSlide.title}
                </h2>
                <p className="text-[9px] md:text-lg text-white/90 mb-2 md:mb-4 font-semibold max-w-lg drop-shadow-md">
                  {currentSlide.subtitle}
                </p>
                <span className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-brand-primary text-surface-dark font-black text-[9px] md:text-xs rounded-full hover:bg-brand-primary/90 transition-colors shadow-[0_0_20px_rgba(255,204,0,0.3)]">
                  <Play size={10} className="fill-current" />
                  {currentSlide.cta}
                </span>
              </motion.div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      {slides.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white/70 hover:bg-black/60 hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-20"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white/70 hover:bg-black/60 hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-20"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 right-4 flex gap-1 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === current ? 'bg-brand-primary w-4' : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

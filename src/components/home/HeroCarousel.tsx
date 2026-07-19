import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=1920&auto=format&fit=crop',
    title: 'BÔNUS DE BOAS-VINDAS',
    subtitle: '100% até R$ 500 no primeiro depósito',
    cta: 'PEGAR BÔNUS',
    color: 'from-purple-600 to-blue-600'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=1920&auto=format&fit=crop',
    title: 'TORNEIO DE SLOTS',
    subtitle: 'Prêmio total de R$ 10.000 em dinheiro',
    cta: 'PARTICIPAR',
    color: 'from-[#FFCC00] to-red-600'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
    title: 'CASHBACK SEMANAL',
    subtitle: 'Receba 10% de volta toda segunda-feira',
    cta: 'SAIBA MAIS',
    color: 'from-emerald-500 to-teal-600'
  }
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % SLIDES.length);
  const prev = () => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

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
          <img
            src={SLIDES[current].image}
            alt={SLIDES[current].title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${SLIDES[current].color} opacity-60 mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
          
          <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg md:text-4xl font-black text-white mb-1 leading-tight drop-shadow-lg">
                {SLIDES[current].title}
              </h2>
              <p className="text-[10px] md:text-lg text-white/90 mb-2 font-medium max-w-lg drop-shadow-md">
                {SLIDES[current].subtitle}
              </p>
              <button className="px-4 py-1 bg-white text-black font-bold text-[10px] md:text-sm rounded-full hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {SLIDES[current].cta}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <button 
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white/70 hover:bg-black/50 hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
      >
        <ChevronLeft size={20} />
      </button>
      <button 
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white/70 hover:bg-black/50 hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-2 right-4 flex gap-1">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === current ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

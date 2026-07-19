import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Gamepad2, RotateCw } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: Gamepad2, color: 'text-white' },
  { id: 'slots', label: 'Slots', icon: Sparkles, color: 'text-[#FF007F]' },
  { id: 'roletas', label: 'Roletas', icon: RotateCw, color: 'text-[#FFCC00]' },
];

export function CategoryFilter({ active, onChange }: { active: string, onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.id;
        return (
          <motion.button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            whileTap={{ scale: 0.95 }}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap snap-center transition-all duration-300
              ${isActive 
                ? 'bg-gradient-to-r from-[#FFCC00] to-[#FF007F] text-white shadow-[0_0_15px_rgba(255,204,0,0.4)] border-transparent' 
                : 'bg-[#151020] border border-white/5 text-white/60 hover:text-white hover:bg-[#1a1428]'
              }
            `}
          >
            <cat.icon size={16} className={isActive ? 'text-white' : cat.color} />
            <span className="text-xs font-bold tracking-wide uppercase">{cat.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

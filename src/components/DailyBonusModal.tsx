import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface DailyBonusModalProps {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({ isOpen, amount, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full"
          >
            <X size={18} />
          </button>

          {/* Icon Badge */}
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] relative">
            <Gift size={36} className="text-surface-dark" />
            <div className="absolute -top-1 -right-1 text-amber-200 animate-pulse">
              <Sparkles size={20} />
            </div>
          </div>

          {/* Pill badge */}
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Sparkles size={12} />
            Recompensa Diária
          </div>

          <h3 className="text-xl font-black text-white tracking-tight mb-2">
            Bônus de Login Resgatado!
          </h3>
          <p className="text-xs text-white/70 leading-relaxed mb-6">
            Parabéns! Como você já realizou depósito na plataforma, garantiu seu bônus de login diário para apostar nos seus jogos favoritos.
          </p>

          {/* Value box */}
          <div className="bg-neutral-950 border border-amber-500/20 rounded-xl p-4 mb-6">
            <span className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">
              Valor Adicionado ao Saldo
            </span>
            <span className="text-3xl font-black font-mono text-amber-400 tracking-tight">
              R$ {amount.toFixed(2)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-surface-dark font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 size={18} />
            Começar a Jogar
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

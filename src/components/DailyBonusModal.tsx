import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface DailyBonusModalProps {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({ isOpen, amount, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden bg-gradient-to-b from-stone-900 via-stone-900/95 to-stone-950 border border-amber-500/30 rounded-3xl p-6 text-center shadow-2xl shadow-amber-500/10"
        >
          {/* Background glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Icon Header */}
          <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-3xl shadow-lg shadow-amber-500/30 text-stone-950">
            <Gift size={36} className="animate-bounce" />
            <div className="absolute -top-1 -right-1 text-yellow-200">
              <Sparkles size={24} className="animate-pulse" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={14} /> Recompensa Diária
          </span>

          <h3 className="text-2xl font-black text-white mb-2">
            Bônus de Login Resgatado!
          </h3>

          <p className="text-sm text-stone-300 mb-6 px-4">
            Parabéns! Você entrou hoje e garantiu um bônus exclusivo para apostar nos seus jogos favoritos.
          </p>

          {/* Prize Amount Card */}
          <div className="relative bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6">
            <span className="text-xs text-amber-400/80 font-medium uppercase tracking-widest block mb-1">
              Valor Adicionado ao Saldo
            </span>
            <div className="text-4xl font-black text-amber-400 tracking-tight">
              R$ {amount.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-2xl shadow-lg shadow-amber-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-base"
          >
            <CheckCircle2 size={20} />
            <span>Começar a Jogar</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

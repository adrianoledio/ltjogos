import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

interface DepositSuccessModalProps {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
}

export const DepositSuccessModal: React.FC<DepositSuccessModalProps> = ({ isOpen, amount, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden bg-gradient-to-b from-stone-900 via-stone-900/95 to-stone-950 border border-emerald-500/40 rounded-3xl p-6 text-center shadow-2xl shadow-emerald-500/20"
        >
          {/* Background glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />

          {/* Icon Header */}
          <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl shadow-lg shadow-emerald-500/30 text-stone-950">
            <CheckCircle2 size={40} className="animate-bounce" />
            <div className="absolute -top-1 -right-1 text-teal-200">
              <Sparkles size={24} className="animate-pulse" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={14} /> Pagamento Aprovado
          </span>

          <h3 className="text-2xl font-black text-white mb-2">
            Depósito Confirmado!
          </h3>

          <p className="text-sm text-stone-300 mb-6 px-4">
            Seu pagamento foi aprovado com sucesso e o saldo já foi creditado em sua carteira. Divirta-se nos jogos!
          </p>

          {/* Amount Card */}
          <div className="relative bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-6">
            <span className="text-xs text-emerald-400/80 font-medium uppercase tracking-widest block mb-1">
              Valor Creditado
            </span>
            <div className="text-4xl font-black text-emerald-400 tracking-tight font-numeric">
              R$ {amount > 0 ? amount.toFixed(2).replace('.', ',') : '0,00'}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black rounded-2xl shadow-lg shadow-emerald-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-base uppercase tracking-wider"
          >
            <span>Ir para o Lobby</span>
            <ArrowRight size={20} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

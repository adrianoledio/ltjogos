import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, LogOut, Play } from 'lucide-react';

interface ConfirmExitModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSpinning?: boolean;
  title?: string;
  message?: string;
}

export const ConfirmExitModal: React.FC<ConfirmExitModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  isSpinning = false,
  title,
  message,
}) => {
  const modalTitle = title || (isSpinning ? "Rodada em Andamento!" : "Sair do Jogo?");
  const modalMessage = message || (isSpinning 
    ? "Atenção: Há uma aposta ou rodada ativa em execução! Se você sair agora, os resultados da rodada atual poderão ser afetados." 
    : "Tem certeza de que deseja fechar o jogo e retornar ao Lobby?");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`w-full max-w-sm rounded-2xl bg-gradient-to-b ${
              isSpinning 
                ? 'from-[#2b1212] to-[#0d0707] border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.3)]' 
                : 'from-[#1c162b] to-[#0d0a17] border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.2)]'
            } border p-5 text-center relative overflow-hidden`}
          >
            {/* Ambient Background Glow */}
            <div className={`absolute -top-12 -left-12 w-32 h-32 ${isSpinning ? 'bg-red-500/20' : 'bg-amber-500/10'} rounded-full blur-2xl pointer-events-none`} />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Warning Icon Badge */}
            <div className={`mx-auto w-14 h-14 rounded-2xl ${
              isSpinning 
                ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            } border flex items-center justify-center mb-4 shadow-inner`}>
              <AlertTriangle size={28} className="animate-pulse" />
            </div>

            {/* Title & Message */}
            <h3 className="text-lg font-black text-white uppercase tracking-wide mb-2">
              {modalTitle}
            </h3>
            <p className="text-xs text-white/80 leading-relaxed mb-6 font-medium">
              {modalMessage}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={onCancel}
                className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-98 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                Continuar Jogando
              </button>

              <button
                onClick={onConfirm}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={14} />
                Confirmar Saída
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

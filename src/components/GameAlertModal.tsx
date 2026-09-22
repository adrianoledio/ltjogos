import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Coins, X, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GameAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'insufficient_balance' | 'info' | 'error';
  onAction?: () => void;
  actionText?: string;
}

export const GameAlertModal: React.FC<GameAlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  onAction,
  actionText,
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (type === 'insufficient_balance') {
      onClose();
      navigate('/app/wallet'); // Redirect to Wallet / Deposit directly
    } else {
      onClose();
    }
  };

  const getThemeStyles = () => {
    switch (type) {
      case 'insufficient_balance':
        return {
          fromTo: 'from-[#2b1f12] to-[#0d0a07] border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.25)]',
          glow: 'bg-amber-500/15',
          iconBg: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
          icon: <Coins size={28} className="animate-pulse" />,
          title: title || 'Saldo Insuficiente',
          btnText: actionText || 'Depositar com Bônus',
        };
      case 'error':
        return {
          fromTo: 'from-[#2b1212] to-[#0d0707] border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.25)]',
          glow: 'bg-red-500/15',
          iconBg: 'bg-red-500/20 border-red-500/30 text-red-400',
          icon: <AlertTriangle size={28} className="animate-pulse" />,
          title: title || 'Ocorreu um Erro',
          btnText: actionText || 'Entendido',
        };
      case 'info':
      default:
        return {
          fromTo: 'from-[#161c2b] to-[#070a0d] border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.2)]',
          glow: 'bg-blue-500/10',
          iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
          icon: <AlertTriangle size={28} />,
          title: title || 'Aviso da Plataforma',
          btnText: actionText || 'Fechar',
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-2xl bg-gradient-to-b ${styles.fromTo} border p-5 text-center relative overflow-hidden`}
          >
            {/* Close Button top-right */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white/80 active:scale-95 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Ambient Background Glow */}
            <div className={`absolute -top-12 -left-12 w-32 h-32 ${styles.glow} rounded-full blur-2xl pointer-events-none`} />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Icon Badge */}
            <div className={`mx-auto w-14 h-14 rounded-2xl ${styles.iconBg} border flex items-center justify-center mb-4 shadow-inner`}>
              {styles.icon}
            </div>

            {/* Title & Message */}
            <h3 className="text-base font-black text-white uppercase tracking-wider mb-2">
              {styles.title}
            </h3>
            <p className="text-xs text-white/80 leading-relaxed mb-6 font-medium">
              {message}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAction}
                className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'insufficient_balance'
                    ? 'text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-98'
                    : 'text-white bg-blue-600 hover:bg-blue-500 active:scale-98'
                }`}
              >
                {type === 'insufficient_balance' && <Landmark size={14} />}
                {styles.btnText}
              </button>

              {type === 'insufficient_balance' && (
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white/50 hover:text-white/80 hover:bg-white/5 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Voltar ao Jogo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

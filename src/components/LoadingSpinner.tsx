import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'CARREGANDO...',
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-[9px] tracking-widest',
    md: 'text-xs tracking-[0.25em]',
    lg: 'text-sm tracking-[0.3em]',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 space-y-3 select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Glow effect behind icon */}
        <div className="absolute inset-0 rounded-full bg-brand-primary/20 blur-xl animate-pulse" />
        
        {/* Slowly spinning custom icon */}
        <img
          src="https://i.postimg.cc/qMC9Q13X/icone.png"
          alt="Carregando"
          className={`${iconSizes[size]} object-contain animate-[spin_5s_linear_infinite] drop-shadow-[0_0_12px_rgba(255,204,0,0.4)] relative z-10`}
        />
      </div>

      {text && (
        <span className={`font-display font-black text-brand-primary uppercase animate-pulse ${textSizes[size]}`}>
          {text}
        </span>
      )}
    </div>
  );
};

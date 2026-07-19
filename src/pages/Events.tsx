import React from 'react';
import { Calendar } from 'lucide-react';

export function Events() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
        <Calendar size={40} className="text-white/30" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Eventos</h2>
      <p className="text-white/50 max-w-xs">
        Fique ligado! Em breve teremos torneios e eventos especiais valendo prêmios exclusivos.
      </p>
    </div>
  );
}

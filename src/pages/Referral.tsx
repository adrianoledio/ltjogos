import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Share2, Copy, Check, Users, Trophy, Medal, Crown, TrendingUp, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../data/db';

export function Referral() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Time remaining simulation for the weekly cycle
  const [timeLeft, setTimeLeft] = useState('2 dias, 14h 22m');

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await db.getSettings();
      setSettings(data);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  if (!user || loading) return null;

  const handleCopy = () => {
    if (user.referralLink) {
      navigator.clipboard.writeText(user.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const referralsForFirstWithdrawal = settings?.referralsForFirstWithdrawal || 3;
  const progress = Math.min(100, ((user.referrals || 0) / referralsForFirstWithdrawal) * 100);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="glass-card p-10 text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <Share2 size={160} />
        </div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-brand-primary/20 rotate-3 group-hover:rotate-6 transition-transform duration-500">
            <Users size={48} className="text-brand-primary drop-shadow-lg" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter mb-4 text-white">INDIQUE E <span className="text-brand-primary">GANHE</span></h2>
          <p className="text-white/40 max-w-xs mx-auto text-xs font-bold uppercase tracking-widest leading-relaxed">
            Convide seus amigos e, após o primeiro depósito deles, desbloqueie seu primeiro resgate!
          </p>
        </div>
      </div>

      <div className="glass-panel p-8 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Progresso de Desbloqueio</p>
            <p className="text-xs font-black text-brand-primary uppercase tracking-widest">{user.referrals || 0} / {referralsForFirstWithdrawal} Amigos</p>
          </div>
          <div className="h-4 bg-white/[0.03] rounded-full overflow-hidden border border-white/5 p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full shadow-[0_0_20px_rgba(255,204,0,0.3)]"
            />
          </div>
          {user.unlockFirstWithdrawal ? (
            <p className="text-[10px] text-emerald-400 font-black text-center uppercase tracking-[0.2em] animate-pulse">✨ Primeiro resgate desbloqueado!</p>
          ) : (
            <p className="text-[10px] text-white/20 font-black text-center uppercase tracking-[0.2em]">Faltam {Math.max(0, referralsForFirstWithdrawal - (user.referrals || 0))} indicações</p>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Seu Link de Indicação</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-xs text-white/40 truncate flex items-center">
              {user.referralLink || 'Link não gerado'}
            </div>
            <button 
              onClick={handleCopy}
              className="w-14 h-14 bg-brand-primary text-surface-dark rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-primary/20 active:scale-95 hover:scale-105 transition-all"
            >
              {copied ? <Check size={24} className="font-black" /> : <Copy size={24} className="font-black" />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
            <Check size={20} />
          </div>
          <div>
            <p className="text-xs font-bold">Passo 1</p>
            <p className="text-[10px] text-white/50">Copie seu link e envie para seus amigos.</p>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
            <Check size={20} />
          </div>
          <div>
            <p className="text-xs font-bold">Passo 2</p>
            <p className="text-[10px] text-white/50">Eles se cadastram e fazem o primeiro depósito.</p>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Check size={20} />
          </div>
          <div>
            <p className="text-xs font-bold">Passo 3</p>
            <p className="text-[10px] text-white/50">Você desbloqueia seu primeiro resgate!</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO: RANKING DE INDICAÇÃO */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-brand-primary animate-pulse" size={20} />
            <h3 className="font-black text-sm tracking-widest text-white uppercase">Ranking de Indicação</h3>
          </div>
          <span className="flex items-center gap-1 bg-white/5 border border-white/10 text-[9px] font-mono px-2.5 py-1 rounded-xl text-white/60 uppercase font-bold tracking-widest">
            <Calendar size={10} className="text-brand-primary" />
            {timeLeft}
          </span>
        </div>

        {/* Prizes announcement banner */}
        <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/5 border border-brand-primary/15 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-brand-primary tracking-widest">Premiação Semanal</p>
            <p className="text-xs text-white/80 leading-relaxed font-bold">
              Os 3 principais divulgadores da semana ganham bônus direto na carteira!
            </p>
          </div>
          <div className="bg-brand-primary/20 p-2.5 rounded-xl border border-brand-primary/30 shrink-0">
            <Sparkles className="text-brand-primary animate-pulse" size={20} />
          </div>
        </div>

        {/* Podium visualization for top 3 */}
        <div className="grid grid-cols-3 gap-3 pt-4 items-end bg-white/[0.01] border border-white/5 rounded-2xl p-4">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border-2 border-slate-400 flex items-center justify-center relative mb-2 shadow-lg">
              <Medal className="text-slate-400" size={18} />
              <span className="absolute -bottom-1.5 bg-slate-400 text-surface-dark text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">2º</span>
            </div>
            <span className="text-[10px] font-black text-white/90 truncate max-w-full text-center">beatriz_tattoo</span>
            <span className="text-[9px] text-white/40 font-black uppercase mt-0.5">61 amigos</span>
            <span className="text-[10px] text-slate-400 font-black mt-1">R$ 250,00</span>
          </div>

          {/* 1st Place - Tallest */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 border-2 border-brand-primary flex items-center justify-center relative mb-2 shadow-[0_0_20px_rgba(255,204,0,0.15)]">
              <Crown className="text-brand-primary absolute -top-4 animate-bounce" size={20} />
              <Trophy className="text-brand-primary" size={24} />
              <span className="absolute -bottom-1.5 bg-brand-primary text-surface-dark text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">1º</span>
            </div>
            <span className="text-xs font-black text-white truncate max-w-full text-center">marcos_ink</span>
            <span className="text-[10px] text-brand-primary font-black uppercase mt-0.5">84 amigos</span>
            <span className="text-[11px] text-brand-primary font-black mt-1">R$ 500,00</span>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border-2 border-amber-700 flex items-center justify-center relative mb-2 shadow-lg">
              <Medal className="text-amber-600" size={18} />
              <span className="absolute -bottom-1.5 bg-amber-700 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">3º</span>
            </div>
            <span className="text-[10px] font-black text-white/90 truncate max-w-full text-center">gabriel_pix</span>
            <span className="text-[9px] text-white/40 font-black uppercase mt-0.5">49 amigos</span>
            <span className="text-[10px] text-amber-600 font-black mt-1">R$ 100,00</span>
          </div>
        </div>

        {/* Scrollable list for other top users */}
        <div className="space-y-2 border-t border-white/5 pt-4">
          <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Demais Colocações</p>
          
          {[
            { rank: 4, name: 'luan.ink', referrals: 32 },
            { rank: 5, name: 'carol.piercer', referrals: 24 },
            { rank: 6, name: 'felipe.art', referrals: 19 },
            { rank: 7, name: 'mari_p', referrals: 15 },
          ].map((item) => (
            <div key={item.rank} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-white/40 w-4 font-black">#{item.rank}</span>
                <span className="text-xs font-bold text-white/80">{item.name}</span>
              </div>
              <span className="text-xs font-black text-white/60 font-mono">{item.referrals} indicações</span>
            </div>
          ))}
        </div>

        {/* Current user's statistics inside the ranking */}
        <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/5 border-2 border-brand-primary/25 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-brand-primary text-surface-dark flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(255,204,0,0.2)]">
              #{user.referrals && user.referrals >= 84 ? '1' : user.referrals && user.referrals >= 61 ? '2' : user.referrals && user.referrals >= 49 ? '3' : '14'}
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">Seu Posicionamento</p>
              <p className="text-[10px] text-brand-primary/80 font-black uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <TrendingUp size={12} />
                {user.referrals || 0} amigos indicados
              </p>
            </div>
          </div>
          <div className="text-right relative z-10">
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Faltam {Math.max(1, 15 - (user.referrals || 0))} ref</p>
            <p className="text-[10px] font-black text-white uppercase tracking-wider">para o Top 10</p>
          </div>
          {/* Subtle back decorative glow */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-24 h-24 bg-brand-primary/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

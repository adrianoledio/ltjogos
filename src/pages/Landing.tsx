import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Skull, ArrowRight, ShieldAlert, Gift, Star, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Landing() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;
  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#FFCC00]/30 flex justify-center">
      <div className="w-full max-w-md bg-[#05020a] min-h-screen relative shadow-2xl flex flex-col overflow-x-hidden">
        
        {/* Hero Section */}
        <div className="relative pt-16 pb-10 px-6 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark via-surface-dark to-black z-0" />
          <img
            src="https://picsum.photos/seed/tattoo-neon/800/1200"
            alt="Tattoo Neon"
            className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay scale-110 animate-pulse-slow"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
          
          <div className="relative z-20 flex flex-col items-center w-full mt-6">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
              className="w-20 h-20 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,0,127,0.4)] rotate-3"
            >
              <Skull size={40} className="text-white drop-shadow-lg" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black tracking-tighter leading-[1] mb-4 text-white drop-shadow-2xl"
            >
              SUA TATUAGEM <br />
              <span className="text-gradient">ESTÁ EM JOGO</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-xs mb-8 max-w-[280px] font-medium leading-relaxed uppercase tracking-widest"
            >
              A única Plataforma de Jogos onde seus ganhos viram tatuagens reais. Multiplique seu saldo e feche o braço!
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full space-y-4"
            >
              <Link
                to="/register"
                className="btn-primary w-full py-5 text-lg uppercase tracking-[0.2em] shadow-2xl shadow-brand-primary/20"
              >
                COMEÇAR AGORA <ArrowRight size={20} className="ml-2 inline" />
              </Link>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                Já tem conta? <Link to="/login" className="text-brand-primary hover:underline">Entrar</Link>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 px-5 relative z-20 flex flex-col gap-6 pb-16">
          
          {/* Deposit Bonus Trigger */}
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/10 blur-3xl rounded-full -mr-16 -mt-16 transition-all group-hover:bg-brand-secondary/20" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
                <Gift size={24} />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest leading-tight">DOBRAMOS SEU <br/> 1º DEPÓSITO</h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-4 font-medium">
              Deposite <strong className="text-white">R$ 50</strong> e jogue com <strong className="text-white">R$ 100</strong>. Suas chances de ganhar aquela tatuagem dos sonhos acabaram de dobrar!
            </p>
            <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 bg-emerald-400/10 w-max px-4 py-2 rounded-lg uppercase tracking-widest">
              <CheckCircle2 size={14} /> Oferta liberada no cadastro
            </div>
          </div>

          {/* Social Proof - Fake Winners Feed */}
          <div className="glass-panel p-5 rounded-3xl">
            <h3 className="text-[10px] font-black flex items-center gap-3 mb-5 text-white/40 uppercase tracking-[0.2em]">
              <TrendingUp className="text-emerald-500" size={16} />
              Ganhadores Recentes
            </h3>
            <div className="space-y-3 relative overflow-hidden h-[140px]">
              <motion.div
                animate={{ y: [0, -200] }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="space-y-3"
              >
                {[
                  { n: 'Lucas M.', v: '850,00', t: 'Há 2 min' },
                  { n: 'Pedro H.', v: '1.200,00', t: 'Há 5 min' },
                  { n: 'Ana C.', v: '450,00', t: 'Há 12 min' },
                  { n: 'Rafael T.', v: '2.100,00', t: 'Há 15 min' },
                  { n: 'Marcos S.', v: '600,00', t: 'Há 22 min' },
                  { n: 'Julia R.', v: '950,00', t: 'Há 28 min' },
                ].map((w, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                        {w.n[0]}
                      </div>
                      <span className="text-xs font-bold text-white/80">{w.n}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-display font-black text-emerald-400">+ R$ {w.v}</p>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{w.t}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
              {/* Fade masks */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-surface-dark to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface-dark to-transparent z-10" />
            </div>
          </div>

          {/* Social Proof - Testimonials */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-center text-white/50 uppercase tracking-widest mt-2">Quem joga, tatua</h3>
            
            <div className="bg-[#151020] border border-white/5 p-4 rounded-2xl relative">
              <div className="flex text-yellow-500 mb-2">
                <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
              </div>
              <p className="text-xs text-white/80 italic mb-2">"Coloquei R$ 30 de bobeira no Mystic Ink e tirei R$ 800 em créditos. Já marquei minha sessão pra fechar a perna! 💉"</p>
              <p className="text-[10px] font-bold text-[#FFCC00]">@pedro_alves</p>
            </div>

            <div className="bg-[#151020] border border-white/5 p-4 rounded-2xl relative">
              <div className="flex text-yellow-500 mb-2">
                <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
              </div>
              <p className="text-xs text-white/80 italic mb-2">"Melhor que plataforma de jogos normal porque o prêmio é real e fica pra sempre na pele. O bônus de depósito me salvou! 🚀"</p>
              <p className="text-[10px] font-bold text-[#FFCC00]">@lucas.ink</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 bg-black/50 border border-white/5 p-4 rounded-2xl text-center">
            <ShieldAlert className="text-white/30 mx-auto mb-2" size={20} />
            <h4 className="font-bold text-xs text-white/50 mb-1">Atenção: Sem Resgate em Dinheiro</h4>
            <p className="text-[10px] text-white/40 leading-relaxed">
              A LT JOGOS é uma plataforma exclusiva de entretenimento. Todo o saldo ganho é convertido 100% em vouchers para tatuagens com nossos estúdios parceiros. Não realizamos pagamentos em dinheiro real.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

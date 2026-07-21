import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Gift, ShieldCheck, Zap } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <LoadingSpinner size="lg" text="CARREGANDO..." />
    </div>
  );
  if (user) return <Navigate to="/app" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await register(name, phone, password);
      if (success) {
        navigate('/app/wallet');
      } else {
        setError('Erro ao criar conta');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar o cadastro');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#FFCC00]/30 flex justify-center">
      <div className="w-full max-w-md bg-[#05020a] min-h-screen relative shadow-2xl flex flex-col justify-center p-6">
        
        {/* Persuasive Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-white mb-2">
            CRIE SUA CONTA E <span className="text-brand-primary">GANHE</span>
          </h1>
          <p className="text-white/60 text-[11px] font-black uppercase tracking-[0.2em]">
            + Bônus de até 75% no 1º depósito!
          </p>
        </div>

        {/* Promo Banner */}
        <div className="bg-gradient-to-br from-purple-900/40 to-black/40 border border-brand-primary/30 rounded-2xl p-4 mb-6 shadow-[0_4px_25px_rgba(255,204,0,0.1)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0 animate-pulse">
            <Gift className="text-brand-primary" size={20} />
          </div>
          <p className="text-[10px] text-white/80 leading-snug">
            Cadastre-se agora e garanta seu bônus de boas-vindas. Depósitos acima de R$ 200 recebem <strong className="text-brand-primary font-black">+75% EXTRA!</strong>
          </p>
        </div>

        <div className="bg-[#151020] p-6 rounded-3xl border border-white/5 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-bold text-center uppercase tracking-widest">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-brand-primary transition-all"
                placeholder="Ex: João Silva"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Telefone (WhatsApp)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-brand-primary transition-all"
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-brand-primary transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary text-surface-dark font-display font-black py-5 rounded-2xl text-sm uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_4px_25px_rgba(255,204,0,0.2)] hover:shadow-[0_4px_35px_rgba(255,204,0,0.35)] flex items-center justify-center gap-2 mt-2"
            >
              <Zap size={16} /> CADASTRAR E GANHAR BÔNUS
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] font-bold text-white/30 uppercase tracking-widest">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-brand-primary hover:underline font-black">
              Entrar
            </Link>
          </p>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex justify-center items-center gap-6 text-white/20">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest">
            <ShieldCheck size={14} /> Seguro
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest">
            <Zap size={14} /> Rápido
          </div>
        </div>
      </div>
    </div>
  );
}


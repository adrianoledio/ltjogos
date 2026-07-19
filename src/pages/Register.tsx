import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

export function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;
  if (user) return <Navigate to="/app" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register(name, phone, password);
    if (success) {
      navigate('/app');
    } else {
      setError('Telefone já cadastrado');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#FFCC00]/30 flex justify-center">
      <div className="w-full max-w-md bg-[#05020a] min-h-screen relative shadow-2xl flex flex-col justify-center p-6">
        <div className="bg-[#151020] p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-tighter text-gradient mb-2">
              CRIAR CONTA
            </h1>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">DOBRE SEU 1º DEPÓSITO</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-bold text-center uppercase tracking-widest">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Seu nome"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Telefone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="(99) 99999-9999"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-5 text-sm uppercase tracking-[0.2em] mt-4"
            >
              <UserPlus size={18} className="mr-2 inline" /> Registrar
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] font-bold text-white/30 uppercase tracking-widest">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-brand-primary hover:underline font-black">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

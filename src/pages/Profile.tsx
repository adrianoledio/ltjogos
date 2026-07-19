import React from 'react';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="p-4 space-y-6 animate-in fade-in">
      <div className="flex items-center gap-4 bg-[#151020] p-4 rounded-2xl border border-white/5">
        <div className="w-16 h-16 bg-gradient-to-tr from-[#FFCC00] to-[#FF007F] rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-white/50">{user.email}</p>
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            {user.role === 'admin' ? 'Administrador' : 'Verificado'}
          </div>
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="space-y-2 animate-in slide-in-from-top duration-300">
          <h3 className="text-xs font-bold text-[#FFCC00] uppercase tracking-wider px-2">Administração</h3>
          <div className="bg-[#151020] rounded-2xl border border-[#FFCC00]/25 overflow-hidden">
            <Link 
              id="btn-admin-panel"
              to="/app/admin" 
              className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
            >
              <Shield size={20} className="text-[#FFCC00]" />
              <div className="flex-1">
                <span className="text-sm font-medium block text-white">Painel do Administrador</span>
                <span className="text-[10px] text-white/50 block">Gerenciar usuários, depósitos e saques</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider px-2">Conta</h3>
        <div className="bg-[#151020] rounded-2xl border border-white/5 overflow-hidden">
          <button className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left">
            <User size={20} className="text-white/70" />
            <span className="text-sm font-medium">Dados Pessoais</span>
          </button>
          <div className="h-px bg-white/5" />
          <button className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left">
            <Settings size={20} className="text-white/70" />
            <span className="text-sm font-medium">Configurações</span>
          </button>
        </div>
      </div>

      <button 
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors border border-red-500/20"
      >
        <LogOut size={20} />
        Sair da Conta
      </button>
      
      <div className="text-center text-[10px] text-white/30 pt-8">
        Versão 1.0.0 • LT JOGOS
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Wallet, User as UserIcon, Bell, Menu } from 'lucide-react';

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 w-full max-w-md left-1/2 -translate-x-1/2 h-16 glass-panel z-50 flex items-center justify-between px-4 shadow-2xl border-b border-white/10">
      <div className="flex items-center gap-3">
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all">
          <Menu size={20} />
        </button>
        <Link to="/app" className="relative group">
          <span className="text-xl font-black tracking-tighter text-white">
            LT<span className="text-brand-primary">JOGOS</span>
          </span>
          <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-brand-primary to-brand-secondary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link 
              to="/app/wallet" 
              className="flex items-center gap-2 bg-white/[0.03] border border-white/10 pl-3 pr-1 py-1 rounded-2xl hover:bg-white/[0.06] hover:border-brand-primary/30 transition-all group"
            >
              <div className="flex flex-col items-end leading-none mr-1">
                <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Saldo</span>
                <span className="font-display font-bold text-sm text-brand-primary group-hover:text-white transition-colors">
                  R$ {user.balance.toFixed(2)}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                <Wallet size={14} />
              </div>
            </Link>
            
            <div className="relative group">
              <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
                <UserIcon size={18} />
              </button>
              
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-56 glass-card p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50 scale-95 group-hover:scale-100">
                <div className="p-4 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-t-2xl">
                  <p className="font-bold text-sm text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-white/40 truncate font-medium">{user.phone || user.email}</p>
                </div>
                <div className="p-1 space-y-1">
                  {user.role === 'admin' && (
                    <Link to="/app/admin" className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                      <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
                      Painel Admin
                    </Link>
                  )}
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <Bell size={14} />
                    Notificações
                  </button>
                  <div className="h-px bg-white/5 mx-2 my-1" />
                  <button onClick={logout} className="w-full text-left px-3 py-2.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all">
                    Sair da Conta
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-xs font-bold text-white/70 hover:text-white transition-colors">
              ENTRAR
            </Link>
            <Link to="/register" className="btn-primary py-2 px-4 text-xs">
              REGISTRAR
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

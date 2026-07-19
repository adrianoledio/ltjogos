import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Wallet, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const links = [
    { to: '/', icon: Home, label: 'Início' },
    { to: '/games', icon: Gamepad2, label: 'Jogos' },
    { to: '/wallet', icon: Wallet, label: 'Carteira' },
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  if (user?.role === 'admin') {
    links.push({ to: '/admin', icon: Settings, label: 'Painel Admin' });
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0a0510] border-r border-white/5 hidden lg:flex flex-col z-40">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <Link to="/" className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#FFCC00] to-[#FF007F]">
          LT JOGOS
        </Link>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium',
                isActive
                  ? 'bg-gradient-to-r from-[#FFCC00]/20 to-transparent text-[#FFCC00] border-l-2 border-[#FFCC00]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <link.icon size={20} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-[#151020] rounded-xl p-4 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FFCC00] to-[#FF007F] flex items-center justify-center text-white font-bold">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Visitante'}</p>
            <p className="text-xs text-white/50 truncate font-mono">R$ {user?.balance?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

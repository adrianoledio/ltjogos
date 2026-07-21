import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Share2, Wallet, User, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export function BottomNav() {
  const { pathname } = useLocation();

  // Hide BottomNav on game pages
  if (pathname.startsWith('/app/games/')) {
    return null;
  }

  const links = [
    { to: '/app', icon: Home, label: 'Início' },
    { to: '/app/events', icon: Calendar, label: 'Eventos' },
    { to: '/app/referral', icon: Share2, label: 'Indicar', highlight: true },
    { to: '/app/wallet', icon: Wallet, label: 'Carteira' },
    { to: '/app/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md h-16 bg-surface-card/90 backdrop-blur-2xl border border-border-rgba rounded-2xl z-50 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center justify-around px-2 transition-all duration-300">
      {links.map((link) => {
        const isActive = pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            className="relative flex flex-col items-center justify-center w-14 h-full group"
          >
            {isActive && (
              <motion.div
                layoutId="nav-active"
                className="absolute -top-3 w-8 h-1 bg-[#FFCC00] rounded-full shadow-[0_0_15px_rgba(255,204,0,0.5)]"
              />
            )}
            
            <div className={cn(
              "relative p-2 rounded-xl transition-all duration-300",
              isActive ? "text-[#FFCC00]" : "text-text-muted/60 group-hover:text-text-main",
              link.highlight && !isActive && "text-[#FFCC00]"
            )}>
              <link.icon 
                size={22} 
                className={cn(
                  "transition-transform duration-300",
                  isActive && "scale-110"
                )} 
              />
              {link.highlight && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

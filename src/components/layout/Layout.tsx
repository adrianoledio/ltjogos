import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';

export function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/app/admin');
  const isGame = location.pathname.includes('/games/');
  const useZeroPadding = isAdmin || isGame;

  return (
    <div className={`min-h-screen bg-black text-text-main font-sans selection:bg-[#FFCC00]/30 ${isAdmin ? '' : 'flex justify-center'} transition-colors duration-300`}>
      <div className={`w-full bg-surface-dark min-h-screen relative flex flex-col overflow-x-hidden ${isAdmin ? '' : 'max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] border-x border-border-rgba'} transition-colors duration-300`}>
        {!isAdmin && !isGame && <Topbar />}
        <main className={`flex-1 ${isAdmin ? 'overflow-y-auto' : isGame ? 'h-0 overflow-hidden' : 'h-0 overflow-hidden pt-14 pb-24'} scrollbar-hide flex flex-col`}>
          <div className={`${useZeroPadding ? 'p-0' : 'p-4'} flex-1 flex flex-col`}>
            <Outlet />
          </div>
        </main>
        {!isAdmin && !isGame && <BottomNav />}
      </div>
    </div>
  );
}

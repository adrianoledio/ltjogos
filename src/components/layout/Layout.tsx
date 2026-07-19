import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';

export function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/app/admin');

  return (
    <div className={`min-h-screen bg-black text-white font-sans selection:bg-[#FFCC00]/30 ${isAdmin ? '' : 'flex justify-center'}`}>
      <div className={`w-full bg-[#05020a] min-h-screen relative flex flex-col overflow-x-hidden ${isAdmin ? '' : 'max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] border-x border-white/5'}`}>
        {!isAdmin && <Topbar />}
        <main className={`flex-1 ${isAdmin ? 'overflow-y-auto' : 'h-0 overflow-hidden pt-14 pb-24'} scrollbar-hide flex flex-col`}>
          <div className={`${isAdmin ? 'p-0' : 'p-4'} flex-1 flex flex-col`}>
            <Outlet />
          </div>
        </main>
        {!isAdmin && <BottomNav />}
      </div>
    </div>
  );
}

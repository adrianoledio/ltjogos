import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Landing } from './pages/Landing';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Wallet } from './pages/Wallet';
import { Admin } from './pages/Admin';

import { Events } from './pages/Events';
import { Referral } from './pages/Referral';
import { Profile } from './pages/Profile';

// Lazy loaded game pages for optimized initial bundle loading
const MysticInk = React.lazy(() => import('./pages/games/MysticInk').then(m => ({ default: m.MysticInk })));
const TattooCash = React.lazy(() => import('./pages/games/TattooCash').then(m => ({ default: m.TattooCash })));
const RoulettaInk = React.lazy(() => import('./pages/games/RoulettaInk').then(m => ({ default: m.RoulettaInk })));
const TattooSlot = React.lazy(() => import('./pages/games/TattooSlot').then(m => ({ default: m.TattooSlot })));
const CalaveraInk = React.lazy(() => import('./pages/games/CalaveraInk').then(m => ({ default: m.CalaveraInk })));
const InkReveal = React.lazy(() => import('./pages/games/InkReveal').then(m => ({ default: m.InkReveal })));
const YakuzaInk = React.lazy(() => import('./pages/games/YakuzaInk').then(m => ({ default: m.YakuzaInk })));

function GameLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-yellow-500/20 animate-ping" />
        <div className="w-10 h-10 rounded-full border-2 border-t-yellow-400 border-r-yellow-400 border-b-transparent border-l-transparent animate-spin" />
      </div>
      <span className="text-xs font-semibold text-white/60 tracking-widest uppercase">Carregando jogo...</span>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors theme="dark" />
      <ThemeProvider>
        <AudioProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Home />} />
                <Route path="events" element={<Events />} />
                <Route path="referral" element={<Referral />} />
                <Route path="games" element={<Home />} />
                <Route path="games/mystic-ink" element={<Suspense fallback={<GameLoadingFallback />}><MysticInk /></Suspense>} />
                <Route path="games/wild-tattoo" element={<Suspense fallback={<GameLoadingFallback />}><MysticInk /></Suspense>} />
                <Route path="games/calavera-ink" element={<Suspense fallback={<GameLoadingFallback />}><CalaveraInk /></Suspense>} />
                <Route path="games/tattoo-cash" element={<Suspense fallback={<GameLoadingFallback />}><TattooCash /></Suspense>} />
                <Route path="games/rouletta-ink" element={<Suspense fallback={<GameLoadingFallback />}><RoulettaInk /></Suspense>} />
                <Route path="games/roleta-pix" element={<Navigate to="/app/games/rouletta-ink" replace />} />
                <Route path="games/tattoo-slot" element={<Suspense fallback={<GameLoadingFallback />}><TattooSlot /></Suspense>} />
                <Route path="games/ink-reveal" element={<Suspense fallback={<GameLoadingFallback />}><InkReveal /></Suspense>} />
                <Route path="games/yakuza-ink" element={<Suspense fallback={<GameLoadingFallback />}><YakuzaInk /></Suspense>} />
                {/* Fallback for other games */}
                <Route path="games/:id" element={<div className="text-center mt-20 text-white/50 text-sm">Jogo em desenvolvimento...</div>} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="admin" element={<Admin />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
          </Router>
        </AudioProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

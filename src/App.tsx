import React from 'react';
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
import { MysticInk } from './pages/games/MysticInk';
import { TattooCash } from './pages/games/TattooCash';
import { RoletaPix } from './pages/games/RoletaPix';
import { TattooSlot } from './pages/games/TattooSlot';
import { CalaveraInk } from './pages/games/CalaveraInk';

import { Events } from './pages/Events';
import { Referral } from './pages/Referral';
import { Profile } from './pages/Profile';

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
                <Route path="games/mystic-ink" element={<MysticInk />} />
                <Route path="games/wild-tattoo" element={<MysticInk />} />
                <Route path="games/calavera-ink" element={<CalaveraInk />} />
                <Route path="games/tattoo-cash" element={<TattooCash />} />
                <Route path="games/roleta-pix" element={<RoletaPix />} />
                <Route path="games/tattoo-slot" element={<TattooSlot />} />
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

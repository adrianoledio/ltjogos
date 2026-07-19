import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, User } from '../data/db';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneOrEmail: string, pass: string) => Promise<boolean>;
  register: (name: string, phone: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateBalance: (amount: number, type: 'deposit' | 'withdraw' | 'bet' | 'win', gameId?: string, metadata?: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await db.init();
      const storedUserId = localStorage.getItem('lt_active_user');
      if (storedUserId) {
        const found = await db.getUser(storedUserId);
        if (found) {
          let updated = false;
          // Ensure earnings exists for legacy users
          if (found.earnings === undefined) {
            found.earnings = 0;
            updated = true;
          }
          // Ensure referralLink exists and is not empty
          if (!found.referralLink) {
            found.referralLink = `${window.location.origin}/register?ref=${found.id}`;
            updated = true;
          }
          if (updated) {
            await db.updateUser(found);
          }
          setUser(found);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (phoneOrEmail: string, pass: string) => {
    const cleanedInput = phoneOrEmail.includes('@') ? phoneOrEmail : phoneOrEmail.replace(/\D/g, '');
    const users = await db.getUsers();
    const found = users.find((u) => {
      const uPhoneCleaned = u.phone ? u.phone.replace(/\D/g, '') : '';
      const uEmail = u.email ? u.email.toLowerCase() : '';
      const search = cleanedInput.toLowerCase();
      return (uPhoneCleaned === search || uEmail === search) && u.password === pass;
    });

    if (found) {
      let updated = false;
      if (!found.referralLink) {
        found.referralLink = `${window.location.origin}/register?ref=${found.id}`;
        updated = true;
      }
      if (updated) {
        try {
          await db.updateUser(found);
        } catch (e) {
          console.warn("Could not sync logged in user link:", e);
        }
      }
      setUser(found);
      localStorage.setItem('lt_active_user', found.id);
      return true;
    }
    return false;
  };

  const register = async (name: string, phone: string, pass: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      throw new Error('Número de telefone inválido.');
    }

    const users = await db.getUsers();
    
    // Check if phone or email already exists
    const duplicate = users.find((u) => {
      const uPhoneCleaned = u.phone ? u.phone.replace(/\D/g, '') : '';
      const emailPattern = `${cleanPhone}@ltjogos.com`.toLowerCase();
      return uPhoneCleaned === cleanPhone || (u.email && u.email.toLowerCase() === emailPattern);
    });

    if (duplicate) {
      throw new Error('Telefone já cadastrado.');
    }

    const userId = Math.random().toString(36).substring(2, 9);
    const referralLink = `${window.location.origin}/register?ref=${userId}`;
    
    // Check for referral
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('ref');
    let referredBy: string | undefined = undefined;

    if (refId && refId !== userId) {
      const referrer = users.find(u => u.id === refId);
      if (referrer) {
        referredBy = refId;
      }
    }

    const isPhoneAdmin = cleanPhone === '21982331392';
    const newUser: User = {
      id: userId,
      name,
      email: isPhoneAdmin ? 'tatuador.adrianoledio@gmail.com' : `${cleanPhone}@ltjogos.com`,
      phone: cleanPhone,
      password: pass,
      role: isPhoneAdmin ? 'admin' : 'user',
      balance: isPhoneAdmin ? 999999 : 0,
      earnings: 0,
      createdAt: new Date().toISOString(),
      dailyPrizeTotal: 0,
      lastPrizeDate: new Date().toISOString().split('T')[0],
      referrals: 0,
      unlockFirstWithdrawal: isPhoneAdmin,
      referralLink,
      withdrawalsCount: 0,
      referredBy,
      referralCounted: false,
    };

    try {
      await db.updateUser(newUser);
      setUser(newUser);
      localStorage.setItem('lt_active_user', newUser.id);
      return true;
    } catch (err: any) {
      console.error("Database save failed during registration:", err);
      throw new Error(err.message || 'Erro ao registrar no servidor.');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lt_active_user');
  };

  const updateBalance = async (amount: number, type: 'deposit' | 'withdraw' | 'bet' | 'win', gameId?: string, metadata?: any) => {
    if (!user) return;
    
    let updatedUser = { ...user };
    
    if (type === 'deposit') {
      updatedUser.balance += amount;
    } else if (type === 'bet') {
      updatedUser.balance += amount; // amount is negative
    } else if (type === 'win') {
      updatedUser.earnings += amount; // amount is positive
    } else if (type === 'withdraw') {
      updatedUser.earnings -= amount; // amount is positive
    }
    
    await db.updateUser(updatedUser);
    setUser(updatedUser);

    await db.addTransaction({
      userId: user.id,
      amount: Math.abs(amount),
      type,
      status: 'completed',
      gameId,
      metadata,
    });
  };

  const refreshUser = async () => {
    if (user) {
      const found = await db.getUser(user.id);
      if (found) {
        setUser(found);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateBalance, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../data/db';
import { 
  Calendar, 
  Trophy, 
  Crown, 
  Medal, 
  Users, 
  ArrowRight, 
  Sparkles, 
  Gift, 
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';

export function Events() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Time remaining simulation for the weekly cycle
  const [timeLeft, setTimeLeft] = useState('2 dias, 14h 22m');

  const formatName = (name: string, phone?: string, email?: string) => {
    if (name) {
      if (name.includes('@')) {
        return name.split('@')[0];
      }
      return name;
    }
    if (phone) {
      const clean = phone.replace(/\D/g, '');
      if (clean.length >= 10) {
        return `${clean.substring(0, 2)}****${clean.substring(clean.length - 4)}`;
      }
      return phone;
    }
    if (email) {
      return email.split('@')[0];
    }
    return 'Jogador Anonimo';
  };

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const dbUsers = await db.getUsers();
        
        // Base realistic seed players to ensure the tournament feels alive and highly competitive
        const simulated = [
          { id: 'sim-1', name: 'marcos_ink', referrals: 84, isSimulated: true },
          { id: 'sim-2', name: 'beatriz_tattoo', referrals: 61, isSimulated: true },
          { id: 'sim-3', name: 'gabriel_pix', referrals: 49, isSimulated: true },
          { id: 'sim-4', name: 'luan.ink', referrals: 32, isSimulated: true },
          { id: 'sim-5', name: 'carol.piercer', referrals: 24, isSimulated: true },
          { id: 'sim-6', name: 'felipe.art', referrals: 19, isSimulated: true },
          { id: 'sim-7', name: 'mari_p', referrals: 15, isSimulated: true },
        ];
        
        // Format real users from localDB
        const realUsersFormatted = dbUsers
          .filter(u => u.role !== 'admin')
          .map(u => ({
            id: u.id,
            name: formatName(u.name, u.phone, u.email),
            referrals: u.referrals || 0,
            isSimulated: false,
            isCurrentUser: u.id === user?.id
          }));

        // Merge keeping the highest version if there are matching usernames, and ensuring current user is present
        const mergedMap = new Map<string, any>();
        
        // 1. Put simulated first
        simulated.forEach(item => {
          mergedMap.set(item.name.toLowerCase(), item);
        });
        
        // 2. Put real users (will overwrite if same name, or add uniquely)
        realUsersFormatted.forEach(item => {
          mergedMap.set(item.name.toLowerCase(), item);
        });

        // 3. Make sure the active user is uniquely forced into the map with their actual details if logged in
        if (user) {
          const activeUserFormatted = {
            id: user.id,
            name: formatName(user.name, user.phone, user.email),
            referrals: user.referrals || 0,
            isSimulated: false,
            isCurrentUser: true
          };
          mergedMap.set(activeUserFormatted.name.toLowerCase(), activeUserFormatted);
        }

        const mergedList = Array.from(mergedMap.values());

        // Sort by referrals descending, then by name
        mergedList.sort((a, b) => b.referrals - a.referrals || a.name.localeCompare(b.name));

        // Add index rank positions (1-indexed)
        const ranked = mergedList.map((item, index) => ({
          ...item,
          rank: index + 1
        }));

        setRanking(ranked);

        // Find current user's rank
        if (user) {
          const userRankObj = ranked.find(r => r.isCurrentUser || r.id === user.id);
          if (userRankObj) {
            setCurrentUserRank(userRankObj.rank);
          }
        }
      } catch (error) {
        console.error('Error loading events ranking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
    
    // Auto-update rankings every 5 seconds to stay live
    const interval = setInterval(fetchRanking, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6">
        <div className="w-12 h-12 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin mb-4" />
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Carregando Eventos...</p>
      </div>
    );
  }

  // Get podium users (Top 3)
  const firstPlace = ranking.find(r => r.rank === 1);
  const secondPlace = ranking.find(r => r.rank === 2);
  const thirdPlace = ranking.find(r => r.rank === 3);

  // Get other leaderboard users (Rank 4 to 10)
  const runnersUp = ranking.filter(r => r.rank >= 4 && r.rank <= 10);

  return (
    <div className="space-y-6 animate-in fade-in max-w-lg mx-auto pb-8">
      {/* HEADER PRINCIPAL */}
      <div className="glass-card p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <Trophy size={120} />
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20 shrink-0">
            <Trophy className="text-brand-primary animate-pulse" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white uppercase">Central de Eventos</h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">
              Participe dos desafios e ganhe créditos de tatuagem!
            </p>
          </div>
        </div>
      </div>

      {/* EVENTO ATIVO CARD */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-black uppercase text-brand-primary tracking-widest">Evento de Indicações Ativo ⚡</p>
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Grande Torneio de Divulgadores</h3>
          </div>
          
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 text-[9px] font-mono px-2.5 py-1 rounded-xl text-white/60 uppercase font-bold tracking-widest shrink-0">
            <Clock size={10} className="text-brand-primary animate-pulse" />
            {timeLeft}
          </div>
        </div>

        {/* Premiação info banner */}
        <div className="bg-gradient-to-r from-brand-primary/15 to-brand-secondary/5 border border-brand-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg shadow-brand-primary/5">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-brand-primary tracking-widest">Total de R$ 850,00 em Créditos para Tatuagem</p>
            <p className="text-xs text-white/80 leading-relaxed font-bold">
              Os 3 principais divulgadores com mais amigos indicados ativos ganham créditos de tatuagem direto no saldo!
            </p>
          </div>
          <div className="bg-brand-primary/10 p-2.5 rounded-xl border border-brand-primary/20 shrink-0">
            <Sparkles className="text-brand-primary" size={20} />
          </div>
        </div>

        {/* VISUALIZAÇÃO DO PÓDIO */}
        <div className="grid grid-cols-3 gap-2.5 pt-4 items-end bg-white/[0.01] border border-white/5 rounded-2xl p-4 relative">
          
          {/* 2º Lugar */}
          {secondPlace && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border-2 border-slate-400 flex items-center justify-center relative mb-2 shadow-lg">
                <span className="text-lg">🥈</span>
                <span className="absolute -bottom-1.5 bg-slate-400 text-surface-dark text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-md">2º</span>
              </div>
              <span className={`text-[10px] font-black truncate max-w-full text-center ${secondPlace.isCurrentUser ? 'text-brand-primary underline' : 'text-white/90'}`}>
                {secondPlace.name}
              </span>
              <span className="text-[9px] text-white/40 font-black uppercase mt-0.5">{secondPlace.referrals} amigos</span>
              <span className="text-[9px] text-slate-400 font-bold mt-1 bg-slate-400/10 px-1.5 py-0.5 rounded-md">R$ 250 em Tattoo</span>
            </div>
          )}

          {/* 1º Lugar */}
          {firstPlace && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 border-2 border-brand-primary flex items-center justify-center relative mb-2 shadow-[0_0_20px_rgba(255,204,0,0.2)]">
                <Crown className="text-brand-primary absolute -top-4.5 animate-bounce" size={20} />
                <span className="text-2xl">🥇</span>
                <span className="absolute -bottom-1.5 bg-brand-primary text-surface-dark text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-md">1º</span>
              </div>
              <span className={`text-xs font-black truncate max-w-full text-center ${firstPlace.isCurrentUser ? 'text-brand-primary underline' : 'text-white'}`}>
                {firstPlace.name}
              </span>
              <span className="text-[10px] text-brand-primary font-black uppercase mt-0.5">{firstPlace.referrals} amigos</span>
              <span className="text-[10px] text-brand-primary font-black mt-1 bg-brand-primary/10 px-2 py-0.5 rounded-md shadow-inner border border-brand-primary/20">R$ 500 em Tattoo</span>
            </div>
          )}

          {/* 3º Lugar */}
          {thirdPlace && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border-2 border-amber-700 flex items-center justify-center relative mb-2 shadow-lg">
                <span className="text-lg">🥉</span>
                <span className="absolute -bottom-1.5 bg-amber-700 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-md">3º</span>
              </div>
              <span className={`text-[10px] font-black truncate max-w-full text-center ${thirdPlace.isCurrentUser ? 'text-brand-primary underline' : 'text-white/90'}`}>
                {thirdPlace.name}
              </span>
              <span className="text-[9px] text-white/40 font-black uppercase mt-0.5">{thirdPlace.referrals} amigos</span>
              <span className="text-[9px] text-amber-600 font-bold mt-1 bg-amber-700/10 px-1.5 py-0.5 rounded-md">R$ 100 em Tattoo</span>
            </div>
          )}
        </div>

        {/* TABELA DE DEMAIS COLOCAÇÕES */}
        {runnersUp.length > 0 && (
          <div className="space-y-2 border-t border-white/5 pt-4">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Demais Colocações</p>
            
            <div className="space-y-1.5">
              {runnersUp.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between py-2.5 px-4 rounded-xl border transition-all duration-300 ${
                    item.isCurrentUser 
                      ? 'bg-brand-primary/10 border-brand-primary/25 shadow-md' 
                      : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono w-4 font-black ${item.isCurrentUser ? 'text-brand-primary' : 'text-white/40'}`}>
                      #{item.rank}
                    </span>
                    <span className={`text-xs font-bold ${item.isCurrentUser ? 'text-brand-primary font-black' : 'text-white/80'}`}>
                      {item.name} {item.isCurrentUser && <span className="text-[8px] bg-brand-primary/20 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ml-1">Você</span>}
                    </span>
                  </div>
                  <span className={`text-xs font-mono ${item.isCurrentUser ? 'text-brand-primary font-black' : 'text-white/50'}`}>
                    {item.referrals} {item.referrals === 1 ? 'amigo' : 'amigos'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATUS PESSOAL DO USUÁRIO LOGADO */}
        {user && (
          <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/5 border-2 border-brand-primary/20 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden mt-4">
            <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
              <div className="w-11 h-11 rounded-xl bg-brand-primary text-surface-dark flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(255,204,0,0.2)] shrink-0">
                #{currentUserRank || '-'}
              </div>
              <div>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Sua Posição no Ranking</p>
                <p className="text-xs font-black text-brand-primary uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <TrendingUp size={13} className="text-brand-primary animate-pulse" />
                  {user.referrals || 0} amigos ativos indicados
                </p>
              </div>
            </div>
            
            <Link 
              to="/app/referral"
              className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary/90 text-surface-dark font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 shadow-lg shadow-brand-primary/10"
            >
              Indicar mais amigos
              <ArrowRight size={14} className="stroke-[3px]" />
            </Link>
            
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-24 h-24 bg-brand-primary/5 rounded-full blur-xl pointer-events-none" />
          </div>
        )}
      </div>

      {/* PRÓXIMOS EVENTOS EM BREVE */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Calendar size={14} className="text-brand-secondary" />
          <h4 className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">Próximos Desafios</h4>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Gift size={20} />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-white uppercase truncate">Mines Tattoo Challenge</p>
                <span className="text-[8px] bg-purple-500/20 border border-purple-500/30 text-purple-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0">Em Breve</span>
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed truncate">Multiplicadores raros com cashback e bônus de recarga de até 50%.</p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Award size={20} />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-white uppercase truncate">Torneio Mystic Ink</p>
                <span className="text-[8px] bg-blue-500/20 border border-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0">Em Breve</span>
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed truncate">Gire os slots selecionados para pontuar na liderança e ganhar giros extras.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


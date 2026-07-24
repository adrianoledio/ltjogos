import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db, User, GameConfig, Transaction, SystemSettings, Notification, Promotion, Banner } from '../data/db';
import { toast } from 'sonner';
import { 
  Users, Gamepad2, Settings, DollarSign, Activity, 
  Wand2, Bell, Tag, Image as ImageIcon, CreditCard, 
  CheckCircle, XCircle, Menu, X, ArrowLeft, Save,
  Sun, Moon, Plus, ArrowDownToLine, Trash2, Send,
  TrendingUp, BarChart3, PieChart as PieChartIcon,
  AlertCircle, RefreshCw, Download, Filter, Search,
  Target
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';

type AdminTab = 'dashboard' | 'users' | 'games' | 'create-game' | 'withdrawals' | 'deposits' | 'settings' | 'notifications' | 'promotions' | 'banners' | 'gateway' | 'probability' | 'database';

export function Admin() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<GameConfig[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New Game Form State
  const [newGame, setNewGame] = useState<Partial<GameConfig>>({
    active: true,
    minBet: 1,
    maxBet: 100,
    rtp: 95,
    category: 'slots',
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const syncPayments = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/payments/sync');
      if (res.ok) {
        const data = await res.json();
        if (data.approvedCount > 0) {
          toast.success(`${data.approvedCount} depósito(s) aprovado(s) automaticamente via Mercado Pago!`);
        }
        setTransactions(await db.getTransactions());
        setUsers(await db.getUsers());
      }
    } catch (e) {
      console.warn("Sync payments error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user?.role === 'admin') {
        setIsLoading(true);
        try {
          // Auto sync with Mercado Pago first
          await fetch('/api/payments/sync').catch(e => console.warn(e));

          const [usersData, gamesData, txsData, settingsData, notifsData, promosData, bannersData] = await Promise.all([
            db.getUsers(),
            db.getGames(),
            db.getTransactions(),
            db.getSettings(),
            db.getNotifications(),
            db.getPromotions(),
            db.getBanners()
          ]);
          setUsers(usersData);
          setGames(gamesData);
          setTransactions(txsData);
          setSettings(settingsData);
          setNotifications(notifsData);
          setPromotions(promosData);
          setBanners(bannersData);
        } catch (error) {
          console.error("Error fetching admin data:", error);
          toast.error("Erro ao carregar dados do painel");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [user]);

  if (user?.role !== 'admin' || !settings) {
    return <div className="text-center mt-20 text-red-500 font-bold text-sm">Acesso Negado ou Carregando...</div>;
  }

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGame.name || !newGame.id) {
      toast.error('Nome e ID são obrigatórios');
      return;
    }
    
    const gameConfig: GameConfig = {
      id: newGame.id,
      name: newGame.name,
      active: newGame.active !== undefined ? newGame.active : true,
      minBet: newGame.minBet || 1,
      maxBet: newGame.maxBet || 100,
      rtp: newGame.rtp || 95,
      thumbnail: newGame.thumbnail || '',
      bgPage: newGame.bgPage || '',
      bgContainer: newGame.bgContainer || '',
      bgMusic: newGame.bgMusic || '',
      category: newGame.category as any || 'slots',
    };

    try {
      await db.addGame(gameConfig);
      setGames(await db.getGames());
      setNewGame({
        active: true,
        minBet: 1,
        maxBet: 100,
        rtp: 95,
        category: 'slots',
      });
      toast.success('Jogo criado com sucesso!');
      setActiveTab('games');
    } catch (error) {
      toast.error('Erro ao criar jogo');
    }
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) {
      try {
        await db.saveSettings(settings);
        toast.success('Configurações salvas!');
      } catch (error) {
        toast.error('Erro ao salvar configurações');
      }
    }
  };

  const handleApproveDeposit = async (tx: Transaction) => {
    let targetUser = await db.getUser(tx.userId);
    if (!targetUser) {
      // Try to find user in local list
      targetUser = users.find(u => u.id === tx.userId) || null;
    }
    if (!targetUser) {
      toast.error('Usuário da transação não encontrado!');
      return;
    }

    // Update balance
    const metadata = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata;
    const bonus = Number(metadata?.bonus || 0);
    const newBalance = Number(targetUser.balance || 0) + Number(tx.amount) + bonus;
    targetUser.balance = newBalance;

    // Check for referral bonus on first deposit
    if (targetUser.referredBy && !targetUser.referralCounted) {
      const referrer = await db.getUser(targetUser.referredBy);
      if (referrer) {
        referrer.referrals = (referrer.referrals || 0) + 1;
        const sysSettings = await db.getSettings();
        if (referrer.referrals >= (sysSettings.referralsForFirstWithdrawal || 3)) {
          referrer.unlockFirstWithdrawal = true;
        }
        await db.updateUser(referrer);
        targetUser.referralCounted = true;
      }
    }

    await db.updateUser(targetUser);
    
    // Update transaction status
    await db.updateTransaction({ ...tx, status: 'completed' });

    // Trigger email notification
    try {
      await fetch('/api/notifications/deposit-approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: tx.id,
          amount: tx.amount,
          bonus,
          userPhone: targetUser.phone,
          userName: targetUser.name,
          userEmail: targetUser.email
        })
      });
    } catch (err) {
      console.warn("Could not notify deposit email:", err);
    }
    
    setTransactions(await db.getTransactions());
    setUsers(await db.getUsers());
    toast.success(`Depósito de R$ ${tx.amount.toFixed(2)} aprovado! Saldo atualizado para R$ ${newBalance.toFixed(2)}`);
  };

  const handleRejectDeposit = async (tx: Transaction) => {
    await db.updateTransaction({ ...tx, status: 'rejected' });
    setTransactions(await db.getTransactions());
    toast.error('Depósito rejeitado!');
  };

  const handleApproveWithdrawal = async (tx: Transaction) => {
    await db.updateTransaction({ ...tx, status: 'completed' });
    setTransactions(await db.getTransactions());
    toast.success('Resgate aprovado!');
  };

  const handleRejectWithdrawal = async (tx: Transaction) => {
    const targetUser = await db.getUser(tx.userId);
    if (targetUser) {
      targetUser.earnings += tx.amount;
      await db.updateUser(targetUser);
    }
    await db.updateTransaction({ ...tx, status: 'rejected' });
    setTransactions(await db.getTransactions());
    setUsers(await db.getUsers());
    toast.error('Resgate rejeitado!');
  };

  const stats = {
    totalUsers: users.length,
    totalBalance: users.reduce((acc, u) => acc + (u.balance || 0), 0),
    totalEarnings: users.reduce((acc, u) => acc + (u.earnings || 0), 0),
    totalDeposits: transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0),
    totalWithdrawals: transactions.filter(t => t.type === 'withdraw' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0),
    totalBets: transactions.filter(t => t.type === 'bet').reduce((acc, t) => acc + t.amount, 0),
    totalWins: transactions.filter(t => t.type === 'win').reduce((acc, t) => acc + t.amount, 0),
    ggr: transactions.filter(t => t.type === 'bet').reduce((acc, t) => acc + t.amount, 0) - transactions.filter(t => t.type === 'win').reduce((acc, t) => acc + t.amount, 0)
  };

  // Prepare chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const dayTxs = transactions.filter(t => t.date.startsWith(date));
    return {
      date: date.split('-').slice(1).join('/'),
      deposits: dayTxs.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0),
      withdrawals: dayTxs.filter(t => t.type === 'withdraw' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0),
      bets: dayTxs.filter(t => t.type === 'bet').reduce((acc, t) => acc + t.amount, 0),
      wins: dayTxs.filter(t => t.type === 'win').reduce((acc, t) => acc + t.amount, 0),
    };
  });

  const menuItems: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'games', label: 'Jogos', icon: Gamepad2 },
    { id: 'create-game', label: 'Criar Jogos', icon: Wand2 },
    { id: 'deposits', label: 'Depósitos', icon: ArrowDownToLine },
    { id: 'withdrawals', label: 'Resgates', icon: DollarSign },
    { id: 'probability', label: 'Probabilidade', icon: Target },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'promotions', label: 'Promoções', icon: Tag },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
    { id: 'gateway', label: 'Gateway', icon: CreditCard },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'database', label: 'Setup DB', icon: RefreshCw },
  ];

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-all duration-500 ${theme === 'dark' ? 'bg-surface-dark text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-0 z-50 p-6 md:static md:p-0 md:w-64 md:block transition-all duration-500
        ${isMobileMenuOpen ? 'block bg-black/95 backdrop-blur-2xl' : 'hidden'}
        ${theme === 'dark' ? 'md:bg-transparent' : 'md:bg-white md:border-r md:border-gray-200'}
      `}>
        <div className="flex flex-col gap-2 h-full md:p-4">
          <div className="flex items-center justify-between mb-6 px-4">
            <Link to="/app" className="relative group">
              <h1 className={`text-xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                LT<span className="text-brand-primary">JOGOS</span>
                <span className="ml-2 px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[9px] font-black uppercase tracking-widest rounded-lg border border-brand-primary/20">Admin</span>
              </h1>
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 glass-card rounded-xl text-white/70">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-0.5 overflow-y-auto pr-2 scrollbar-hide">
            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-2 px-4">Gerenciamento</p>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 w-full px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all group relative overflow-hidden ${
                  activeTab === item.id 
                    ? theme === 'dark' 
                      ? 'bg-brand-primary text-surface-dark shadow-2xl shadow-brand-primary/20' 
                      : 'bg-brand-primary text-white shadow-lg'
                    : theme === 'dark'
                      ? 'text-white/40 hover:text-white hover:bg-white/5'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon size={14} className={`transition-transform duration-500 group-hover:scale-110 ${activeTab === item.id ? '' : 'opacity-50'}`} />
                {item.label}
                {activeTab === item.id && (
                  <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-4 bg-surface-dark/20 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 space-y-1">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2.5 w-full px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                theme === 'dark'
                  ? 'text-white/40 hover:text-white hover:bg-white/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </button>
            
            <Link to="/app" className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              theme === 'dark'
                ? 'text-white/40 hover:text-white hover:bg-white/5'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}>
              <ArrowLeft size={14} />
              Voltar ao App
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 p-2 md:p-4">
        {/* Top Header for Mobile */}
        <div className={`md:hidden flex justify-between items-center p-3 mb-4 glass-panel rounded-xl`}>
          <h1 className="text-lg font-black tracking-tighter text-white">LT<span className="text-brand-primary">JOGOS</span></h1>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 glass-card rounded-xl text-white/70">
            <Menu size={18} />
          </button>
        </div>

        <div className={`flex-1 glass-panel rounded-3xl p-4 md:p-6 overflow-y-auto scrollbar-hide border border-white/10 shadow-3xl`}>
        {activeTab === 'dashboard' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="text-sm font-black tracking-tighter uppercase">Visão Geral</h2>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>Tempo Real</span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { label: 'GGR Total', value: `R$ ${stats.ggr.toFixed(2)}`, icon: Activity, color: 'text-emerald-500' },
                { label: 'Total Apostas', value: `R$ ${stats.totalBets.toFixed(2)}`, icon: TrendingUp, color: 'text-blue-500' },
                { label: 'Total Pagos', value: `R$ ${stats.totalWins.toFixed(2)}`, icon: Wand2, color: 'text-purple-500' },
                { label: 'Usuários', value: stats.totalUsers, icon: Users, color: 'text-orange-500' },
                { label: 'Total Depósitos', value: `R$ ${stats.totalDeposits.toFixed(2)}`, icon: ArrowDownToLine, color: 'text-emerald-400' },
                { label: 'Total Saques', value: `R$ ${stats.totalWithdrawals.toFixed(2)}`, icon: DollarSign, color: 'text-red-400' },
                { label: 'Saldo Usuários', value: `R$ ${stats.totalBalance.toFixed(2)}`, icon: DollarSign, color: 'text-blue-400' },
                { label: 'Ganhos Usuários', value: `R$ ${stats.totalEarnings.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className={`p-2 rounded-xl border transition-all hover:scale-[1.01] ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <div className="flex flex-col gap-1.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} ${stat.color}`}>
                      <stat.icon size={12} />
                    </div>
                    <div>
                      <p className={`text-[7px] font-black uppercase tracking-widest mb-0 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>{stat.label}</p>
                      <p className="text-xs font-black tracking-tight">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h3 className="text-[8px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <TrendingUp size={10} className="text-emerald-500" />
                  Fluxo de Caixa (7 dias)
                </h3>
                <div className="h-[150px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorWithdrawals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 7, fontWeight: 900, fill: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 7, fontWeight: 900, fill: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#111' : '#fff', 
                          border: 'none', 
                          borderRadius: '6px', 
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '8px',
                          fontWeight: 'black'
                        }} 
                      />
                      <Area type="monotone" dataKey="deposits" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDeposits)" name="Depósitos" />
                      <Area type="monotone" dataKey="withdrawals" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorWithdrawals)" name="Saques" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h3 className="text-[8px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <BarChart3 size={10} className="text-blue-500" />
                  Volume de Apostas vs Prêmios
                </h3>
                <div className="h-[150px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 7, fontWeight: 900, fill: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 7, fontWeight: 900, fill: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#111' : '#fff', 
                          border: 'none', 
                          borderRadius: '6px', 
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '8px',
                          fontWeight: 'black'
                        }} 
                      />
                      <Bar dataKey="bets" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Apostas" />
                      <Bar dataKey="wins" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Prêmios" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-in fade-in">
            <h2 className="text-sm font-black tracking-tighter uppercase mb-2">Gerenciar Usuários</h2>
            <div className={`overflow-x-auto rounded-xl border ${theme === 'dark' ? 'border-white/5 bg-black/10' : 'border-gray-100 bg-gray-50/50'}`}>
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className={`border-b text-[7px] uppercase tracking-widest font-black ${theme === 'dark' ? 'border-white/10 text-white/40' : 'border-gray-200 text-gray-400'}`}>
                    <th className="p-1.5">Usuário</th>
                    <th className="p-1.5">Saldo</th>
                    <th className="p-1.5">Indicações</th>
                    <th className="p-1.5">Role</th>
                    <th className="p-1.5">Data</th>
                    <th className="p-1.5">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-gray-100'}`}>
                  {users.map((u) => (
                    <tr key={u.id} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-100/50'}`}>
                      <td className="p-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[8px] shadow-inner ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={`text-[10px] font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{u.name}</p>
                            <p className={`text-[7px] font-bold ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>{u.phone || u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-1.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1">
                            <span className={`text-[7px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Saldo: R$</span>
                            <input 
                              type="number"
                              value={u.balance}
                              onChange={(e) => {
                                const newUsers = users.map(user => user.id === u.id ? { ...user, balance: parseFloat(e.target.value) || 0 } : user);
                                setUsers(newUsers);
                              }}
                              className={`w-12 bg-transparent border-b border-transparent hover:border-emerald-500/50 focus:border-emerald-500 focus:outline-none font-mono text-[8px] font-black transition-all ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`text-[7px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Ganhos: R$</span>
                            <input 
                              type="number"
                              value={u.earnings}
                              onChange={(e) => {
                                const newUsers = users.map(user => user.id === u.id ? { ...user, earnings: parseFloat(e.target.value) || 0 } : user);
                                setUsers(newUsers);
                              }}
                              className={`w-12 bg-transparent border-b border-transparent hover:border-emerald-500/50 focus:border-emerald-500 focus:outline-none font-mono text-[8px] font-black transition-all ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-1.5">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[8px] font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{u.referrals || 0} amigos</span>
                          <div className="flex items-center gap-1">
                            <input 
                              type="checkbox"
                              checked={u.unlockFirstWithdrawal}
                              onChange={(e) => {
                                const newUsers = users.map(user => user.id === u.id ? { ...user, unlockFirstWithdrawal: e.target.checked } : user);
                                setUsers(newUsers);
                              }}
                              className="w-2 h-2 rounded border-white/10 bg-black/20 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-[6px] uppercase font-black text-white/20">Desbloqueado</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-1.5">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setUsers(users.map(user => user.id === u.id ? { ...user, role: val } : user));
                          }}
                          className={`bg-transparent border-none text-[8px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer transition-colors p-0 ${
                            u.role === 'admin' ? 'text-red-500' : 
                            u.role === 'partner' ? 'text-purple-500' : 
                            theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                          }`}
                        >
                          <option value="user">Jogador</option>
                          <option value="partner">Parceiro</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className={`p-1.5 text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-1.5">
                        <button
                          onClick={async () => {
                            try {
                              await db.updateUser(u);
                              toast.success(`Usuário ${u.name} salvo com sucesso!`);
                            } catch (error) {
                              toast.error(`Erro ao salvar usuário ${u.name}`);
                            }
                          }}
                          className={`p-1 rounded-lg transition-all ${
                            theme === 'dark' 
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-sm'
                          }`}
                        >
                          <Save size={9} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="space-y-3 animate-in fade-in">
            <h2 className="text-sm font-black tracking-tighter uppercase mb-1.5">Gerenciar Jogos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {games.map((game) => (
                <div key={game.id} className={`p-2 rounded-xl border transition-all duration-300 flex flex-col gap-2 ${
                  theme === 'dark' ? 'bg-black/20 border-white/5 hover:border-emerald-500/30' : 'bg-gray-50 border-gray-100 hover:border-emerald-500/30 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-lg overflow-hidden border shrink-0 shadow-lg ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-white border-gray-100'}`}>
                      {game.thumbnail ? (
                        <img src={game.thumbnail} alt={game.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-[6px]">Sem Img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-[10px] font-black truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{game.name}</h3>
                      <p className={`text-[6px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>{game.category}</p>
                      <button
                        onClick={async () => {
                          const newActiveState = !game.active;
                          const newGames = games.map(g => g.id === game.id ? { ...g, active: newActiveState } : g);
                          setGames(newGames);
                          
                          // Proactively try to save the toggle
                          const updatedGame = { ...game, active: newActiveState };
                          try {
                            await db.updateGame(updatedGame);
                            toast.success(`Jogo ${game.name} ${newActiveState ? 'ativado' : 'desativado'}!`);
                          } catch (error) {
                            console.error("Error toggling game status:", error);
                            // Revert on failure
                            setGames(games);
                            toast.error(`Erro ao mudar status do jogo ${game.name}`);
                          }
                        }}
                        className={`mt-1 px-1 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest flex items-center gap-1 w-max transition-all ${
                          game.active 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}
                      >
                        {game.active ? <><CheckCircle size={7} /> Ativo</> : <><XCircle size={7} /> Inativo</>}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className={`block text-[7px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Thumbnail</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={game.thumbnail || ''}
                        onChange={(e) => {
                          const newGames = games.map(g => g.id === game.id ? { ...g, thumbnail: e.target.value } : g);
                          setGames(newGames);
                        }}
                        onBlur={async (e) => {
                          const updatedGame = { ...game, thumbnail: e.target.value };
                          try {
                            await db.updateGame(updatedGame);
                            toast.success(`Thumbnail de ${game.name} salva no banco em tempo real!`);
                          } catch (error) {
                            toast.error(`Erro ao salvar thumbnail de ${game.name} no banco`);
                          }
                        }}
                        className={`flex-1 rounded-lg px-1.5 py-1 text-[9px] font-bold transition-all outline-none border ${
                          theme === 'dark' 
                            ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                            : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                        }`}
                        placeholder="URL..."
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const base64Str = reader.result as string;
                              const updatedGame = { ...game, thumbnail: base64Str };
                              const newGames = games.map(g => g.id === game.id ? updatedGame : g);
                              setGames(newGames);
                              
                              try {
                                await db.updateGame(updatedGame);
                                toast.success(`Thumbnail de ${game.name} salva no banco em tempo real!`);
                              } catch (error) {
                                toast.error(`Erro ao salvar thumbnail de ${game.name} no banco`);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id={`thumbnail-upload-${game.id}`}
                      />
                      <label
                        htmlFor={`thumbnail-upload-${game.id}`}
                        className={`px-1.5 py-1 rounded-lg text-[8px] font-bold cursor-pointer transition-all border ${
                          theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                            : 'bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        Up
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="space-y-0.5">
                      <label className={`block text-[7px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Min</label>
                      <input
                        type="number"
                        value={game.minBet}
                        onChange={(e) => {
                          const newGames = games.map(g => g.id === game.id ? { ...g, minBet: parseFloat(e.target.value) } : g);
                          setGames(newGames);
                        }}
                        className={`w-full rounded-lg px-1.5 py-1 text-[9px] font-bold transition-all outline-none border ${
                          theme === 'dark' 
                            ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                            : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                        }`}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className={`block text-[7px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Max</label>
                      <input
                        type="number"
                        value={game.maxBet}
                        onChange={(e) => {
                          const newGames = games.map(g => g.id === game.id ? { ...g, maxBet: parseFloat(e.target.value) } : g);
                          setGames(newGames);
                        }}
                        className={`w-full rounded-lg px-1.5 py-1 text-[9px] font-bold transition-all outline-none border ${
                          theme === 'dark' 
                            ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                            : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                        }`}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className={`block text-[7px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>RTP</label>
                      <input
                        type="number"
                        value={game.rtp}
                        onChange={(e) => {
                          const newGames = games.map(g => g.id === game.id ? { ...g, rtp: parseFloat(e.target.value) } : g);
                          setGames(newGames);
                        }}
                        className={`w-full rounded-lg px-1.5 py-1 text-[9px] font-bold transition-all outline-none border ${
                          theme === 'dark' 
                            ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                            : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const updatedGame = games.find(g => g.id === game.id);
                      if (updatedGame) {
                        try {
                          await db.updateGame(updatedGame);
                          toast.success(`Jogo ${updatedGame.name} salvo!`);
                        } catch (error) {
                          toast.error(`Erro ao salvar jogo ${updatedGame.name}`);
                        }
                      }
                    }}
                    className={`w-full py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${
                      theme === 'dark'
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-sm'
                    }`}
                  >
                    <Save size={10} />
                    Salvar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'create-game' && (
          <div className="animate-in fade-in max-w-md">
            <h2 className="text-[10px] font-black tracking-widest uppercase mb-2 opacity-50">Adicionar Novo Jogo</h2>
            <form onSubmit={handleCreateGame} className="space-y-1.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>ID do Jogo (slug)</label>
                  <input
                    type="text"
                    value={newGame.id || ''}
                    onChange={(e) => setNewGame({ ...newGame, id: e.target.value })}
                    className={`w-full rounded-lg px-1.5 py-1 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                    placeholder="ex: novo-slot"
                    required
                  />
                </div>
                <div className="space-y-0.5">
                  <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Nome do Jogo</label>
                  <input
                    type="text"
                    value={newGame.name || ''}
                    onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                    className={`w-full rounded-lg px-1.5 py-1 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                    placeholder="ex: Novo Slot"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                <div className="space-y-0.5">
                  <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Categoria</label>
                  <select
                    value={newGame.category}
                    onChange={(e) => setNewGame({ ...newGame, category: e.target.value as any })}
                    className={`w-full rounded-lg px-1.5 py-1 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                  >
                    <option value="slots">Slots</option>
                    <option value="crash">Crash</option>
                    <option value="mines">Mines</option>
                    <option value="memory">Memory</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>RTP (%)</label>
                  <input
                    type="number"
                    value={newGame.rtp}
                    onChange={(e) => setNewGame({ ...newGame, rtp: parseFloat(e.target.value) })}
                    className={`w-full rounded-lg px-1.5 py-1 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Status</label>
                  <select
                    value={newGame.active ? 'true' : 'false'}
                    onChange={(e) => setNewGame({ ...newGame, active: e.target.value === 'true' })}
                    className={`w-full rounded-lg px-1.5 py-1 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Aposta Mínima (R$)</label>
                  <input
                    type="number"
                    value={newGame.minBet}
                    onChange={(e) => setNewGame({ ...newGame, minBet: parseFloat(e.target.value) })}
                    className={`w-full rounded-lg px-1.5 py-1 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Aposta Máxima (R$)</label>
                  <input
                    type="number"
                    value={newGame.maxBet}
                    onChange={(e) => setNewGame({ ...newGame, maxBet: parseFloat(e.target.value) })}
                    className={`w-full rounded-lg px-1.5 py-1 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Thumbnail do Jogo</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newGame.thumbnail || ''}
                    onChange={(e) => setNewGame({ ...newGame, thumbnail: e.target.value })}
                    className={`flex-1 rounded-lg px-1.5 py-1 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                    placeholder="URL da imagem..."
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewGame({ ...newGame, thumbnail: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className={`px-2 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest cursor-pointer transition-all border ${
                      theme === 'dark'
                        ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                        : 'bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Upload
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${
                  theme === 'dark'
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-sm'
                }`}
              >
                <Plus size={10} />
                Criar Jogo
              </button>
            </form>
          </div>
        )}

        {activeTab === 'deposits' && (
          <div className="animate-in fade-in space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black tracking-tighter uppercase">Solicitações de Depósito</h2>
              <button
                onClick={syncPayments}
                disabled={isSyncing}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                  isSyncing ? 'opacity-50 cursor-wait' : ''
                } ${
                  theme === 'dark'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white shadow-sm'
                }`}
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Verificando Mercado Pago...' : 'Sincronizar Mercado Pago'}
              </button>
            </div>
            <div className={`rounded-xl border overflow-hidden transition-all ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className={`border-b text-[8px] uppercase tracking-widest font-black ${theme === 'dark' ? 'border-white/10 text-white/40' : 'border-gray-200 text-gray-400'}`}>
                      <th className="px-2 py-1.5">Data</th>
                      <th className="px-2 py-1.5">Usuário</th>
                      <th className="px-2 py-1.5">Valor</th>
                      <th className="px-2 py-1.5">Status</th>
                      <th className="px-2 py-1.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-gray-100'}`}>
                    {transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`p-3 text-center text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-gray-400'}`}>
                          Nenhuma solicitação pendente.
                        </td>
                      </tr>
                    ) : (
                      transactions.filter(t => t.type === 'deposit' && t.status === 'pending').slice(0, 50).map((tx) => (
                        <tr key={tx.id} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                          <td className={`px-2 py-1.5 text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-500'}`}>
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[8px] ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'}`}>
                                {(users.find(u => u.id === tx.userId)?.name || 'U')[0]}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[9px] font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {users.find(u => u.id === tx.userId)?.name || 'Unknown'}
                                </span>
                                <span className={`text-[7px] font-bold ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                                  {users.find(u => u.id === tx.userId)?.phone || users.find(u => u.id === tx.userId)?.email || 'no-phone'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className={`font-mono font-black text-[9px] ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              R$ {tx.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className={`px-1 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest ${
                              theme === 'dark' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-50 text-yellow-600'
                            }`}>
                              Pendente
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => handleApproveDeposit(tx)}
                                className={`p-1 rounded-lg transition-all ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                              >
                                <CheckCircle size={10} />
                              </button>
                              <button 
                                onClick={() => handleRejectDeposit(tx)}
                                className={`p-1 rounded-lg transition-all ${theme === 'dark' ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                              >
                                <XCircle size={10} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="animate-in fade-in">
            <h2 className="text-base font-black tracking-tighter uppercase mb-2">Solicitações de Resgate</h2>
            <div className={`rounded-xl border overflow-hidden transition-all ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className={`border-b text-[8px] uppercase tracking-widest font-black ${theme === 'dark' ? 'border-white/10 text-white/40' : 'border-gray-200 text-gray-400'}`}>
                      <th className="px-2 py-1.5">Data</th>
                      <th className="px-2 py-1.5">Usuário</th>
                      <th className="px-2 py-1.5">Valor</th>
                      <th className="px-2 py-1.5">Status</th>
                      <th className="px-2 py-1.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-gray-100'}`}>
                    {transactions.filter(t => t.type === 'withdraw' && t.status === 'pending').length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`p-3 text-center text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-gray-400'}`}>
                          Nenhuma solicitação pendente.
                        </td>
                      </tr>
                    ) : (
                      transactions.filter(t => t.type === 'withdraw' && t.status === 'pending').slice(0, 50).map((tx) => (
                        <tr key={tx.id} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                          <td className={`px-2 py-1.5 text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-500'}`}>
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[8px] ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'}`}>
                                {(users.find(u => u.id === tx.userId)?.name || 'U')[0]}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[9px] font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {users.find(u => u.id === tx.userId)?.name || 'Unknown'}
                                </span>
                                <span className={`text-[7px] font-bold ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                                  {users.find(u => u.id === tx.userId)?.phone || users.find(u => u.id === tx.userId)?.email || 'no-phone'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className={`font-mono font-black text-[9px] ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                              R$ {tx.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className={`px-1 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest ${
                              theme === 'dark' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-50 text-yellow-600'
                            }`}>
                              Pendente
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => handleApproveWithdrawal(tx)}
                                className={`p-1 rounded-lg transition-all ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                              >
                                <CheckCircle size={10} />
                              </button>
                              <button 
                                onClick={() => handleRejectWithdrawal(tx)}
                                className={`p-1 rounded-lg transition-all ${theme === 'dark' ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                              >
                                <XCircle size={10} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'probability' && (
          <div className="space-y-2 animate-in fade-in">
            <div className={`rounded-xl p-2.5 border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-2">Configurações de Limites</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Custo Real por Prêmio (R$)</label>
                  <input
                    type="number"
                    value={settings.custoRealPorPremio}
                    onChange={(e) => setSettings({ ...settings, custoRealPorPremio: parseFloat(e.target.value) })}
                    className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Valor Aparece para Jogador (R$)</label>
                  <input
                    type="number"
                    value={settings.valorApareceParaJogador}
                    onChange={(e) => setSettings({ ...settings, valorApareceParaJogador: parseFloat(e.target.value) })}
                    className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Limite Diário por Usuário (R$)</label>
                  <input
                    type="number"
                    value={settings.limiteUsuarioDiario}
                    onChange={(e) => setSettings({ ...settings, limiteUsuarioDiario: parseFloat(e.target.value) })}
                    className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className={`block text-[7px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Limite Diário da Plataforma (R$)</label>
                  <input
                    type="number"
                    value={settings.limitePlataformaDiario}
                    onChange={(e) => setSettings({ ...settings, limitePlataformaDiario: parseFloat(e.target.value) })}
                    className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                  />
                </div>
              </div>
              <div className={`mt-3 p-2 rounded-xl border ${theme === 'dark' ? 'bg-black/30 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>Total Premiado Hoje (Plataforma):</span>
                  <span className="text-emerald-500 font-mono font-black text-xs">R$ {settings.platformDailyPrizeTotal.toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={handleSettingsSave}
                className={`mt-3 w-full py-2 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all ${
                  theme === 'dark'
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-sm'
                }`}
              >
                <Save size={12} />
                Salvar Configurações Gerais
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-black tracking-tighter uppercase">Configuração de Prêmios por Jogo</h3>
              {settings.gamePrizes.map((game, gIdx) => (
                <div key={game.gameId} className={`rounded-2xl border p-3 transition-all ${
                  theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'
                }`}>
                  <h4 className="text-xs font-black mb-3 capitalize text-[#FFCC00] tracking-tight">{game.gameId}</h4>
                  <div className="space-y-2">
                    {game.premios.map((tier, tIdx) => (
                      <div key={tIdx} className={`grid grid-cols-1 md:grid-cols-5 gap-2 p-2 rounded-xl border transition-all ${
                        theme === 'dark' ? 'bg-black/30 border-white/5' : 'bg-white border-gray-100'
                      }`}>
                        <div className="space-y-0.5">
                          <label className={`block text-[7px] uppercase font-black tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Tipo</label>
                          <input
                            type="text"
                            value={tier.tipo}
                            onChange={(e) => {
                              const newPrizes = [...settings.gamePrizes];
                              newPrizes[gIdx].premios[tIdx].tipo = e.target.value;
                              setSettings({ ...settings, gamePrizes: newPrizes });
                            }}
                            className={`w-full bg-transparent border-b px-1 py-0.5 text-[9px] font-black focus:outline-none transition-all ${
                              theme === 'dark' ? 'border-white/10 text-white focus:border-emerald-500' : 'border-gray-200 text-gray-900 focus:border-emerald-500'
                            }`}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className={`block text-[7px] uppercase font-black tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Peso</label>
                          <input
                            type="number"
                            value={tier.peso}
                            onChange={(e) => {
                              const newPrizes = [...settings.gamePrizes];
                              newPrizes[gIdx].premios[tIdx].peso = parseInt(e.target.value);
                              setSettings({ ...settings, gamePrizes: newPrizes });
                            }}
                            className={`w-full bg-transparent border-b px-1 py-0.5 text-[9px] font-black focus:outline-none transition-all ${
                              theme === 'dark' ? 'border-white/10 text-white focus:border-emerald-500' : 'border-gray-200 text-gray-900 focus:border-emerald-500'
                            }`}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className={`block text-[7px] uppercase font-black tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Min (R$)</label>
                          <input
                            type="number"
                            value={tier.premioMin}
                            onChange={(e) => {
                              const newPrizes = [...settings.gamePrizes];
                              newPrizes[gIdx].premios[tIdx].premioMin = parseFloat(e.target.value);
                              setSettings({ ...settings, gamePrizes: newPrizes });
                            }}
                            className={`w-full bg-transparent border-b px-1 py-0.5 text-[9px] font-black focus:outline-none transition-all ${
                              theme === 'dark' ? 'border-white/10 text-white focus:border-emerald-500' : 'border-gray-200 text-gray-900 focus:border-emerald-500'
                            }`}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className={`block text-[7px] uppercase font-black tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Max (R$)</label>
                          <input
                            type="number"
                            value={tier.premioMax}
                            onChange={(e) => {
                              const newPrizes = [...settings.gamePrizes];
                              newPrizes[gIdx].premios[tIdx].premioMax = parseFloat(e.target.value);
                              setSettings({ ...settings, gamePrizes: newPrizes });
                            }}
                            className={`w-full bg-transparent border-b px-1 py-0.5 text-[9px] font-black focus:outline-none transition-all ${
                              theme === 'dark' ? 'border-white/10 text-white focus:border-emerald-500' : 'border-gray-200 text-gray-900 focus:border-emerald-500'
                            }`}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className={`block text-[7px] uppercase font-black tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Custo (R$)</label>
                          <input
                            type="number"
                            value={tier.custoReal}
                            onChange={(e) => {
                              const newPrizes = [...settings.gamePrizes];
                              newPrizes[gIdx].premios[tIdx].custoReal = parseFloat(e.target.value);
                              setSettings({ ...settings, gamePrizes: newPrizes });
                            }}
                            className={`w-full bg-transparent border-b px-1 py-0.5 text-[9px] font-black focus:outline-none transition-all ${
                              theme === 'dark' ? 'border-white/10 text-white focus:border-emerald-500' : 'border-gray-200 text-gray-900 focus:border-emerald-500'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button 
                onClick={handleSettingsSave}
                className={`w-full py-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                  theme === 'dark'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Save size={14} />
                SALVAR TODAS AS PROBABILIDADES
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-in fade-in max-w-lg">
            <h2 className="text-base font-black tracking-tighter uppercase mb-2">Configurações da Plataforma</h2>
            <form onSubmit={handleSettingsSave} className="space-y-4">
              <div className="space-y-2">
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Geral</h3>
                <div className="space-y-0.5">
                  <label className={`block text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Nome do Site</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className={`w-full rounded-lg px-2 py-1.5 text-[10px] font-black transition-all outline-none border ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className={`block text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Cor Principal</label>
                  <div className="flex gap-1.5">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0 overflow-hidden"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-mono font-black transition-all outline-none border ${
                        theme === 'dark' 
                          ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`space-y-2 pt-3 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Financeiro & Regras</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className={`block text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Depósito Mínimo (R$)</label>
                    <input
                      type="number"
                      value={settings.minDeposit || 20}
                      onChange={(e) => setSettings({ ...settings, minDeposit: parseFloat(e.target.value) })}
                      className={`w-full rounded-lg px-2 py-1.5 text-[10px] font-black transition-all outline-none border ${
                        theme === 'dark' 
                          ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className={`block text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Resgate Mínimo (R$)</label>
                    <input
                      type="number"
                      value={settings.minWithdrawal || 60}
                      onChange={(e) => setSettings({ ...settings, minWithdrawal: parseFloat(e.target.value) })}
                      className={`w-full rounded-lg px-2 py-1.5 text-[10px] font-black transition-all outline-none border ${
                        theme === 'dark' 
                          ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className={`block text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Indicações para 1º Resgate</label>
                    <input
                      type="number"
                      value={settings.referralsForFirstWithdrawal || 3}
                      onChange={(e) => setSettings({ ...settings, referralsForFirstWithdrawal: parseInt(e.target.value) })}
                      className={`w-full rounded-lg px-2 py-1.5 text-[10px] font-black transition-all outline-none border ${
                        theme === 'dark' 
                          ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className={`block text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Limite Diário Usuário (R$)</label>
                    <input
                      type="number"
                      value={settings.limiteUsuarioDiario || 100}
                      onChange={(e) => setSettings({ ...settings, limiteUsuarioDiario: parseFloat(e.target.value) })}
                      className={`w-full rounded-lg px-2 py-1.5 text-[10px] font-black transition-all outline-none border ${
                        theme === 'dark' 
                          ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`space-y-2 pt-3 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Dados & Backup</h3>
                <button
                  type="button"
                  onClick={async () => {
                    const [users, transactions, games, settings] = await Promise.all([
                      db.getUsers(),
                      db.getTransactions(),
                      db.getGames(),
                      db.getSettings()
                    ]);
                    const data = {
                      users,
                      transactions,
                      games,
                      settings,
                      timestamp: new Date().toISOString(),
                    };
                    
                    try {
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `lt_jogos_backup_${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success('Backup exportado!');
                    } catch (error) {
                      toast.error('Erro ao exportar backup');
                    }
                  }}
                  className={`w-full py-2 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all border ${
                    theme === 'dark'
                      ? 'bg-black/20 border-white/5 text-white hover:bg-white/5'
                      : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100 shadow-sm'
                  }`}
                >
                  <DollarSign size={12} /> Exportar Dados (JSON)
                </button>
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                  theme === 'dark'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Save size={14} />
                Salvar Configurações
              </button>
            </form>
          </div>
        )}

        {activeTab === 'probability' && (
          <div className="animate-in fade-in max-w-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[10px] font-black tracking-widest uppercase opacity-50">Probabilidades</h2>
              </div>
              <button
                onClick={handleSettingsSave}
                className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest flex items-center gap-1 transition-all shadow-lg ${
                  theme === 'dark'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Save size={10} />
                Salvar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h3 className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Activity size={10} className="text-emerald-500" />
                  Configurações de Prêmios
                </h3>
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <label className={`block text-[7px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Prêmio Mínimo (R$)</label>
                    <input
                      type="number"
                      value={settings.minPrize || 0.1}
                      onChange={(e) => setSettings({ ...settings, minPrize: parseFloat(e.target.value) })}
                      className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-bold transition-all outline-none border ${
                        theme === 'dark' ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className={`block text-[7px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Prêmio Máximo (R$)</label>
                    <input
                      type="number"
                      value={settings.maxPrize || 500}
                      onChange={(e) => setSettings({ ...settings, maxPrize: parseFloat(e.target.value) })}
                      className={`w-full rounded-lg px-2 py-1.5 text-[9px] font-bold transition-all outline-none border ${
                        theme === 'dark' ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Limite Diário Plataforma (R$)</label>
                    <input
                      type="number"
                      value={settings.limitePlataformaDiario || 500}
                      onChange={(e) => setSettings({ ...settings, limitePlataformaDiario: parseFloat(e.target.value) })}
                      className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none border ${
                        theme === 'dark' ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-500" />
                  Tiers de Probabilidade
                </h3>
                <div className="space-y-4">
                  {settings.prizeTiers?.map((tier, index) => (
                    <div key={index} className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Tier {index + 1}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{tier.weight}% Chance</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/20">Min (R$)</label>
                          <input
                            type="number"
                            value={tier.min}
                            onChange={(e) => {
                              const newTiers = [...settings.prizeTiers];
                              newTiers[index].min = parseFloat(e.target.value);
                              setSettings({ ...settings, prizeTiers: newTiers });
                            }}
                            className={`w-full rounded-lg px-3 py-2 text-xs font-bold transition-all outline-none border ${
                              theme === 'dark' ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                            }`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/20">Max (R$)</label>
                          <input
                            type="number"
                            value={tier.max}
                            onChange={(e) => {
                              const newTiers = [...settings.prizeTiers];
                              newTiers[index].max = parseFloat(e.target.value);
                              setSettings({ ...settings, prizeTiers: newTiers });
                            }}
                            className={`w-full rounded-lg px-3 py-2 text-xs font-bold transition-all outline-none border ${
                              theme === 'dark' ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                            }`}
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/20">Peso (0-100)</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={tier.weight}
                          onChange={(e) => {
                            const newTiers = [...settings.prizeTiers];
                            newTiers[index].weight = parseInt(e.target.value);
                            setSettings({ ...settings, prizeTiers: newTiers });
                          }}
                          className="w-full h-1 bg-emerald-500/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gateway' && (
          <div className="animate-in fade-in max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-black tracking-tighter uppercase">Gateway de Pagamento</h2>
                <p className={`text-[9px] font-medium mt-0.5 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
                  Configure as credenciais do Mercado Pago para PIX.
                </p>
              </div>
              <button
                onClick={handleSettingsSave}
                className={`px-3 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1.5 transition-all shadow-lg ${
                  theme === 'dark'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Save size={12} />
                Salvar
              </button>
            </div>

            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <DollarSign size={16} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Mercado Pago (PIX)</h3>
                  <p className={`text-[8px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Integração Direta</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-0.5">
                  <label className={`block text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Access Token</label>
                  <input
                    type="password"
                    value={settings.mpAccessToken || ''}
                    onChange={(e) => setSettings({ ...settings, mpAccessToken: e.target.value })}
                    placeholder="APP_USR-..."
                    className={`w-full rounded-lg px-2 py-1.5 text-[10px] font-black transition-all outline-none border ${
                      theme === 'dark' ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                    }`}
                  />
                  <p className={`text-[7px] font-black uppercase tracking-widest mt-1 ${theme === 'dark' ? 'text-white/20' : 'text-gray-400'}`}>
                    Obtenha seu token em: <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Painel do Desenvolvedor</a>
                  </p>
                </div>

                <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100'}`}>
                  <div className="flex gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-black text-white">!</span>
                    </div>
                    <p className={`text-[9px] font-bold leading-relaxed ${theme === 'dark' ? 'text-blue-200/60' : 'text-blue-800'}`}>
                      Webhook no Mercado Pago: <br />
                      <code className="bg-black/20 px-1 rounded select-all">{`${window.location.origin}/api/webhooks/mercadopago`}</code>
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border space-y-2 ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Notificações de Depósito Aprovado</p>
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ativo</span>
                  </div>
                  <p className={`text-[8px] font-medium ${theme === 'dark' ? 'text-white/50' : 'text-gray-600'}`}>
                    Destino: <strong className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>lediotattoo@proton.me</strong> (Envia valor e telefone a cada depósito aprovado)
                  </p>
                  <div className="space-y-1">
                    <label className={`block text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Resend API Key (Opcional)</label>
                    <input
                      type="password"
                      value={settings.resendApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })}
                      placeholder="re_..."
                      className={`w-full rounded-lg px-2 py-1.5 text-[10px] font-black transition-all outline-none border ${
                        theme === 'dark' ? 'bg-black/40 border-white/5 text-white focus:border-emerald-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Setup Tab */}
        {activeTab === 'database' && (
          <div className="space-y-3 animate-in fade-in max-w-2xl">
            <div className="flex flex-col gap-0.5">
              <h2 className={`text-lg font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Setup do <span className="text-brand-primary">Banco de Dados</span>
              </h2>
              <p className={`text-[9px] font-medium ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
                Execute o SQL abaixo no seu painel do Supabase para criar as tabelas necessárias.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-500 ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                    <RefreshCw className="text-brand-primary" size={16} />
                  </div>
                  <div>
                    <h3 className={`text-xs font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>SQL Editor</h3>
                    <p className={`text-[8px] font-bold ${theme === 'dark' ? 'text-white/20' : 'text-gray-400'} uppercase tracking-widest`}>Supabase Query</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const sql = document.getElementById('sql-code-content')?.innerText;
                    if (sql) {
                      navigator.clipboard.writeText(sql);
                      toast.success('SQL copiado!');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-surface-dark rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg shadow-brand-primary/20"
                >
                  <Download size={12} />
                  Copiar SQL
                </button>
              </div>

              <div className={`p-2 rounded-xl border mb-3 ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100'}`}>
                <div className="flex gap-1.5">
                  <AlertCircle className="text-blue-500 shrink-0" size={14} />
                  <p className={`text-[9px] font-bold leading-relaxed ${theme === 'dark' ? 'text-blue-200/60' : 'text-blue-800'}`}>
                    Acesse o <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400 transition-colors">Dashboard do Supabase</a>, vá em <b>SQL Editor</b> e cole o código abaixo.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <pre id="sql-code-content" className={`relative p-3 rounded-xl border font-mono text-[9px] leading-relaxed overflow-x-auto max-h-[300px] scrollbar-thin ${theme === 'dark' ? 'bg-black/40 border-white/5 text-brand-primary/80' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
{`-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user' NOT NULL,
    balance NUMERIC DEFAULT 0 NOT NULL,
    earnings NUMERIC DEFAULT 0 NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "dailyPrizeTotal" NUMERIC DEFAULT 0,
    "lastPrizeDate" TEXT,
    referrals INTEGER DEFAULT 0,
    "unlockFirstWithdrawal" BOOLEAN DEFAULT false,
    "referralLink" TEXT,
    "withdrawalsCount" INTEGER DEFAULT 0,
    "referredBy" TEXT,
    "referralCounted" BOOLEAN DEFAULT false
);

-- 2. Tabela de Jogos
CREATE TABLE IF NOT EXISTS public.games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    "minBet" NUMERIC DEFAULT 1 NOT NULL,
    "maxBet" NUMERIC DEFAULT 100 NOT NULL,
    rtp NUMERIC DEFAULT 95 NOT NULL,
    thumbnail TEXT,
    "bgPage" TEXT,
    "bgContainer" TEXT,
    "bgMusic" TEXT,
    category TEXT DEFAULT 'slots'
);

-- 3. Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'bet', 'win', 'referral'
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'failed'
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "gameId" TEXT,
    metadata JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Configurações
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY, -- 'global'
    data JSONB NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabela de Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'info', 'success', 'warning', 'error'
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "targetUserId" TEXT REFERENCES public.users(id) ON DELETE CASCADE
);

-- 6. Tabela de Promoções
CREATE TABLE IF NOT EXISTS public.promotions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    discount NUMERIC NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabela de Banners
CREATE TABLE IF NOT EXISTS public.banners (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    link TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Opcional mas recomendado)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Criar Políticas de Acesso (Simplificado para o app funcionar)
CREATE POLICY "Allow all access users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all access games" ON public.games FOR ALL USING (true);
CREATE POLICY "Allow all access transactions" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Allow all access settings" ON public.settings FOR ALL USING (true);
CREATE POLICY "Allow all access notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Allow all access promotions" ON public.promotions FOR ALL USING (true);
CREATE POLICY "Allow all access banners" ON public.banners FOR ALL USING (true);`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Management */}
        {activeTab === 'notifications' && (
          <div className="animate-in fade-in max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-black tracking-tighter uppercase">Notificações</h2>
                <p className={`text-[9px] font-medium mt-0.5 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
                  Gerencie as notificações enviadas aos usuários.
                </p>
              </div>
              <button
                className={`px-3 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1.5 transition-all shadow-lg ${
                  theme === 'dark'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Plus size={12} />
                Nova Notificação
              </button>
            </div>

            <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}>
                    <th className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-gray-400">Título</th>
                    <th className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-gray-400">Mensagem</th>
                    <th className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-gray-400 text-center">Tipo</th>
                    <th className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-gray-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {notifications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2.5 py-6 text-center text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        Nenhuma notificação encontrada
                      </td>
                    </tr>
                  ) : (
                    notifications.map((notif) => (
                      <tr key={notif.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-2.5 py-1.5 text-[9px] font-bold">{notif.title}</td>
                        <td className="px-2.5 py-1.5 text-[9px] font-medium text-gray-400 truncate max-w-[200px]">{notif.message}</td>
                        <td className="px-2.5 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase ${
                            notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                            notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                            notif.type === 'error' ? 'bg-red-500/10 text-red-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {notif.type}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 text-right">
                          <button className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors">
                            <Trash2 size={10} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Promotions Management */}
        {activeTab === 'promotions' && (
          <div className="animate-in fade-in max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-black tracking-tighter uppercase">Promoções</h2>
                <p className={`text-[9px] font-medium mt-0.5 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
                  Gerencie códigos promocionais e descontos.
                </p>
              </div>
              <button
                className={`px-3 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1.5 transition-all shadow-lg ${
                  theme === 'dark'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Plus size={12} />
                Nova Promoção
              </button>
            </div>

            <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}>
                    <th className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-gray-400">Título</th>
                    <th className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-gray-400">Código</th>
                    <th className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-gray-400 text-center">Desconto</th>
                    <th className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                    <th className="px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-gray-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {promotions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-2.5 py-6 text-center text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        Nenhuma promoção encontrada
                      </td>
                    </tr>
                  ) : (
                    promotions.map((promo) => (
                      <tr key={promo.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-2.5 py-1.5 text-[9px] font-bold">{promo.title}</td>
                        <td className="px-2.5 py-1.5 text-[9px] font-mono text-emerald-500">{promo.code}</td>
                        <td className="px-2.5 py-1.5 text-center text-[9px] font-bold">{promo.discount}%</td>
                        <td className="px-2.5 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase ${
                            promo.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {promo.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 text-right">
                          <button className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors">
                            <Trash2 size={10} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Banners Management */}
        {activeTab === 'banners' && (
          <div className="animate-in fade-in max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-black tracking-tighter uppercase">Banners</h2>
                <p className={`text-[9px] font-medium mt-0.5 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
                  Gerencie os banners rotativos da página inicial.
                </p>
              </div>
              <button
                className={`px-3 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1.5 transition-all shadow-lg ${
                  theme === 'dark'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Plus size={12} />
                Novo Banner
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {banners.length === 0 ? (
                <div className={`col-span-full p-6 rounded-2xl border text-center ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Nenhum banner encontrado</p>
                </div>
              ) : (
                banners.map((banner) => (
                  <div key={banner.id} className={`group relative rounded-2xl border overflow-hidden transition-all ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="aspect-video relative overflow-hidden">
                      <img src={banner.imageUrl} alt={banner.link || 'Banner'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-1.5 left-2 right-2">
                        <h3 className="text-[9px] font-black text-white truncate">{banner.link || 'Sem Link'}</h3>
                      </div>
                    </div>
                    <div className="p-1.5 flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase ${
                        banner.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {banner.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <button className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
          </div>
        </main>
      </div>
    );
}

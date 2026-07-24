import { supabase } from '../lib/supabase';

const calaveraInkCover = '/images/calavera_ink_cover_1784495373476.jpg';

export type Role = 'user' | 'admin' | 'partner';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: Role;
  balance: number;
  earnings: number;
  createdAt: string;
  dailyPrizeTotal: number;
  lastPrizeDate: string;
  referrals: number;
  unlockFirstWithdrawal: boolean;
  referralLink: string;
  withdrawalsCount: number;
  referredBy?: string;
  referralCounted?: boolean;
  level: number;
  betVolume: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  date: string;
  gameId?: string;
  metadata?: any;
}

export interface GameConfig {
  id: string;
  name: string;
  active: boolean;
  minBet: number;
  maxBet: number;
  rtp: number;
  thumbnail: string;
  bgPage: string;
  bgContainer: string;
  bgMusic: string;
  category: 'slots' | 'mines' | 'crash' | 'memory' | 'roletas';
}

export interface PrizeTier {
  tipo: string;
  peso: number;
  premioMin: number;
  premioMax: number;
  custoReal: number;
}

export interface GamePrizeConfig {
  gameId: string;
  premios: PrizeTier[];
}

export interface SystemSettings {
  siteName: string;
  logo: string;
  primaryColor: string;
  globalMusic: string;
  minDeposit: number;
  minWithdrawal: number;
  custoRealPorPremio: number;
  valorApareceParaJogador: number;
  limiteUsuarioDiario: number;
  limitePlataformaDiario: number;
  platformDailyPrizeTotal: number;
  lastPlatformPrizeDate: string;
  gamePrizes: GamePrizeConfig[];
  referralsForFirstWithdrawal: number;
  mpAccessToken?: string;
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  emailFrom?: string;
  minPrize?: number;
  maxPrize?: number;
  prizeTiers?: Array<{ min: number; max: number; weight: number }>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  targetUserId?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: number;
  active: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  link: string;
  active: boolean;
  createdAt: string;
}

const DEFAULT_GAMES: GameConfig[] = [
  {
    id: 'mystic-ink',
    name: 'Mystic Ink',
    active: true,
    minBet: 1,
    maxBet: 100,
    rtp: 95,
    thumbnail: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=800&auto=format&fit=crop',
    bgPage: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=1920&auto=format&fit=crop',
    bgContainer: 'rgba(0,0,0,0.8)',
    bgMusic: '',
    category: 'slots',
  },
  {
    id: 'wild-tattoo',
    name: 'Wild Tattoo',
    active: true,
    minBet: 0.4,
    maxBet: 100,
    rtp: 96,
    thumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=800&auto=format&fit=crop',
    bgPage: '',
    bgContainer: '',
    bgMusic: '',
    category: 'slots',
  },
  {
    id: 'calavera-ink',
    name: 'Calavera Ink',
    active: true,
    minBet: 0.4,
    maxBet: 100,
    rtp: 98,
    thumbnail: calaveraInkCover,
    bgPage: '',
    bgContainer: '',
    bgMusic: '',
    category: 'slots',
  },
  {
    id: 'tattoo-cash',
    name: 'Tattoo Cash',
    active: true,
    minBet: 0.5,
    maxBet: 100,
    rtp: 97,
    thumbnail: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=800&auto=format&fit=crop',
    bgPage: '',
    bgContainer: '',
    bgMusic: '',
    category: 'slots',
  },
  {
    id: 'tattoo-slot',
    name: 'Tattoo Slot',
    active: true,
    minBet: 0.5,
    maxBet: 100,
    rtp: 98,
    thumbnail: 'https://images.unsplash.com/photo-1598252571565-794637d7a2ee?q=80&w=800&auto=format&fit=crop',
    bgPage: '',
    bgContainer: '',
    bgMusic: '',
    category: 'slots',
  },
  {
    id: 'rouletta-ink',
    name: 'Rouletta Ink',
    active: true,
    minBet: 1,
    maxBet: 100,
    rtp: 97,
    thumbnail: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=800&auto=format&fit=crop',
    bgPage: '',
    bgContainer: '',
    bgMusic: '',
    category: 'roletas',
  },
  {
    id: 'ink-reveal',
    name: 'Ink Reveal',
    active: true,
    minBet: 1.00,
    maxBet: 50.00,
    rtp: 96,
    thumbnail: 'https://images.unsplash.com/photo-1560707854-fb9a10eea18b?q=80&w=800&auto=format&fit=crop',
    bgPage: '',
    bgContainer: '',
    bgMusic: '',
    category: 'slots',
  },
  {
    id: 'yakuza-ink',
    name: 'Yakuza Ink',
    active: true,
    minBet: 0.10,
    maxBet: 100.00,
    rtp: 98,
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    bgPage: '',
    bgContainer: '',
    bgMusic: '',
    category: 'slots',
  },
];

const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'LT JOGOS',
  logo: '',
  primaryColor: '#FFCC00',
  globalMusic: '',
  minDeposit: 20,
  minWithdrawal: 60,
  custoRealPorPremio: 50,
  valorApareceParaJogador: 200,
  limiteUsuarioDiario: 100,
  limitePlataformaDiario: 500,
  platformDailyPrizeTotal: 0,
  lastPlatformPrizeDate: new Date().toISOString().split('T')[0],
  mpAccessToken: '',
  gamePrizes: [
    {
      gameId: 'slots',
      premios: [
        { tipo: "Comum", peso: 50, premioMin: 50, premioMax: 50, custoReal: 12.5 },
        { tipo: "Médio", peso: 30, premioMin: 100, premioMax: 100, custoReal: 25 },
        { tipo: "Raro", peso: 15, premioMin: 150, premioMax: 180, custoReal: 37.5 },
        { tipo: "Premium", peso: 5, premioMin: 180, premioMax: 200, custoReal: 50 }
      ]
    },
    {
      gameId: 'roletas',
      premios: [
        { tipo: "Comum (R$ 1)", peso: 65, premioMin: 1, premioMax: 1, custoReal: 0.25 },
        { tipo: "Médio (R$ 20)", peso: 20, premioMin: 20, premioMax: 20, custoReal: 5 },
        { tipo: "Raro (R$ 50)", peso: 10, premioMin: 50, premioMax: 50, custoReal: 12.5 },
        { tipo: "Premium (R$ 100+)", peso: 5, premioMin: 100, premioMax: 500, custoReal: 25 }
      ]
    }
  ],
  referralsForFirstWithdrawal: 3
};

class LocalDB {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          this.setStorageItem('lt_users', data);
          return data;
        }
      }
    } catch (e) {
      console.warn("Could not fetch users from API, trying direct Supabase client fallback...", e);
    }

    // Direct Supabase fallback (useful on static Vercel deployments)
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        const formatted = data.map((u: any) => ({
          ...u,
          unlockFirstWithdrawal: !!u.unlockFirstWithdrawal,
          referralCounted: !!u.referralCounted
        }));
        this.setStorageItem('lt_users', formatted);
        return formatted;
      }
    } catch (e) {
      console.warn("Could not fetch users from direct Supabase client:", e);
    }

    return this.getStorageItem<User[]>('lt_users', []);
  }

  async getUser(id: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.id === id);
  }

  async updateUser(updatedUser: User) {
    // Sync locally first
    const users = this.getStorageItem<User[]>('lt_users', []);
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
    } else {
      users.push(updatedUser);
    }
    this.setStorageItem('lt_users', users);

    // Sync to API or direct Supabase
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }
    } catch (e: any) {
      console.warn("Could not sync user update to API, attempting direct Supabase upsert...", e);
      try {
        const { error } = await supabase.from('users').upsert({
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          password: updatedUser.password,
          role: updatedUser.role,
          balance: updatedUser.balance,
          earnings: updatedUser.earnings,
          createdAt: updatedUser.createdAt,
          dailyPrizeTotal: updatedUser.dailyPrizeTotal,
          lastPrizeDate: updatedUser.lastPrizeDate,
          referrals: updatedUser.referrals || 0,
          unlockFirstWithdrawal: updatedUser.unlockFirstWithdrawal ? true : false,
          referralLink: updatedUser.referralLink || '',
          withdrawalsCount: updatedUser.withdrawalsCount || 0,
          referredBy: updatedUser.referredBy || null,
          referralCounted: updatedUser.referralCounted ? true : false,
          phone: updatedUser.phone || null
        });
        if (error) {
          console.error("Direct Supabase user upsert error:", error);
        }
      } catch (subErr) {
        console.error("Direct Supabase user upsert failed:", subErr);
      }
    }
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          this.setStorageItem('lt_transactions', data);
          return data;
        }
      }
    } catch (e) {
      console.warn("Could not fetch transactions from API, trying direct Supabase client fallback...", e);
    }

    try {
      const { data, error } = await supabase.from('transactions').select('*');
      if (!error && Array.isArray(data)) {
        this.setStorageItem('lt_transactions', data);
        return data;
      }
    } catch (e) {
      console.warn("Could not fetch transactions from direct Supabase client:", e);
    }

    return this.getStorageItem<Transaction[]>('lt_transactions', []);
  }

  async addTransaction(tx: Omit<Transaction, 'id' | 'date'>) {
    const newTx = {
      ...tx,
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
    };

    // Sync locally first
    const transactions = this.getStorageItem<Transaction[]>('lt_transactions', []);
    transactions.push(newTx);
    this.setStorageItem('lt_transactions', transactions);

    // Sync to API or direct Supabase
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      });
    } catch (e) {
      console.warn("Could not sync new transaction to API, trying direct Supabase...", e);
      try {
        await supabase.from('transactions').upsert(newTx);
      } catch (err) {
        console.error("Direct Supabase transaction insert error:", err);
      }
    }

    return newTx;
  }

  async updateTransaction(tx: Transaction) {
    // Sync locally first
    const transactions = this.getStorageItem<Transaction[]>('lt_transactions', []);
    const index = transactions.findIndex(t => t.id === tx.id);
    if (index !== -1) {
      transactions[index] = tx;
      this.setStorageItem('lt_transactions', transactions);
    }

    // Sync to API or direct Supabase
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx)
      });
    } catch (e) {
      console.warn("Could not sync transaction update to API, trying direct Supabase...", e);
      try {
        await supabase.from('transactions').upsert(tx);
      } catch (err) {
        console.error("Direct Supabase transaction update error:", err);
      }
    }
  }

  // Games
  async getGames(): Promise<GameConfig[]> {
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          this.setStorageItem('lt_games', data);
          return data.filter(g => g.category === 'slots' || g.category === 'roletas');
        }
      }
    } catch (e) {
      console.warn("Could not fetch games from API, trying direct Supabase client fallback...", e);
    }

    try {
      const { data, error } = await supabase.from('games').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        this.setStorageItem('lt_games', data);
        return data.filter(g => g.category === 'slots' || g.category === 'roletas');
      }
    } catch (e) {
      console.warn("Could not fetch games from direct Supabase client:", e);
    }

    const games = this.getStorageItem<GameConfig[]>('lt_games', []);
    const list = games.length > 0 ? games : DEFAULT_GAMES;
    return list.filter(g => g.category === 'slots' || g.category === 'roletas');
  }

  async getGame(id: string): Promise<GameConfig | undefined> {
    const games = await this.getGames();
    return games.find(g => g.id === id);
  }

  async updateGame(updatedGame: GameConfig) {
    // Sync locally first
    const games = this.getStorageItem<GameConfig[]>('lt_games', []);
    const index = games.findIndex(g => g.id === updatedGame.id);
    if (index !== -1) {
      games[index] = updatedGame;
    } else {
      games.push(updatedGame);
    }
    this.setStorageItem('lt_games', games);

    // Sync to API
    try {
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGame)
      });
    } catch (e) {
      console.warn("Could not sync game update to API:", e);
    }
  }

  async addGame(game: GameConfig) {
    await this.updateGame(game);
  }

  // Settings
  async getSettings(): Promise<SystemSettings> {
    let settingsData: any = null;
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          settingsData = data;
          this.setStorageItem('lt_settings', data);
        }
      }
    } catch (e) {
      console.warn("Could not fetch settings from API, using localStorage cache:", e);
    }

    if (!settingsData) {
      try {
        const { data, error } = await supabase.from("settings").select("data").eq("id", "global").single();
        if (!error && data && data.data) {
          const parsed = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
          settingsData = parsed;
          this.setStorageItem('lt_settings', parsed);
        }
      } catch (e) {
        console.warn("Could not fetch settings from Supabase client:", e);
      }
    }

    if (!settingsData) {
      settingsData = this.getStorageItem<SystemSettings | null>('lt_settings', null);
    }

    if (!settingsData) {
      return DEFAULT_SETTINGS;
    }

    // Merge DEFAULT_SETTINGS to ensure any newly added structure/defaults exist
    const merged = { ...DEFAULT_SETTINGS, ...settingsData };
    if (!merged.gamePrizes || !Array.isArray(merged.gamePrizes) || merged.gamePrizes.length === 0) {
      merged.gamePrizes = DEFAULT_SETTINGS.gamePrizes;
    } else {
      const mergedPrizes = [...DEFAULT_SETTINGS.gamePrizes];
      if (Array.isArray(settingsData.gamePrizes)) {
        settingsData.gamePrizes.forEach((p: any) => {
          const idx = mergedPrizes.findIndex(mp => mp.gameId === p.gameId);
          if (idx !== -1) {
            mergedPrizes[idx] = p;
          } else {
            mergedPrizes.push(p);
          }
        });
      }
      merged.gamePrizes = mergedPrizes;
    }
    return merged;
  }

  async saveSettings(settings: SystemSettings) {
    this.setStorageItem('lt_settings', settings);

    // Sync to API
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
    } catch (e) {
      console.warn("Could not sync settings to API:", e);
    }

    // Sync to Supabase
    try {
      await supabase.from("settings").upsert({
        id: "global",
        data: settings,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Could not sync settings to Supabase client:", e);
    }
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          this.setStorageItem('lt_notifications', data);
          return data;
        }
      }
    } catch (e) {
      console.warn("Could not fetch notifications from API, using localStorage cache:", e);
    }
    return this.getStorageItem<Notification[]>('lt_notifications', []);
  }

  async addNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
    const newNotification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    // Sync locally
    const notifications = this.getStorageItem<Notification[]>('lt_notifications', []);
    notifications.push(newNotification);
    this.setStorageItem('lt_notifications', notifications);

    // Sync to API
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      });
    } catch (e) {
      console.warn("Could not sync notification to API:", e);
    }

    return newNotification;
  }

  async deleteNotification(id: string) {
    // Sync locally
    const notifications = this.getStorageItem<Notification[]>('lt_notifications', []);
    const filtered = notifications.filter(n => n.id !== id);
    this.setStorageItem('lt_notifications', filtered);

    // Sync to API
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn("Could not sync notification deletion to API:", e);
    }
  }

  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    try {
      const res = await fetch('/api/promotions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          this.setStorageItem('lt_promotions', data);
          return data;
        }
      }
    } catch (e) {
      console.warn("Could not fetch promotions from API, using localStorage cache:", e);
    }
    return this.getStorageItem<Promotion[]>('lt_promotions', []);
  }

  async addPromotion(promotion: Omit<Promotion, 'id' | 'createdAt'>) {
    const newPromotion = {
      ...promotion,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    // Sync locally
    const promotions = this.getStorageItem<Promotion[]>('lt_promotions', []);
    promotions.push(newPromotion);
    this.setStorageItem('lt_promotions', promotions);

    // Sync to API
    try {
      await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromotion)
      });
    } catch (e) {
      console.warn("Could not sync promotion to API:", e);
    }

    return newPromotion;
  }

  async deletePromotion(id: string) {
    // Sync locally
    const promotions = this.getStorageItem<Promotion[]>('lt_promotions', []);
    const filtered = promotions.filter(p => p.id !== id);
    this.setStorageItem('lt_promotions', filtered);

    // Sync to API
    try {
      await fetch(`/api/promotions/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn("Could not sync promotion deletion to API:", e);
    }
  }

  // Banners
  async getBanners(): Promise<Banner[]> {
    try {
      const res = await fetch('/api/banners');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          this.setStorageItem('lt_banners', data);
          return data;
        }
      }
    } catch (e) {
      console.warn("Could not fetch banners from API, using localStorage cache:", e);
    }
    return this.getStorageItem<Banner[]>('lt_banners', []);
  }

  async addBanner(banner: Omit<Banner, 'id' | 'createdAt'>) {
    const newBanner = {
      ...banner,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    // Sync locally
    const banners = this.getStorageItem<Banner[]>('lt_banners', []);
    banners.push(newBanner);
    this.setStorageItem('lt_banners', banners);

    // Sync to API
    try {
      await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBanner)
      });
    } catch (e) {
      console.warn("Could not sync banner to API:", e);
    }

    return newBanner;
  }

  async deleteBanner(id: string) {
    // Sync locally
    const banners = this.getStorageItem<Banner[]>('lt_banners', []);
    const filtered = banners.filter(b => b.id !== id);
    this.setStorageItem('lt_banners', filtered);

    // Sync to API
    try {
      await fetch(`/api/banners/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn("Could not sync banner deletion to API:", e);
    }
  }

  // Init Admin & Defaults
  async init() {
    const users = await this.getUsers();
    const adminUser = users.find((u) => u.email === 'admin@ltjogos.com');
    if (!adminUser) {
      console.log('Initializing admin user in localStorage...');
      await this.updateUser({
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@ltjogos.com',
        password: 'admin',
        role: 'admin',
        balance: 100,
        earnings: 0,
        createdAt: new Date().toISOString(),
        dailyPrizeTotal: 0,
        lastPrizeDate: new Date().toISOString().split('T')[0],
        referrals: 0,
        unlockFirstWithdrawal: true,
        referralLink: '',
        withdrawalsCount: 0,
        level: 1,
        betVolume: 0,
      });
    } else {
      // Force admin balance to 100 as requested
      if (adminUser.balance !== 100) {
        adminUser.balance = 100;
        await this.updateUser(adminUser);
      }
    }

    // Initialize the specific admin with phone 21982331392 and password megabell
    const phoneAdmin = users.find((u) => u.phone === '21982331392');
    if (!phoneAdmin) {
      console.log('Initializing specific admin 21982331392...');
      await this.updateUser({
        id: 'admin-phone-21982331392',
        name: 'Tatuador Adriano Ledio',
        email: 'tatuador.adrianoledio@gmail.com',
        phone: '21982331392',
        password: 'megabell',
        role: 'admin',
        balance: 999999,
        earnings: 0,
        createdAt: new Date().toISOString(),
        dailyPrizeTotal: 0,
        lastPrizeDate: new Date().toISOString().split('T')[0],
        referrals: 0,
        unlockFirstWithdrawal: true,
        referralLink: `https://ltjogos.vercel.app/register?ref=admin-phone-21982331392`,
        withdrawalsCount: 0,
        level: 5,
        betVolume: 100000,
      });
    } else {
      // Ensure role, password, and email are correct
      let changed = false;
      if (phoneAdmin.role !== 'admin') {
        phoneAdmin.role = 'admin';
        changed = true;
      }
      if (phoneAdmin.password !== 'megabell') {
        phoneAdmin.password = 'megabell';
        changed = true;
      }
      if (!phoneAdmin.email) {
        phoneAdmin.email = 'tatuador.adrianoledio@gmail.com';
        changed = true;
      }
      if (changed) {
        await this.updateUser(phoneAdmin);
      }
    }

    const currentGames = this.getStorageItem<GameConfig[]>('lt_games', []);
    const mergedGames = [...DEFAULT_GAMES];
    currentGames.forEach(cg => {
      const idx = mergedGames.findIndex(g => g.id === cg.id);
      if (idx !== -1) {
        mergedGames[idx] = cg;
      } else {
        mergedGames.push(cg);
      }
    });
    const onlyAllowed = mergedGames.filter(g => g.category === 'slots' || g.category === 'roletas');
    this.setStorageItem('lt_games', onlyAllowed);

    const settings = this.getStorageItem<SystemSettings | null>('lt_settings', null);
    if (!settings) {
      this.setStorageItem('lt_settings', DEFAULT_SETTINGS);
    } else {
      if (!settings.gamePrizes) {
        settings.gamePrizes = [...DEFAULT_SETTINGS.gamePrizes];
      } else {
        settings.gamePrizes = settings.gamePrizes.filter(gp => gp?.gameId === 'slots' || gp?.gameId === 'roletas');
      }
      const hasRoletas = settings.gamePrizes.some(gp => gp?.gameId === 'roletas');
      if (!hasRoletas) {
        const roletasDefault = DEFAULT_SETTINGS.gamePrizes.find(gp => gp.gameId === 'roletas');
        if (roletasDefault) {
          settings.gamePrizes.push(roletasDefault);
        }
      }
      this.setStorageItem('lt_settings', settings);
    }
  }
}

export const db = new LocalDB();

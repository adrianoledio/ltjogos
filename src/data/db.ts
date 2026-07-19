export type Role = 'user' | 'admin' | 'partner';

export interface User {
  id: string;
  name: string;
  email: string;
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
    minBet: 1,
    maxBet: 100,
    rtp: 96,
    thumbnail: 'https://picsum.photos/seed/tattoo/400/300',
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
    id: 'roleta-pix',
    name: 'Roleta da Sorte',
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
    return this.getStorageItem<User[]>('lt_users', []);
  }

  async getUser(id: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.id === id);
  }

  async updateUser(updatedUser: User) {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
    } else {
      users.push(updatedUser);
    }
    this.setStorageItem('lt_users', users);
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return this.getStorageItem<Transaction[]>('lt_transactions', []);
  }

  async addTransaction(tx: Omit<Transaction, 'id' | 'date'>) {
    const transactions = await this.getTransactions();
    const newTx = {
      ...tx,
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
    };
    transactions.push(newTx);
    this.setStorageItem('lt_transactions', transactions);
    return newTx;
  }

  async updateTransaction(tx: Transaction) {
    const transactions = await this.getTransactions();
    const index = transactions.findIndex(t => t.id === tx.id);
    if (index !== -1) {
      transactions[index] = tx;
      this.setStorageItem('lt_transactions', transactions);
    }
  }

  // Games
  async getGames(): Promise<GameConfig[]> {
    const games = this.getStorageItem<GameConfig[]>('lt_games', []);
    const list = games.length > 0 ? games : DEFAULT_GAMES;
    return list.filter(g => g.category === 'slots' || g.category === 'roletas');
  }

  async getGame(id: string): Promise<GameConfig | undefined> {
    const games = await this.getGames();
    return games.find(g => g.id === id);
  }

  async updateGame(updatedGame: GameConfig) {
    const games = await this.getGames();
    const index = games.findIndex(g => g.id === updatedGame.id);
    if (index !== -1) {
      games[index] = updatedGame;
    } else {
      games.push(updatedGame);
    }
    this.setStorageItem('lt_games', games);
  }

  async addGame(game: GameConfig) {
    await this.updateGame(game);
  }

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const settings = this.getStorageItem<SystemSettings | null>('lt_settings', null);
    return settings || DEFAULT_SETTINGS;
  }

  async saveSettings(settings: SystemSettings) {
    this.setStorageItem('lt_settings', settings);
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return this.getStorageItem<Notification[]>('lt_notifications', []);
  }

  async addNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
    const notifications = await this.getNotifications();
    const newNotification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    notifications.push(newNotification);
    this.setStorageItem('lt_notifications', notifications);
    return newNotification;
  }

  async deleteNotification(id: string) {
    const notifications = await this.getNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    this.setStorageItem('lt_notifications', filtered);
  }

  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    return this.getStorageItem<Promotion[]>('lt_promotions', []);
  }

  async addPromotion(promotion: Omit<Promotion, 'id' | 'createdAt'>) {
    const promotions = await this.getPromotions();
    const newPromotion = {
      ...promotion,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    promotions.push(newPromotion);
    this.setStorageItem('lt_promotions', promotions);
    return newPromotion;
  }

  async deletePromotion(id: string) {
    const promotions = await this.getPromotions();
    const filtered = promotions.filter(p => p.id !== id);
    this.setStorageItem('lt_promotions', filtered);
  }

  // Banners
  async getBanners(): Promise<Banner[]> {
    return this.getStorageItem<Banner[]>('lt_banners', []);
  }

  async addBanner(banner: Omit<Banner, 'id' | 'createdAt'>) {
    const banners = await this.getBanners();
    const newBanner = {
      ...banner,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    banners.push(newBanner);
    this.setStorageItem('lt_banners', banners);
    return newBanner;
  }

  async deleteBanner(id: string) {
    const banners = await this.getBanners();
    const filtered = banners.filter(b => b.id !== id);
    this.setStorageItem('lt_banners', filtered);
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
      });
    } else {
      // Force admin balance to 100 as requested
      if (adminUser.balance !== 100) {
        adminUser.balance = 100;
        await this.updateUser(adminUser);
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

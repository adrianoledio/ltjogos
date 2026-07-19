-- Esquema de Banco de Dados (SQLite)
-- Este arquivo é apenas para documentação. O arquivo server.ts cria essas tabelas automaticamente.

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'user', -- 'admin', 'user', 'partner'
  balance REAL DEFAULT 0.0,
  earnings REAL DEFAULT 0.0,
  createdAt TEXT NOT NULL,
  dailyPrizeTotal REAL DEFAULT 0.0,
  lastPrizeDate TEXT,
  referrals INTEGER DEFAULT 0,
  unlockFirstWithdrawal INTEGER DEFAULT 0, -- 0 = false, 1 = true
  referralLink TEXT,
  withdrawalsCount INTEGER DEFAULT 0,
  referredBy TEXT,
  referralCounted INTEGER DEFAULT 0 -- 0 = false, 1 = true
);

-- Tabela de Jogos (Configurações)
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active INTEGER DEFAULT 1, -- 0 = false, 1 = true
  minBet REAL DEFAULT 1.0,
  maxBet REAL DEFAULT 100.0,
  rtp REAL DEFAULT 95.0,
  thumbnail TEXT,
  bgPage TEXT,
  bgContainer TEXT,
  bgMusic TEXT,
  category TEXT -- 'slots', 'mines', 'crash', 'memory'
);

-- Tabela de Transações (Depósitos, Saques, Apostas, Ganhos)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL, -- 'deposit', 'withdraw', 'bet', 'win'
  amount REAL NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'approved', 'rejected', 'completed'
  date TEXT NOT NULL,
  gameId TEXT,
  metadata TEXT, -- JSON string para dados adicionais (ex: detalhes da aposta)
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (gameId) REFERENCES games(id)
);

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY, -- Geralmente 'global'
  data TEXT NOT NULL -- JSON string contendo todas as configurações globais (SystemSettings)
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

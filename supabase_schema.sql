-- ====================================================================
-- SUPABASE / POSTGRESQL DATABASE SCHEMA
-- Copie e cole este script no painel SQL Editor do seu projeto Supabase.
-- ====================================================================

-- 1. Tabela de Usuários (users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'user', -- 'admin', 'user', 'partner'
  balance DOUBLE PRECISION DEFAULT 0.0,
  earnings DOUBLE PRECISION DEFAULT 0.0,
  "createdAt" TEXT NOT NULL,
  "dailyPrizeTotal" DOUBLE PRECISION DEFAULT 0.0,
  "lastPrizeDate" TEXT,
  referrals INTEGER DEFAULT 0,
  "unlockFirstWithdrawal" BOOLEAN DEFAULT FALSE,
  "referralLink" TEXT,
  "withdrawalsCount" INTEGER DEFAULT 0,
  "referredBy" TEXT,
  "referralCounted" BOOLEAN DEFAULT FALSE
);

-- 2. Tabela de Jogos (games)
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  "minBet" DOUBLE PRECISION DEFAULT 1.0,
  "maxBet" DOUBLE PRECISION DEFAULT 100.0,
  rtp DOUBLE PRECISION DEFAULT 95.0,
  thumbnail TEXT,
  "bgPage" TEXT,
  "bgContainer" TEXT,
  "bgMusic" TEXT,
  category TEXT -- 'slots', 'mines', 'crash', 'memory'
);

-- 3. Tabela de Transações (transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'deposit', 'withdraw', 'bet', 'win'
  amount DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'approved', 'rejected', 'completed'
  date TEXT NOT NULL,
  "gameId" TEXT REFERENCES games(id) ON DELETE SET NULL,
  metadata JSONB
);

-- 4. Tabela de Configurações do Sistema (settings)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY, -- 'global'
  data JSONB NOT NULL
);

-- 5. Tabela de Notificações (notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "targetUserId" TEXT REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Tabela de Promoções (promotions)
CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  discount DOUBLE PRECISION DEFAULT 0.0,
  active BOOLEAN DEFAULT TRUE,
  "createdAt" TEXT NOT NULL
);

-- 7. Tabela de Banners (banners)
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  "imageUrl" TEXT NOT NULL,
  link TEXT,
  active BOOLEAN DEFAULT TRUE,
  "createdAt" TEXT NOT NULL
);

-- ====================================================================
-- ÍNDICES PARA OTIMIZAÇÃO DE CONSULTAS
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions("userId");
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ====================================================================
-- SEGURANÇA E POLÍTICAS (ROW LEVEL SECURITY)
-- Desativa o RLS por padrão para permitir que sua API leia/escreva
-- diretamente nas tabelas usando a chave anon/service_role.
-- ====================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;

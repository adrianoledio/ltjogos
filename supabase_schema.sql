-- ====================================================================
-- ESQUEMA COMPLETO DO BANCO DE DADOS SUPABASE (LT JOGOS)
-- Abra o painel do Supabase -> SQL Editor -> New Query
-- Cole todo este conteúdo e clique em "Run"
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
  "referralCounted" BOOLEAN DEFAULT FALSE,
  "lastLoginBonusDate" TEXT,
  "level" INTEGER DEFAULT 1,
  "betVolume" DOUBLE PRECISION DEFAULT 0.0
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
  category TEXT, -- 'slots', 'mines', 'crash', 'memory', 'roletas'
  featured BOOLEAN DEFAULT FALSE
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
-- SEGURANÇA E POLÍTICAS (DISABLE RLS)
-- Permite leitura e escrita direta via API/SDK anon
-- ====================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- INSERÇÃO DE DADOS INICIAIS (SEED DATA)
-- ====================================================================

-- 1. Configurações Globais Iniciais
INSERT INTO settings (id, data) VALUES (
  'global',
  '{
    "siteName": "LT JOGOS",
    "logo": "",
    "primaryColor": "#FFCC00",
    "globalMusic": "",
    "minDeposit": 20,
    "minWithdrawal": 60,
    "custoRealPorPremio": 50,
    "valorApareceParaJogador": 200,
    "limiteUsuarioDiario": 100,
    "limitePlataformaDiario": 500,
    "platformDailyPrizeTotal": 0,
    "lastPlatformPrizeDate": "2026-09-21",
    "gamePrizes": [
      {
        "gameId": "slots",
        "premios": [
          { "tipo": "Comum", "peso": 50, "premioMin": 50, "premioMax": 50, "custoReal": 12.5 },
          { "tipo": "Médio", "peso": 30, "premioMin": 100, "premioMax": 100, "custoReal": 25 },
          { "tipo": "Raro", "peso": 15, "premioMin": 150, "premioMax": 180, "custoReal": 37.5 },
          { "tipo": "Premium", "peso": 5, "premioMin": 180, "premioMax": 200, "custoReal": 50 }
        ]
      },
      {
        "gameId": "roletas",
        "premios": [
          { "tipo": "Comum (R$ 1)", "peso": 65, "premioMin": 1, "premioMax": 1, "custoReal": 0.25 },
          { "tipo": "Médio (R$ 20)", "peso": 20, "premioMin": 20, "premioMax": 20, "custoReal": 5 },
          { "tipo": "Raro (R$ 50)", "peso": 10, "premioMin": 50, "premioMax": 50, "custoReal": 12.5 },
          { "tipo": "Premium (R$ 100+)", "peso": 5, "premioMin": 100, "premioMax": 500, "custoReal": 25 }
        ]
      }
    ],
    "referralsForFirstWithdrawal": 3,
    "pixupClientId": "adrianoledio_f27410f412960abf",
    "pixupClientSecret": "",
    "pixupPostbackUrl": "https://ltjogos.vercel.app/webhook"
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 2. Jogos Iniciais
INSERT INTO games (id, name, active, "minBet", "maxBet", rtp, thumbnail, "bgPage", "bgContainer", "bgMusic", category, featured) VALUES
  ('wild-tattoo', 'Wild Tattoo', true, 0.4, 100, 96, 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=800&auto=format&fit=crop', '', '', '', 'slots', true),
  ('calavera-ink', 'Calavera Ink', true, 0.4, 100, 98, '/images/calavera_ink_cover_1784495373476.jpg', '', '', '', 'slots', true),
  ('mystic-ink', 'Mystic Ink', true, 1.0, 100, 95, 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=1920&auto=format&fit=crop', 'rgba(0,0,0,0.8)', '', 'slots', true),
  ('tattoo-cash', 'Tattoo Cash', true, 0.5, 100, 97, 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=800&auto=format&fit=crop', '', '', '', 'slots', true),
  ('tattoo-slot', 'Tattoo Slot', true, 0.5, 100, 98, 'https://images.unsplash.com/photo-1598252571565-794637d7a2ee?q=80&w=800&auto=format&fit=crop', '', '', '', 'slots', false),
  ('rouletta-ink', 'Rouletta Ink', true, 1.0, 100, 97, 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=800&auto=format&fit=crop', '', '', '', 'roletas', false),
  ('ink-reveal', 'Ink Reveal', true, 1.0, 50, 96, 'https://images.unsplash.com/photo-1560707854-fb9a10eea18b?q=80&w=800&auto=format&fit=crop', '', '', '', 'slots', false),
  ('yakuza-ink', 'Yakuza Ink', true, 0.1, 100, 98, 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop', '', '', '', 'slots', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Contas Admin Padrão
INSERT INTO users (
  id, name, email, phone, password, role, balance, earnings, "createdAt", "dailyPrizeTotal", "lastPrizeDate", referrals, "unlockFirstWithdrawal", "referralLink", "withdrawalsCount"
) VALUES 
  ('admin-1', 'Admin', 'admin@ltjogos.com', NULL, 'admin', 'admin', 0, 0, NOW()::text, 0, CURRENT_DATE::text, 0, true, '', 0),
  ('admin-phone-21982331392', 'Tatuador Adriano Ledio', 'tatuador.adrianoledio@gmail.com', '21982331392', 'megabell', 'admin', 0, 0, NOW()::text, 0, CURRENT_DATE::text, 0, true, 'https://example.com/register?ref=admin-phone-21982331392', 0)
ON CONFLICT (id) DO NOTHING;

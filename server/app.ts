import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { sendDepositNotificationEmail } from "./lib/sendDepositEmail";
import { verifyAndApprovePayment, syncAllPendingDeposits } from "./services/checkStatus";
import { getValidSupabaseCredentials, isConfiguredSupabase } from "../src/lib/supabase";
import { RtpMonitor } from "./rtpMonitor";
import {
  computeTattooSlotOutcome,
  computeYakuzaInkOutcome,
  computeMysticInkOutcome,
  computeCalaveraInkOutcome,
  computeTattooCashOutcome,
  computeRoulettaInkOutcome,
  computeInkRevealOutcome,
} from "./slotEngine";

// Supabase Configuration
const { url: validServerUrl, key: validServerKey } = getValidSupabaseCredentials();
export const isServerSupabaseConfigured = isConfiguredSupabase(validServerUrl, validServerKey);

console.log("Supabase initialized with URL:", isServerSupabaseConfigured ? validServerUrl : "offline fallback mode");
export const supabase = createClient(
  isServerSupabaseConfigured ? validServerUrl : "https://placeholder.supabase.co",
  isServerSupabaseConfigured ? validServerKey : "placeholder"
);

function logSupabaseError(context: string, err: any) {
  if (!err) return;
  const msg = typeof err === 'string' ? err : err.message || '';
  const str = String(err);
  const stack = typeof err?.stack === 'string' ? err.stack : '';
  if (
    msg.includes("fetch failed") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("placeholder") ||
    str.includes("fetch failed") ||
    str.includes("TypeError") ||
    stack.includes("fetch failed") ||
    err.name === "TypeError"
  ) {
    return;
  }
  console.log(`${context}:`, msg || err);
}

// In-memory caches for offline / standalone execution
const DEFAULT_ADMIN_USER: any = {
  id: 'admin-master-adriano',
  name: 'Adriano Ledio',
  email: 'tatuador.adrianoledio@gmail.com',
  phone: '21982331392',
  password: 'admin',
  role: 'admin',
  balance: 999999,
  earnings: 0,
  createdAt: new Date().toISOString(),
  dailyPrizeTotal: 0,
  lastPrizeDate: new Date().toISOString().split('T')[0],
  referrals: 0,
  unlockFirstWithdrawal: true,
  referralLink: 'https://ltjogos.vercel.app/?ref=admin',
  referralCode: 'admin',
  withdrawalsCount: 0,
  level: 5,
  betVolume: 100000,
};
const inMemoryUsers = new Map<string, any>([[DEFAULT_ADMIN_USER.id, DEFAULT_ADMIN_USER]]);
let inMemorySettings: any = null;
const inMemoryTransactions: any[] = [];
const inMemoryGames: any[] = [];
const inMemoryNotifications: any[] = [];
const inMemoryPromotions: any[] = [];
const inMemoryBanners: any[] = [];

export const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  // Normalize URLs for Vercel Serverless Function rewrites:
  // e.g. Vercel rewrites /api/* to /api/index, but provides original path in x-matched-path
  const matched = (req.headers['x-matched-path'] || req.headers['x-invoke-path']) as string;
  if (matched && typeof matched === 'string' && (matched.startsWith('/api') || matched.startsWith('/webhook') || matched.startsWith('/app/webhook'))) {
    req.url = matched;
  }
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.get("/api/users", async (req, res) => {
    try {
      if (!isServerSupabaseConfigured) {
        return res.json(Array.from(inMemoryUsers.values()));
      }
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        logSupabaseError("Supabase info fetching users", error);
        return res.json(Array.from(inMemoryUsers.values()));
      }
      res.json((data || []).map((u: any) => ({
        ...u,
        balance: Number(u.balance ?? 0),
        earnings: Number(u.earnings ?? 0),
        unlockFirstWithdrawal: !!u.unlockFirstWithdrawal,
        referralCounted: !!u.referralCounted
      })));
    } catch (error: any) {
      logSupabaseError("Supabase offline/unreachable for users", error);
      res.json(Array.from(inMemoryUsers.values()));
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      if (!isServerSupabaseConfigured) {
        const u = inMemoryUsers.get(req.params.id);
        if (!u) {
          return res.status(404).json({ error: "User not found" });
        }
        return res.json({
          ...u,
          balance: Number(u.balance ?? 0),
          earnings: Number(u.earnings ?? 0),
          unlockFirstWithdrawal: !!u.unlockFirstWithdrawal,
          referralCounted: !!u.referralCounted
        });
      }
      const { data, error } = await supabase.from("users").select("*").eq("id", req.params.id).maybeSingle();
      if (error || !data) {
        const u = inMemoryUsers.get(req.params.id);
        if (u) return res.json(u);
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        ...data,
        balance: Number(data.balance ?? 0),
        earnings: Number(data.earnings ?? 0),
        unlockFirstWithdrawal: !!data.unlockFirstWithdrawal,
        referralCounted: !!data.referralCounted
      });
    } catch (error: any) {
      const u = inMemoryUsers.get(req.params.id);
      if (u) return res.json(u);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    console.log("POST /api/users called with body:", JSON.stringify(req.body));
    try {
      const { id, name, email, password, role, balance, earnings, createdAt, dailyPrizeTotal, lastPrizeDate, lastLoginBonusDate, referrals, unlockFirstWithdrawal, referralLink, referralCode, withdrawalsCount, referredBy, referralCounted, phone } = req.body;
      console.log("Saving user:", id);
      const payload: any = {
        id, name, email, password, role, balance, earnings, createdAt, dailyPrizeTotal, lastPrizeDate, 
        lastLoginBonusDate: lastLoginBonusDate || null,
        referrals: referrals || 0, 
        unlockFirstWithdrawal: unlockFirstWithdrawal ? true : false, 
        referralLink: referralLink || '', 
        referralCode: req.body.referralCode || null,
        withdrawalsCount: withdrawalsCount || 0, 
        referredBy: referredBy || null, 
        referralCounted: referralCounted ? true : false,
        phone: phone || null
      };
      if (id) {
        inMemoryUsers.set(id, { ...payload });
      }
      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      let { error } = await supabase.from("users").upsert(payload);
      if (error && (error.message?.toLowerCase().includes("column") || error.message?.toLowerCase().includes("does not exist") || error.message?.toLowerCase().includes("schema"))) {
        delete payload.lastLoginBonusDate;
        delete payload.phone;
        const res2 = await supabase.from("users").upsert(payload);
        error = res2.error;
        if (error && error.message?.toLowerCase().includes("column")) {
          // If still error, retry with minimal safe columns
          const minimalPayload = {
            id: payload.id,
            name: payload.name,
            email: payload.email,
            password: payload.password,
            role: payload.role,
            balance: payload.balance,
            earnings: payload.earnings,
            createdAt: payload.createdAt,
            dailyPrizeTotal: payload.dailyPrizeTotal || 0,
            lastPrizeDate: payload.lastPrizeDate || null
          };
          const res3 = await supabase.from("users").upsert(minimalPayload);
          error = res3.error;
        }
      }
      if (error) {
        logSupabaseError("Supabase save user status", error);
        return res.json({ success: true, offline: true });
      }
      res.json({ success: true });
    } catch (error: any) {
      logSupabaseError("Internal/network note saving user", error);
      res.json({ success: true, offline: true });
    }
  });

  app.get("/api/games", async (req, res) => {
    try {
      if (!isServerSupabaseConfigured) {
        return res.json(inMemoryGames);
      }
      const { data, error } = await supabase.from("games").select("*");
      if (error) {
        logSupabaseError("Supabase info fetching games", error);
        return res.json(inMemoryGames);
      }
      res.json((data || []).map((g: any) => ({ ...g, active: !!g.active, featured: !!g.featured })));
    } catch (error: any) {
      logSupabaseError("Supabase offline/unreachable for games", error);
      res.json(inMemoryGames);
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const { id, name, active, minBet, maxBet, rtp, thumbnail, bgPage, bgContainer, bgMusic, category, featured } = req.body;
      const payload: any = {
        id, name, active: !!active, minBet, maxBet, rtp, thumbnail, bgPage, bgContainer, bgMusic, category, featured: !!featured
      };
      const existingIdx = inMemoryGames.findIndex(g => g.id === id);
      if (existingIdx >= 0) inMemoryGames[existingIdx] = payload;
      else inMemoryGames.push(payload);

      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      let { error } = await supabase.from("games").upsert(payload);
      if (error && (error.message?.toLowerCase().includes("featured") || error.message?.toLowerCase().includes("column"))) {
        delete payload.featured;
        const res2 = await supabase.from("games").upsert(payload);
        error = res2.error;
        if (error && error.message?.toLowerCase().includes("column")) {
          const minimalPayload: any = {
            id: payload.id,
            name: payload.name,
            active: payload.active,
            rtp: payload.rtp,
            category: payload.category
          };
          const res3 = await supabase.from("games").upsert(minimalPayload);
          error = res3.error;
        }
      }
      if (error) {
        logSupabaseError("Supabase save game status", error);
        return res.json({ success: true, offline: true });
      }
      res.json({ success: true });
    } catch (error: any) {
      logSupabaseError("Internal/network note saving game", error);
      res.json({ success: true, offline: true });
    }
  });

  // Authoritative Backend Slot Spin & Probability Engine
  app.post("/api/slots/spin", async (req, res) => {
    try {
      const {
        userId,
        gameId,
        baseBet = 1,
        activeBet = 1,
        bet = 1,
        betPerLine = 1,
        totalBet = 1,
        freeSpins = 0,
        freeSpinsActive = false,
        freeSpinsMultiplier = 1,
        freeSpinMultiplier = 1,
        doubleChance = false,
        tigerActive = true,
        dragonActive = true,
        isWildTattoo = false,
        isFeverActive = false,
      } = req.body;

      let targetPrize = 0;
      let userRole = 'user';
      let settingsData: any = null;
      let userData: any = null;

      try {
        if (isServerSupabaseConfigured) {
          if (userId) {
            const { data: u } = await supabase.from("users").select("*").eq("id", userId).single();
            if (u) {
              userData = u;
              userRole = u.role || 'user';
            }
          }
          const { data: s } = await supabase.from("settings").select("data").eq("id", "global").single();
          if (s && s.data) {
            settingsData = s.data;
          }
        } else {
          if (userId && inMemoryUsers.has(userId)) {
            userData = inMemoryUsers.get(userId);
            userRole = userData?.role || 'user';
          }
          if (inMemorySettings) {
            settingsData = inMemorySettings;
          }
        }
      } catch (e) {
        // quiet fallback
      }

      // Determine category for prize lookup
      const prizeCategory = (gameId === 'rouletta-ink') ? 'roletas' : 'slots';

      // Compute Target Prize according to game rules & limits
      if (settingsData && settingsData.gamePrizes) {
        const gamePrizeConfig =
          settingsData.gamePrizes.find((p: any) => p.gameId === prizeCategory || p.gameId === 'slots') || settingsData.gamePrizes[0];
        if (gamePrizeConfig && gamePrizeConfig.premios) {
          const tiers = gamePrizeConfig.premios;
          const adjustedTiers = tiers.map((t: any, idx: number) => {
            if (userRole === 'partner' && idx >= tiers.length - 2) {
              return { ...t, peso: t.peso * 4 };
            }
            return t;
          });
          const totalWeight = adjustedTiers.reduce((acc: number, t: any) => acc + (t.peso || 0), 0);
          let rand = Math.random() * totalWeight;
          let selectedTier = adjustedTiers[0];
          for (const tier of adjustedTiers) {
            if (rand < tier.peso) {
              selectedTier = tier;
              break;
            }
            rand -= tier.peso;
          }

          let pAmount =
            Math.floor(Math.random() * (selectedTier.premioMax - selectedTier.premioMin + 1)) +
            selectedTier.premioMin;
          pAmount = Math.min(pAmount, 1000);

          if (userData) {
            const userLimit = Math.min(
              userRole === 'partner'
                ? (settingsData.limiteUsuarioDiario || 100) * 5
                : settingsData.limiteUsuarioDiario || 100,
              1000
            );
            const userRemaining = userLimit - (userData.dailyPrizeTotal || 0);
            if (pAmount > userRemaining) pAmount = Math.max(0, userRemaining);
          }

          const platformRemaining =
            (settingsData.limitePlataformaDiario || 500) - (settingsData.platformDailyPrizeTotal || 0);
          if (pAmount > platformRemaining) pAmount = Math.max(0, platformRemaining);

          targetPrize = pAmount;
        }
      }

      let result: any;
      if (gameId === 'tattoo-slot') {
        result = computeTattooSlotOutcome(
          targetPrize,
          baseBet,
          freeSpinsActive,
          freeSpinsMultiplier,
          doubleChance
        );
      } else if (gameId === 'yakuza-ink') {
        result = computeYakuzaInkOutcome(targetPrize, betPerLine, tigerActive, dragonActive);
      } else if (gameId === 'mystic-ink' || gameId === 'wild-tattoo') {
        result = computeMysticInkOutcome(
          targetPrize,
          bet || activeBet || baseBet,
          freeSpins,
          freeSpinMultiplier || freeSpinsMultiplier,
          isWildTattoo || gameId === 'wild-tattoo'
        );
      } else if (gameId === 'calavera-ink') {
        result = computeCalaveraInkOutcome(
          targetPrize,
          activeBet || baseBet || bet,
          freeSpinsActive,
          freeSpinsMultiplier
        );
      } else if (gameId === 'tattoo-cash') {
        result = computeTattooCashOutcome(
          targetPrize,
          bet || baseBet || activeBet,
          freeSpins
        );
      } else if (gameId === 'rouletta-ink') {
        result = computeRoulettaInkOutcome(
          targetPrize,
          bet || 1,
          isFeverActive
        );
      } else if (gameId === 'ink-reveal') {
        result = computeInkRevealOutcome(
          targetPrize,
          bet || 1
        );
      } else {
        return res.status(400).json({ error: "Invalid gameId" });
      }

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error("Error in /api/slots/spin:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      if (!isServerSupabaseConfigured) {
        return res.json(inMemoryTransactions);
      }
      const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false });
      if (error) {
        return res.json(inMemoryTransactions);
      }
      res.json((data || []).map((t: any) => ({ ...t, metadata: t.metadata ? (typeof t.metadata === 'string' ? JSON.parse(t.metadata) : t.metadata) : null })));
    } catch (error: any) {
      res.json(inMemoryTransactions);
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { id, userId, type, amount, status, date, gameId, metadata } = req.body;
      const txObj = { id, userId, type, amount, status, date, gameId, metadata: metadata || null };
      inMemoryTransactions.unshift(txObj);
      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      const { error } = await supabase.from("transactions").upsert(txObj);
      if (error) {
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true, offline: true });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      if (!isServerSupabaseConfigured) {
        return res.json(inMemorySettings);
      }
      const { data, error } = await supabase.from("settings").select("data").eq("id", "global").maybeSingle();
      if (error) {
        logSupabaseError("Supabase info fetching settings", error);
        return res.json(inMemorySettings);
      }
      if (data && data.data) {
        const parsed = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
        inMemorySettings = parsed;
        res.json(parsed);
      } else {
        res.json(inMemorySettings);
      }
    } catch (error: any) {
      logSupabaseError("Supabase offline/unreachable for settings", error);
      res.json(inMemorySettings);
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      inMemorySettings = req.body;
      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      const { error } = await supabase.from("settings").upsert({
        id: 'global',
        data: req.body
      });
      if (error) {
        logSupabaseError("Supabase save settings status", error);
        return res.json({ success: true, offline: true });
      }
      res.json({ success: true });
    } catch (error: any) {
      logSupabaseError("Internal/network note saving settings", error);
      res.json({ success: true, offline: true });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!isServerSupabaseConfigured) return res.json(inMemoryNotifications);
      const { data, error } = await supabase.from("notifications").select("*").order("createdAt", { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist")) {
          return res.json(inMemoryNotifications);
        }
        logSupabaseError("Supabase info fetching notifications", error);
        return res.json(inMemoryNotifications);
      }
      res.json(data || []);
    } catch (error: any) {
      res.json(inMemoryNotifications);
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const { id, title, message, type, createdAt, targetUserId } = req.body;
      const notifObj = { id, title, message, type, createdAt, targetUserId: targetUserId || null };
      inMemoryNotifications.unshift(notifObj);
      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      const { error } = await supabase.from("notifications").upsert(notifObj);
      if (error) {
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const idx = inMemoryNotifications.findIndex(n => n.id === req.params.id);
      if (idx >= 0) inMemoryNotifications.splice(idx, 1);
      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      const { error } = await supabase.from("notifications").delete().eq("id", req.params.id);
      if (error) {
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/transactions", async (req, res) => {
    try {
      inMemoryTransactions.length = 0;
      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      const { error } = await supabase.from("transactions").delete().neq("id", "none");
      if (error) {
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true, offline: true });
    }
  });

  app.post("/api/admin/reset-financial-data", async (req, res) => {
    try {
      console.log("Resetting all financial data, transactions and user balances...");
      
      inMemoryTransactions.length = 0;
      for (const [key, user] of inMemoryUsers.entries()) {
        inMemoryUsers.set(key, { ...user, balance: 0, earnings: 0, dailyPrizeTotal: 0, withdrawalsCount: 0 });
      }
      if (inMemorySettings) {
        inMemorySettings.platformDailyPrizeTotal = 0;
      }

      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, message: "Dados financeiros zerados com sucesso. Usuários mantidos." });
      }

      // 1. Delete all transactions
      try {
        await supabase.from("transactions").delete().neq("id", "none");
      } catch (txErr) {
        // quiet
      }

      // 2. Reset all users balance and earnings to 0 (keeping all accounts intact)
      try {
        const { data: allUsers } = await supabase.from("users").select("id");
        if (allUsers && allUsers.length > 0) {
          for (const u of allUsers) {
            await supabase.from("users").update({
              balance: 0,
              earnings: 0,
              dailyPrizeTotal: 0,
              withdrawalsCount: 0
            }).eq("id", u.id);
          }
        }
      } catch (uErr) {
        // quiet
      }

      // 3. Reset platform settings daily prize
      try {
        const { data: s } = await supabase.from("settings").select("data").eq("id", "global").single();
        if (s && s.data) {
          const parsed = typeof s.data === 'string' ? JSON.parse(s.data) : s.data;
          parsed.platformDailyPrizeTotal = 0;
          await supabase.from("settings").upsert({ id: "global", data: parsed });
        }
      } catch (sErr) {
        // quiet
      }

      res.json({ success: true, message: "Dados financeiros zerados com sucesso. Usuários mantidos." });
    } catch (error: any) {
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/users", async (req, res) => {
    try {
      inMemoryUsers.clear();
      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      const { error } = await supabase.from("users").delete().neq("id", "none");
      if (error) {
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      inMemoryUsers.delete(id);
      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      // Delete associated transactions first to prevent foreign key constraint violations
      try {
        await supabase.from("transactions").delete().eq("userId", id);
      } catch (e) {
        // ignore
      }
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) {
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true, offline: true });
    }
  });

  // Promotions
  app.get("/api/promotions", async (req, res) => {
    try {
      if (!isServerSupabaseConfigured) return res.json(inMemoryPromotions);
      const { data, error } = await supabase.from("promotions").select("*").order("createdAt", { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.message?.includes("fetch failed") || error.message?.includes("ENOTFOUND")) {
          return res.json(inMemoryPromotions);
        }
        return res.json(inMemoryPromotions);
      }
      res.json((data || []).map((p: any) => ({ ...p, active: !!p.active })));
    } catch (error: any) {
      res.json(inMemoryPromotions);
    }
  });

  app.post("/api/promotions", async (req, res) => {
    try {
      const { id, title, description, code, discount, active, createdAt } = req.body;
      const promoObj = { id, title, description, code, discount, active: !!active, createdAt };
      const idx = inMemoryPromotions.findIndex(p => p.id === id);
      if (idx >= 0) inMemoryPromotions[idx] = promoObj;
      else inMemoryPromotions.unshift(promoObj);

      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      const { error } = await supabase.from("promotions").upsert(promoObj);
      if (error) {
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/promotions/:id", async (req, res) => {
    try {
      const idx = inMemoryPromotions.findIndex(p => p.id === req.params.id);
      if (idx >= 0) inMemoryPromotions.splice(idx, 1);
      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      const { error } = await supabase.from("promotions").delete().eq("id", req.params.id);
      if (error) {
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true, offline: true });
    }
  });

  // Banners
  app.get("/api/banners", async (req, res) => {
    try {
      if (!isServerSupabaseConfigured) return res.json(inMemoryBanners);
      const { data, error } = await supabase.from("banners").select("*").order("createdAt", { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.message?.includes("fetch failed") || error.message?.includes("ENOTFOUND")) {
          return res.json(inMemoryBanners);
        }
        return res.json(inMemoryBanners);
      }
      res.json((data || []).map((b: any) => ({ ...b, active: !!b.active })));
    } catch (error: any) {
      res.json(inMemoryBanners);
    }
  });

  app.post("/api/banners", async (req, res) => {
    try {
      const { id, imageUrl, link, active, createdAt } = req.body;
      const bannerObj = { id, imageUrl, link, active: !!active, createdAt };
      const idx = inMemoryBanners.findIndex(b => b.id === id);
      if (idx >= 0) inMemoryBanners[idx] = bannerObj;
      else inMemoryBanners.unshift(bannerObj);

      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      const { error } = await supabase.from("banners").upsert(bannerObj);
      if (error) {
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/banners/:id", async (req, res) => {
    try {
      const idx = inMemoryBanners.findIndex(b => b.id === req.params.id);
      if (idx >= 0) inMemoryBanners.splice(idx, 1);
      if (!isServerSupabaseConfigured) {
        return res.json({ success: true, offline: true });
      }
      const { error } = await supabase.from("banners").delete().eq("id", req.params.id);
      if (error) {
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true, offline: true });
    }
  });

  // PixUP Gateway Helpers
  let pixupCachedToken: string | null = null;
  let pixupTokenExpiresAt: number = 0;

  async function getPixupAccessToken(clientId: string, clientSecret: string, forceRefresh: boolean = false): Promise<string> {
    const cId = (clientId || '').trim();
    const cSecret = (clientSecret || '').trim();
    if (!cId || !cSecret) {
      throw new Error("Client ID e Client Secret da PixUP não configurados.");
    }

    const now = Date.now();
    if (!forceRefresh && pixupCachedToken && pixupTokenExpiresAt > now + 30000) {
      return pixupCachedToken;
    }

    const basicAuth = Buffer.from(`${cId}:${cSecret}`).toString('base64');
    console.log(`[PixUP Auth] Gerando token para Client ID: ${cId.substring(0, 10)}... (forceRefresh: ${forceRefresh})`);

    const authRes = await fetch("https://api.pixupbr.com/v2/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json"
      }
    });

    const responseText = await authRes.text();
    let authData: any = {};
    try {
      authData = JSON.parse(responseText);
    } catch (e) {
      authData = { message: responseText };
    }

    if (!authRes.ok || authData.success === false) {
      const errDetail = authData.error?.message || (typeof authData.error === 'string' ? authData.error : null) || authData.message || `HTTP ${authRes.status}: Falha na autenticação da PixUP. Verifique Client ID e Client Secret.`;
      console.error("[PixUP Auth] Erro:", authRes.status, authData);
      throw new Error(`Erro PixUP: ${errDetail}`);
    }

    const token = authData.access_token || authData.accessToken || authData.token || authData.data?.access_token;
    const expiresIn = authData.expires_in || authData.expiresIn || 3600;

    if (!token) {
      throw new Error("Token não retornado pela PixUP.");
    }

    pixupCachedToken = token;
    pixupTokenExpiresAt = Date.now() + (Number(expiresIn) * 1000);
    return token;
  }

  // PixUP Test Connection Endpoint (Server-side to avoid CORS)
  app.post("/api/pixup/test", async (req, res) => {
    try {
      const { clientId: reqCId, clientSecret: reqCSecret } = req.body || {};
      let cId = (reqCId || "").trim() || process.env.PIXUP_CLIENT_ID || process.env.VITE_PIXUP_CLIENT_ID || "adrianoledio_f27410f412960abf";
      let cSecret = (reqCSecret || "").trim() || process.env.PIXUP_CLIENT_SECRET || process.env.VITE_PIXUP_CLIENT_SECRET || "";

      if (!cSecret) {
        try {
          const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").maybeSingle();
          if (settingsData && settingsData.data) {
            const s = typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data;
            if (s.pixupClientSecret) cSecret = s.pixupClientSecret.trim();
            if (s.pixupClientId) cId = s.pixupClientId.trim();
          }
        } catch (e) {
          // ignore
        }
      }

      if (!cSecret) {
        return res.json({ success: false, error: "Client Secret não fornecido. Preencha o Client Secret da PixUP." });
      }

      const basicAuth = Buffer.from(`${cId}:${cSecret}`).toString('base64');
      const authRes = await fetch("https://api.pixupbr.com/v2/oauth/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/json"
        }
      });

      const responseText = await authRes.text();
      let authData: any = {};
      try {
        authData = JSON.parse(responseText);
      } catch (e) {
        authData = { message: responseText };
      }

      if (!authRes.ok || authData.success === false) {
        const errDetail = authData.error?.message || (typeof authData.error === 'string' ? authData.error : null) || authData.message || `HTTP ${authRes.status}: Credenciais recusadas pela PixUP.`;
        return res.json({ success: false, error: errDetail });
      }

      return res.json({ success: true, message: "Conexão PixUP testada e aprovada com sucesso!" });
    } catch (err: any) {
      return res.json({ success: false, error: err.message || "Erro ao conectar com PixUP" });
    }
  });

  // PixUP Gateway Endpoints
  app.post("/api/payments/pix", async (req, res) => {
    try {
      const {
        amount,
        userId,
        email,
        name,
        cpf,
        bonus,
        clientId: clientPassedId,
        clientSecret: clientPassedSecret,
        pixupClientId: clientPassedPixupId,
        pixupClientSecret: clientPassedPixupSecret,
        token: clientToken,
        postbackUrl: clientPostback
      } = req.body;
      
      let clientId = (clientPassedPixupId || clientPassedId || "").trim() ||
        process.env.PIXUP_CLIENT_ID ||
        process.env.VITE_PIXUP_CLIENT_ID || "";
        
      let clientSecret = (clientPassedPixupSecret || clientPassedSecret || "").trim() ||
        process.env.PIXUP_CLIENT_SECRET ||
        process.env.VITE_PIXUP_CLIENT_SECRET || "";

      let postback_url = (clientPostback || "").trim() ||
        process.env.PIXUP_POSTBACK_URL ||
        "https://ltjogos.vercel.app/webhook";

      let directToken = (clientToken || "").trim() ||
        process.env.PIXUP_API_TOKEN ||
        process.env.PIXUP_TOKEN || "";
      
      let settings: any = null;
      if ((!clientId || !clientSecret) && !directToken && isServerSupabaseConfigured) {
        try {
          const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").maybeSingle();
          if (settingsData && settingsData.data) {
            settings = typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data;
            if (settings) {
              if (!clientId) clientId = (settings.pixupClientId || "").trim();
              if (!clientSecret) clientSecret = (settings.pixupClientSecret || "").trim();
              if (settings.pixupPostbackUrl) postback_url = settings.pixupPostbackUrl.trim();
              if (!directToken && settings.pixupToken) directToken = settings.pixupToken.trim();
            }
          }
        } catch (e) {
          logSupabaseError("Não foi possível buscar configurações do Supabase", e);
        }
      }

      if (!clientId) {
        clientId = "adrianoledio_f27410f412960abf";
      }

      // Prioritize OAuth generation if Client Secret is provided
      let authToken = "";
      if (clientId && clientSecret) {
        try {
          authToken = await getPixupAccessToken(clientId, clientSecret);
        } catch (authErr: any) {
          console.warn("[PixUP] Falha ao obter token OAuth com Client Secret:", authErr.message);
          if (directToken) {
            authToken = directToken;
          } else {
            return res.status(400).json({
              error: authErr.message || "Falha na autenticação da PixUP. Verifique seu Client ID e Client Secret no painel Admin."
            });
          }
        }
      } else if (directToken) {
        authToken = directToken;
      }
      
      if (!authToken) {
        console.error("Credenciais PixUP não configuradas.");
        return res.status(400).json({
          error: "Credenciais da PixUP não configuradas. Adicione seu Client Secret no painel Admin (Configurações > Gateway)."
        });
      }

      const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const payerEmail = email && email.includes("@") ? email : "usuario@ltjogos.com";
      const payerName = name && name.trim().length > 0 ? name.trim() : "Jogador LT Jogos";

      let cleanDoc = (cpf || "").replace(/\D/g, "");
      if (!cleanDoc || cleanDoc.length < 11) {
        const rnd = (n: number) => Math.floor(Math.random() * n);
        const mod = (dividend: number, divisor: number) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));
        const n = Array(9).fill(0).map(() => rnd(9));
        let d1 = n.reduce((total, number, index) => total + (number * (10 - index)), 0);
        d1 = 11 - mod(d1, 11);
        if (d1 >= 10) d1 = 0;
        let d2 = d1 * 2 + n.reduce((total, number, index) => total + (number * (11 - index)), 0);
        d2 = 11 - mod(d2, 11);
        if (d2 >= 10) d2 = 0;
        cleanDoc = `${n.join('')}${d1}${d2}`;
      }

      const pixupPayload: any = {
        amount: Number(Number(amount).toFixed(2)),
        currency: "BRL",
        external_id: txId,
        payer: {
          name: payerName,
          email: payerEmail,
          document: cleanDoc
        },
        postback_url: postback_url || "https://ltjogos.vercel.app/webhook"
      };

      console.log("[PixUP] Chamando cashin:", JSON.stringify(pixupPayload));
      
      let pixupResponse = await fetch("https://api.pixupbr.com/v2/transactions/cashin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken.trim()}`
        },
        body: JSON.stringify(pixupPayload)
      });

      let pixupData: any = await pixupResponse.json().catch(() => ({}));
      console.log("[PixUP] Resposta da API:", pixupResponse.status, JSON.stringify(pixupData));

      // Retry once if token was expired or invalid
      if ((!pixupResponse.ok || pixupData?.success === false) && 
          (pixupResponse.status === 401 || pixupData?.error?.code === 'INVALID_TOKEN') && 
          clientId && clientSecret) {
        console.log("[PixUP] Token expirado ou inválido (401). Renovando token OAuth e tentando novamente...");
        pixupCachedToken = null;
        try {
          const freshToken = await getPixupAccessToken(clientId, clientSecret, true);
          pixupResponse = await fetch("https://api.pixupbr.com/v2/transactions/cashin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${freshToken.trim()}`
            },
            body: JSON.stringify(pixupPayload)
          });
          pixupData = await pixupResponse.json().catch(() => ({}));
          console.log("[PixUP Retry] Resposta da API após renovação de token:", pixupResponse.status, JSON.stringify(pixupData));
        } catch (retryErr: any) {
          console.warn("[PixUP] Erro no retry com novo token:", retryErr.message);
        }
      }

      if (!pixupResponse.ok || pixupData.success === false) {
        console.error("Erro na PixUP:", pixupData);
        let detail = "Erro ao gerar PIX na PixUP.";
        if (typeof pixupData.error === 'string') {
          detail = pixupData.error;
        } else if (pixupData.error?.message && typeof pixupData.error.message === 'string') {
          if (pixupData.error.code === 'INVALID_TOKEN' || pixupData.error.code === 'INVALID_CREDENTIALS') {
            detail = "Credenciais ou token da PixUP inválidos. Acesse o Painel Admin > Gateway e verifique seu Client ID e Client Secret.";
          } else {
            detail = pixupData.error.message;
          }
        } else if (typeof pixupData.message === 'string') {
          detail = pixupData.message;
        } else if (pixupData.details?.message && typeof pixupData.details.message === 'string') {
          detail = pixupData.details.message;
        }
        return res.status(pixupResponse.status >= 400 ? pixupResponse.status : 400).json({ error: detail, details: pixupData });
      }

      const resData = pixupData.data || pixupData;
      const pixupTxId = resData.transaction_id || resData.id || pixupData.request_id;
      const qrCode = resData.payment_info?.qrcode || resData.qrcode || resData.payment_info?.qr_code || resData.qr_code || "";
      const qrCodeBase64 = resData.payment_info?.qrcode_base64 || resData.payment_info?.qr_code_base64 || resData.qrcode_base64 || "";

      // Create pending transaction in Supabase
      const metadata = {
        pixupTransactionId: pixupTxId,
        qrCode,
        qrCodeBase64,
        bonus: bonus || 0,
        gateway: "pixup"
      };

      try {
        if (isServerSupabaseConfigured) {
          if (userId) {
            await supabase.from("users").upsert({
              id: userId,
              name: payerName,
              email: payerEmail,
              role: "player"
            }, { onConflict: "id", ignoreDuplicates: true });
          }

          await supabase.from("transactions").insert({
            id: txId,
            userId,
            type: "deposit",
            amount: Number(amount),
            status: "pending",
            date: new Date().toISOString(),
            metadata
          });
        }
      } catch (txErr) {
        logSupabaseError("Erro ao salvar transação pendente no Supabase", txErr);
      }

      res.json({
        success: true,
        transactionId: txId,
        pixupTransactionId: pixupTxId,
        qrCode,
        qrCodeBase64,
        expiresAt: resData.payment_info?.expires_at
      });

    } catch (error: any) {
      console.error("Erro interno ao gerar PIX PixUP:", error);
      res.status(500).json({ error: error.message || "Erro interno do servidor ao gerar PIX." });
    }
  });

  const handlePixupWebhook = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const query = req.query || {};

      console.log("[PixUP Webhook] Payload recebido:", JSON.stringify(body));

      const event = body?.event || body?.type || query?.event || "";
      const txData = body?.data || body?.transaction || body;

      const externalId = txData?.external_id || body?.external_id || query?.external_id || body?.data?.external_id;
      const pixupTxId = txData?.transaction_id || txData?.id || body?.transaction_id || query?.['data.id'] || query?.id;
      const status = (txData?.status || body?.status || "").toLowerCase();

      const isConfirmed = event.includes("confirmed") ||
        event.includes("approved") ||
        event.includes("paid") ||
        status === "completed" ||
        status === "confirmed" ||
        status === "approved" ||
        status === "paid" ||
        status === "success";

      if (isConfirmed && (externalId || pixupTxId) && isServerSupabaseConfigured) {
        try {
          const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").single();
          const settings = settingsData && settingsData.data ? (typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data) : null;

          const { data: transactions } = await supabase.from("transactions").select("*").eq("status", "pending").eq("type", "deposit");
          
          if (transactions) {
            for (const tx of transactions) {
              const metadata = tx.metadata ? (typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata) : {};
              const txPixupId = metadata?.pixupTransactionId || metadata?.mpPaymentId;

              const isMatch = (externalId && String(tx.id) === String(externalId)) ||
                (pixupTxId && txPixupId && String(txPixupId) === String(pixupTxId));

              if (isMatch) {
                await supabase.from("transactions").update({ status: 'completed' }).eq("id", tx.id);
                
                const { data: user } = await supabase.from("users").select("balance, phone, name, email, referredBy, referralCounted").eq("id", tx.userId).single();
                if (user) {
                  const bonus = metadata?.bonus || 0;
                  const totalAdd = Number(tx.amount) + Number(bonus);
                  await supabase.from("users").update({ balance: (Number(user.balance) || 0) + totalAdd }).eq("id", tx.userId);
                  
                  if (user.referredBy && !user.referralCounted) {
                    const { data: referrer } = await supabase.from("users").select("id, referrals, unlockFirstWithdrawal").eq("id", user.referredBy).single();
                    if (referrer) {
                      const newReferrals = (Number(referrer.referrals) || 0) + 1;
                      let unlockFirstWithdrawal = referrer.unlockFirstWithdrawal;
                      if (newReferrals >= (settings?.referralsForFirstWithdrawal || 3)) {
                        unlockFirstWithdrawal = true;
                      }
                      await supabase.from("users").update({ referrals: newReferrals, unlockFirstWithdrawal }).eq("id", referrer.id);
                      await supabase.from("users").update({ referralCounted: true }).eq("id", tx.userId);
                    }
                  }

                  // Send deposit email notification to lediotattoo@proton.me
                  try {
                    await sendDepositNotificationEmail({
                      amount: tx.amount,
                      bonus,
                      userPhone: user.phone,
                      userName: user.name,
                      userEmail: user.email,
                      transactionId: tx.id,
                      settings
                    });
                  } catch (emailErr) {
                    console.warn("Erro ao enviar email de notificação:", emailErr);
                  }

                  // Check high deposit alert threshold
                  const alertThreshold = Number(settings?.adminDepositAlertThreshold || 100);
                  if (Number(tx.amount) >= alertThreshold) {
                    try {
                      await supabase.from("notifications").insert({
                        id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 7),
                        title: `🚨 Alerta: Depósito Alto PixUP (R$ ${Number(tx.amount).toFixed(2)})`,
                        message: `Depósito de R$ ${Number(tx.amount).toFixed(2)} confirmado via PixUP para ${user.name || user.email}.`,
                        type: 'success',
                        createdAt: new Date().toISOString()
                      });
                    } catch (notifErr) {
                      logSupabaseError("Erro ao criar notificação de depósito", notifErr);
                    }
                  }
                }

                console.log(`[PixUP] Depósito ${tx.id} concluído com sucesso para o usuário ${tx.userId}`);
                break;
              }
            }
          }
        } catch (innerErr) {
          logSupabaseError("Webhook inner error handled safely", innerErr);
        }
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      logSupabaseError("Webhook error caught safely", error);
      return res.status(200).json({ success: true });
    }
  };

  app.all(["/webhook", "/api/webhook", "/api/webhooks/pixup", "/app/webhook"], handlePixupWebhook);

  app.post("/api/notifications/deposit-approved", async (req, res) => {
    try {
      const { transactionId, amount, userPhone, userName, userEmail, bonus } = req.body || {};

      let settings = null;
      if (isServerSupabaseConfigured) {
        try {
          const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").single();
          if (settingsData && settingsData.data) {
            settings = typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data;
          }
        } catch (e) {
          logSupabaseError("Could not load settings in notification route", e);
        }
      }

      const sent = await sendDepositNotificationEmail({
        amount: Number(amount) || 0,
        bonus: Number(bonus) || 0,
        userPhone,
        userName,
        userEmail,
        transactionId,
        settings
      });

      return res.status(200).json({ success: true, sent });
    } catch (err: any) {
      console.error("Error in /api/notifications/deposit-approved:", err);
      return res.status(500).json({ error: err?.message || "Error sending email" });
    }
  });

  app.all("/api/payments/sync", async (req, res) => {
    try {
      const result = await syncAllPendingDeposits();
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("Error in /api/payments/sync:", err);
      return res.status(200).json({ approvedCount: 0, error: err?.message || "Error syncing payments" });
    }
  });

  app.all("/api/payments/check-status", async (req, res) => {
    try {
      const paymentId = req.query?.paymentId || req.body?.paymentId;
      const txId = req.query?.txId || req.body?.txId;
      const userId = req.query?.userId || req.body?.userId;

      const result = await verifyAndApprovePayment(paymentId, txId, userId);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("Error in /api/payments/check-status:", err);
      return res.status(200).json({ approved: false, error: err?.message || "Error checking payment status" });
    }
  });

  // Base API health check
  app.all(["/api", "/api/index", "/api/health"], (req, res) => {
    res.json({ status: "ok", service: "LT JOGOS API", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  
export default app;

import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { sendDepositNotificationEmail } from "./lib/sendDepositEmail";
import { verifyAndApprovePayment, syncAllPendingDeposits } from "./services/checkStatus";
import { getValidSupabaseCredentials } from "../src/lib/supabase";
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

console.log("Supabase initialized with URL:", validServerUrl || "offline placeholder");
export const supabase = createClient(
  validServerUrl || "https://placeholder.supabase.co",
  validServerKey || "placeholder"
);

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
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        console.log("Supabase info fetching users:", error.message || error);
        return res.json([]);
      }
      res.json((data || []).map((u: any) => ({
        ...u,
        unlockFirstWithdrawal: !!u.unlockFirstWithdrawal,
        referralCounted: !!u.referralCounted
      })));
    } catch (error: any) {
      console.log("Supabase offline/unreachable for users:", error.message || error);
      res.json([]);
    }
  });

  app.post("/api/users", async (req, res) => {
    console.log("POST /api/users called with body:", JSON.stringify(req.body));
    try {
      const { id, name, email, password, role, balance, earnings, createdAt, dailyPrizeTotal, lastPrizeDate, lastLoginBonusDate, referrals, unlockFirstWithdrawal, referralLink, withdrawalsCount, referredBy, referralCounted, phone } = req.body;
      console.log("Saving user:", id);
      const payload: any = {
        id, name, email, password, role, balance, earnings, createdAt, dailyPrizeTotal, lastPrizeDate, 
        lastLoginBonusDate: lastLoginBonusDate || null,
        referrals: referrals || 0, 
        unlockFirstWithdrawal: unlockFirstWithdrawal ? true : false, 
        referralLink: referralLink || '', 
        withdrawalsCount: withdrawalsCount || 0, 
        referredBy: referredBy || null, 
        referralCounted: referralCounted ? true : false,
        phone: phone || null
      };
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
        console.log("Supabase save user status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note saving user:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  app.get("/api/games", async (req, res) => {
    try {
      const { data, error } = await supabase.from("games").select("*");
      if (error) {
        console.log("Supabase info fetching games:", error.message || error);
        return res.json([]);
      }
      res.json((data || []).map((g: any) => ({ ...g, active: !!g.active, featured: !!g.featured })));
    } catch (error: any) {
      console.log("Supabase offline/unreachable for games:", error.message || error);
      res.json([]);
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const { id, name, active, minBet, maxBet, rtp, thumbnail, bgPage, bgContainer, bgMusic, category, featured } = req.body;
      const payload: any = {
        id, name, active: !!active, minBet, maxBet, rtp, thumbnail, bgPage, bgContainer, bgMusic, category, featured: !!featured
      };
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
        console.log("Supabase save game status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note saving game:", error.message || error);
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
      } catch (e) {
        console.warn("Supabase fetch error in /api/slots/spin:", e);
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
      const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false });
      if (error) {
        console.warn("Supabase info fetching transactions:", error.message || error);
        return res.json([]);
      }
      res.json((data || []).map((t: any) => ({ ...t, metadata: t.metadata ? (typeof t.metadata === 'string' ? JSON.parse(t.metadata) : t.metadata) : null })));
    } catch (error: any) {
      console.log("Supabase offline/unreachable for transactions:", error.message || error);
      res.json([]);
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { id, userId, type, amount, status, date, gameId, metadata } = req.body;
      const { error } = await supabase.from("transactions").upsert({
        id, userId, type, amount, status, date, gameId, metadata: metadata || null
      });
      if (error) {
        console.log("Supabase save transaction status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note saving transaction:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const { data, error } = await supabase.from("settings").select("data").eq("id", "global").maybeSingle();
      if (error) {
        console.log("Supabase info fetching settings:", error.message || error);
        return res.json(null);
      }
      if (data && data.data) {
        res.json(typeof data.data === 'string' ? JSON.parse(data.data) : data.data);
      } else {
        res.json(null);
      }
    } catch (error: any) {
      console.log("Supabase offline/unreachable for settings:", error.message || error);
      res.json(null);
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { error } = await supabase.from("settings").upsert({
        id: 'global',
        data: req.body
      });
      if (error) {
        console.log("Supabase save settings status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note saving settings:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const { data, error } = await supabase.from("notifications").select("*").order("createdAt", { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.message?.includes("fetch failed") || error.message?.includes("ENOTFOUND")) {
          return res.json([]);
        }
        console.log("Supabase info fetching notifications:", error.message || error);
        return res.json([]);
      }
      res.json(data || []);
    } catch (error: any) {
      console.log("Supabase offline/unreachable for notifications:", error.message || error);
      res.json([]);
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const { id, title, message, type, createdAt, targetUserId } = req.body;
      const { error } = await supabase.from("notifications").upsert({
        id, title, message, type, createdAt, targetUserId: targetUserId || null
      });
      if (error) {
        console.log("Supabase save notification status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note saving notification:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", req.params.id);
      if (error) {
        console.log("Supabase delete notification status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note deleting notification:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/transactions", async (req, res) => {
    try {
      const { error } = await supabase.from("transactions").delete().neq("id", "none");
      if (error) {
        console.log("Supabase delete transactions status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note deleting transactions:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  app.post("/api/admin/reset-financial-data", async (req, res) => {
    try {
      console.log("Resetting all financial data, transactions and user balances...");
      
      // 1. Delete all transactions
      try {
        await supabase.from("transactions").delete().neq("id", "none");
      } catch (txErr) {
        console.warn("Error deleting transactions:", txErr);
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
        console.warn("Error resetting user balances:", uErr);
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
        console.warn("Error resetting platformDailyPrizeTotal:", sErr);
      }

      res.json({ success: true, message: "Dados financeiros zerados com sucesso. Usuários mantidos." });
    } catch (error: any) {
      console.log("Error in /api/admin/reset-financial-data:", error);
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/users", async (req, res) => {
    try {
      const { error } = await supabase.from("users").delete().neq("id", "none");
      if (error) {
        console.log("Supabase delete users status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note deleting users:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Delete associated transactions first to prevent foreign key constraint violations
      try {
        await supabase.from("transactions").delete().eq("userId", id);
      } catch (e) {
        // ignore
      }
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) {
        console.log("Supabase delete user status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note deleting user:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  // Promotions
  app.get("/api/promotions", async (req, res) => {
    try {
      const { data, error } = await supabase.from("promotions").select("*").order("createdAt", { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.message?.includes("fetch failed") || error.message?.includes("ENOTFOUND")) {
          return res.json([]);
        }
        console.log("Supabase info fetching promotions:", error.message || error);
        return res.json([]);
      }
      res.json((data || []).map((p: any) => ({ ...p, active: !!p.active })));
    } catch (error: any) {
      console.log("Supabase offline/unreachable for promotions:", error.message || error);
      res.json([]);
    }
  });

  app.post("/api/promotions", async (req, res) => {
    try {
      const { id, title, description, code, discount, active, createdAt } = req.body;
      const { error } = await supabase.from("promotions").upsert({
        id, title, description, code, discount, active: !!active, createdAt
      });
      if (error) {
        console.log("Supabase save promotion status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note saving promotion:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/promotions/:id", async (req, res) => {
    try {
      const { error } = await supabase.from("promotions").delete().eq("id", req.params.id);
      if (error) {
        console.log("Supabase delete promotion status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note deleting promotion:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  // Banners
  app.get("/api/banners", async (req, res) => {
    try {
      const { data, error } = await supabase.from("banners").select("*").order("createdAt", { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.message?.includes("fetch failed") || error.message?.includes("ENOTFOUND")) {
          return res.json([]);
        }
        console.log("Supabase info fetching banners:", error.message || error);
        return res.json([]);
      }
      res.json((data || []).map((b: any) => ({ ...b, active: !!b.active })));
    } catch (error: any) {
      console.log("Supabase offline/unreachable for banners:", error.message || error);
      res.json([]);
    }
  });

  app.post("/api/banners", async (req, res) => {
    try {
      const { id, imageUrl, link, active, createdAt } = req.body;
      const { error } = await supabase.from("banners").upsert({
        id, imageUrl, link, active: !!active, createdAt
      });
      if (error) {
        console.log("Supabase save banner status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note saving banner:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  app.delete("/api/banners/:id", async (req, res) => {
    try {
      const { error } = await supabase.from("banners").delete().eq("id", req.params.id);
      if (error) {
        console.log("Supabase delete banner status:", error.message || error);
        return res.json({ success: true, warning: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.log("Internal/network note deleting banner:", error.message || error);
      res.json({ success: true, offline: true });
    }
  });

  // PixUP Gateway Helpers
  let pixupCachedToken: string | null = null;
  let pixupTokenExpiresAt: number = 0;

  async function getPixupAccessToken(clientId: string, clientSecret: string): Promise<string> {
    const cId = (clientId || '').trim();
    const cSecret = (clientSecret || '').trim();
    if (!cId || !cSecret) {
      throw new Error("Client ID e Client Secret da PixUP não configurados.");
    }

    const now = Date.now();
    if (pixupCachedToken && pixupTokenExpiresAt > now + 30000) {
      return pixupCachedToken;
    }

    const basicAuth = Buffer.from(`${cId}:${cSecret}`).toString('base64');
    console.log(`[PixUP Auth] Gerando token para Client ID: ${cId.substring(0, 10)}...`);

    const authRes = await fetch("https://api.pixupbr.com/v2/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json"
      }
    });

    const authData: any = await authRes.json();
    if (!authRes.ok || authData.success === false) {
      const errDetail = authData.error?.message || authData.message || authData.error || "Falha na autenticação da PixUP. Verifique Client ID e Client Secret.";
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
        const errDetail = authData.error?.message || authData.message || authData.error || `HTTP ${authRes.status}: Credenciais recusadas pela PixUP.`;
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
      if ((!clientId || !clientSecret) && !directToken) {
        try {
          const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").maybeSingle();
          if (settingsData && settingsData.data) {
            settings = typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data;
            if (settings) {
              if (!clientId) clientId = (settings.pixupClientId || "").trim();
              if (!clientSecret) clientSecret = (settings.pixupClientSecret || "").trim();
              if (settings.pixupPostbackUrl) postback_url = settings.pixupPostbackUrl.trim();
              if (!directToken) directToken = (settings.pixupToken || settings.mpAccessToken || "").trim();
            }
          }
        } catch (e) {
          console.warn("Não foi possível buscar configurações do Supabase:", e);
        }
      }

      if (!clientId) {
        clientId = "adrianoledio_f27410f412960abf";
      }

      let authToken = directToken;
      if (!authToken && clientId && clientSecret) {
        authToken = await getPixupAccessToken(clientId, clientSecret);
      }
      
      if (!authToken) {
        console.error("Credenciais PixUP não configuradas.");
        return res.status(400).json({
          error: "Credenciais PixUP não configuradas. Adicione seu Client Secret no painel Admin (Configurações > Gateway)."
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
      
      const pixupResponse = await fetch("https://api.pixupbr.com/v2/transactions/cashin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken.trim()}`
        },
        body: JSON.stringify(pixupPayload)
      });

      const pixupData: any = await pixupResponse.json();
      console.log("[PixUP] Resposta da API:", pixupResponse.status, JSON.stringify(pixupData));

      if (!pixupResponse.ok || pixupData.success === false) {
        console.error("Erro na PixUP:", pixupData);
        const detail = pixupData.message ||
          pixupData.error ||
          pixupData.details?.message ||
          (typeof pixupData === 'string' ? pixupData : "Erro ao gerar PIX na PixUP.");
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
        await supabase.from("transactions").insert({
          id: txId,
          userId,
          type: "deposit",
          amount: Number(amount),
          status: "pending",
          date: new Date().toISOString(),
          metadata
        });
      } catch (txErr) {
        console.warn("Erro ao salvar transação pendente no Supabase:", txErr);
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

      if (isConfirmed && (externalId || pixupTxId)) {
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
                      console.warn("Erro ao criar notificação de depósito:", notifErr);
                    }
                  }
                }

                console.log(`[PixUP] Depósito ${tx.id} concluído com sucesso para o usuário ${tx.userId}`);
                break;
              }
            }
          }
        } catch (innerErr) {
          console.warn("Webhook inner error handled safely:", innerErr);
        }
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Webhook error caught safely:", error);
      return res.status(200).json({ success: true });
    }
  };

  app.all(["/webhook", "/api/webhook", "/api/webhooks/pixup", "/app/webhook"], handlePixupWebhook);

  app.post("/api/notifications/deposit-approved", async (req, res) => {
    try {
      const { transactionId, amount, userPhone, userName, userEmail, bonus } = req.body || {};

      let settings = null;
      try {
        const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").single();
        if (settingsData && settingsData.data) {
          settings = typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data;
        }
      } catch (e) {
        console.warn("Could not load settings in notification route:", e);
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

import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase Configuration
let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
// Prioritize SECRET_KEY for full server database authorization, then PUBLISHABLE_KEY, then VITE_SUPABASE_ANON_KEY
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (supabaseUrl && !supabaseUrl.startsWith("http")) {
  supabaseUrl = `https://${supabaseUrl}`;
}

if (!supabaseUrl || !supabaseKey) {
  console.warn("CRITICAL: Supabase configuration is missing!");
  console.warn("Please ensure SUPABASE_URL and either SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY are configured in your environment.");
} else {
  try {
    const url = new URL(supabaseUrl);
    console.log("Supabase URL configured:", url.hostname);
    if (!url.hostname.includes("supabase.co")) {
      console.warn("WARNING: Supabase URL might be incorrect (should normally be [id].supabase.co):", url.hostname);
    }
  } catch (e) {
    console.warn("CRITICAL: Supabase URL is not a valid URL:", supabaseUrl);
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test and Seed Supabase connection on startup
async function testAndSeedSupabase() {
  try {
    const tables = ["users", "games", "transactions", "settings", "notifications", "promotions", "banners"];
    let reachable = true;
    for (const table of tables) {
      const { error } = await supabase.from(table).select("id").limit(1);
      if (error) {
        if (error.message?.includes("fetch failed") || error.message?.includes("ENOTFOUND") || error.message?.includes("fetch")) {
          console.log("Supabase is unreachable. Running in LocalStorage / Offline mode as requested.");
          reachable = false;
          break;
        }
        console.log(`Supabase check info for table '${table}':`, error.message);
      } else {
        console.log(`Supabase connection successful for table '${table}'.`);
      }
    }

    if (reachable) {
      console.log("Seeding default data if empty...");

      // 1. Seed settings
      const { data: settingsData, error: settingsError } = await supabase.from("settings").select("id").eq("id", "global").single();
      if (settingsError && (settingsError.code === "PGRST116" || settingsError.message?.includes("contains 0 rows"))) {
        console.log("Seeding DEFAULT_SETTINGS to Supabase...");
        const DEFAULT_SETTINGS = {
          siteName: "LT JOGOS",
          logo: "",
          primaryColor: "#FFCC00",
          globalMusic: "",
          minDeposit: 20,
          minWithdrawal: 60,
          custoRealPorPremio: 50,
          valorApareceParaJogador: 200,
          limiteUsuarioDiario: 100,
          limitePlataformaDiario: 500,
          platformDailyPrizeTotal: 0,
          lastPlatformPrizeDate: new Date().toISOString().split('T')[0],
          mpAccessToken: "",
          gamePrizes: [
            {
              gameId: "slots",
              premios: [
                { tipo: "Comum", peso: 50, premioMin: 50, premioMax: 50, custoReal: 12.5 },
                { tipo: "Médio", peso: 30, premioMin: 100, premioMax: 100, custoReal: 25 },
                { tipo: "Raro", peso: 15, premioMin: 150, premioMax: 180, custoReal: 37.5 },
                { tipo: "Premium", peso: 5, premioMin: 180, premioMax: 200, custoReal: 50 }
              ]
            },
            {
              gameId: "roletas",
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
        await supabase.from("settings").insert({ id: "global", data: DEFAULT_SETTINGS });
      }

      // 2. Seed games
      console.log("Checking games in Supabase...");
      const { data: existingGames, error: gamesFetchError } = await supabase.from("games").select("id");
      const existingIds = new Set((existingGames || []).map((g: any) => g.id));

      console.log("Seeding missing DEFAULT_GAMES to Supabase...");
      const DEFAULT_GAMES = [
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
          thumbnail: '/images/calavera_ink_cover_1784495373476.jpg',
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
      ];
      
      for (const g of DEFAULT_GAMES) {
        if (!existingIds.has(g.id)) {
          console.log(`Seeding game ${g.id} to Supabase...`);
          await supabase.from("games").upsert(g);
        }
      }

      // 3. Seed default admin users if they do not exist
      const { data: usersData, error: usersError } = await supabase.from("users").select("id");
      if (!usersError && usersData) {
        const hasAdmin1 = usersData.some(u => u.id === 'admin-1');
        const hasAdminPhone = usersData.some(u => u.id === 'admin-phone-21982331392');

        if (!hasAdmin1) {
          console.log("Seeding default admin-1 user...");
          await supabase.from("users").upsert({
            id: "admin-1",
            name: "Admin",
            email: "admin@ltjogos.com",
            password: "admin",
            role: "admin",
            balance: 100,
            earnings: 0,
            createdAt: new Date().toISOString(),
            dailyPrizeTotal: 0,
            lastPrizeDate: new Date().toISOString().split("T")[0],
            referrals: 0,
            unlockFirstWithdrawal: true,
            referralLink: "",
            withdrawalsCount: 0,
            phone: null
          });
        }

        if (!hasAdminPhone) {
          console.log("Seeding default admin-phone-21982331392 user...");
          await supabase.from("users").upsert({
            id: "admin-phone-21982331392",
            name: "Tatuador Adriano Ledio",
            email: "tatuador.adrianoledio@gmail.com",
            phone: "21982331392",
            password: "megabell",
            role: "admin",
            balance: 999999,
            earnings: 0,
            createdAt: new Date().toISOString(),
            dailyPrizeTotal: 0,
            lastPrizeDate: new Date().toISOString().split("T")[0],
            referrals: 0,
            unlockFirstWithdrawal: true,
            referralLink: "https://example.com/register?ref=admin-phone-21982331392",
            withdrawalsCount: 0
          });
        }
      }
    }
  } catch (err: any) {
    console.log("Unexpected error testing/seeding Supabase:", err.message || err);
  }
}
testAndSeedSupabase();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
  const PORT = 3000;

  // API routes
  app.get("/api/users", async (req, res) => {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist")) {
          return res.json([]);
        }
        console.error("Supabase error fetching users:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json((data || []).map((u: any) => ({
        ...u,
        unlockFirstWithdrawal: !!u.unlockFirstWithdrawal,
        referralCounted: !!u.referralCounted
      })));
    } catch (error: any) {
      console.error("Network error fetching users:", error.message || error);
      res.json([]);
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { id, name, email, password, role, balance, earnings, createdAt, dailyPrizeTotal, lastPrizeDate, referrals, unlockFirstWithdrawal, referralLink, withdrawalsCount, referredBy, referralCounted, phone } = req.body;
      const { error } = await supabase.from("users").upsert({
        id, name, email, password, role, balance, earnings, createdAt, dailyPrizeTotal, lastPrizeDate, 
        referrals: referrals || 0, 
        unlockFirstWithdrawal: unlockFirstWithdrawal ? true : false, 
        referralLink: referralLink || '', 
        withdrawalsCount: withdrawalsCount || 0, 
        referredBy: referredBy || null, 
        referralCounted: referralCounted ? true : false,
        phone: phone || null
      });
      if (error) {
        console.error("Supabase error saving user:", error);
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Internal error saving user:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/games", async (req, res) => {
    try {
      const { data, error } = await supabase.from("games").select("*");
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist")) {
          return res.json([]);
        }
        console.error("Supabase error fetching games:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json((data || []).map((g: any) => ({ ...g, active: !!g.active })));
    } catch (error: any) {
      console.error("Network error fetching games:", error.message || error);
      res.json([]);
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const { id, name, active, minBet, maxBet, rtp, thumbnail, bgPage, bgContainer, bgMusic, category } = req.body;
      const { error } = await supabase.from("games").upsert({
        id, name, active: !!active, minBet, maxBet, rtp, thumbnail, bgPage, bgContainer, bgMusic, category
      });
      if (error) {
        console.error("Supabase error saving game:", error);
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Internal error saving game:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist")) {
          return res.json([]);
        }
        console.error("Supabase error fetching transactions:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json((data || []).map((t: any) => ({ ...t, metadata: t.metadata ? (typeof t.metadata === 'string' ? JSON.parse(t.metadata) : t.metadata) : null })));
    } catch (error: any) {
      console.error("Internal error fetching transactions:", error);
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
        console.error("Supabase error saving transaction:", error);
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Internal error saving transaction:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const { data, error } = await supabase.from("settings").select("data").eq("id", "global").single();
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist")) {
          return res.json(null);
        }
        if (error.code !== 'PGRST116') {
          console.error("Supabase error fetching settings:", error);
          return res.status(500).json({ error: error.message });
        }
      }
      if (data && data.data) {
        res.json(typeof data.data === 'string' ? JSON.parse(data.data) : data.data);
      } else {
        res.json(null);
      }
    } catch (error: any) {
      console.error("Network error fetching settings:", error.message || error);
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
        console.error("Supabase error saving settings:", error);
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Internal error saving settings:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const { data, error } = await supabase.from("notifications").select("*").order("createdAt", { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist")) {
          return res.json([]);
        }
        console.error("Supabase error fetching notifications:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json(data || []);
    } catch (error: any) {
      console.error("Internal error fetching notifications:", error);
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
        console.error("Supabase error saving notification:", error);
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Internal error saving notification:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", req.params.id);
      if (error) {
        console.error("Supabase error deleting notification:", error);
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Internal error deleting notification:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Promotions
  app.get("/api/promotions", async (req, res) => {
    try {
      const { data, error } = await supabase.from("promotions").select("*").order("createdAt", { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist")) {
          return res.json([]);
        }
        console.error("Supabase error fetching promotions:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json((data || []).map((p: any) => ({ ...p, active: !!p.active })));
    } catch (error: any) {
      console.error("Internal error fetching promotions:", error);
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
        console.error("Supabase error saving promotion:", error);
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Internal error saving promotion:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.delete("/api/promotions/:id", async (req, res) => {
    try {
      const { error } = await supabase.from("promotions").delete().eq("id", req.params.id);
      if (error) {
        console.error("Supabase error deleting promotion:", error);
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Internal error deleting promotion:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Banners
  app.get("/api/banners", async (req, res) => {
    try {
      const { data, error } = await supabase.from("banners").select("*").order("createdAt", { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.message?.includes("Could not find the table") || error.message?.includes("does not exist")) {
          return res.json([]);
        }
        console.error("Supabase error fetching banners:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json((data || []).map((b: any) => ({ ...b, active: !!b.active })));
    } catch (error: any) {
      console.error("Internal error fetching banners:", error);
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
        console.error("Supabase error saving banner:", error);
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Internal error saving banner:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.delete("/api/banners/:id", async (req, res) => {
    try {
      const { error } = await supabase.from("banners").delete().eq("id", req.params.id);
      if (error) {
        console.error("Supabase error deleting banner:", error);
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Internal error deleting banner:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Mercado Pago Endpoints
  app.post("/api/payments/pix", async (req, res) => {
    try {
      const { amount, userId, email } = req.body;
      
      const { data: settingsData, error: settingsError } = await supabase.from("settings").select("data").eq("id", "global").single();
      if (settingsError) throw settingsError;
      const settings = settingsData && settingsData.data ? (typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data) : null;
      
      if (!settings || !settings.mpAccessToken) {
        return res.status(400).json({ error: "Mercado Pago não configurado." });
      }

      const idempotencyKey = Math.random().toString(36).substring(2, 15);
      
      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.mpAccessToken}`,
          "X-Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          transaction_amount: amount,
          description: "Depósito na Plataforma",
          payment_method_id: "pix",
          notification_url: `https://${req.get('host')}/api/webhooks/mercadopago`,
          payer: {
            email: email || "usuario@exemplo.com",
            first_name: "Usuário",
            last_name: "Plataforma"
          }
        })
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error("Erro no Mercado Pago:", mpData);
        return res.status(400).json({ error: "Erro ao gerar PIX no Mercado Pago." });
      }

      // Create pending transaction
      const txId = Math.random().toString(36).substring(2, 9);
      const metadata = {
        mpPaymentId: mpData.id,
        qrCodeBase64: mpData.point_of_interaction.transaction_data.qr_code_base64,
        qrCode: mpData.point_of_interaction.transaction_data.qr_code
      };

      const { error: txError } = await supabase.from("transactions").insert({
        id: txId,
        userId,
        type: "deposit",
        amount,
        status: "pending",
        date: new Date().toISOString(),
        metadata
      });
      if (txError) throw txError;

      res.json({
        success: true,
        transactionId: txId,
        qrCodeBase64: metadata.qrCodeBase64,
        qrCode: metadata.qrCode
      });

    } catch (error) {
      console.error("Erro interno ao gerar PIX:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });

  app.post("/api/webhooks/mercadopago", async (req, res) => {
    try {
      const { type, data } = req.body;
      
      // We only care about payment updates
      if (type === "payment" && data && data.id) {
        const paymentId = data.id;
        
        const { data: settingsData, error: settingsError } = await supabase.from("settings").select("data").eq("id", "global").single();
        if (settingsError) throw settingsError;
        const settings = settingsData && settingsData.data ? (typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data) : null;
        
        if (!settings || !settings.mpAccessToken) {
          return res.status(400).send("MP not configured");
        }

        // Fetch payment details from MP
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            "Authorization": `Bearer ${settings.mpAccessToken}`
          }
        });

        const mpData = await mpResponse.json();

        if (mpData.status === "approved") {
          // Find the transaction with this payment ID
          const { data: transactions, error: txsError } = await supabase.from("transactions").select("*").eq("status", "pending").eq("type", "deposit");
          if (txsError) throw txsError;
          
          for (const tx of transactions) {
            const metadata = tx.metadata ? (typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata) : null;
            if (metadata && metadata.mpPaymentId === paymentId) {
              // Mark as completed
              await supabase.from("transactions").update({ status: 'completed' }).eq("id", tx.id);
              
              // Update user balance
              const { data: user, error: userError } = await supabase.from("users").select("balance, referredBy, referralCounted").eq("id", tx.userId).single();
              if (userError) throw userError;

              await supabase.from("users").update({ balance: (user.balance || 0) + tx.amount }).eq("id", tx.userId);
              
              // Check for referral bonus on first deposit
              if (user.referredBy && !user.referralCounted) {
                const { data: referrer, error: referrerError } = await supabase.from("users").select("id, referrals, unlockFirstWithdrawal").eq("id", user.referredBy).single();
                if (!referrerError && referrer) {
                  const newReferrals = (referrer.referrals || 0) + 1;
                  let unlockFirstWithdrawal = referrer.unlockFirstWithdrawal;
                  if (newReferrals >= (settings.referralsForFirstWithdrawal || 3)) {
                    unlockFirstWithdrawal = true;
                  }
                  await supabase.from("users").update({ referrals: newReferrals, unlockFirstWithdrawal }).eq("id", referrer.id);
                  await supabase.from("users").update({ referralCounted: true }).eq("id", tx.userId);
                }
              }

              console.log(`Payment ${paymentId} approved and processed for user ${tx.userId}`);
              break;
            }
          }
        }
      }
      
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Error");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

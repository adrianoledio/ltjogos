import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase Configuration
let supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (supabaseUrl && !supabaseUrl.startsWith("http")) {
  supabaseUrl = `https://${supabaseUrl}`;
}

if (!supabaseUrl || !supabaseKey) {
  console.warn("CRITICAL: Supabase configuration is missing!");
  console.warn("Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.");
} else {
  try {
    const url = new URL(supabaseUrl);
    console.log("Supabase URL configured:", url.hostname);
    if (!url.hostname.includes("supabase.co")) {
      console.warn("WARNING: Supabase URL might be incorrect (should normally be [id].supabase.co):", url.hostname);
    }
  } catch (e) {
    console.warn("CRITICAL: VITE_SUPABASE_URL is not a valid URL:", supabaseUrl);
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection on startup
async function testSupabase() {
  try {
    const tables = ["users", "games", "transactions", "settings", "notifications", "promotions", "banners"];
    for (const table of tables) {
      const { error } = await supabase.from(table).select("id").limit(1);
      if (error) {
        if (error.message?.includes("fetch failed") || error.message?.includes("ENOTFOUND") || error.message?.includes("fetch")) {
          console.log("Supabase is unreachable. Running in LocalStorage / Offline mode as requested.");
          break;
        }
        console.log(`Supabase check info for table '${table}':`, error.message);
      } else {
        console.log(`Supabase connection successful for table '${table}'.`);
      }
    }
  } catch (err: any) {
    console.log("Unexpected error testing Supabase:", err.message || err);
  }
}
testSupabase();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
  const PORT = 3000;

  // API routes
  app.get("/api/users", async (req, res) => {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        if (error.message.includes("Could not find the table")) {
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
      res.status(500).json({ error: "Erro de conexão com o banco de dados: " + (error.message || "Unknown error") });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { id, name, email, password, role, balance, earnings, createdAt, dailyPrizeTotal, lastPrizeDate, referrals, unlockFirstWithdrawal, referralLink, withdrawalsCount, referredBy, referralCounted } = req.body;
      const { error } = await supabase.from("users").upsert({
        id, name, email, password, role, balance, earnings, createdAt, dailyPrizeTotal, lastPrizeDate, 
        referrals: referrals || 0, 
        unlockFirstWithdrawal: unlockFirstWithdrawal ? true : false, 
        referralLink: referralLink || '', 
        withdrawalsCount: withdrawalsCount || 0, 
        referredBy: referredBy || null, 
        referralCounted: referralCounted ? true : false
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
        if (error.message.includes("Could not find the table")) {
          return res.json([]);
        }
        console.error("Supabase error fetching games:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json((data || []).map((g: any) => ({ ...g, active: !!g.active })));
    } catch (error: any) {
      console.error("Network error fetching games:", error.message || error);
      res.status(500).json({ error: "Erro de conexão com o banco de dados" });
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
        if (error.message.includes("Could not find the table")) {
          return res.json([]);
        }
        console.error("Supabase error fetching transactions:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json(data.map((t: any) => ({ ...t, metadata: t.metadata ? (typeof t.metadata === 'string' ? JSON.parse(t.metadata) : t.metadata) : null })));
    } catch (error: any) {
      console.error("Internal error fetching transactions:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
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
        if (error.message?.includes("Could not find the table")) {
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
      res.status(500).json({ error: "Erro de conexão" });
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
        if (error.message.includes("Could not find the table")) {
          return res.json([]);
        }
        console.error("Supabase error fetching notifications:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json(data);
    } catch (error: any) {
      console.error("Internal error fetching notifications:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
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
        if (error.message.includes("Could not find the table")) {
          return res.json([]);
        }
        console.error("Supabase error fetching promotions:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json(data.map((p: any) => ({ ...p, active: !!p.active })));
    } catch (error: any) {
      console.error("Internal error fetching promotions:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
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
        if (error.message.includes("Could not find the table")) {
          return res.json([]);
        }
        console.error("Supabase error fetching banners:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json(data.map((b: any) => ({ ...b, active: !!b.active })));
    } catch (error: any) {
      console.error("Internal error fetching banners:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
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

import { createClient } from "@supabase/supabase-js";
import { sendDepositNotificationEmail } from "../lib/sendDepositEmail";

export async function approvePendingTx(supabase: any, tx: any, settings: any) {
  if (tx.status === 'completed') return true;

  const metadata = tx.metadata ? (typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata) : {};
  const bonus = Number(metadata?.bonus || 0);
  const totalAdd = Number(tx.amount) + bonus;

  // Mark completed
  await supabase.from("transactions").update({ status: 'completed' }).eq("id", tx.id);

  const { data: user } = await supabase.from("users").select("id, balance, phone, name, email, referredBy, referralCounted").eq("id", tx.userId).single();

  if (user) {
    const newBalance = (Number(user.balance) || 0) + totalAdd;
    await supabase.from("users").update({ balance: newBalance }).eq("id", user.id);

    // Referral logic
    if (user.referredBy && !user.referralCounted) {
      const { data: referrer } = await supabase.from("users").select("id, referrals, unlockFirstWithdrawal").eq("id", user.referredBy).single();
      if (referrer) {
        const newReferrals = (referrer.referrals || 0) + 1;
        let unlockFirstWithdrawal = referrer.unlockFirstWithdrawal;
        if (newReferrals >= (settings?.referralsForFirstWithdrawal || 3)) {
          unlockFirstWithdrawal = true;
        }
        await supabase.from("users").update({ referrals: newReferrals, unlockFirstWithdrawal }).eq("id", referrer.id);
        await supabase.from("users").update({ referralCounted: true }).eq("id", user.id);
      }
    }

    // Email notification
    try {
      await sendDepositNotificationEmail({
        amount: Number(tx.amount),
        bonus,
        userPhone: user.phone,
        userName: user.name,
        userEmail: user.email,
        transactionId: tx.id,
        settings
      });
    } catch (emailErr) {
      console.warn("Could not send deposit email notification:", emailErr);
    }
    return true;
  }
  return false;
}

export async function syncAllPendingDeposits() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    return { approvedCount: 0, error: "Supabase not configured" };
  }

  const supabase = createClient(supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`, supabaseKey);

  // 1. Get settings for mpAccessToken
  const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").single();
  const settings = settingsData && settingsData.data ? (typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data) : null;
  const mpAccessToken = settings?.mpAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN;

  if (!mpAccessToken) {
    return { approvedCount: 0, error: "mpAccessToken missing" };
  }

  // 2. Get all pending deposit transactions
  const { data: pendingTxs } = await supabase.from("transactions").select("*").eq("type", "deposit").eq("status", "pending");
  if (!pendingTxs || pendingTxs.length === 0) {
    return { approvedCount: 0, message: "No pending deposits" };
  }

  // 3. Search recent approved payments in Mercado Pago
  let mpApprovedPayments: any[] = [];
  try {
    const mpSearchRes = await fetch("https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=50", {
      headers: { "Authorization": `Bearer ${mpAccessToken.trim()}` }
    });
    if (mpSearchRes.ok) {
      const searchData = await mpSearchRes.json();
      const results = searchData.results || [];
      mpApprovedPayments = results.filter((p: any) => p.status === "approved");
    }
  } catch (err) {
    console.warn("Error fetching MP recent payments search:", err);
  }

  let approvedCount = 0;

  for (const tx of pendingTxs) {
    const metadata = tx.metadata ? (typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata) : {};
    const mpPaymentId = metadata?.mpPaymentId;

    let isApproved = false;

    // Check direct payment ID first if we have it
    if (mpPaymentId) {
      try {
        const directRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
          headers: { "Authorization": `Bearer ${mpAccessToken.trim()}` }
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData && directData.status === "approved") {
            isApproved = true;
          }
        }
      } catch (e) {
        console.warn(`Direct MP fetch failed for payment ${mpPaymentId}:`, e);
      }
    }

    // If not approved by direct ID, check in recent search results by ID or Amount
    if (!isApproved && mpApprovedPayments.length > 0) {
      const matchingMp = mpApprovedPayments.find((mp: any) => {
        if (mpPaymentId && String(mp.id) === String(mpPaymentId)) return true;
        // Match by amount if created within same timeframe
        if (Number(mp.transaction_amount) === Number(tx.amount)) {
          const txTime = new Date(tx.date || tx.createdAt).getTime();
          const mpTime = new Date(mp.date_created || mp.date_approved).getTime();
          // Within 2 hours
          if (Math.abs(txTime - mpTime) < 2 * 60 * 60 * 1000) {
            return true;
          }
        }
        return false;
      });

      if (matchingMp) {
        isApproved = true;
      }
    }

    if (isApproved) {
      const ok = await approvePendingTx(supabase, tx, settings);
      if (ok) approvedCount++;
    }
  }

  return { approvedCount, pendingChecked: pendingTxs.length };
}

export async function verifyAndApprovePayment(paymentId: string | number, txId?: string, targetUserId?: string) {
  // Always trigger a sync of all pending deposits
  await syncAllPendingDeposits().catch(e => console.warn("syncAllPendingDeposits error:", e));

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    return { approved: false, reason: "Supabase not configured" };
  }

  const supabase = createClient(supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`, supabaseKey);

  let query = supabase.from("transactions").select("*").eq("type", "deposit");
  if (txId) {
    query = query.eq("id", txId);
  } else if (targetUserId) {
    query = query.eq("userId", targetUserId);
  }

  const { data: transactions } = await query;
  if (!transactions || transactions.length === 0) {
    return { approved: false, reason: "No transaction found" };
  }

  const completedTx = transactions.find(t => t.status === "completed");
  if (completedTx) {
    const { data: user } = await supabase.from("users").select("balance").eq("id", completedTx.userId).single();
    return { approved: true, status: "approved", newBalance: user?.balance || 0, txId: completedTx.id };
  }

  return { approved: false, status: "pending" };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.query?.all === "true" || req.body?.all === true) {
      const syncResult = await syncAllPendingDeposits();
      return res.status(200).json(syncResult);
    }

    const paymentId = req.query?.paymentId || req.body?.paymentId;
    const txId = req.query?.txId || req.body?.txId;
    const userId = req.query?.userId || req.body?.userId;

    const result = await verifyAndApprovePayment(paymentId, txId, userId);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Error checking payment status:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

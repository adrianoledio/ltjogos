import { createClient } from "@supabase/supabase-js";
import { sendDepositNotificationEmail } from "../lib/sendDepositEmail";
import { getValidSupabaseCredentials } from "../../src/lib/supabase";

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
  const { url: supabaseUrl, key: supabaseKey } = getValidSupabaseCredentials();

  if (!supabaseUrl || !supabaseKey) {
    return { approvedCount: 0, error: "Supabase not configured" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Get settings for pixup credentials
  const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").single();
  const settings = settingsData && settingsData.data ? (typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data) : null;
  
  let pixupToken = settings?.pixupToken || process.env.PIXUP_API_TOKEN || process.env.PIXUP_TOKEN || process.env.VITE_PIXUP_TOKEN;
  const clientId = settings?.pixupClientId || process.env.PIXUP_CLIENT_ID || "adrianoledio_f27410f412960abf";
  const clientSecret = settings?.pixupClientSecret || process.env.PIXUP_CLIENT_SECRET;

  if (!pixupToken && clientId && clientSecret) {
    try {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const authRes = await fetch("https://api.pixupbr.com/v2/oauth/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/json"
        }
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        pixupToken = authData.access_token || authData.accessToken || authData.token || authData.data?.access_token;
      }
    } catch (e) {
      console.warn("PixUP OAuth token generation failed in check-status:", e);
    }
  }

  // 2. Get all pending deposit transactions
  const { data: pendingTxs } = await supabase.from("transactions").select("*").eq("type", "deposit").eq("status", "pending");
  if (!pendingTxs || pendingTxs.length === 0) {
    return { approvedCount: 0, message: "No pending deposits" };
  }

  let approvedCount = 0;

  if (pixupToken) {
    for (const tx of pendingTxs) {
      const metadata = tx.metadata ? (typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata) : {};
      const pixupTxId = metadata?.pixupTransactionId || metadata?.mpPaymentId;

      if (pixupTxId) {
        try {
          const res = await fetch(`https://api.pixupbr.com/v2/transactions/${pixupTxId}`, {
            headers: { "Authorization": `Bearer ${pixupToken.trim()}` }
          });
          if (res.ok) {
            const data = await res.json();
            const txInfo = data?.data || data;
            const status = (txInfo?.status || "").toLowerCase();
            if (status === "completed" || status === "confirmed" || status === "paid" || status === "approved") {
              const ok = await approvePendingTx(supabase, tx, settings);
              if (ok) approvedCount++;
            }
          }
        } catch (e) {
          console.warn(`PixUP status query failed for ${pixupTxId}:`, e);
        }
      }
    }
  }

  return { approvedCount, pendingChecked: pendingTxs.length };
}

export async function verifyAndApprovePayment(paymentId: string | number, txId?: string, targetUserId?: string) {
  // Trigger sync of pending deposits
  await syncAllPendingDeposits().catch(e => console.warn("syncAllPendingDeposits error:", e));

  const { url: supabaseUrl, key: supabaseKey } = getValidSupabaseCredentials();

  if (!supabaseUrl || !supabaseKey) {
    return { approved: false, reason: "Supabase not configured" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

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

import { createClient } from "@supabase/supabase-js";
import { sendDepositNotificationEmail } from "../lib/sendDepositEmail";

export async function verifyAndApprovePayment(paymentId: string | number, txId?: string, targetUserId?: string) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    return { approved: false, reason: "Supabase not configured" };
  }

  const supabase = createClient(supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`, supabaseKey);

  // 1. Get global settings to retrieve mpAccessToken
  const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").single();
  const settings = settingsData && settingsData.data ? (typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data) : null;
  const mpAccessToken = settings?.mpAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN;

  // 2. Find matching pending deposit transaction
  let query = supabase.from("transactions").select("*").eq("type", "deposit");
  if (txId) {
    query = query.eq("id", txId);
  } else if (targetUserId) {
    query = query.eq("userId", targetUserId).eq("status", "pending");
  }

  const { data: transactions } = await query;
  if (!transactions || transactions.length === 0) {
    return { approved: false, reason: "No transaction found" };
  }

  let txToProcess = null;
  for (const tx of transactions) {
    if (tx.status === "completed") {
      return { approved: true, alreadyCompleted: true, txId: tx.id };
    }
    const metadata = tx.metadata ? (typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata) : {};
    if (paymentId && String(metadata?.mpPaymentId) === String(paymentId)) {
      txToProcess = tx;
      break;
    }
    if (!paymentId && tx.status === "pending") {
      txToProcess = tx;
      if (metadata?.mpPaymentId) {
        paymentId = metadata.mpPaymentId;
      }
    }
  }

  if (!txToProcess) {
    // If we couldn't match metadata directly, try the first pending transaction if paymentId provided
    txToProcess = transactions.find(t => t.status === "pending") || null;
  }

  if (!txToProcess) {
    return { approved: false, reason: "No pending transaction matching criteria" };
  }

  const metadata = txToProcess.metadata ? (typeof txToProcess.metadata === 'string' ? JSON.parse(txToProcess.metadata) : txToProcess.metadata) : {};
  const actualMpPaymentId = paymentId || metadata?.mpPaymentId;

  if (!actualMpPaymentId || !mpAccessToken) {
    return { approved: false, reason: "Missing mpPaymentId or mpAccessToken" };
  }

  // 3. Query Mercado Pago API for payment status
  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${actualMpPaymentId}`, {
    headers: {
      "Authorization": `Bearer ${mpAccessToken.trim()}`
    }
  });

  if (!mpResponse.ok) {
    return { approved: false, reason: "Failed to query Mercado Pago API" };
  }

  const mpData = await mpResponse.json();

  if (mpData && mpData.status === "approved") {
    // 4. Payment is approved! Mark transaction completed and add user balance
    await supabase.from("transactions").update({ status: 'completed' }).eq("id", txToProcess.id);

    const bonus = Number(metadata?.bonus || 0);
    const totalAdd = Number(txToProcess.amount) + bonus;

    const { data: user } = await supabase.from("users").select("id, balance, phone, name, email, referredBy, referralCounted").eq("id", txToProcess.userId).single();

    if (user) {
      const newBalance = (Number(user.balance) || 0) + totalAdd;
      await supabase.from("users").update({ balance: newBalance }).eq("id", user.id);

      // Handle referral bonus if applicable
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

      // Send email notification to lediotattoo@proton.me
      try {
        await sendDepositNotificationEmail({
          amount: Number(txToProcess.amount),
          bonus,
          userPhone: user.phone,
          userName: user.name,
          userEmail: user.email,
          transactionId: txToProcess.id,
          settings
        });
      } catch (emailErr) {
        console.warn("Could not send deposit email notification:", emailErr);
      }

      return {
        approved: true,
        status: "approved",
        amount: txToProcess.amount,
        bonus,
        newBalance,
        txId: txToProcess.id
      };
    }
  }

  return { approved: false, status: mpData?.status || "pending" };
}

export default async function handler(req: any, res: any) {
  try {
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

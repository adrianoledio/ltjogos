import { createClient } from "@supabase/supabase-js";
import { sendDepositNotificationEmail } from "../lib/sendDepositEmail";

function getSupabaseEnv() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://mtodxdlvpsldxwtvtttk.supabase.co";
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10b2R4ZGx2cHNsZHh3dHZ0dHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTg5NjUsImV4cCI6MjEwNTU5NDk2NX0.By1JUfX28vpMSZS1fbItofVcq3X5MoFeT2m_QDhxH_E";
  return { url, key };
}

export async function approvePendingTx(supabase: any, tx: any, settings: any) {
  if (tx.status === 'completed') return true;

  const metadata = tx.metadata ? (typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata) : {};
  const bonus = Number(metadata?.bonus || 0);
  const totalAdd = Number(tx.amount) + bonus;

  // Mark completed
  await supabase.from("transactions").update({ status: 'completed' }).eq("id", tx.id);

  const { data: user } = await supabase.from("users").select("id, balance, phone, name, email, referredBy, referralCounted").eq("id", tx.userId).maybeSingle();

  if (user) {
    const newBalance = (Number(user.balance) || 0) + totalAdd;
    await supabase.from("users").update({ balance: newBalance }).eq("id", user.id);

    // Referral logic
    if (user.referredBy && !user.referralCounted) {
      const { data: referrer } = await supabase.from("users").select("id, referrals, unlockFirstWithdrawal").eq("id", user.referredBy).maybeSingle();
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
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseEnv();

  if (!supabaseUrl || !supabaseKey) {
    return { approvedCount: 0, error: "Supabase not configured" };
  }

  const supabase = createClient(supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`, supabaseKey);

  const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").maybeSingle();
  const settings = settingsData?.data ? (typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data) : null;

  const { data: pendingTxs } = await supabase
    .from("transactions")
    .select("*")
    .eq("type", "deposit")
    .eq("status", "pending");

  if (!pendingTxs || pendingTxs.length === 0) {
    return { approvedCount: 0, message: "No pending transactions" };
  }

  let approvedCount = 0;
  for (const tx of pendingTxs) {
    const meta = tx.metadata ? (typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata) : {};
    const pixupTxId = meta.pixupTransactionId || meta.transactionId;
    
    // Auto-approve if marked as approved in gateway or if user verified
    if (meta.status === 'PAID' || meta.status === 'COMPLETED' || meta.approved) {
      const ok = await approvePendingTx(supabase, tx, settings);
      if (ok) approvedCount++;
    }
  }

  return { approvedCount, totalPending: pendingTxs.length };
}

export async function verifyAndApprovePayment(paymentId?: string, txId?: string, userId?: string) {
  await syncAllPendingDeposits().catch(e => console.warn("syncAllPendingDeposits error:", e));

  const { url: supabaseUrl, key: supabaseKey } = getSupabaseEnv();

  if (!supabaseUrl || !supabaseKey) {
    return { approved: false, reason: "Supabase not configured" };
  }

  const supabase = createClient(supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`, supabaseKey);
  const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").maybeSingle();
  const settings = settingsData?.data ? (typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data) : null;

  let query = supabase.from("transactions").select("*").eq("type", "deposit");
  if (txId) {
    query = query.eq("id", txId);
  } else if (userId) {
    query = query.eq("userId", userId).order("date", { ascending: false }).limit(1);
  }

  const { data: txs } = await query;
  const targetTx = txs?.[0];

  if (!targetTx) {
    return { approved: false, reason: "Transaction not found" };
  }

  if (targetTx.status === 'completed') {
    return { approved: true, transactionId: targetTx.id, amount: targetTx.amount };
  }

  return { approved: false, status: targetTx.status, transactionId: targetTx.id };
}

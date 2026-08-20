import { createClient } from "@supabase/supabase-js";
import { sendDepositNotificationEmail } from "../lib/sendDepositEmail";
import { getValidSupabaseCredentials } from "../../src/lib/supabase";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return res.status(200).send("OK");
    }

    const body = req.body || {};
    const query = req.query || {};

    console.log("[PixUP Webhook] Received webhook payload:", JSON.stringify(body));

    // Extract identifiers and event from payload
    const event = body?.event || body?.type || query?.event || "";
    const txData = body?.data || body?.transaction || body;

    const externalId = txData?.external_id || body?.external_id || query?.external_id || body?.data?.external_id;
    const pixupTxId = txData?.transaction_id || txData?.id || body?.transaction_id || query?.['data.id'] || query?.id;
    const status = (txData?.status || body?.status || "").toLowerCase();

    // Check if event is cashin.confirmed or status indicates payment completion
    const isConfirmed = event.includes("confirmed") ||
      event.includes("approved") ||
      event.includes("paid") ||
      status === "completed" ||
      status === "confirmed" ||
      status === "approved" ||
      status === "paid" ||
      status === "success";

    if (isConfirmed && (externalId || pixupTxId)) {
      const { url: supabaseUrl, key: supabaseKey } = getValidSupabaseCredentials();

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").single();
        const settings = settingsData && settingsData.data ? (typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data) : null;

        // Query pending deposit transactions
        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .eq("status", "pending")
          .eq("type", "deposit");

        if (transactions && transactions.length > 0) {
          for (const tx of transactions) {
            const metadata = tx.metadata ? (typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata) : {};
            const txPixupId = metadata?.pixupTransactionId || metadata?.mpPaymentId;

            const isMatch = (externalId && String(tx.id) === String(externalId)) ||
              (pixupTxId && txPixupId && String(txPixupId) === String(pixupTxId));

            if (isMatch) {
              // Approve transaction
              await supabase.from("transactions").update({ status: 'completed' }).eq("id", tx.id);
              const bonus = Number(metadata?.bonus || 0);
              const totalAdd = Number(tx.amount) + bonus;

              const { data: user } = await supabase.from("users").select("id, balance, phone, name, email, referredBy, referralCounted").eq("id", tx.userId).single();
              if (user) {
                const newBalance = (Number(user.balance) || 0) + totalAdd;
                await supabase.from("users").update({ balance: newBalance }).eq("id", user.id);

                // Handle referral bonus
                if (user.referredBy && !user.referralCounted) {
                  const { data: referrer } = await supabase.from("users").select("id, referrals, unlockFirstWithdrawal").eq("id", user.referredBy).single();
                  if (referrer) {
                    const newReferrals = (Number(referrer.referrals) || 0) + 1;
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
                    amount: tx.amount,
                    bonus,
                    userPhone: user.phone,
                    userName: user.name,
                    userEmail: user.email,
                    transactionId: tx.id,
                    settings
                  });
                } catch (emailErr) {
                  console.warn("Could not send email notification:", emailErr);
                }

                // Admin high deposit alert notification
                const alertThreshold = Number(settings?.adminDepositAlertThreshold || 100);
                if (tx.amount >= alertThreshold) {
                  try {
                    await supabase.from("notifications").insert({
                      id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 7),
                      title: `🚨 Alerta: Depósito Alto PixUP (R$ ${tx.amount.toFixed(2)})`,
                      message: `Depósito de R$ ${tx.amount.toFixed(2)} confirmado via PixUP para ${user.name || user.email}.`,
                      type: 'success',
                      createdAt: new Date().toISOString()
                    });
                  } catch (notifErr) {
                    console.warn("Error creating high deposit notification:", notifErr);
                  }
                }

                console.log(`[PixUP Webhook] Deposit ${tx.id} completed for user ${user.id}. Credited: R$ ${totalAdd}`);
              }
              break;
            }
          }
        }
      }
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (err: any) {
    console.error("[PixUP Webhook] Error caught safely:", err);
    return res.status(200).json({ success: true });
  }
}

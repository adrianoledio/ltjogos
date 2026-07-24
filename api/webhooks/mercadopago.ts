import { createClient } from "@supabase/supabase-js";
import { sendDepositNotificationEmail } from "../lib/sendDepositEmail";

export default async function handler(req: any, res: any) {
  // Always return 200 OK to Mercado Pago webhooks
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return res.status(200).send("OK");
    }

    const body = req.body || {};
    const query = req.query || {};

    const paymentId = body?.data?.id || body?.id || query?.['data.id'] || query?.id;

    if (paymentId) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
      const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createClient(supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`, supabaseKey);
          
          const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").single();
          const settings = settingsData && settingsData.data ? (typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data) : null;
          const mpAccessToken = settings?.mpAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN;

          if (mpAccessToken) {
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
              headers: {
                "Authorization": `Bearer ${mpAccessToken.trim()}`
              }
            });

            if (mpResponse.ok) {
              const mpData = await mpResponse.json();

              if (mpData && mpData.status === "approved") {
                const { data: transactions } = await supabase.from("transactions").select("*").eq("status", "pending").eq("type", "deposit");
                if (transactions) {
                  for (const tx of transactions) {
                    const metadata = tx.metadata ? (typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata) : null;
                    if (metadata && (String(metadata.mpPaymentId) === String(paymentId))) {
                      await supabase.from("transactions").update({ status: 'completed' }).eq("id", tx.id);
                      const bonus = metadata.bonus || 0;
                      const totalAdd = tx.amount + bonus;

                      const { data: userData } = await supabase.from("users").select("balance, phone, name, email").eq("id", tx.userId).single();
                      if (userData) {
                        await supabase.from("users").update({ balance: (userData.balance || 0) + totalAdd }).eq("id", tx.userId);

                        try {
                          await sendDepositNotificationEmail({
                            amount: tx.amount,
                            bonus,
                            userPhone: userData.phone,
                            userName: userData.name,
                            userEmail: userData.email,
                            transactionId: tx.id,
                            settings
                          });
                        } catch (emailErr) {
                          console.warn("Error sending deposit notification email:", emailErr);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (supabaseErr) {
          console.warn("Notice during webhook processing:", supabaseErr);
        }
      }
    }

    return res.status(200).send("OK");
  } catch (err: any) {
    console.error("Webhook error caught safely:", err);
    return res.status(200).send("OK");
  }
}


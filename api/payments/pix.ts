import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, userId, email, bonus, mpAccessToken: clientToken } = req.body || {};

    let mpAccessToken = (clientToken || "").trim() || process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN || "";

    if (!mpAccessToken) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
      const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
      
      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createClient(supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`, supabaseKey);
          const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").single();
          if (settingsData && settingsData.data) {
            const settings = typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data;
            if (settings && settings.mpAccessToken) {
              mpAccessToken = settings.mpAccessToken.trim();
            }
          }
        } catch (e) {
          console.warn("Could not fetch settings from Supabase:", e);
        }
      }
    }

    if (!mpAccessToken) {
      return res.status(400).json({ error: "Access Token do Mercado Pago não configurado. Adicione-o no painel Admin (Configurações > Gateway)." });
    }

    const idempotencyKey = Math.random().toString(36).substring(2, 15);
    const payerEmail = email && email.includes("@") ? email : "usuario@ltjogos.com";

    const host = req.headers?.host || '';
    let notification_url: string | undefined = undefined;
    if (process.env.APP_URL && process.env.APP_URL.startsWith("https://") && !process.env.APP_URL.includes("localhost")) {
      notification_url = `${process.env.APP_URL}/api/webhooks/mercadopago`;
    } else if (host && host.includes(".") && !host.includes("localhost") && !host.includes("127.0.0.1") && !host.includes("run.app")) {
      notification_url = `https://${host}/api/webhooks/mercadopago`;
    }

    const mpBody: any = {
      transaction_amount: Number(amount),
      description: "Depósito na Plataforma LT JOGOS",
      payment_method_id: "pix",
      payer: {
        email: payerEmail,
        first_name: "Usuario",
        last_name: "LTJogos"
      }
    };
    if (notification_url) {
      mpBody.notification_url = notification_url;
    }

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mpAccessToken.trim()}`,
        "X-Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(mpBody)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      const detail = mpData.message || mpData.cause?.[0]?.description || mpData.error || "Erro ao gerar PIX no Mercado Pago";
      return res.status(400).json({ error: detail, details: mpData });
    }

    const txId = Math.random().toString(36).substring(2, 9);
    
    // Save to Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`, supabaseKey);
        await supabase.from("transactions").insert({
          id: txId,
          userId,
          type: "deposit",
          amount: Number(amount),
          status: "pending",
          date: new Date().toISOString(),
          metadata: {
            mpPaymentId: mpData.id,
            qrCodeBase64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
            qrCode: mpData.point_of_interaction?.transaction_data?.qr_code,
            bonus: bonus || 0
          }
        });
      } catch (txErr) {
        console.warn("Could not save pending tx to Supabase:", txErr);
      }
    }

    return res.status(200).json({
      success: true,
      transactionId: txId,
      mpPaymentId: mpData.id,
      qrCode: mpData.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: mpData.point_of_interaction?.transaction_data?.qr_code_base64
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Erro interno ao processar PIX." });
  }
}

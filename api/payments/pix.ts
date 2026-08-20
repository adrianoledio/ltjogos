import { createClient } from "@supabase/supabase-js";
import { createPixupCashin, getPixupToken } from "../lib/pixup";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    } = req.body || {};

    let clientId = (clientPassedPixupId || clientPassedId || "").trim() ||
      process.env.PIXUP_CLIENT_ID ||
      process.env.VITE_PIXUP_CLIENT_ID || "";

    let clientSecret = (clientPassedPixupSecret || clientPassedSecret || "").trim() ||
      process.env.PIXUP_CLIENT_SECRET ||
      process.env.VITE_PIXUP_CLIENT_SECRET || "";

    let postbackUrl = (clientPostback || "").trim() ||
      process.env.PIXUP_POSTBACK_URL ||
      "https://ltjogos.vercel.app/webhook";

    let directToken = (clientToken || "").trim() ||
      process.env.PIXUP_API_TOKEN ||
      process.env.PIXUP_TOKEN || "";

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    let supabase: any = null;

    if (supabaseUrl && supabaseKey) {
      try {
        supabase = createClient(supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`, supabaseKey);
      } catch (e) {
        console.warn("Could not init Supabase client in pix.ts:", e);
      }
    }

    if ((!clientId || !clientSecret) && !directToken && supabase) {
      try {
        const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").single();
        if (settingsData && settingsData.data) {
          const settings = typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data;
          if (settings) {
            if (!clientId) clientId = (settings.pixupClientId || "").trim();
            if (!clientSecret) clientSecret = (settings.pixupClientSecret || "").trim();
            if (settings.pixupPostbackUrl) postbackUrl = settings.pixupPostbackUrl.trim();
            if (!directToken) directToken = (settings.pixupToken || "").trim();
          }
        }
      } catch (e) {
        console.warn("Could not fetch settings from Supabase:", e);
      }
    }

    // Default Client ID if user configured in screenshot
    if (!clientId) {
      clientId = "adrianoledio_f27410f412960abf";
    }

    if (!clientSecret && !directToken) {
      return res.status(400).json({
        error: "Client Secret da PixUP não configurado. Adicione seu Client Secret no painel Admin (Configurações > Gateway)."
      });
    }

    const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const pixupResult = await createPixupCashin({
      clientId: clientId || undefined,
      clientSecret: clientSecret || undefined,
      token: directToken || undefined,
      amount: Number(amount),
      external_id: txId,
      payerName: name,
      payerEmail: email,
      payerDocument: cpf,
      postback_url: postbackUrl || "https://ltjogos.vercel.app/webhook"
    });

    // Save pending deposit to Supabase
    if (supabase) {
      try {
        await supabase.from("transactions").insert({
          id: txId,
          userId,
          type: "deposit",
          amount: Number(amount),
          status: "pending",
          date: new Date().toISOString(),
          metadata: {
            pixupTransactionId: pixupResult.pixupTransactionId,
            qrCode: pixupResult.qrCode,
            qrCodeBase64: pixupResult.qrCodeBase64,
            bonus: bonus || 0,
            gateway: "pixup"
          }
        });
      } catch (txErr) {
        console.warn("Could not save pending transaction to Supabase:", txErr);
      }
    }

    return res.status(200).json({
      success: true,
      transactionId: txId,
      pixupTransactionId: pixupResult.pixupTransactionId,
      qrCode: pixupResult.qrCode,
      qrCodeBase64: pixupResult.qrCodeBase64,
      expiresAt: pixupResult.expiresAt
    });

  } catch (err: any) {
    console.error("Error in /api/payments/pix (PixUP):", err);
    return res.status(500).json({ error: err.message || "Erro interno ao processar PIX." });
  }
}

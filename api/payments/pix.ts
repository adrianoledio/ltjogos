import { createClient } from "@supabase/supabase-js";

function generateFallbackCPF(): string {
  const rnd = (n: number) => Math.floor(Math.random() * n);
  const mod = (dividend: number, divisor: number) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));
  const n = Array(9).fill(0).map(() => rnd(9));
  let d1 = n.reduce((total, number, index) => total + (number * (10 - index)), 0);
  d1 = 11 - mod(d1, 11);
  if (d1 >= 10) d1 = 0;
  let d2 = d1 * 2 + n.reduce((total, number, index) => total + (number * (11 - index)), 0);
  d2 = 11 - mod(d2, 11);
  if (d2 >= 10) d2 = 0;
  return `${n.join('')}${d1}${d2}`;
}

export default async function handler(req: any, res: any) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

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
    } = body || {};

    let clientId = (clientPassedPixupId || clientPassedId || "").trim() ||
      process.env.PIXUP_CLIENT_ID ||
      process.env.VITE_PIXUP_CLIENT_ID || "adrianoledio_f27410f412960abf";

    let clientSecret = (clientPassedPixupSecret || clientPassedSecret || "").trim() ||
      process.env.PIXUP_CLIENT_SECRET ||
      process.env.VITE_PIXUP_CLIENT_SECRET || "";

    let postbackUrl = (clientPostback || "").trim() ||
      process.env.PIXUP_POSTBACK_URL ||
      "https://ltjogos.vercel.app/webhook";

    let directToken = (clientToken || "").trim() ||
      process.env.PIXUP_API_TOKEN ||
      process.env.PIXUP_TOKEN || "";

    // Supabase client initialization (Safe for serverless)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    let supabase: any = null;

    if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
      try {
        supabase = createClient(supabaseUrl, supabaseKey);
      } catch (e) {
        console.warn("Could not init Supabase in pix.ts:", e);
      }
    }

    // Try to load settings from Supabase if credentials are missing
    if ((!clientSecret || !clientId) && !directToken && supabase) {
      try {
        const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").maybeSingle();
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

    if (!clientSecret && !directToken) {
      return res.status(200).json({
        success: false,
        error: "Client Secret da PixUP não configurado. Acesse o Painel Admin > Gateway para salvar seu Client Secret."
      });
    }

    // 1. Obtain Access Token from PixUP
    let authToken = directToken;
    if (!authToken) {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const authRes = await fetch("https://api.pixupbr.com/v2/oauth/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/json"
        }
      });

      const authText = await authRes.text();
      let authData: any = {};
      try {
        authData = JSON.parse(authText);
      } catch (e) {
        authData = { message: authText };
      }

      if (!authRes.ok || authData.success === false) {
        const errDetail = authData.error?.message || authData.message || authData.error || `HTTP ${authRes.status}: Credenciais recusadas pela PixUP.`;
        return res.status(200).json({
          success: false,
          error: `Erro de autenticação PixUP: ${errDetail}`
        });
      }

      authToken = authData.access_token || authData.accessToken || authData.token || authData.data?.access_token;
      if (!authToken) {
        return res.status(200).json({
          success: false,
          error: "Token de acesso não retornado pela PixUP."
        });
      }
    }

    // 2. Generate transaction ID and format payer data
    const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const payerName = name && name.trim().length > 0 ? name.trim() : "Jogador LT Jogos";
    const payerEmail = email && email.includes("@") ? email : "usuario@ltjogos.com";

    let cleanDoc = (cpf || "").replace(/\D/g, "");
    if (!cleanDoc || cleanDoc.length < 11) {
      cleanDoc = generateFallbackCPF();
    }

    const payload: any = {
      amount: Number(Number(amount).toFixed(2)),
      currency: "BRL",
      external_id: txId,
      payer: {
        name: payerName,
        email: payerEmail,
        document: cleanDoc
      }
    };

    if (postbackUrl) {
      payload.postback_url = postbackUrl;
    }

    console.log("[PixUP Cashin] Enviando cobrança:", JSON.stringify(payload));

    // 3. Create PIX cashin on PixUP
    const cashinRes = await fetch("https://api.pixupbr.com/v2/transactions/cashin", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const cashinText = await cashinRes.text();
    let resData: any = {};
    try {
      resData = JSON.parse(cashinText);
    } catch (e) {
      resData = { message: cashinText };
    }

    if (!cashinRes.ok || resData.success === false) {
      const errorMsg = resData.message || resData.error || resData.details?.message || `HTTP ${cashinRes.status}: Erro ao gerar PIX na PixUP.`;
      console.error("[PixUP Cashin Error]:", errorMsg, cashinText);
      return res.status(200).json({
        success: false,
        error: errorMsg
      });
    }

    const info = resData.data || resData;
    const pixupTxId = info.transaction_id || info.id || resData.request_id;
    const qrCode = info.payment_info?.qrcode || info.qrcode || info.payment_info?.qr_code || info.qr_code || "";
    const qrCodeBase64 = info.payment_info?.qrcode_base64 || info.payment_info?.qr_code_base64 || info.qrcode_base64 || "";

    // 4. Save pending deposit in Supabase if connected
    if (supabase && userId) {
      try {
        await supabase.from("transactions").insert({
          id: txId,
          userId,
          type: "deposit",
          amount: Number(amount),
          status: "pending",
          date: new Date().toISOString(),
          metadata: {
            pixupTransactionId: pixupTxId,
            qrCode,
            qrCodeBase64,
            bonus: Number(bonus) || 0,
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
      pixupTransactionId: pixupTxId,
      qrCode,
      qrCodeBase64,
      expiresAt: info.payment_info?.expires_at
    });

  } catch (err: any) {
    console.error("Error in /api/payments/pix:", err);
    return res.status(200).json({
      success: false,
      error: err?.message || "Erro interno ao processar o PIX"
    });
  }
}

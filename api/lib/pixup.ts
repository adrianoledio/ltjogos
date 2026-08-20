let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getPixupToken(clientId: string, clientSecret: string, forceRefresh = false): Promise<string> {
  const cId = (clientId || '').trim();
  const cSecret = (clientSecret || '').trim();

  if (!cId || !cSecret) {
    throw new Error("Client ID e Client Secret da PixUP são obrigatórios.");
  }

  const now = Date.now();
  if (!forceRefresh && cachedToken && tokenExpiresAt > now + 30000) {
    return cachedToken;
  }

  const basicAuth = typeof Buffer !== 'undefined'
    ? Buffer.from(`${cId}:${cSecret}`).toString('base64')
    : btoa(`${cId}:${cSecret}`);

  console.log(`[PixUP Auth] Solicitando access_token para Client ID: ${cId.substring(0, 8)}...`);

  const response = await fetch("https://api.pixupbr.com/v2/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errMsg = data.error?.message || data.message || data.error || "Credenciais inválidas na PixUP.";
    console.error("[PixUP Auth] Erro de autenticação:", response.status, JSON.stringify(data));
    throw new Error(`Erro ao autenticar na PixUP: ${errMsg}`);
  }

  const token = data.access_token || data.accessToken || data.token || data.data?.access_token || data.data?.accessToken;
  const expiresIn = data.expires_in || data.expiresIn || data.data?.expires_in || 3600;

  if (!token) {
    throw new Error("Token de acesso não retornado pela PixUP.");
  }

  cachedToken = token;
  tokenExpiresAt = Date.now() + (Number(expiresIn) * 1000);

  return token;
}

export interface CreatePixupCashinParams {
  clientId?: string;
  clientSecret?: string;
  token?: string;
  amount: number;
  external_id: string;
  payerName?: string;
  payerEmail?: string;
  payerDocument?: string;
  postback_url?: string;
}

export async function createPixupCashin(params: CreatePixupCashinParams) {
  let authToken = params.token;

  if (!authToken && params.clientId && params.clientSecret) {
    authToken = await getPixupToken(params.clientId, params.clientSecret);
  }

  if (!authToken) {
    throw new Error("Token ou Client ID/Secret da PixUP não fornecido.");
  }

  const payerName = params.payerName && params.payerName.trim() ? params.payerName.trim() : "Jogador LT Jogos";
  const payerEmail = params.payerEmail && params.payerEmail.includes("@") ? params.payerEmail : "usuario@ltjogos.com";

  let cleanDoc = (params.payerDocument || "").replace(/\D/g, "");
  if (!cleanDoc || cleanDoc.length < 11) {
    cleanDoc = undefined as any;
  }

  const payload: any = {
    amount: Number(Number(params.amount).toFixed(2)),
    currency: "BRL",
    external_id: params.external_id,
    payer: {
      name: payerName,
      email: payerEmail,
      ...(cleanDoc ? { document: cleanDoc } : {})
    }
  };

  const postback = params.postback_url || "https://ltjogos.vercel.app/webhook";
  if (postback) {
    payload.postback_url = postback;
  }

  console.log("[PixUP Cashin] Criando cobrança PIX:", JSON.stringify(payload));

  const res = await fetch("https://api.pixupbr.com/v2/transactions/cashin", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authToken.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const resData = await res.json();
  console.log("[PixUP Cashin] Resposta:", res.status, JSON.stringify(resData));

  if (!res.ok || resData.success === false) {
    const errorMsg = resData.message || resData.error || resData.details?.message || "Erro ao gerar cobrança PIX na PixUP.";
    throw new Error(errorMsg);
  }

  const info = resData.data || resData;
  const pixupTxId = info.transaction_id || info.id || resData.request_id;
  const qrCode = info.payment_info?.qrcode || info.qrcode || info.payment_info?.qr_code || info.qr_code || "";
  const qrCodeBase64 = info.payment_info?.qrcode_base64 || info.payment_info?.qr_code_base64 || info.qrcode_base64 || "";

  return {
    transactionId: params.external_id,
    pixupTransactionId: pixupTxId,
    qrCode,
    qrCodeBase64,
    expiresAt: info.payment_info?.expires_at,
    raw: resData
  };
}

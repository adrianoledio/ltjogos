export interface PixupTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getPixupToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const basicAuth = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
  console.log(`[PixUP] Autenticando com Client ID: ${clientId}`);

  const res = await fetch("https://api.pixupbr.com/v2/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/json"
    }
  });

  const resText = await res.text();
  let resData: any = {};
  try {
    resData = JSON.parse(resText);
  } catch (e) {
    resData = { message: resText };
  }

  if (!res.ok || resData.success === false) {
    const errorMsg = resData.error?.message || resData.message || resData.error || `HTTP ${res.status}: Credenciais recusadas pela PixUP.`;
    throw new Error(errorMsg);
  }

  const token = resData.access_token || resData.accessToken || resData.token || resData.data?.access_token;
  const expiresIn = resData.expires_in || resData.expiresIn || resData.data?.expires_in || 3600;

  if (!token) {
    throw new Error("Token não retornado pela API PixUP.");
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

function generateFallbackCPF(): string {
  const rnd = (n: number) => Math.floor(Math.random() * n);
  const n = Array(9).fill(0).map(() => rnd(9));
  const mod = (dividend: number, divisor: number) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));
  let d1 = n.reduce((total, number, index) => total + (number * (10 - index)), 0);
  d1 = 11 - mod(d1, 11);
  if (d1 >= 10) d1 = 0;
  let d2 = d1 * 2 + n.reduce((total, number, index) => total + (number * (11 - index)), 0);
  d2 = 11 - mod(d2, 11);
  if (d2 >= 10) d2 = 0;
  return `${n.join('')}${d1}${d2}`;
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
    cleanDoc = generateFallbackCPF();
  }

  const payload: any = {
    amount: Number(Number(params.amount).toFixed(2)),
    currency: "BRL",
    external_id: params.external_id,
    payer: {
      name: payerName,
      email: payerEmail,
      document: cleanDoc
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

  const resText = await res.text();
  let resData: any = {};
  try {
    resData = JSON.parse(resText);
  } catch (e) {
    resData = { message: resText };
  }
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
    expiresAt: info.payment_info?.expires_at
  };
}

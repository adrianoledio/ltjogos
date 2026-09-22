export default async function handler(req: any, res: any) {
  // Enable CORS headers
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

    const { clientId: reqCId, clientSecret: reqCSecret } = body || {};
    let cId = (reqCId || "").trim() || process.env.PIXUP_CLIENT_ID || process.env.VITE_PIXUP_CLIENT_ID || "adrianoledio_f27410f412960abf";
    let cSecret = (reqCSecret || "").trim() || process.env.PIXUP_CLIENT_SECRET || process.env.VITE_PIXUP_CLIENT_SECRET || "";

    if (!cSecret) {
      return res.status(200).json({ 
        success: false, 
        error: "Client Secret não fornecido. Cole o Client Secret obtido no painel da PixUP antes de testar." 
      });
    }

    const basicAuth = Buffer.from(`${cId}:${cSecret}`).toString('base64');
    const authRes = await fetch("https://api.pixupbr.com/v2/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json"
      }
    });

    const responseText = await authRes.text();
    let authData: any = {};
    try {
      authData = JSON.parse(responseText);
    } catch (e) {
      authData = { message: responseText };
    }

    if (!authRes.ok || authData.success === false) {
      const errDetail = authData.error?.message || authData.message || authData.error || `HTTP ${authRes.status}: Credenciais recusadas pela PixUP.`;
      return res.status(200).json({ success: false, error: errDetail });
    }

    const token = authData.access_token || authData.accessToken || authData.token || authData.data?.access_token;
    if (!token) {
      return res.status(200).json({ success: false, error: "PixUP não retornou access_token válido." });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Conexão PixUP testada e aprovada com sucesso! As credenciais são válidas." 
    });
  } catch (err: any) {
    console.error("Error in /api/pixup/test:", err);
    return res.status(200).json({ success: false, error: err?.message || "Erro interno ao conectar com PixUP" });
  }
}

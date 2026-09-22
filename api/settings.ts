import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
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

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  let supabase: any = null;
  if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
      // ignore
    }
  }

  if (req.method === 'GET') {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("settings").select("data").eq("id", "global").maybeSingle();
        if (data && data.data) {
          const s = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
          return res.status(200).json(s);
        }
      }
      return res.status(200).json(null);
    } catch (e: any) {
      return res.status(200).json(null);
    }
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
      }
      if (supabase) {
        await supabase.from("settings").upsert({ id: 'global', data: body });
      }
      return res.status(200).json({ success: true });
    } catch (e: any) {
      return res.status(200).json({ success: true, offline: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

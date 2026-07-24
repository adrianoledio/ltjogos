import { createClient } from "@supabase/supabase-js";
import { sendDepositNotificationEmail } from "../lib/sendDepositEmail";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transactionId, amount, userPhone, userName, userEmail, bonus } = req.body || {};

    let settings = null;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`, supabaseKey);
        const { data: settingsData } = await supabase.from("settings").select("data").eq("id", "global").single();
        if (settingsData && settingsData.data) {
          settings = typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data;
        }
      } catch (e) {
        console.warn("Could not load settings for notification email:", e);
      }
    }

    const sent = await sendDepositNotificationEmail({
      amount: Number(amount) || 0,
      bonus: Number(bonus) || 0,
      userPhone,
      userName,
      userEmail,
      transactionId,
      settings
    });

    return res.status(200).json({ success: true, sent });
  } catch (err: any) {
    console.error("Error in deposit email notification route:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

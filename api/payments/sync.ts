import { syncAllPendingDeposits } from "./check-status";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const result = await syncAllPendingDeposits();
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Error syncing payments:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}


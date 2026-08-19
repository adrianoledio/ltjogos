import { SupabaseClient } from '@supabase/supabase-js';

export class RtpMonitor {
  private supabase: SupabaseClient;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  public startMonitoring(intervalHours = 6) {
    console.log("Starting backend RTP monitoring service...");
    // Run once on startup after 10s
    setTimeout(() => {
      this.checkRtpCompliance();
    }, 10000);

    // Then periodically
    this.intervalId = setInterval(() => {
      this.checkRtpCompliance();
    }, intervalHours * 60 * 60 * 1000);
  }

  public stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async checkRtpCompliance() {
    try {
      console.log("Running scheduled RTP compliance verification...");

      // 1. Fetch recent transactions (last 1000 or past 24 hours)
      const { data: transactions, error } = await this.supabase
        .from("transactions")
        .select("*")
        .in("type", ["bet", "win"])
        .order("date", { ascending: false })
        .limit(2000);

      if (error) {
        if (error.code === '42P01' || error.message?.includes("does not exist")) {
          console.log("RTP Monitor: Transactions table not found yet, skipping check.");
          return;
        }
        console.warn("RTP Monitor error fetching transactions:", error.message);
        return;
      }

      if (!transactions || transactions.length === 0) {
        console.log("RTP Monitor: No bet/win transactions recorded yet.");
        return;
      }

      // 2. Fetch games configured RTP
      const { data: games } = await this.supabase.from("games").select("id, name, rtp");
      const gameRtpMap: Record<string, number> = {};
      if (games) {
        games.forEach((g: any) => {
          gameRtpMap[g.id] = g.rtp || 97;
        });
      }

      // 3. Group bets and wins by gameId
      const stats: Record<string, { totalBets: number; totalWins: number; count: number }> = {};

      transactions.forEach((tx: any) => {
        const gId = tx.gameId || 'general';
        if (!stats[gId]) {
          stats[gId] = { totalBets: 0, totalWins: 0, count: 0 };
        }
        if (tx.type === 'bet') {
          stats[gId].totalBets += Number(tx.amount) || 0;
        } else if (tx.type === 'win') {
          stats[gId].totalWins += Number(tx.amount) || 0;
        }
        stats[gId].count++;
      });

      // 4. Analyze RTP compliance
      for (const [gameId, data] of Object.entries(stats)) {
        if (data.totalBets < 50) continue; // Skip low sample size

        const actualRtp = (data.totalWins / data.totalBets) * 100;
        const targetRtp = gameRtpMap[gameId] || 97.0;
        const variance = Math.abs(actualRtp - targetRtp);

        console.log(`[RTP Monitor] Game: ${gameId} | Total Bets: R$ ${data.totalBets.toFixed(2)} | Total Wins: R$ ${data.totalWins.toFixed(2)} | Actual RTP: ${actualRtp.toFixed(2)}% | Target RTP: ${targetRtp}%`);

        // If variance exceeds 4% tolerance on significant volume
        if (variance > 4.0 && data.totalBets > 200) {
          const alertType = actualRtp > targetRtp ? '📈 RTP Acima da Meta (Risco p/ Plataforma)' : '📉 RTP Abaixo da Meta (Risco p/ Jogadores)';
          console.warn(`[RTP Alert] Desvio significativo detectado para ${gameId}: Desvio de ${variance.toFixed(2)}%`);

          try {
            await this.supabase.from("notifications").insert({
              id: 'rtp_alert_' + Date.now() + Math.random().toString(36).substring(2, 6),
              title: `⚠️ Alerta de Desvio RTP (${gameId})`,
              message: `O RTP atual de ${actualRtp.toFixed(2)}% diverge do alvo configurado (${targetRtp}%). Verifique os parâmetros de premiação.`,
              type: 'warning',
              createdAt: new Date().toISOString()
            });
          } catch (notifErr) {
            console.warn("Could not insert RTP alert notification:", notifErr);
          }
        }
      }

      console.log("RTP compliance verification completed successfully.");
    } catch (err) {
      console.error("Error in RTP compliance check:", err);
    }
  }
}

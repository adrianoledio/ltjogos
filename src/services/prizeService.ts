import { db, PrizeTier, User, SystemSettings } from '../data/db';

export class PrizeService {
  static async getTargetPrize(userId: string, gameCategory: string): Promise<{ amount: number, tier: PrizeTier }> {
    const user = await db.getUser(userId);
    const settings = await db.getSettings();
    const today = new Date().toISOString().split('T')[0];

    if (!user) throw new Error("User not found");

    // Reset daily totals if date changed (dry run reset)
    await this.checkAndResetDailyTotals(user, settings, today);

    const gamePrizeConfig = (settings.gamePrizes && settings.gamePrizes.find(p => p.gameId === gameCategory)) || 
                           (settings.gamePrizes && settings.gamePrizes.find(p => p.gameId === 'slots')) ||
                           {
                             gameId: 'slots',
                             premios: [
                               { tipo: "Comum", peso: 50, premioMin: 50, premioMax: 50, custoReal: 12.5 },
                               { tipo: "Médio", peso: 30, premioMin: 100, premioMax: 100, custoReal: 25 },
                               { tipo: "Raro", peso: 15, premioMin: 150, premioMax: 180, custoReal: 37.5 },
                               { tipo: "Premium", peso: 5, premioMin: 180, premioMax: 200, custoReal: 50 }
                             ]
                           };

    if (!gamePrizeConfig) throw new Error("Game prize config not found");

    // 1. Select tier based on weights (boosted for partners)
    const selectedTier = this.selectTierByWeight(gamePrizeConfig.premios, user.role === 'partner');
    
    // 2. Randomize value within tier
    let prizeAmount = Math.floor(Math.random() * (selectedTier.premioMax - selectedTier.premioMin + 1)) + selectedTier.premioMin;

    // 3. Apply User Daily Limit (Partners have 5x higher limit)
    const userLimit = user.role === 'partner' ? settings.limiteUsuarioDiario * 5 : settings.limiteUsuarioDiario;
    const userRemaining = userLimit - user.dailyPrizeTotal;
    if (prizeAmount > userRemaining) {
      prizeAmount = Math.max(0, userRemaining);
    }

    // 4. Apply Platform Daily Limit
    const platformRemaining = settings.limitePlataformaDiario - settings.platformDailyPrizeTotal;
    if (prizeAmount > platformRemaining) {
      prizeAmount = Math.max(0, platformRemaining);
    }

    return { amount: prizeAmount, tier: selectedTier };
  }

  static async commitPrize(userId: string, amount: number) {
    if (amount <= 0) return;

    const user = await db.getUser(userId);
    const settings = await db.getSettings();
    const today = new Date().toISOString().split('T')[0];

    if (!user) return;

    user.dailyPrizeTotal += amount;
    user.lastPrizeDate = today;
    await db.updateUser(user);

    settings.platformDailyPrizeTotal += amount;
    settings.lastPlatformPrizeDate = today;
    await db.saveSettings(settings);
  }

  private static selectTierByWeight(tiers: PrizeTier[], isPartner: boolean): PrizeTier {
    // If partner, boost weights of higher tiers (last 2 tiers)
    const adjustedTiers = tiers.map((t, idx) => {
      if (isPartner && idx >= tiers.length - 2) {
        return { ...t, peso: t.peso * 4 }; // 4x more likely to get high tiers
      }
      return t;
    });

    const totalWeight = adjustedTiers.reduce((acc, t) => acc + t.peso, 0);
    let random = Math.random() * totalWeight;
    
    for (const tier of adjustedTiers) {
      if (random < tier.peso) return tier;
      random -= tier.peso;
    }
    
    return adjustedTiers[0];
  }

  private static async checkAndResetDailyTotals(user: User, settings: SystemSettings, today: string) {
    if (user.lastPrizeDate !== today) {
      user.dailyPrizeTotal = 0;
      user.lastPrizeDate = today;
      await db.updateUser(user);
    }

    if (settings.lastPlatformPrizeDate !== today) {
      settings.platformDailyPrizeTotal = 0;
      settings.lastPlatformPrizeDate = today;
      await db.saveSettings(settings);
    }
  }
}

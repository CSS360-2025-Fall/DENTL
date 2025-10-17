// src/config/gameConfig.js
export const GameConfig = {
  freebie: {
    amount: 100,
    cooldownMs: 60 * 60 * 1000, // 1 hour
  },
  daily: {
    baseAmount: 1000,
    maxStreak: 5,
    //cooldownMs: 24 * 60 * 60 * 1000, // optional for 24h variant
  },
  russian: {
    odds: 6,
  },
  economy: {
    startingBalance: 0,
  },
  stocks: {
    stockTick: 5, //minutes before the stock prices update

    stableBaseChance: 15,
    stableMin: -1.05,
    stableMax: 1.05,

    slowRiseBaseChance: 25,
    slowRiseMin: -1.05,
    slowRiseMax: 1.15,

    slowFallBaseChance: 25,
    slowFallMin: -1.15,
    slowFallMax: 1.05,

    fastRiseBaseChance: 12.5,
    fastRiseMin: 1.05,
    fastRiseMax: 1.3,

    fastFallBaseChance: 12.5,
    fastFallMin: -1.3,
    fastFallMax: -1.05,

    chaoticBaseChance: 8,
    chaoticMin: -1.5,
    chaoticMax: 1.5,

    boomBaseChance: 1,
    boomMin: 1.15,
    boomMax: 1.9,

    crashBaseChance: 1,
    crashMin: -1.9,
    crashMax: -1.15,
  },
};

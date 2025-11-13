// src/config/gameConfig.js
export const GameConfig = {
  limits: {
    default: 999999,
    rps: 10000,
    coinflip: 10000,
    blackjack: 999999,
    horseRaces: 999999,
  },
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
    odds: 6, // 1 in X chance of losing
  },
  economy: {
    startingBalance: 0,
  },
  stocks: {
    stockTick: 1, //minutes before the stock prices update

    baselineBias: 20, //percent above/below baseline to favor returning to baseline

    stableBaseChance: 15, //weight, not percent, though currently adds to 100.
    stableMin: 0.95,
    stableMax: 1.05,

    slowRiseBaseChance: 25,
    slowRiseMin: 0.95,
    slowRiseMax: 1.15,

    slowFallBaseChance: 25,
    slowFallMin: 0.85,
    slowFallMax: 1.05,

    fastRiseBaseChance: 12.5,
    fastRiseMin: 1.05,
    fastRiseMax: 1.3,

    fastFallBaseChance: 12.5,
    fastFallMin: 0.7,
    fastFallMax: 0.95,

    chaoticBaseChance: 8,
    chaoticMin: 0.5,
    chaoticMax: 1.5,

    boomBaseChance: 1,
    boomMin: 1.15,
    boomMax: 1.9,

    crashBaseChance: 1,
    crashMin: 0.1,
    crashMax: 0.85,

    injectionEnabled: true,
    injectionThreshold: 0.2, // 20% of baseline
    injectionChance: 0.5, // 50% chance
    injectionMin: 0.15,
    injectionMax: 0.25,
  },
  horses: {
    arion: {
      speed: 4,
      stamina: 3,
      focus: 1,
    },
    bill: {
      speed: 1,
      stamina: 3,
      focus: 3,
    },

    frankel: {
      speed: 4,
      stamina: 4,
      focus: 3,
    },

    zippychippy: {
      speed: 1,
      stamina: 1,
      focus: 1,
    },
  },
};

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
};

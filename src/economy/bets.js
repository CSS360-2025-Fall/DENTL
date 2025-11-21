import { getBalance, addBalance } from "./db.js";
import { GameConfig } from "../config/gameConfig.js";

export function validateAndLockBet(
  userId,
  bet,
  cap = Number(GameConfig.limits.default)
) {
  bet = Number(bet) | 0;
  if (bet < 0)
    return {
      ok: false,
      error: "Bet must be non-negative.",
      bal: getBalance(userId),
    };

  const bal = getBalance(userId);
  if (bet > bal)
    return { ok: false, error: `You only have ${bal} chips.`, bal };
  if (bet > cap)
    return {
      ok: false,
      error: `You cannot bet more than ${cap} chips for this game.`,
      cap,
    };

  if (bet > 0) addBalance(userId, -bet); // lock
  return {
    ok: true,
    bet,
    settle: {
      win: (multiplier = 2) => {
        const m = Number(multiplier);
        const factor = Number.isFinite(m) && m > 0 ? m : 2;
        return addBalance(userId, bet * factor);
      },

      tie: () => addBalance(userId, bet),
      lose: () => addBalance(userId, 0),
    },
  };
}

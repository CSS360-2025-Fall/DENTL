import { getBalance, addBalance } from "./db.js";

export function validateAndLockBet(userId, bet) {
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

  if (bet > 0) addBalance(userId, -bet); // lock
  return {
    ok: true,
    bet,
    settle: {
      win: () => addBalance(userId, bet * 2),
      tie: () => addBalance(userId, bet),
      lose: () => addBalance(userId, 0),
    },
  };
}

export function validateBet(userId, bet) {
    bet = Number(bet) | 0;
  if (bet < 0)
    return {
      ok: false,
      error: "Bet must be non-negative.",
      bal: getBalance(userId),
    };

  const bal = getBalance(userId);
  if (bet > bal) {
    return { ok: false, error: `You only have ${bal} chips.`, bal };
  }
  return { ok: true, bal };
}

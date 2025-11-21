import { InteractionResponseType } from "discord-interactions";
import { getBalance, recordGameResult } from "../economy/db.js";
import { validateAndLockBet } from "../economy/bets.js";
import { GameConfig } from "../config/gameConfig.js";

export async function execute(interaction) {
  const ctx = interaction.context;
  const userId = ctx === 0 ? interaction.member.user.id : interaction.user.id;

  // Normalize to lowercase and handle undefined safely
  const rawPick = interaction.data.options?.find(
    (o) => o.name === "pick"
  )?.value;
  const pick = String(rawPick ?? "").toLowerCase();

  const bet =
    Number(
      interaction.data.options?.find((o) => o.name === "bet")?.value ?? 0
    ) | 0;

  if (!["heads", "tails"].includes(pick)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Pick heads or tails.", flags: 64 },
    };
  }

  const check = validateAndLockBet(userId, bet, GameConfig.limits.coinflip);
  if (!check.ok) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: check.error, flags: 64 },
    };
  }

  const flip = Math.random() < 0.5 ? "heads" : "tails";
  const win = flip === pick;

  let newBal = getBalance(userId);
  if (bet > 0) newBal = win ? check.settle.win() : check.settle.lose();

  // stats update
  try {
    recordGameResult(userId, win ? "win" : "lose", bet, "coinflip");
  } catch (e) {
    console.error("recordGameResult failed (coinflip):", e);
  }

  const msg =
    `${
      win ? "🎉 You win!" : "💀 You lose."
    } You picked **${pick}**, coin: **${flip}**.` +
    (bet > 0 ? `\nBet: **${bet}** | New balance: **${newBal}**` : "");

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: msg },
  };
}

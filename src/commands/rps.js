// src/commands/rps.js
import { InteractionResponseType } from "discord-interactions";
import { RPS_CHOICES, botPick, judge } from "../games/rps/rules.js";
import { validateAndLockBet } from "../economy/bets.js";
import { getBalance, recordGameResult } from "../economy/db.js";
import { t } from "../core/i18n.js";
import { GameConfig } from "../config/gameConfig.js";

export async function execute(interaction) {
  const ctx = interaction.context; // 0=guild, 1=bot DM, 2=user DM
  const userId = ctx === 0 ? interaction.member.user.id : interaction.user.id;

  const player = interaction.data.options?.find(
    (o) => o.name === "choice"
  )?.value;
  const bet =
    Number(
      interaction.data.options?.find((o) => o.name === "bet")?.value ?? 0
    ) | 0;

  if (!RPS_CHOICES.includes(player)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: t(userId, "rps_invalid"), flags: 64 },
    };
  }

  const check = validateAndLockBet(userId, bet, GameConfig.limits.rps);
  if (!check.ok) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: check.error, flags: 64 },
    };
  }

  const bot = botPick();
  const result = judge(player, bot);

  let newBal = getBalance(userId);
  if (bet > 0) {
    if (result === "win") newBal = check.settle.win();
    else if (result === "tie") newBal = check.settle.tie();
    else newBal = check.settle.lose();
  }

  // stats update
  try {
    recordGameResult(userId, result, bet, "rps");
  } catch (e) {
    console.error("recordGameResult failed (rps):", e);
  }

  const hand = (h) => t(userId, h); // rock/paper/scissors
  let msg = [
    t(userId, result), // win/lose/tie
    t(userId, "you_chose", { choice: hand(player) }),
    t(userId, "bot_chose", { choice: hand(bot) }),
  ].join("\n");
  if (bet > 0) msg += t(userId, "bet_line", { bet, bal: newBal });

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: msg },
  };
}

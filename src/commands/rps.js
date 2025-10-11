// src/commands/rps.js
import { InteractionResponseType } from "discord-interactions";
import {
  RPS_CHOICES,
  botPick,
  judge,
  formatResult,
} from "../games/rps/rules.js";
import { validateAndLockBet } from "../economy/bets.js";
import { getBalance } from "../economy/db.js";

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
      data: { content: "Choose rock, paper, or scissors.", flags: 64 },
    };
  }

  const check = validateAndLockBet(userId, bet);
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

  const msg =
    formatResult({ userId, player, bot, result }) +
    (bet > 0 ? `\nBet: **${bet}** | New balance: **${newBal}**` : "");

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: msg },
  };
}

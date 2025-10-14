import { InteractionResponseType } from "discord-interactions";
import { claimFreebie } from "../economy/db.js";
import { GameConfig } from "../config/gameConfig.js";

function fmtHMS(ms) {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(ss)}`;
}

export async function execute(interaction) {
  const ctx = interaction.context;
  const userId = ctx === 0 ? interaction.member.user.id : interaction.user.id;

  const { amount, cooldownMs } = GameConfig.freebie;

  const res = claimFreebie(userId, amount, cooldownMs);

  if (!res.ok) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `⏳ Freebie on cooldown. Try again in **${fmtHMS(
          res.waitMs
        )}**.`,
        flags: 64,
      },
    };
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `🎉 Freebie claimed: **+${res.amount}**. New balance: **${res.newBalance}**.`,
    },
  };
}

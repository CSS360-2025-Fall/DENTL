import { InteractionResponseType } from "discord-interactions";
import { claimDailyCalendar } from "../economy/db.js";
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
  const ctx = interaction.context; // 0=guild,1=bot DM,2=user DM
  const userId = ctx === 0 ? interaction.member.user.id : interaction.user.id;

  const { base, cap } = GameConfig.daily;

  const res = claimDailyCalendar(userId, base, cap);

  if (!res.ok && res.reason === "already") {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `⏳ You already claimed today. Next reset in **${fmtHMS(
          res.waitMs
        )}**. Current streak: **${res.streak}**.`,
        flags: 64,
      },
    };
  }

  // granted
  const msg =
    res.streak === 1
      ? `🎁 Daily claimed: **+${res.amount}**. Streak: **1**.\nBalance: **${res.newBalance}**.\n*(Miss a day and your streak resets.)*`
      : `🔥 Streak **${res.streak}**! Daily: **+${res.amount}**.\nBalance: **${res.newBalance}**.`;

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: msg },
  };
}

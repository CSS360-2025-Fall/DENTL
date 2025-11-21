import { InteractionResponseType } from "discord-interactions";
import { getStats } from "../economy/db.js";

export async function execute(interaction) {
  const ctx = interaction.context; // 0=guild, 1=bot DM, 2=user DM

  // Optional "user" option (type 6)
  const targetOpt = interaction.data.options?.find((o) => o.name === "user");
  const targetId =
    targetOpt?.value ??
    (ctx === 0 ? interaction.member.user.id : interaction.user.id);

  const stats = getStats(targetId);

  const games = stats.games_played || 0;
  const wins = stats.wins || 0;
  const losses = stats.losses || 0;
  const ties = stats.ties || 0;
  const biggestWin = stats.biggest_win || 0;
  const biggestLoss = stats.biggest_loss || 0;

  const totalDecisions = wins + losses + ties;
  const winRate =
    totalDecisions > 0 ? Math.round((wins / totalDecisions) * 100) : 0;

  // Discord timestamp formatting: <t:unix:R> → "2 hours ago"
  let lastPlayedStr = "never";
  if (stats.last_played_at != null) {
    const ts = Number(stats.last_played_at) || 0;
    if (ts > 0) {
      lastPlayedStr = `<t:${ts}:R>`;
    }
  }

  const lastGame = stats.last_game_type || "N/A";
  const mention = `<@${targetId}>`;

  const lines = [
    `🎲 **Stats for ${mention}**`,
    "",
    `• Games played: **${games}**`,
    `• Wins: **${wins}**`,
    `• Losses: **${losses}**`,
    `• Ties: **${ties}**`,
    `• Win rate: **${winRate}%**`,
    "",
    `• Biggest win bet: **${biggestWin}**`,
    `• Biggest loss bet: **${biggestLoss}**`,
    "",
    `• Last game: **${lastGame}**`,
    `• Last played: **${lastPlayedStr}**`,
  ];

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: lines.join("\n"),
      flags: 64
    },
  };
}
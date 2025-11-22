import { InteractionResponseType } from "discord-interactions";
import { getTopBalances, getTopStatsBy } from "../economy/db.js";

export async function execute(interaction) {
  const opts = interaction.data.options ?? [];

  // Read "category" from the slash command
  const categoryOpt = opts.find((o) => o.name === "category");
  const category = categoryOpt?.value ?? "balance"; // balance | wins | games_played | biggest_win | biggest_loss

  // Limit (1–25)
  const limitOpt = opts.find((o) => o.name === "limit");
  let limit = Number(limitOpt?.value ?? 10);
  if (!Number.isFinite(limit) || limit <= 0) limit = 10;
  if (limit > 25) limit = 25;

  let rows;
  try {
    if (category === "balance") {
      // { user_id, balance }
      rows = getTopBalances(limit);
    } else {
      // { user_id, value } from stats table
      rows = getTopStatsBy(category, limit);
    }
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to load leaderboard. Try again later.",
        flags: 64,
      },
    };
  }

  if (!rows || rows.length === 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "📭 No entries yet. Play some games to get on the board!",
      },
    };
  }

  const titleMap = {
    balance: "Chip Balance",
    games_played: "Games Played",
    wins: "Wins",
    losses: "Losses",
    ties: "Ties",
    biggest_win: "Biggest Win Bet",
    biggest_loss: "Biggest Loss Bet",
  };

  const title = titleMap[category] ?? "Leaderboard";

  const lines = rows.map((row, i) => {
    const rank = i + 1;
    const mention = `<@${row.user_id}>`;
    const medal =
      rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "▫️";

    let valueText;

    if (category === "balance") {
      const balance = row.balance ?? 0;
      valueText = `${balance} chips`;
    } else {
      const v = row.value ?? 0;

      switch (category) {
        case "games_played":
          valueText = `${v} game${v === 1 ? "" : "s"}`;
          break;
        case "wins":
          valueText = `${v} win${v === 1 ? "" : "s"}`;
          break;
        case "losses":
          valueText = `${v} loss${v === 1 ? "" : "es"}`;
          break;
        case "ties":
          valueText = `${v} tie${v === 1 ? "" : "s"}`;
          break;
        case "biggest_win":
          valueText = `biggest win bet: ${v}`;
          break;
        case "biggest_loss":
          valueText = `biggest loss bet: ${v}`;
          break;
        default:
          valueText = String(v);
      }
    }

    return `${medal} **${rank}.** ${mention} — **${valueText}**`;
  });

  const content = [
    `🏆 **Leaderboard – ${title}**`,
    "",
    ...lines,
  ].join("\n");

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content },
  };
}

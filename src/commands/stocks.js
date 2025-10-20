import { InteractionResponseType } from "discord-interactions";
import { isAdmin } from "../core/utils.js";
import {
  listCurrentStocks,
  buyStock,
  sellStock,
  resetStock,
  resetAllStocks,
} from "../economy/stocks.js";

export async function execute(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const sub = interaction.data.options?.[0];

  if (!sub) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Usage: /stocks list | buy | sell | stats", flags: 64 },
    };
  }

  if (sub.name === "list") {
    const arr = listCurrentStocks();
    const body =
      arr
        .map(
          (s) =>
            `• **${s.name}** (${s.symbol}) — **${s.price}** [baseline ${s.baseline}]`
        )
        .join("\n") || "No stocks configured.";
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: body },
    };
  }

  if (sub.name === "buy") {
    const symbol = sub.options?.find((o) => o.name === "symbol")?.value;
    const qty =
      Number(sub.options?.find((o) => o.name === "qty")?.value ?? 1) | 0;
    try {
      const res = buyStock(userId, symbol, qty);
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `🛒 Bought **${qty}** of **${symbol}** at **${res.price}** each.`,
        },
      };
    } catch (e) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `❌ ${e.message}`, flags: 64 },
      };
    }
  }

  if (sub.name === "sell") {
    const symbol = sub.options?.find((o) => o.name === "symbol")?.value;
    const qty =
      Number(sub.options?.find((o) => o.name === "qty")?.value ?? 1) | 0;
    try {
      const res = sellStock(userId, symbol, qty);
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `💸 Sold **${qty}** of **${symbol}** at **${res.price}** each for **${res.proceeds}**.`,
        },
      };
    } catch (e) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `❌ ${e.message}`, flags: 64 },
      };
    }
  }

  if (sub.name === "stats") {
    if (!isAdmin(userId)) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: "⛔ Admins only.", flags: 64 },
      };
    }
    const arr = listCurrentStocks();
    const states = [
      "Stable",
      "Slow Rise",
      "Slow Fall",
      "Fast Rise",
      "Fast Fall",
      "Chaotic",
      "Boom",
      "Crash",
      "Injection",
    ];
    const body =
      arr
        .map(
          (s) =>
            `• **${s.name}** (${s.symbol}) — **${s.price}** • ${
              states[s.stateId] ?? "—"
            } (${s.turnsLeft} turns)`
        )
        .join("\n") || "No stocks.";
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: body, flags: 64 },
    };
  }

  if (sub.name === "reset") {
    if (!isAdmin(userId)) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: "⛔ Admins only.", flags: 64 },
      };
    }
    const symbol = sub.options?.find((o) => o.name === "symbol")?.value;
    try {
      if (symbol) {
        const baseline = resetStock(symbol);
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `🔄 Reset **${symbol}** to baseline **${baseline}**.`,
            flags: 64,
          },
        };
      } else {
        resetAllStocks();
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "🔄 Reset **all stocks** to their baselines.",
            flags: 64,
          },
        };
      }
    } catch (e) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `❌ ${e.message}`, flags: 64 },
      };
    }
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: "Unknown subcommand.", flags: 64 },
  };
}

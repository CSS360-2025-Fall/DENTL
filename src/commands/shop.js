// src/commands/shop.js
import { InteractionResponseType } from "discord-interactions";
import { ShopItems } from "../config/shop.js";

export async function execute(interaction) {
  if (!ShopItems.length) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "🛒 The shop is currently empty.",
      },
    };
  }

  // Group items by category for nicer output
  const byCat = {};
  for (const item of ShopItems) {
    if (!byCat[item.category]) byCat[item.category] = [];
    byCat[item.category].push(item);
  }

  const parts = ["🛒 **DENTL Shop**\n"];

  for (const [cat, items] of Object.entries(byCat)) {
    parts.push(`__${cat}__`);
    for (const i of items) {
      parts.push(
        `• \`${i.id}\` — **${i.name}** — ${i.cost} chips\n  ${i.description}`
      );
    }
    parts.push(""); // blank line
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: parts.join("\n"),
    },
  };
}

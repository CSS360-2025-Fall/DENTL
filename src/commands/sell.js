// src/commands/sell.js
import { InteractionResponseType } from "discord-interactions";
import { getInventory, addItem, addBalance } from "../economy/db.js";
import { getItemDef, toItemCode } from "../registry/index.js";

export async function execute(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const code = interaction.data.options?.find((o) => o.name === "code")?.value; // short code: 'sr', 'sc', 'ff', etc.
  const qty =
    Number(
      interaction.data.options?.find((o) => o.name === "qty")?.value ?? 1
    ) | 0;

  if (!code || qty <= 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Usage: /sell code:<item> qty:<positive int>",
        flags: 64,
      },
    };
  }

  const def = getItemDef(code);
  // Allow selling if item exists AND has a sell price (covers sellables + consumables with sell values)
  if (!def || !(typeof def.sell === "number" && def.sell > 0)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "🚫 That item is not sellable.", flags: 64 },
    };
  }

  const invCode = toItemCode(code);
  const have =
    getInventory(userId).find((i) => i.item_code === invCode)?.qty || 0;
  if (have < qty) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `You only have **${have}**.`, flags: 64 },
    };
  }

  const proceeds = def.sell * qty;
  addItem(userId, invCode, -qty); // remove from inventory
  const newBal = addBalance(userId, proceeds);

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `💸 Sold **${qty}× ${def.name}** for **${proceeds}**. New balance: **${newBal}**.`,
    },
  };
}

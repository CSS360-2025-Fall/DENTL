import { InteractionResponseType } from "discord-interactions";
import { addItem } from "../economy/db.js";
import { isAdmin } from "../core/utils.js";
import {
  getCatalogEntry,
  toItemCode,
  toStockCode,
  displayName,
} from "../registry/index.js";

function normalizeInvCode(input) {
  // Already prefixed?
  if (input.startsWith("itm:") || input.startsWith("stk:")) return input;

  // Heuristic: ALLCAPS (letters/digits/underscores) => stock symbol
  if (/^[A-Z0-9_:-]+$/.test(input) && input === input.toUpperCase()) {
    return toStockCode(input);
  }
  // Otherwise treat as item code
  return toItemCode(input);
}

export async function execute(interaction) {
  const invokerId = interaction.member?.user?.id ?? interaction.user?.id;
  if (!isAdmin(invokerId)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "⛔ Admins only.", flags: 64 },
    };
  }

  const userId = interaction.data.options?.find(
    (o) => o.name === "user"
  )?.value;
  const raw = interaction.data.options
    ?.find((o) => o.name === "code")
    ?.value?.trim();
  const qty =
    Number(
      interaction.data.options?.find((o) => o.name === "qty")?.value ?? 1
    ) | 0;

  if (!userId || !raw || qty <= 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content:
          "Usage: /grantitem user:<id> code:<ld|SAFE|itm:ld|stk:SAFE> qty:<int>",
        flags: 64,
      },
    };
  }

  const code = normalizeInvCode(raw);
  const entry = getCatalogEntry(code);
  if (!entry) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `❌ Unknown code: ${raw}`, flags: 64 },
    };
  }

  const newQty = addItem(userId, code, qty);

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `🎁 Gave <@${userId}> **${qty}× ${displayName(
        code
      )}** (now **${newQty}**).`,
    },
  };
}

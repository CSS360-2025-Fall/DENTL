import { InteractionResponseType } from "discord-interactions";
import { addItem } from "../economy/db.js";
import { isAdmin } from "../core/utils.js";

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
  const code = interaction.data.options?.find((o) => o.name === "code")?.value;
  const qty =
    Number(
      interaction.data.options?.find((o) => o.name === "qty")?.value ?? 1
    ) | 0;

  if (!userId || !code || qty <= 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Usage: /grantitem user:<id> code:<string> qty:<int>",
        flags: 64,
      },
    };
  }

  const newQty = addItem(userId, code, qty);
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `🎁 Gave <@${userId}> **${qty}× ${code}** (now **${newQty}**).`,
    },
  };
}

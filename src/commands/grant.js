import { InteractionResponseType } from "discord-interactions";
import { addBalance } from "../economy/db.js";
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
  const amount =
    Number(
      interaction.data.options?.find((o) => o.name === "amount")?.value ?? 0
    ) | 0;

  if (!userId || amount <= 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Usage: /grant user:<id> amount:<positive int>",
        flags: 64,
      },
    };
  }

  const newBal = addBalance(userId, amount);
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `✅ Granted **${amount}** to <@${userId}>. New balance: **${newBal}**.`,
    },
  };
}

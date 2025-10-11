import { InteractionResponseType } from "discord-interactions";
import { ensureStarter, getBalance } from "../economy/db.js";

export async function execute(interaction) {
  const ctx = interaction.context;
  const userId = ctx === 0 ? interaction.member.user.id : interaction.user.id;

  ensureStarter(userId, 1000);
  const bal = getBalance(userId);

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: `💳 Your balance: **${bal}** chips.`, flags: 64 },
  };
}

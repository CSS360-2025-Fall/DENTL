// src/commands/inventory.js
import { InteractionResponseType } from "discord-interactions";
import { getInventory } from "../economy/db.js";
import { displayName } from "../registry/index.js";

export async function execute(interaction) {
  const ctx = interaction.context;
  const userId = ctx === 0 ? interaction.member.user.id : interaction.user.id;

  const items = getInventory(userId);
  const pretty = items.length
    ? items.map((i) => `• ${displayName(i.item_code)} × ${i.qty}`).join("\n")
    : "— empty —";

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: `🎒 Inventory:\n${pretty}`, flags: 64 },
  };
}

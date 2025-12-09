// src/commands/buy.js
import { InteractionResponseType } from "discord-interactions";
import { getBalance, addBalance } from "../economy/db.js";
import { getItemById, getItemsByCategory } from "../config/shop.js";
import "dotenv/config";

export async function execute(interaction) {
  const guildId = interaction.guild_id;
  const ctx = interaction.context;
  const userId = ctx === 0 ? interaction.member.user.id : interaction.user.id;

  const itemId =
    interaction.data.options?.find((o) => o.name === "item")?.value ?? null;

  if (!itemId) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content:
          "You must specify which item ID to buy. Use `/shop` to see IDs.",
        flags: 64,
      },
    };
  }

  const item = getItemById(itemId);
  if (!item) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Unknown item \`${itemId}\`. Use \`/shop\` to see valid IDs.`,
        flags: 64,
      },
    };
  }

  const bal = getBalance(userId);
  if (bal < item.cost) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `You need **${item.cost}** chips for **${item.name}**, but you only have **${bal}**.`,
        flags: 64,
      },
    };
  }

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error("BOT_TOKEN not set in environment.");
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Internal config error: BOT_TOKEN not set.",
        flags: 64,
      },
    };
  }

  // 1) Get all roles in the same category (mutually exclusive)
  const categoryRoles = getItemsByCategory(item.category)
    .map((i) => i.roleId)
    .filter(Boolean);

  // 2) Remove all roles from this category (no refund for prior purchases)
  //    Discord is fine with removing roles the user doesn't have.
  try {
    for (const roleId of categoryRoles) {
      await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bot ${token}`,
          },
        }
      );
    }

    // 3) Add the new role
    await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${item.roleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );
  } catch (err) {
    console.error("Failed to modify roles for shop purchase:", err);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content:
          "I couldn't assign that role (check my role position / permissions). You were not charged.",
        flags: 64,
      },
    };
  }

  // 4) Deduct cost AFTER successful role changes
  addBalance(userId, -item.cost);
  const newBal = getBalance(userId);

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `✅ You bought **${item.name}** for **${item.cost}** chips.\nCategory: \`${item.category}\` (any previous role in this category has been replaced).\nNew balance: **${newBal}**`,
    },
  };
}

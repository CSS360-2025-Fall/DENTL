import { InteractionResponseType } from "discord-interactions";
import { isAdmin } from "../core/utils.js";
import { recordGameResult } from "../economy/db.js";

// Helper for funny messages
const phrases = ["You spin the cylinder and pull the trigger..."];

export async function execute(interaction) {
  const ctx = interaction.context; // 0=guild, 1=bot DM, 2=user DM
  const user = ctx === 0 ? interaction.member.user : interaction.user;
  const userId = user.id;
  const username = user.username;

  // Roll the 1/6 chance
  const roll = Math.floor(Math.random() * 6) + 1;
  const bullet = roll === 1; // 1 in 6 chance

  const intro = phrases[Math.floor(Math.random() * phrases.length)];

  // Always send a message first (ephemeral for safety)
  let reply = `${intro}\n${
    bullet ? "💥 **You lost.**" : "😎 **You survived!**"
  }`;

  // Admins: no stats & no kick
  if (isAdmin(userId)) {
    reply += "\n🛡️ You're an admin, so you're immune.";
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: reply },
    };
  }

  // stats update for non-admin users(no bet; just track result)
  try {
    recordGameResult(userId, bullet ? "lose" : "win", 0, "russianroulette");
  } catch (e) {
    console.error("recordGameResult failed (russianroulette):", e);
  }

  if (bullet && ctx === 0) {
    try {
      const guildId = interaction.guild_id;
      const memberId = interaction.member.user.id;

      // Call Discord REST API manually (no discord.js)
      const endpoint = `guilds/${guildId}/members/${memberId}`;
      await fetch(`https://discord.com/api/v10/${endpoint}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
      });

      reply += `\n👢 <@${userId}> was kicked from the server.`;
    } catch (err) {
      console.error("Kick failed:", err);
      reply += "\n🚫 I tried to kick you, but I don't have permission!";
    }
  } else if (bullet) {
    reply += "\n🚫 I can only kick in servers (not DMs).";
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: reply },
  };
}

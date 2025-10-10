// src/commands/rps.js
import { InteractionResponseType } from "discord-interactions";
import {
  RPS_CHOICES,
  botPick,
  judge,
  formatResult,
} from "../games/rps/rules.js";

export async function execute(interaction) {
  const ctx = interaction.context; // 0=guild, 1=bot DM, 2=user DM
  const userId = ctx === 0 ? interaction.member.user.id : interaction.user.id;

  const player = interaction.data.options?.find(
    (o) => o.name === "choice"
  )?.value;
  if (!RPS_CHOICES.includes(player)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Please choose rock, paper, or scissors." },
    };
  }
  const bot = botPick();
  const result = judge(player, bot);

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: formatResult({ userId, player, bot, result }) },
  };
}

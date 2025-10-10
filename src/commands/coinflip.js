// src/commands/coinflip.js
import { InteractionResponseType } from "discord-interactions";

export async function execute(interaction) {
  const pick = interaction.data.options?.find(
    (o) => o.name === "choice"
  )?.value;
  if (!["heads", "tails"].includes(pick)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Pick heads or tails." },
    };
  }
  const flip = Math.random() < 0.5 ? "heads" : "tails";
  const win = flip === pick;
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `${
        win ? "🎉 You win!" : "💀 You lose."
      } You picked **${pick}**, coin: **${flip}**.`,
    },
  };
}

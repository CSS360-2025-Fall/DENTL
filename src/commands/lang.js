// src/commands/lang.js
import { InteractionResponseType } from "discord-interactions";
import { setUserLang } from "../core/i18n.js";

export async function execute(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const lang = interaction.data.options?.find(o => o.name === "value")?.value;

  if (!["en", "ja"].includes(lang)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Choose 'en' or 'ja'.", flags: 64 },
    };
  }

  setUserLang(userId, lang);
  const msg = lang === "ja" ? "言語を日本語に設定しました。" : "Language set to English.";
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: msg, flags: 64 },
  };
}

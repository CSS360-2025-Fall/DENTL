import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { InteractionResponseType } from "discord-interactions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function execute(interaction) {
  try {
    const filePath = path.join(__dirname, "../data/jokes.txt");
    const jokes = fs.readFileSync(filePath, "utf8")
      .split("\n")
      .filter(line => line.trim() !== "");

    const random = jokes[Math.floor(Math.random() * jokes.length)];

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: random,
      },
    };
  } catch (err) {
    console.error("Error loading jokes:", err);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "❌ Could not fetch a joke right now. Try again later!",
      },
    };
  }
}

// src/register.js
import "dotenv/config";
import { InstallGlobalCommands } from "./utils.js";
import { RPS_CHOICES } from "../games/rps/rules.js";

const RPS = {
  name: "rps",
  description: "Play rock-paper-scissors against the bot",
  type: 1,
  options: [
    {
      type: 3, // STRING
      name: "choice",
      description: "rock, paper, or scissors",
      required: true,
      choices: RPS_CHOICES.map((c) => ({ name: c, value: c })),
    },
  ],
};

const COINFLIP = {
  name: "coinflip",
  description: "Flip a coin",
  type: 1,
  options: [
    {
      type: 3,
      name: "pick",
      description: "heads or tails",
      required: true,
      choices: [
        { name: "heads", value: "heads" },
        { name: "tails", value: "tails" },
      ],
    },
  ],
};

const commands = [RPS, COINFLIP];

// Register globally (use guild endpoint during development if you prefer)
await InstallGlobalCommands(process.env.APP_ID, commands);

console.log(`✅ Registered ${commands.length} global command(s).`);

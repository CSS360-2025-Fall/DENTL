// src/register.js
import "dotenv/config";
import {
  InstallGuildCommands,
  InstallGlobalCommands,
  ClearGuildCommands,
  ClearGlobalCommands,
} from "./utils.js";

const RPS = {
  name: "rps",
  description: "Play rock-paper-scissors vs the bot",
  type: 1,
  options: [
    {
      type: 3,
      name: "choice",
      description: "rock, paper, or scissors",
      required: true,
      choices: ["rock", "paper", "scissors"].map((c) => ({
        name: c,
        value: c,
      })),
    },
    {
      type: 4,
      name: "bet",
      description: "bet amount (optional)",
      required: false,
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
    {
      type: 4,
      name: "bet",
      description: "bet amount (optional)",
      required: false,
    },
  ],
};

const BALANCE = { name: "balance", description: "Check your chips", type: 1 };

const INVENTORY = { name: "inventory", description: "See your items", type: 1 };

const GRANT = {
  name: "grant",
  description: "Admin: grant chips to a user",
  type: 1,
  options: [
    { type: 6, name: "user", description: "Discord user ID", required: true },
    { type: 4, name: "amount", description: "Chips to grant", required: true },
  ],
};

const GRANTITEM = {
  name: "grantitem",
  description: "Admin: grant an item to a user",
  type: 1,
  options: [
    { type: 6, name: "user", description: "Discord user ID", required: true },
    {
      type: 3,
      name: "code",
      description: "Item code (e.g., ld)",
      required: true,
    },
    { type: 4, name: "qty", description: "Quantity", required: false },
  ],
};

const commands = [RPS, COINFLIP, BALANCE, INVENTORY, GRANT, GRANTITEM];

async function registerCommands() {
  const { APP_ID, GUILD_ID, IN_DEV } = process.env;
  const isDev = String(IN_DEV).toLowerCase() === "true" || IN_DEV === "1";

  console.log(
    `🔧 Register mode: ${isDev ? "Development (guild)" : "Production (global)"}`
  );

  if (isDev) {
    if (!GUILD_ID) {
      console.error("❌ IN_DEV=true but GUILD_ID missing in .env");
      process.exit(1);
    }
    console.log("🧹 Clearing global commands...");
    await ClearGlobalCommands(APP_ID);

    console.log("📦 Installing guild commands...");
    await InstallGuildCommands(APP_ID, GUILD_ID, commands);

    console.log(
      `✅ Registered ${commands.length} command(s) to guild ${GUILD_ID}`
    );
  } else {
    console.log("🧹 Clearing guild commands...");
    if (GUILD_ID) await ClearGuildCommands(APP_ID, GUILD_ID);

    console.log("📦 Installing global commands...");
    await InstallGlobalCommands(APP_ID, commands);

    console.log(`🌍 Registered ${commands.length} global command(s)`);
  }
}

registerCommands().catch(console.error);

console.log(`✅ Registered ${commands.length} global command(s).`);

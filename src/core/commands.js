// src/register.js
import "dotenv/config";
import {
  InstallGuildCommands,
  InstallGlobalCommands,
  ClearGuildCommands,
  ClearGlobalCommands,
} from "./utils.js";

const LANG = {
  name: "lang",
  description: "Set your language",
  name_localizations: { ja: "言語" },
  description_localizations: { ja: "使用言語を設定" },
  type: 1,
  options: [
    {
      type: 3, // STRING
      name: "value",
      description: "Language (en or ja)",
      name_localizations: { ja: "値" },
      description_localizations: { ja: "言語（en または ja）" },
      required: true,
      choices: [
        { name: "English", value: "en", name_localizations: { ja: "英語" } },
        { name: "日本語",  value: "ja", name_localizations: { ja: "日本語" } },
      ],
    },
  ],
};

const RULES  = {
  name: "rule",
  description: "Get the rules for a game",
  type: 1,
  options: [
    {
      type: 3,
      name: "game",
      description: "Game type (e.g., rps)",
      required: true,
      choices: [
        { name: "rps", value: "rps" },
        { name: "coinflip", value: "coinflip" },
        { name: "russianroulette", value: "russianroulette" }  
      ],
    },
  ],
};
    
const RPS = {
  name: "rps",
  description: "Play rock-paper-scissors vs the bot",
  name_localizations: { ja: "じゃんけん" },
  description_localizations: { ja: "ボットとじゃんけんで勝負" },
  type: 1,
  options: [
    {
      type: 3,
      name: "choice",
      description: "rock, paper, or scissors",
      name_localizations: { ja: "手" },
      description_localizations: { ja: "グー・パー・チョキのいずれか" },
      required: true,
      choices: [
        { name: "Rock",     value: "rock",     name_localizations: { ja: "グー" } },
        { name: "Paper",    value: "paper",    name_localizations: { ja: "パー" } },
        { name: "Scissors", value: "scissors", name_localizations: { ja: "チョキ" } },
      ],
    },
    {
      type: 4,
      name: "bet",
      description: "bet amount (optional)",
      name_localizations: { ja: "ベット" },
      description_localizations: { ja: "任意のベット額" },
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

const RUSSIANROULETTE = {
  name: "russianroulette",
  description: "Play the odds.",
  type: 1,
};

const DAILY = {
  name: "daily",
  description: "Claim your daily credits (with streak)",
  type: 1,
};
const FREEBIE = {
  name: "freebie",
  description: "Grab a small freebie (1h cooldown)",
  type: 1,
};

const JOKE = {
  name: "joke",
  description: "get a random joke",
  type: 1,
};
const QUOTE = {
  name: "quote",
  description: "get a random quote",
  type: 1,
};



const commands = [
  LANG,
  RULES,
  RPS,
  COINFLIP,
  BALANCE,
  INVENTORY,
  GRANT,
  GRANTITEM,
  RUSSIANROULETTE,
  DAILY,
  FREEBIE,
  JOKE,
  QUOTE,
];

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

// src/register.js
import "dotenv/config";
import {
  InstallGuildCommands,
  InstallGlobalCommands,
  ClearGuildCommands,
  ClearGlobalCommands,
} from "./utils.js";
import { ITEMS } from "../registry/items.js";
import { STOCKS as STOCK_REG } from "../registry/stocks.js";

const POKER = {
  name: "poker",
  description: "Texas Hold'em Poker game",
  type: 1,
  options: [
    { name: "join", type: 1, description: "Join the poker lobby" },
    { name: "leave", type: 1, description: "Leave the poker table" },
    { name: "start", type: 1, description: "Start the game" },
    { name: "end", type: 1, description: "End the game (admin only)" }
  ]
};

const BLACKJACK = {
  name: "blackjack",
  description: "Play blackjack against the bot",
  type: 1,
  options: [
    {
      type: 4,
      name: "bet",
      description: "bet amount (mandatory)",
      required: true,
    },
  ],
};

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
        { name: "日本語", value: "ja", name_localizations: { ja: "日本語" } },
      ],
    },
  ],
};

const RULES = {
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
        { name: "russianroulette", value: "russianroulette" },
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
        { name: "Rock", value: "rock", name_localizations: { ja: "グー" } },
        { name: "Paper", value: "paper", name_localizations: { ja: "パー" } },
        {
          name: "Scissors",
          value: "scissors",
          name_localizations: { ja: "チョキ" },
        },
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

const SELL_CHOICES = ITEMS.filter(
  (i) => i.enabled !== false && typeof i.sell === "number" && i.sell > 0
)
  .slice(0, 25)
  .map((i) => ({ name: i.name, value: i.code })); // pass short code like "sr", "sc", "ff"

const SELL = {
  name: "sell",
  description: "Sell a sellable item from your inventory for credits",
  type: 1, // CHAT_INPUT
  options: [
    {
      type: 3, // STRING
      name: "code",
      description: "Item to sell (pick from the list)",
      required: true,
      choices: SELL_CHOICES, // e.g., "Shiny Rock" -> "sr"
    },
    {
      type: 4, // INTEGER
      name: "qty",
      description: "Quantity to sell (defaults to 1)",
      required: false,
    },
  ],
};

const STOCK_CHOICES = STOCK_REG.filter((s) => s.enabled !== false)
  .slice(0, 25)
  .map((s) => ({ name: `${s.name} (${s.symbol})`, value: s.symbol }));

const STOCKS = {
  name: "stocks",
  description: "View/buy/sell stocks",
  type: 1,
  options: [
    {
      type: 1,
      name: "list",
      description: "List all stocks and current prices",
    },
    {
      type: 1,
      name: "buy",
      description: "Buy shares at current price",
      options: [
        {
          type: 3,
          name: "symbol",
          description: "Stock symbol",
          required: true,
          choices: STOCK_CHOICES,
        },
        {
          type: 4,
          name: "qty",
          description: "Quantity (default 1)",
          required: false,
        },
      ],
    },
    {
      type: 1,
      name: "sell",
      description: "Sell shares at current price",
      options: [
        {
          type: 3,
          name: "symbol",
          description: "Stock symbol",
          required: true,
          choices: STOCK_CHOICES,
        },
        {
          type: 4,
          name: "qty",
          description: "Quantity (default 1)",
          required: false,
        },
      ],
    },
    { type: 1, name: "stats", description: "Admin: show stock states & turns" },
    {
      type: 1,
      name: "reset",
      description: "Admin: reset one stock or all to baseline",
      options: [
        {
          type: 3,
          name: "symbol",
          description: "Stock symbol (omit to reset ALL)",
          required: false,
          choices: STOCK_CHOICES,
        },
      ],
    },
  ],
};

const SLOTS = {
  name: "slots",
  description: "Spin a slot machine (bet 0 = free play)",
  type: 1,
  options: [
    {
      type: 4,
      name: "bet",
      description: "bet amount (optional, 0 = free play)",
      required: false,
    },
  ],
};

const commands = [
  POKER,
  BLACKJACK,
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
  SELL,
  STOCKS,
  SLOTS,
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

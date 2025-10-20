// src/app.js
import "dotenv/config";
import express from "express";
import {
  verifyKeyMiddleware,
  InteractionType,
  InteractionResponseType,
} from "discord-interactions";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tickAllStocks } from "../economy/stocks.js";
import { GameConfig } from "../config/gameConfig.js";
import { stock_prune_by_age } from "../economy/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// dynamic command module loader
async function loadCommand(name) {
  const file = path.join(__dirname, "../commands", `${name}.js`);
  if (!fs.existsSync(file)) return null;
  return import(pathToFileURL(file));
}

app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY),
  async (req, res) => {
    const { type, data } = req.body;

    // 1) Verification
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    // 2) Slash commands
    if (type === InteractionType.APPLICATION_COMMAND) {
      const cmdName = data.name; // e.g., 'rps', 'coinflip'
      const mod = await loadCommand(cmdName);
      if (!mod?.execute) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `Unknown command: /${cmdName}` },
        });
      }
      try {
        const response = await mod.execute(req.body);
        return res.send(response);
      } catch (err) {
        console.error(err);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "❌ Error executing command." },
        });
      }
    }

    // 3) Anything else
    return res.status(400).json({ error: "unsupported interaction" });
  }
);

app.listen(PORT, () => console.log(`🚀 Listening on :${PORT}`));

const MIN = 60 * 1000;
setInterval(() => {
  try {
    tickAllStocks();
  } catch (e) {
    console.error("Error ticking stocks:", e);
  }
}, (GameConfig.stocks.stockTick || 5) * MIN);

setInterval(() => {
  try {
    const removed = stock_prune_by_age(7);
    if (removed) console.log(`🗑️ pruned ${removed} old stock rows`);
  } catch (e) {
    console.error("Prune error:", e);
  }
}, 6 * 60 * 60 * 1000); // every 6 hours

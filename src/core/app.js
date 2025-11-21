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
import * as BLACKJACK from '../commands/blackjack.js'; // adjust if needed
import * as ROULETTE from '../commands/roulette.js';
import * as POKER from '../commands/poker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// DO NOT apply express.json() globally!

// Dynamic command loader for slash commands
async function loadCommand(name) {
  const file = path.join(__dirname, "../commands", `${name}.js`);
  if (!fs.existsSync(file)) return null;
  return import(pathToFileURL(file));
}

// The ONLY /interactions route!
app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY), // must be raw body for signature check!
  async (req, res) => {
    const { type, data } = req.body;

    // 1) Verification
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    // 2) Slash commands
    if (type === InteractionType.APPLICATION_COMMAND) {
      const cmdName = data.name; // e.g., 'rps', 'coinflip', 'blackjack'
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

    // 3) Button/component interactions
    if (type === InteractionType.MESSAGE_COMPONENT) {
      // Blackjack buttons
      if (data.custom_id && data.custom_id.startsWith("bj_")) {
        try {
          const response = await BLACKJACK.interact(req.body);
          console.log("Blackjack interact output:", response);
          return res.send(response);
        } catch (err) {
          console.error("BJ button error:", err, err.stack);
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "❌ Error handling Blackjack interaction." }
          });
        }
      }

      // Roulette buttons
      if (data.custom_id && data.custom_id.startsWith("roulette_")) {
        try {
          const response = await ROULETTE.interact(req.body);
          console.log("Roulette interact output:", response);
          return res.send(response);
        } catch (err) {
          console.error("Roulette button error:", err, err.stack);
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "❌ Error handling Roulette interaction." }
          });
        }
      }

      // Add more cases for other games/commands/buttons here if needed

    }

     // 4) MODAL SUBMISSIONS (ADD THIS ENTIRE SECTION)
    if (type === InteractionType.MODAL_SUBMIT) {
      // Roulette modals
      if (data.custom_id && data.custom_id.startsWith("roulette_modal_")) {
        try {
          const response = await ROULETTE.handleModalSubmit(req.body);
          console.log("Roulette modal output:", response);
          return res.send(response);
        } catch (err) {
          console.error("Roulette modal error:", err, err.stack);
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "❌ Error handling Roulette modal." }
          });
        }
      }

      // Add other modal handlers here if needed
      
    }


    
    if (data.custom_id && data.custom_id.startsWith("poker_")) {
    try {
      const response = await POKER.interact(req.body);
      return res.send(response);
    } catch (err) {
      console.error("Poker button error:", err, err.stack);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: "❌ Error handling Poker interaction." }
      });
    }
  }
    // 4) Anything else
    return res.status(400).json({ error: "unsupported interaction" });
  }
);

// If you have other API routes, use express.json() ONLY for those, like:
// app.use('/api', express.json());

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

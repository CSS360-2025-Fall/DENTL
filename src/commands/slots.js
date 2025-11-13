// src/commands/slots.js
import { InteractionResponseType } from "discord-interactions";
import { getBalance } from "../economy/db.js";
import { validateAndLockBet } from "../economy/bets.js";

// ──────────────────────────────────────────────
// Symbols & paytable
// ──────────────────────────────────────────────
//
// two  = multiplier for any 2-of-a-kind on the payline
// three = multiplier for 3-of-a-kind on the payline
//
const SYMBOLS = [
  { emoji: "🍒", weight: 40, two: 1.5, three: 4 }, // common, small win
  { emoji: "🍋", weight: 35, two: 2, three: 5 },
  { emoji: "🔔", weight: 20, two: 3, three: 8 },
  { emoji: "⭐", weight: 10, two: 4, three: 12 },
  { emoji: "7️⃣", weight: 4, two: 7, three: 21 },
  { emoji: "💎", weight: 1, two: 10, three: 50 }, // rare jackpot
];

const totalWeight = SYMBOLS.reduce((a, s) => a + s.weight, 0);
const SYMBOL_BY_EMOJI = Object.fromEntries(SYMBOLS.map((s) => [s.emoji, s]));

function randSymbol() {
  let r = Math.random() * totalWeight;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SYMBOLS[0];
}

// One column = [top, mid, bot]
function randColumn() {
  return [randSymbol(), randSymbol(), randSymbol()];
}

// Cycle: symbol above becomes next payline symbol
// newTop = random, newMid = oldTop, newBot = oldMid
function shiftColumn(col) {
  return [randSymbol(), col[0], col[1]];
}

// Determine result FROM CENTER ROW ONLY.
// Returns { tier, symbol, multiplier }:
//   tier = 0 (no win), 2 (two-of-a-kind), 3 (three-of-a-kind)
//   symbol = SYMBOL object (or null)
//   multiplier = payout factor (0 if no win)
function paylineResult(cols) {
  const midA = cols[0][1];
  const midB = cols[1][1];
  const midC = cols[2][1];

  // 3-of-a-kind
  if (midA.emoji === midB.emoji && midB.emoji === midC.emoji) {
    const sym = SYMBOL_BY_EMOJI[midA.emoji];
    return {
      tier: 3,
      symbol: sym,
      multiplier: sym?.three ?? 0,
    };
  }

  // any 2-of-a-kind
  let matchEmoji = null;
  if (midA.emoji === midB.emoji) matchEmoji = midA.emoji;
  else if (midA.emoji === midC.emoji) matchEmoji = midA.emoji;
  else if (midB.emoji === midC.emoji) matchEmoji = midB.emoji;

  if (matchEmoji) {
    const sym = SYMBOL_BY_EMOJI[matchEmoji];
    return {
      tier: 2,
      symbol: sym,
      multiplier: sym?.two ?? 0,
    };
  }

  // no win
  return { tier: 0, symbol: null, multiplier: 0 };
}

// cols = [col1, col2, col3], each col = [top, mid, bot]
function renderFrame(cols, footer = "Spinning…") {
  const [c1, c2, c3] = cols;

  const topRow = `   │ ${c1[0].emoji} │ ${c2[0].emoji} │ ${c3[0].emoji} │`;
  const midRow = `▶ ${c1[1].emoji} │ ${c2[1].emoji} │ ${c3[1].emoji} ◀`;
  const botRow = `   │ ${c1[2].emoji} │ ${c2[2].emoji} │ ${c3[2].emoji} │`;

  return [
    "🎰 **SLOTS**",
    "    ─────────────",
    topRow,
    `**${midRow}**`,
    botRow,
    "    ─────────────",
    `_${footer}_`,
  ].join("\n");
}

// ──────────────────────────────────────────────
// Command handler (raw interactions API)
// ──────────────────────────────────────────────

export async function execute(interaction) {
  const ctx = interaction.context;
  const userId = ctx === 0 ? interaction.member.user.id : interaction.user.id;

  const bet =
    Number(
      interaction.data.options?.find((o) => o.name === "bet")?.value ?? 0
    ) | 0;

  const check = validateAndLockBet(userId, bet);
  if (!check.ok) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: check.error, flags: 64 },
    };
  }

  const appId = interaction.application_id;
  const token = interaction.token;
  const endpoint = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;

  // Animation config
  const frames = 8; // total frames
  const delayMs = 500; // 2 edits/sec → 4 seconds

  // Start with random reels
  let cols = [randColumn(), randColumn(), randColumn()];

  const firstContent = renderFrame(cols, "Spinning…");

  // Kick off async animation (PATCH edits)
  (async () => {
    for (let i = 1; i < frames; i++) {
      await new Promise((r) => setTimeout(r, delayMs));

      const stop1 = i >= frames - 3; // last 3 frames: col 1 stops
      const stop2 = i >= frames - 2; // last 2 frames: col 2 stops
      const stop3 = i >= frames - 1; // last frame:  col 3 stops

      if (!stop1) cols[0] = shiftColumn(cols[0]);
      if (!stop2) cols[1] = shiftColumn(cols[1]);
      if (!stop3) cols[2] = shiftColumn(cols[2]);

      let footer = "Spinning…";

      // Final frame: compute result and settle
      if (i === frames - 1) {
        const { tier, symbol, multiplier } = paylineResult(cols);
        let line = "";
        let newBal = getBalance(userId);

        if (bet === 0) {
          // Free play: no balance change
          if (tier === 0) {
            line = "Free play: no win.";
          } else {
            const em = symbol?.emoji ?? "❓";
            const multDisplay = multiplier.toString().replace(/\.0$/, "");
            line =
              tier === 2
                ? `Free play: two **${em}** on the payline (x${multDisplay}).`
                : `Free play: **three ${em}** on the payline! (x${multDisplay}) 🎉`;
          }
        } else {
          if (tier === 0 || multiplier <= 0) {
            newBal = check.settle.lose();
            line = `💀 No match on the payline.\nBet: **${bet}** • New balance: **${newBal}**`;
          } else {
            // Use symbol-specific multiplier
            const mult = multiplier;
            newBal = check.settle.win(mult);
            const em = symbol?.emoji ?? "❓";
            const multDisplay = mult.toString().replace(/\.0$/, "");
            line =
              tier === 2
                ? `🎉 Two **${em}** on the payline! (x${multDisplay})\nBet: **${bet}** • New balance: **${newBal}**`
                : `💎 **Three ${em} jackpot!** (x${multDisplay})\nBet: **${bet}** • New balance: **${newBal}**`;
          }
        }

        footer = line;
      }

      const content = renderFrame(cols, footer);

      try {
        await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
      } catch (err) {
        console.error("slots animation error:", err);
        break;
      }
    }
  })();

  // Initial response (no interaction.reply!)
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: firstContent },
  };
}

// slots.js — RAW INTERACTION API VERSION
import { InteractionResponseType } from "discord-interactions";
import { getBalance } from "../economy/db.js";
import { validateAndLockBet } from "../economy/bets.js";

// ──────────────────────────────────────────────
// Symbols & helpers
// ──────────────────────────────────────────────

const SYMBOLS = [
  { emoji: "🍒", weight: 40 },
  { emoji: "🍋", weight: 35 },
  { emoji: "🔔", weight: 20 },
  { emoji: "⭐", weight: 10 },
  { emoji: "7️⃣", weight: 4 },
  { emoji: "💎", weight: 1 },
];

const totalWeight = SYMBOLS.reduce((a, s) => a + s.weight, 0);

function randSymbol() {
  let r = Math.random() * totalWeight;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SYMBOLS[0];
}

function randColumn() {
  return [randSymbol(), randSymbol(), randSymbol()];
}

// Cycle: top → mid → bot → (new random top)
function shiftColumn(col) {
  return [randSymbol(), col[0], col[1]];
}

function paylineTier(cols) {
  const a = cols[0][1];
  const b = cols[1][1];
  const c = cols[2][1];

  if (a.emoji === b.emoji && b.emoji === c.emoji) return 2;
  if (a.emoji === b.emoji || a.emoji === c.emoji || b.emoji === c.emoji)
    return 1;

  return 0;
}

function renderFrame(cols, footer = "Spinning…") {
  const [c1, c2, c3] = cols;

  return [
    "🎰 **SLOTS**",
    "",
    `   │ ${c1[0].emoji} │ ${c2[0].emoji} │ ${c3[0].emoji} │`,
    `**▶ ${c1[1].emoji} │ ${c2[1].emoji} │ ${c3[1].emoji} ◀**  ← _payline_`,
    `   │ ${c1[2].emoji} │ ${c2[2].emoji} │ ${c3[2].emoji} │`,
    "   └─────────────",
    `_${footer}_`,
  ].join("\n");
}

// ──────────────────────────────────────────────
// Command Handler (RAW INTERACTION RESPONSE)
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

  // Animation parameters
  const frames = 16;
  const delayMs = 500;

  // Initial random columns
  let cols = [randColumn(), randColumn(), randColumn()];

  // Prepare the FIRST FRAME to send back to Discord immediately
  const firstContent = renderFrame(cols, "Spinning…");

  // Begin async animation (PATCH edits)
  const appId = interaction.application_id;
  const token = interaction.token;
  const endpoint = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;

  (async () => {
    for (let i = 1; i < frames; i++) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Stagger stopping
      const stop1 = i >= frames - 3;
      const stop2 = i >= frames - 2;
      const stop3 = i >= frames - 1;

      if (!stop1) cols[0] = shiftColumn(cols[0]);
      if (!stop2) cols[1] = shiftColumn(cols[1]);
      if (!stop3) cols[2] = shiftColumn(cols[2]);

      let content;
      let footer = "Spinning…";

      if (i === frames - 1) {
        // Final frame result + settle
        const tier = paylineTier(cols);
        let resultLine = "";
        let newBal = getBalance(userId);

        if (bet === 0) {
          if (tier === 0) resultLine = "Free play: no win.";
          else if (tier === 1) resultLine = "Free play: two-of-a-kind!";
          else resultLine = "Free play: **three-of-a-kind jackpot!**";
        } else {
          if (tier === 0) {
            newBal = check.settle.lose();
            resultLine = `💀 Lost **${bet}** • New Balance: **${newBal}**`;
          } else if (tier === 1) {
            newBal = check.settle.win(2);
            resultLine = `🎉 Two-of-a-kind! (x2) • New Balance: **${newBal}**`;
          } else {
            newBal = check.settle.win(5);
            resultLine = `💎 **Three-of-a-kind! (x5)** • New Balance: **${newBal}**`;
          }
        }

        footer = resultLine;
      }

      content = renderFrame(cols, footer);

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

  // 🚨 This is the ONLY response we send back to Discord:
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: firstContent },
  };
}

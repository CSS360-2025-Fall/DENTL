import { GameConfig } from "../config/gameConfig.js";
import { STOCKS } from "../registry/stocks.js";
import {
  addBalance,
  getBalance,
  addItem,
  getInventory,
  stock_latest,
  stock_write,
} from "./db.js";
import { toStockCode } from "../registry/index.js";

// ---------- Config shorthands ----------
const C = GameConfig.stocks; // expect fields:
// stockTick (minutes), baselineBias (percent points)
// <state>BaseChance, <state>Min, <state>Max for: stable, slowRise, slowFall, fastRise, fastFall, chaotic, boom, crash

// ---------- State catalog (0..7) ----------
const STATES = [
  {
    id: 0,
    key: "stable",
    name: "Stable",
    base: C.stableBaseChance,
    min: C.stableMin,
    max: C.stableMax,
  },
  {
    id: 1,
    key: "slowRise",
    name: "Slow Rise",
    base: C.slowRiseBaseChance,
    min: C.slowRiseMin,
    max: C.slowRiseMax,
  },
  {
    id: 2,
    key: "slowFall",
    name: "Slow Fall",
    base: C.slowFallBaseChance,
    min: C.slowFallMin,
    max: C.slowFallMax,
  },
  {
    id: 3,
    key: "fastRise",
    name: "Fast Rise",
    base: C.fastRiseBaseChance,
    min: C.fastRiseMin,
    max: C.fastRiseMax,
  },
  {
    id: 4,
    key: "fastFall",
    name: "Fast Fall",
    base: C.fastFallBaseChance,
    min: C.fastFallMin,
    max: C.fastFallMax,
  },
  {
    id: 5,
    key: "chaotic",
    name: "Chaotic",
    base: C.chaoticBaseChance,
    min: C.chaoticMin,
    max: C.chaoticMax,
  },
  {
    id: 6,
    key: "boom",
    name: "Boom",
    base: C.boomBaseChance,
    min: C.boomMin,
    max: C.boomMax,
  },
  {
    id: 7,
    key: "crash",
    name: "Crash",
    base: C.crashBaseChance,
    min: C.crashMin,
    max: C.crashMax,
  },
  {
    id: 8,
    key: "injection",
    name: "Injection",
    base: 0,
    min: C.injectionMin,
    max: C.injectionMax,
  },
];

// ---------- Utils ----------
function randInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}
function sampleMultiplier(min, max) {
  // All bands should be positive multipliers (e.g., 0.95..1.05, not negatives).
  const lo = Math.max(0.01, Math.min(min, max));
  const hi = Math.max(lo, Math.max(min, max));
  return lo + Math.random() * (hi - lo);
}

function sampleFloat(min, max) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.random() * (hi - lo);
}

function baseWeights() {
  return STATES.map((s) => Number(s.base) || 0);
}

function applyBaselineBias(weights, price, baseline) {
  // baselineBias is percent points (e.g., 20 => ±20%)
  // When price is high vs baseline, push weight from rises -> falls.
  // When low, push from falls -> rises. Amounts are 10 and 7.5 "points" (same as earlier design).
  const dev = (price - baseline) / baseline; // signed
  const thr = (C.baselineBias || 20) / 100; // e.g., 0.20

  // Only bias when outside the threshold band
  if (Math.abs(dev) <= thr) {
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    return weights.map((w) => w / sum);
  }

  // strength grows with distance beyond threshold
  const beyond = (Math.abs(dev) - thr) / thr; // 0..1 as you go from 1×thr to 2×thr
  const factor = 1 + Math.min(1, beyond) * 1.5; // up to ×2.5 scaling; tune 1.0–2.0+

  // idx: 1=slowRise, 2=slowFall, 3=fastRise, 4=fastFall
  if (dev > 0) {
    // price above baseline: favor falls
    weights[1] /= factor; // slowRise
    weights[3] /= factor; // fastRise
    weights[2] *= factor; // slowFall
    weights[4] *= factor; // fastFall
  } else {
    // below baseline: favor rises
    weights[2] /= factor; // slowFall
    weights[4] /= factor; // fastFall
    weights[1] *= factor; // slowRise
    weights[3] *= factor; // fastRise
  }

  // (optionally) leave boom/crash unchanged so rare events still happen
  // weights[6], weights[7] untouched

  // normalize
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  return weights.map((w) => w / sum);
}
function sampleIndex(probabilities) {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < probabilities.length; i++) {
    acc += probabilities[i];
    if (r <= acc) return i;
  }
  return probabilities.length - 1;
}

// Assign a new state with baseline bias applied; turns: 3..6 (Boom/Crash <= 3)
function pickNewState(price, baseline) {
  const probs = applyBaselineBias(baseWeights(), price, baseline);
  const id = sampleIndex(probs);
  const isBoomCrash = id === 6 || id === 7;
  const turnsLeft = isBoomCrash ? randInt(1, 3) : randInt(3, 6);
  return { stateId: id, turnsLeft };
}

function ensureLatestRow(symbol, baseline) {
  const row = stock_latest(symbol);
  if (row) return row;
  const now = Date.now();
  // Seed with baseline and 0 turns so first tick assigns state immediately
  stock_write(symbol, now, baseline, 0, 0);
  return { symbol, ts: now, price: baseline, state_id: 0, turns_left: 0 };
}

// ---------- Public: ticking ----------
export function tickAllStocks() {
  const now = Date.now();

  for (const def of STOCKS.filter((s) => s.enabled !== false)) {
    const latest = ensureLatestRow(def.symbol, def.baseline);

    // If state exhausted or missing, assign new
    let stateId = latest.state_id;
    let turnsLeft = latest.turns_left;

    if (turnsLeft <= 0) {
      // --- Injection check ---
      const injOn = GameConfig.stocks.injectionEnabled !== false;
      const injThresh = Number(GameConfig.stocks.injectionThreshold ?? 0.2);
      const injChance = Number(GameConfig.stocks.injectionChance ?? 0.5);

      const below = latest.price <= Math.floor(def.baseline * injThresh);

      if (injOn && below && Math.random() < injChance) {
        const injBoost = sampleFloat(C.injectionMin, C.injectionMax);

        // Apply one-turn additive injection: + (injBoost * baseline)
        const bump = Math.max(1, Math.floor(def.baseline * injBoost));
        const nextPrice = Math.max(1, latest.price + bump);

        // record as a one-turn special state; no turns carry over
        stock_write(def.symbol, now, nextPrice, 8, 0);

        // move to next symbol (skip normal tick logic)
        continue;
      }

      // Otherwise: pick a normal state with bias & regular turns (3..6, boom/crash <=3)
      const ns = pickNewState(latest.price, def.baseline);
      stateId = ns.stateId;
      turnsLeft = ns.turnsLeft;
    }

    // Apply multiplier from the chosen state's band
    const sdef = STATES[stateId];
    const mult = sampleMultiplier(sdef.min, sdef.max); // e.g., 0.95..1.05
    const nextPrice = Math.max(1, Math.floor(latest.price * mult));
    const nextTurns = Math.max(0, turnsLeft - 1);

    stock_write(def.symbol, now, nextPrice, stateId, nextTurns);
  }
}

// ---------- Public: views ----------
export function listCurrentStocks() {
  return STOCKS.filter((s) => s.enabled !== false).map((def) => {
    const row = stock_latest(def.symbol) || {
      price: def.baseline,
      state_id: 0,
      turns_left: 0,
    };
    return {
      symbol: def.symbol,
      name: def.name,
      price: row.price,
      baseline: def.baseline,
      stateId: row.state_id,
      turnsLeft: row.turns_left,
    };
  });
}

// ---------- Public: user ops (holdings in inventory as 'stk:<symbol>') ----------
export function buyStock(userId, symbol, qty) {
  qty = Number(qty) | 0;
  if (qty <= 0) throw new Error("Quantity must be positive.");

  const def = STOCKS.find((s) => s.symbol === symbol && s.enabled !== false);
  if (!def) throw new Error("Unknown stock.");

  const row = stock_latest(symbol) || { price: def.baseline };
  const cost = row.price * qty;
  const bal = getBalance(userId);
  if (bal < cost) throw new Error(`Insufficient funds. Need ${cost}.`);

  addBalance(userId, -cost);
  addItem(userId, toStockCode(symbol), qty);
  return { price: row.price };
}

export function sellStock(userId, symbol, qty) {
  qty = Number(qty) | 0;
  if (qty <= 0) throw new Error("Quantity must be positive.");

  const def = STOCKS.find((s) => s.symbol === symbol && s.enabled !== false);
  if (!def) throw new Error("Unknown stock.");

  const row = stock_latest(symbol) || { price: def.baseline };
  const code = toStockCode(symbol);
  const have = getInventory(userId).find((x) => x.item_code === code)?.qty || 0;
  if (have < qty) throw new Error(`You only have ${have}.`);

  addItem(userId, code, -qty);
  const proceeds = row.price * qty;
  const newBal = addBalance(userId, proceeds);
  return { price: row.price, proceeds, newBal };
}

export function resetStock(symbol) {
  const def = STOCKS.find((s) => s.symbol === symbol && s.enabled !== false);
  if (!def) throw new Error("Unknown stock.");
  const now = Date.now();
  // write a fresh history row at baseline; state_id=0, turns_left=0
  stock_write(symbol, now, def.baseline, 0, 0);
  return def.baseline;
}

export function resetAllStocks() {
  const now = Date.now();
  for (const def of STOCKS.filter((s) => s.enabled !== false)) {
    stock_write(def.symbol, now, def.baseline, 0, 0);
  }
}

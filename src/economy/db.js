// src/economy/db.js
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "..", "data", "casino.sqlite");
console.log("🗄️ Using DB at:", DB_PATH);

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// --- create schema BEFORE any prepare() ---
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS balances (
      user_id TEXT PRIMARY KEY,
      balance INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inventory (
      user_id TEXT NOT NULL,
      item_code TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, item_code)
    );

    -- DAILY (calendar streak)
    CREATE TABLE IF NOT EXISTS claims (
      user_id TEXT PRIMARY KEY,
      last_claim_date TEXT NOT NULL, -- 'YYYY-MM-DD' UTC
      streak INTEGER NOT NULL
    );

    -- FREEBIE (hour cooldown)
    CREATE TABLE IF NOT EXISTS freebies (
      user_id TEXT PRIMARY KEY,
      last_freebie INTEGER NOT NULL  -- ms epoch UTC
    );

    CREATE TABLE IF NOT EXISTS stock_prices (
      symbol      TEXT NOT NULL,       -- e.g. 'cc', 'dc', 'bod', ...
      ts          INTEGER NOT NULL,    -- ms epoch
      price       INTEGER NOT NULL,    -- credits, ≥1
      state_id    INTEGER NOT NULL,    -- 0..7
      turns_left  INTEGER NOT NULL,    -- >=0
      PRIMARY KEY (symbol, ts)
    );
    CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_ts ON stock_prices(symbol, ts);

  `);
}
initSchema();

// --- prepared statements (after schema) ---
const getBal = db.prepare("SELECT balance FROM balances WHERE user_id=?");
const upsertBal = db.prepare(`
  INSERT INTO balances (user_id, balance) VALUES (?, ?)
  ON CONFLICT(user_id) DO UPDATE SET balance=excluded.balance
`);
const allInv = db.prepare(
  "SELECT item_code, qty FROM inventory WHERE user_id=?"
);
const getItem = db.prepare(
  "SELECT qty FROM inventory WHERE user_id=? AND item_code=?"
);
const upsertIt = db.prepare(`
  INSERT INTO inventory (user_id, item_code, qty) VALUES (?, ?, ?)
  ON CONFLICT(user_id, item_code) DO UPDATE SET qty=excluded.qty
`);

// --- currency API ---
export function getBalance(userId) {
  return getBal.get(userId)?.balance ?? 0;
}
export function setBalance(userId, amount) {
  upsertBal.run(userId, Math.max(0, amount | 0));
  return getBalance(userId);
}
export function addBalance(userId, delta) {
  const next = Math.max(0, getBalance(userId) + (delta | 0));
  return setBalance(userId, next);
}

// --- items API ---
export function getInventory(userId) {
  return allInv.all(userId);
}
export function addItem(userId, itemCode, delta = 1) {
  const cur = getItem.get(userId, itemCode)?.qty ?? 0;
  const next = Math.max(0, cur + (delta | 0));
  upsertIt.run(userId, itemCode, next);
  return next;
}
export function setItem(userId, itemCode, qty) {
  upsertIt.run(userId, itemCode, Math.max(0, qty | 0));
  return Math.max(0, qty | 0);
}

/* -------- helpers (UTC calendar) -------- */
function utcDateStr(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function dateMinusDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - days);
  return utcDateStr(dt);
}
function msUntilNextUtcMidnight(now = new Date()) {
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );
  return next.getTime() - now.getTime();
}

/* -------- DAILY (calendar-day with streak 1..maxStreak) -------- */
const getClaim = db.prepare(
  "SELECT last_claim_date, streak FROM claims WHERE user_id=?"
);
const upsertClaim = db.prepare(`
  INSERT INTO claims (user_id, last_claim_date, streak) VALUES (?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET last_claim_date=excluded.last_claim_date, streak=excluded.streak
`);

export function claimDailyCalendar(userId, baseAmount = 1000, maxStreak = 5) {
  const today = utcDateStr();
  const row = getClaim.get(userId);
  if (row?.last_claim_date === today) {
    return {
      ok: false,
      reason: "already",
      waitMs: msUntilNextUtcMidnight(),
      streak: row.streak,
      amount: 0,
      newBalance: getBalance(userId),
    };
  }

  let newStreak = 1;
  if (row) {
    const yesterday = dateMinusDays(today, 1);
    newStreak =
      row.last_claim_date === yesterday
        ? Math.min(row.streak + 1, maxStreak)
        : 1;
  }

  const amount = baseAmount * newStreak;

  const tx = db.transaction((uid, amt, day, streak) => {
    const cur = getBal.get(uid)?.balance ?? 0; // first-ever user auto-creates
    upsertBal.run(uid, cur + amt);
    upsertClaim.run(uid, day, streak);
    return cur + amt;
  });

  const newBal = tx(userId, amount | 0, today, newStreak);
  return {
    ok: true,
    reason: "granted",
    waitMs: 0,
    streak: newStreak,
    amount: amount | 0,
    newBalance: newBal,
  };
}

/* -------- FREEBIE (hour cooldown) -------- */
const getFree = db.prepare("SELECT last_freebie FROM freebies WHERE user_id=?");
const upsertFree = db.prepare(`
  INSERT INTO freebies (user_id, last_freebie) VALUES (?, ?)
  ON CONFLICT(user_id) DO UPDATE SET last_freebie=excluded.last_freebie
`);

export function claimFreebie(
  userId,
  amount = 100,
  cooldownMs = 60 * 60 * 1000
) {
  const now = Date.now();
  const last = getFree.get(userId)?.last_freebie ?? 0;
  const remaining = cooldownMs - (now - last);

  if (last > 0 && remaining > 0) {
    return {
      ok: false,
      waitMs: remaining,
      amount: 0,
      newBalance: getBalance(userId),
    };
  }
  const tx = db.transaction((uid, amt, ts) => {
    const cur = getBal.get(uid)?.balance ?? 0;
    upsertBal.run(uid, cur + amt);
    upsertFree.run(uid, ts);
    return cur + amt;
  });
  const newBal = tx(userId, amount | 0, now);
  return { ok: true, waitMs: 0, amount: amount | 0, newBalance: newBal };
}

// ----- STOCK HISTORY HELPERS -----
const sp_latest = db.prepare(
  `SELECT symbol, ts, price, state_id, turns_left
   FROM stock_prices WHERE symbol=? ORDER BY ts DESC LIMIT 1`
);
const sp_insert = db.prepare(
  `INSERT OR REPLACE INTO stock_prices (symbol, ts, price, state_id, turns_left)
   VALUES (?, ?, ?, ?, ?)`
);
const sp_recent = db.prepare(
  `SELECT symbol, ts, price, state_id, turns_left
   FROM stock_prices WHERE symbol=? ORDER BY ts DESC LIMIT ?`
);

export function stock_latest(symbol) {
  return sp_latest.get(symbol) || null;
}
export function stock_write(symbol, ts, price, stateId, turnsLeft) {
  sp_insert.run(symbol, ts, price, stateId, turnsLeft);
}
export function stock_history(symbol, limit = 100) {
  return sp_recent.all(symbol, limit);
}

const sp_prune_age = db.prepare(`DELETE FROM stock_prices WHERE ts < ?`);

export function stock_prune_by_age(days = 7) {
  const cutoff = Date.now() - days * 86400000;
  return sp_prune_age.run(cutoff).changes;
}

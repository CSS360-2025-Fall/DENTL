// src/economy/db.js
import Database from "better-sqlite3";
import path from "node:path";

// One small file, fast, safe for single-process bots
const db = new Database(
  path.join(process.cwd(), "src", "data", "casino.sqlite")
);

// --- schema ---
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
`);

// --- prepared statements ---
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

// --- public API: currency ---
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
export function ensureStarter(userId, starter = 1000) {
  if (getBal.get(userId)) return getBalance(userId);
  upsertBal.run(userId, starter | 0);
  return starter | 0;
}

// --- public API: items ---
export function getInventory(userId) {
  return allInv.all(userId); // [{item_code:'ld',qty:1}, ...]
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

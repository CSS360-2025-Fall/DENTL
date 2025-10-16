import { ITEMS } from "./items.js";
import { STOCKS } from "./stocks.js";

const itemMap = new Map(
  ITEMS.filter((x) => x.enabled !== false).map((x) => [x.code, x])
);
const stockMap = new Map(
  STOCKS.filter((x) => x.enabled !== false).map((x) => [x.symbol, x])
);

// Helpers to build/store inventory codes with hidden prefixes
export const toItemCode = (code) => `itm:${code}`; // e.g. 'itm:ld'
export const toStockCode = (symbol) => `stk:${symbol}`; // e.g. 'stk:SAFE'

// Resolve a stored inventory code to a catalog entry
export function getCatalogEntry(invCode) {
  if (invCode.startsWith("itm:")) {
    const code = invCode.slice(4);
    const def = itemMap.get(code) || null;
    return def ? { kind: "item", invCode, code, def } : null;
  }
  if (invCode.startsWith("stk:")) {
    const symbol = invCode.slice(4);
    const def = stockMap.get(symbol) || null;
    return def ? { kind: "stock", invCode, symbol, def } : null;
  }
  return null;
}

// For admin/reference (no prefixes)
export function getItemDef(code) {
  return itemMap.get(code) || null;
}
export function getStockDef(sym) {
  return stockMap.get(sym) || null;
}
export function allItems() {
  return [...itemMap.values()];
}
export function allStocks() {
  return [...stockMap.values()];
}

// User-facing display
export function displayName(invCode) {
  const e = getCatalogEntry(invCode);
  if (!e) return invCode;
  if (e.kind === "item") return e.def.name;
  if (e.kind === "stock") return `${e.def.name} (${e.symbol})`;
  return invCode;
}

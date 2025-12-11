// src/core/i18n.js
import fs from "fs";

const LANG_FILE = "../data/lang.json";
let userLang = {};
try {
  userLang = JSON.parse(fs.readFileSync(LANG_FILE, "utf8"));
} catch {
  userLang = {};
}

function saveLang() {
  fs.mkdirSync("../data", { recursive: true });
  fs.writeFileSync(LANG_FILE, JSON.stringify(userLang, null, 2));
}

export function setUserLang(userId, lang) {
  if (!["en", "ja"].includes(lang)) return;
  userLang[userId] = lang;
  saveLang();
}
export function getUserLang(userId) {
  return userLang[userId] || "en";
}

const dict = {
  en: {
    // generic
    win: "🎉 You win!",
    lose: "💀 You lose.",
    tie: "🤝 It’s a tie!",
    you_chose: "You chose **{choice}**",
    bot_chose: "I chose **{choice}**",
    bet_line: "\nBet: **{bet}** | New balance: **{bal}**",
    // rps
    rps_invalid: "Choose rock, paper, or scissors.",
    rock: "Rock",
    paper: "Paper",
    scissors: "Scissors",
  },
  ja: {
    win: "🎉 あなたの勝ち！",
    lose: "💀 あなたの負け！",
    tie: "🤝 あいこです！",
    you_chose: "あなたの手：**{choice}**",
    bot_chose: "わたしの手：**{choice}**",
    bet_line: "\nベット：**{bet}**｜新残高：**{bal}**",
    rps_invalid: "グー・チョキ・パーのいずれかを選んでください。",
    rock: "グー",
    paper: "パー",
    scissors: "チョキ",
  },
};

export function t(userId, key, vars = {}) {
  const lang = getUserLang(userId);
  const pack = dict[lang] || dict.en;
  const template = pack[key] || dict.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function botPick() {
  return RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];
}
export function judge(player, bot) {
  if (player === bot) return "tie";
  if (
    (player === "rock" && bot === "scissors") ||
    (player === "paper" && bot === "rock") ||
    (player === "scissors" && bot === "paper")
  )
    return "win";
  return "lose";
}
export function formatResult({ userId, player, bot, result }) {
  const e = { rock: "🪨", paper: "📄", scissors: "✂️" };
  const head =
    result === "win"
      ? "🎉 You **WIN!**"
      : result === "tie"
      ? "😐 It's a **TIE.**"
      : "💀 You **LOSE.**";
  return `${head}\n<@${userId}>: **${player}** ${e[player]}  |  Bot: **${bot}** ${e[bot]}`;

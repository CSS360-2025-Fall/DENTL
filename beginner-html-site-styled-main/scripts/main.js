// Personalized greeting -------------------------------------------------

const changeUserBtn = document.querySelector("#change-user");
const heroHeading = document.querySelector("#hero-heading");

function setUserName() {
  const myName = prompt("Please enter your name:");
  if (!myName) {
    // If user cancels or leaves it blank, ask again
    setUserName();
  } else {
    localStorage.setItem("dentlName", myName);
    heroHeading.textContent = `Welcome to DENTL, ${myName}!`;
  }
}

// Initialize greeting on page load
(function initGreeting() {
  const storedName = localStorage.getItem("dentlName");
  if (!storedName) {
    setUserName();
  } else {
    heroHeading.textContent = `Welcome to DENTL, ${storedName}!`;
  }
})();

if (changeUserBtn) {
  changeUserBtn.addEventListener("click", function () {
    setUserName();
  });
}

// Expandable game cards -------------------------------------------------

const gameCards = document.querySelectorAll(".game-card");

gameCards.forEach(function (card) {
  const title = card.querySelector(".game-title");
  const details = card.querySelector(".game-details");

  if (!title || !details) {
    return;
  }

  details.style.display = "none";

  title.addEventListener("click", function () {
    const isOpen = card.classList.toggle("open");
    details.style.display = isOpen ? "block" : "none";
  });
});

// Player stats demo -----------------------------------------------------

const demoSelect = document.querySelector("#demo-player-select");
const demoPanel = document.querySelector("#demo-stats-panel");

const demoPlayers = {
  luckyLeo: {
    name: "LuckyLeo",
    balance: 47250,
    wins: 128,
    losses: 94,
    biggestBet: 5000,
    favoriteGame: "Blackjack",
  },
  highrollerHana: {
    name: "HighrollerHana",
    balance: 210000,
    wins: 340,
    losses: 280,
    biggestBet: 25000,
    favoriteGame: "Stock Market",
  },
  mathGamblerMax: {
    name: "MathGamblerMax",
    balance: 35500,
    wins: 190,
    losses: 160,
    biggestBet: 4000,
    favoriteGame: "Coin Flip",
  },
};

function renderDemoStats(key) {
  if (!demoPanel) return;

  const data = demoPlayers[key];
  if (!data) return;

  demoPanel.innerHTML = `
    <h4>${data.name}</h4>
    <ul>
      <li><strong>Balance:</strong> ${data.balance.toLocaleString()} credits</li>
      <li><strong>Wins / Losses:</strong> ${data.wins} / ${data.losses}</li>
      <li><strong>Win Rate:</strong> ${Math.round(
        (data.wins / (data.wins + data.losses)) * 100
      )}%</li>
      <li><strong>Biggest Bet:</strong> ${data.biggestBet.toLocaleString()} credits</li>
      <li><strong>Favorite Game:</strong> ${data.favoriteGame}</li>
    </ul>
    <p>
      In the real bot, this information is displayed using the /stats command.
    </p>
  `;
}

if (demoSelect) {
  renderDemoStats(demoSelect.value);
  demoSelect.addEventListener("change", function () {
    renderDemoStats(demoSelect.value);
  });
}

// Leaderboard demo ------------------------------------------------------

const boardBtn = document.querySelector("#board-generate");
const boardMetricSelect = document.querySelector("#board-metric");
const boardSizeSelect = document.querySelector("#board-size");
const boardTableBody = document.querySelector("#board-table tbody");

const basePlayers = [
  "LuckyLeo",
  "HighrollerHana",
  "MathGamblerMax",
  "JackpotJake",
  "RouletteRae",
  "PokerPanda",
  "CoinflipCody",
  "StatsNerdSam",
  "CasualCasey",
  "RiskyRiley",
];

function generateRandomPlayer(name) {
  const games = 50 + Math.floor(Math.random() * 450);
  const wins = Math.floor(games * (0.3 + Math.random() * 0.4));
  const balance = 1000 + Math.floor(Math.random() * 250000);

  return {
    name: name,
    balance: balance,
    wins: wins,
    games: games,
  };
}

function generateLeaderboard() {
  if (!boardTableBody) return;

  const metric = boardMetricSelect ? boardMetricSelect.value : "balance";
  const size = boardSizeSelect ? parseInt(boardSizeSelect.value, 10) : 5;

  const players = basePlayers.map(function (name) {
    return generateRandomPlayer(name);
  });

  players.sort(function (a, b) {
    return b[metric] - a[metric];
  });

  const slice = players.slice(0, size);

  boardTableBody.innerHTML = "";
  slice.forEach(function (player, index) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${player.name}</td>
      <td>${player.balance.toLocaleString()}</td>
      <td>${player.wins}</td>
      <td>${player.games}</td>
    `;
    boardTableBody.appendChild(row);
  });
}

if (boardBtn) {
  boardBtn.addEventListener("click", generateLeaderboard);
}

// Fun commands demo -----------------------------------------------------

const jokeBtn = document.querySelector("#tell-joke");
const quoteBtn = document.querySelector("#share-quote");
const funOutput = document.querySelector("#fun-output");

const jokes = [
  "Why did the gambler bring a ladder? Because he heard the stakes were high.",
  "I tried to teach my computer blackjack. It still thinks hitting 21 means closing the window.",
  "My win rate is exactly 50%. I either win, or I learn.",
];

const quotes = [
  "“The house doesn’t always win in DENTL — sometimes the math student does.”",
  "“Luck is what happens when preparation meets opportunity.”",
  "“In this bot, the only thing you can lose is fake money and bad strategies.”",
];

function pickRandom(list) {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

if (jokeBtn && funOutput) {
  jokeBtn.addEventListener("click", function () {
    funOutput.textContent = pickRandom(jokes);
  });
}

if (quoteBtn && funOutput) {
  quoteBtn.addEventListener("click", function () {
    funOutput.textContent = pickRandom(quotes);
  });
}

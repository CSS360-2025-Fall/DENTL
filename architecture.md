Tyler - Database

Nagato - App.js + Commands.js + /commands

Elijah - Project File Structure Diagram

Dan - Systems Diagram (Ngrok)

Levon - The purpose of the website is to introduce users to the DENTL Discord bot and provide clear, accessible information about its features and functionality. It serves as a hub where users can learn how DENTL works, access game rules, and find links to invite the bot to their own Discord servers. The site also includes options to change the display language and explore different game modes, making it easier for users to navigate and engage with the bot. In the future, the website may expand to include more interactive features, such as stock trading, user leaderboards, blackjack, poker, or jokes that enhance the overall experience and showcase updates or new features of DENTL.


relationship between files in "core" folder and "commands" folder:
Core folder contains 4 files that are the code for the bot to function. i18n.js handles language settings for localization, utils.js contains the general helpers for Discord API calls and command registrations, commands.js declares all the list of commands the bot has, and the app.js sets up the bot's main logic like handling events and requests and routing the interactions and environment configs.

Commands folder contains the individual implementation for each command features and actions. Each files exports an execute function which is triggered when a user uses that specific command.

When the bot is running, the core system (app.js and commands.js) listens for incoming interactions, determines which command was requested, and loads the corresponding file from the "commands" folder. With this file configuration, the core folder acts as the command loader and central hub, while the commands folder hosts the plug-in logics for each specific feature.

## Project File Structure

```
├── .vscode -> vscode styling settings
├── assets -> global assets
├── data -> global localized languages for DENTL-BOT
├── examples -> previous discord bot examples
├── src
│   ├── commands -> holds respective game logics
│  	├── config -> game configuration
│   ├── core -> app, utils, register bot commands
│   ├── data -> SQLite, Jokes, Quotes
│   ├── economy -> stocks, bets, Database logic
│   ├── events -> interactions, events
│   ├── games/rps -> game rules
│   └── registry -> registry logic
├── .env -> passwords, keys, private file
├── .gitignore
├── README.md -> project description
├── architecture.md -> project architecture description
├── package-lock.json 
├── package.json
└── renovate.json
```


# Database
Overview:
This module provides a local datastore for the in-game economy. It deals _ handling balances, inventory, daily claims, freebies, and stock history.
 It uses SQLite (via better-sqlite3) with WAL mode for safe, concurrent access.

## Initialization
- The database file is created at startup (../data/casino.sqlite).
- Tables are initialized with initSchema() before any statements run.
- Uses a single shared SQLite connection across the app.


### Data Areas
1. Currency — stores user balances.
2. Inventory — tracks items per user.
3. Daily Claims — manages daily streak rewards.
4. Freebies — controls hourly claim cooldowns.
5. Stock Prices — records simple price history with pruning.


## Public API (Main Functions)
Currency
- getBalance(userId)
- setBalance(userId, amount)
- addBalance(userId, delta)


Inventory
- getInventory(userId)
- addItem(userId, itemCode, delta)
- setItem(userId, itemCode, qty)


Daily Claim
- claimDailyCalendar(userId, baseAmount = 1000, maxStreak = 5)
	- Once per UTC day. Rewards scale with streak.


Freebie
- claimFreebie(userId, amount = 100, cooldownMs = 1h)
	- Enforces hourly cooldowns.


Stock
- stock_latest(symbol)
- stock_write(symbol, ts, price, stateId, turnsLeft)
- stock_history(symbol, limit = 100)
- stock_prune_by_age(days = 7)


## Data Model (SQLite Tables)
- balances — (user_id, balance)
- inventory — (user_id, item_code, qty)
- claims — (user_id, last_claim_date, streak)
- freebies — (user_id, last_freebie)
- stock_prices — (symbol, ts, price, state_id, turns_left)

## Economy
The database accepts bets from the users, by first deducting their bet from the user's account, by providing addBalance with a negative value, then subsequently adding either 0, 1, or 2 times their bet on a lose, tie, or win respectively. 

# DENTL - Gambling Bot

## Description:

## Games:

- Rock, Paper, Scissors ✅
- Blackjack
- Poker
- Coin Flip ✅
- Slots
- Lottery
- Horse Race
- Memory
- High or Low
- Liars Dice/Card
- Loot Box

Extras:

- Scratch Ticket
- Roulette
- Shell Game
- Russian Roulette ✅

## Features

- Leaderboards
- Daily Log-In Reward ✅
- Challenge Player
- The Mafia
  - If in debt for long enough, they will find you, and will ban you.
- Achievements
- Banks/Debt
- Credit Factory
- Copyright
  - Players can purchase copyrights for words, forcing others to pay credits when they use them.
- Stock Market
  - Players can place money on stocks, which will change in value hourly.

## Notes:

### Branch Changes

Needs SQLite -> npm i better-sqlite3

ENV file adjustments:

- GUILD_ID -> Server ID. Get from "Copy Server ID" upon right click. This is NOT a list.
- ADMIN_IDS -> Allows access to cheat commands. This is a list, so you can add your user ID after a comma. This should already be set.
- IN_DEV -> Leave as true until the end. This allows for faster reloading of commands on servers, but applies ONLY to specified GUILD_ID servers.

If you can't get Server/User IDs from Discord, navigate to Settings->App Settings->Advanced->Developer Mode.

### Config

Added a gameConfig.js file, that handles various values and rewards.

### Running:

1. npm run register
   - Only necessisary if changes were made
2. npm run start
3. ngrok http 3000

### Commands

/balance - Checks your current balance.
<br>/inventory - Checks the items in your inventory.

/rps choice (bet) - Initiates a game of Rock, Paper, Scissors versus a bot with an optional bet.
<br>/coinflip choice (bet) - Initiates a coinflip with an optional bet.

/daily - Claims your daily reward. Resets daily.
<br>/freebie - Claim a freebie reward. Resets hourly.

<br>/russianroulette - Play the odds. One in Six chance of being kicked from the server. This does not benefit you in any way. Does not kick admins.

<br>ADMIN:

- /grant user credits - Adds/removes credits from a user's account.
- /grantitem user id - Adds/removes an item from a user's inventory.

# DENTL - Gambling Bot

## Description:

## Games:
* Rock, Paper, Scissors ✅
* Blackjack ✅
* Poker
* Coin Flip ✅
* Slots ✅
* Lottery
* Horse Race
* Memory
* High or Low
* Liars Dice/Card
* Loot Box

Extras:
* Scratch Ticket
* Roulette
* Shell Game
* Russian Roulette ✅

## Features
* Leaderboards
* Daily Log-In Reward ✅
* Challenge Player
* The Mafia
* Achievements
* Banks/Debt
* Credit Factory
* Copyright
    * Players can purchase copyrights for words, forcing others to pay credits when they use them.
* Stock Market ✅
    * Players can place money on stocks, which will change in value hourly.
  


### Notes:
Needs SQLite -> npm i better-sqlite3

ENV file adjustments: 
* GUILD_ID -> Server ID. Get from "Copy Server ID" upon right click.
* ADMIN_IDS -> Allows access to cheat commands. This is a list, so you can add your user ID after a comma. This should already be set.
* IN_DEV -> Leave as true until the end. This allows for faster reloading of commands on servers, but applies ONLY to said servers.

If you can't get Server/User IDs from Discord, navigate to Settings->App Settings->Advanced->Developer Mode.

### Running:
1. npm run register
2. npm run start
3. ngrok http 3000

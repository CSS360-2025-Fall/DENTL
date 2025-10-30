Tyler - Potential Vulnerabilities and Leaderboards

Nagato - Bugs from blackjack game and betting limit feature

Levon - Limitations/Gaps in Features

## Potential Vulnerabilities:
### SQLite Database
Our SQLite database is stored on github currently. Whenever the bot gets updated, the current database also gets dumped. 
While this does not contain any sensitive information, it can be used to identify a user's balance, inventory, check the 
stock market state, or anything else that gets saved to the database. This can be combatted by adding the database file
to the .gitignroe file and deleting it from the repository, or making sure to encrypt the file before uploading it.

### SQL Injection
As our database runs off of SQLite, it is suseptible to SQL Injection if we are not careful. As it stands, we currently
are not susceptible to SQL Injection, but if we wish to remain that way, we need to make sure we continue to only accept
specific values, and not general strings.

### Token Security
As the bot requires unique tokens to run, we need to make sure they are kept secure so they aren't hijacked or used by
malicious actors. We are currently dealing with this by having the tokens only exist in our personal workspaces, and our
private group server, inside a .env file. We must make sure that .env remains on .gitignore to prevent these values from
leaking.

## Bugs and Limitations from Blackjack Game:
### Unwanted Player Interaction
Currently, when a player starts the blackjack game, other users on the same server can see the game in active - which is good, but they can also interact with the player's game (press the 'hit' or 'stand' buttons). This returns a unauthorised reply to the bot, causing the game to break. This allows for other players to sabotage the on-going blackjack game, ruining the gambling experiance for users.

### Lacks Multi-Game Support
We developed the blackjack game with only 1 user testing the game at a time, so we never encountered any instances where multiple users would initiate their own blackjack game. However, we want our bot to be functional even in large servers with many instances of users playing their own blackjack game to bet credits.

## Additional Features:
### Leaderboards
We want our bot to be able to display a leaderboard containing the top ten(?) wealthiest people on the system, as well as
where the user calling it would rank upon the board.

### Betting Limits
Many of the real-world gambling settings have betting limits (so that casinos generates profit), and we vision our gambling bot to replicate the physical gambling environment. We hope that this feature would add more strategy to the gambling experience.

## Limitations/Gaps in Features
Some limitations or gaps in the features include the lack of player interaction depth. While you can challenge players, there’s no mention of tournaments, clans, or cooperative modes that could make competition more engaging. The economy system is also quite simple. Players earn daily credits and use them for games or stocks, but there’s no mention of saving, interest, or dynamic events that affect markets or rewards. Also, while DENTL does support multiple languages, it doesn’t mention customization options like changing difficulty levels or adding new games through user input. Also, a single "kick" command isn’t a the most engaging form of "playfulness". While DENTL includes features like achievements and leaderboards, it lacks progression systems such as ranks, levels, or long-term rewards that could motivate players to keep playing over time.

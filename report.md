Tyler - Potential Vulnerabilities and Leaderboards
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




## Additional Features:
### Leaderboards
We want our bot to be able to display a leaderboard containing the top ten(?) wealthiest people on the system, as well as
where the user calling it would rank upon the board.

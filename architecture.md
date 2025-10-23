Tyler - Money + Database

Nagato - App.js + Commands.js + /commands

Elijah - Project File Structure Diagram

Dan - Systems Diagram (Ngrok)

Levon - 


relationship between files in "core" folder and "commands" folder:
Core folder contains 4 files that are the code for the bot to function. i18n.js handles language settings for localization, utils.js contains the general helpers for Discord API calls and command registrations, commands.js declares all the list of commands the bot has, and the app.js sets up the bot's main logic like handling events and requests and routing the interactions and environment configs.

Commands folder contains the individual implementation for each command features and actions. Each files exports an execute function which is triggered when a user uses that specific command.

When the bot is running, the core system (app.js and commands.js) listens for incoming interactions, determines which command was requested, and loads the corresponding file from the "commands" folder. With this file configuration, the core folder acts as the command loader and central hub, while the commands folder hosts the plug-in logics for each specific feature.

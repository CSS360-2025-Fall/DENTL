import { InteractionResponseType } from "discord-interactions";

// Define rules for each game type
const GAME_RULES = {
  rps: "Rock Paper Scissors: Choose rock, paper, or scissors. Rock beats scissors, scissors beats paper, and paper beats rock. If both choose the same, it's a tie.",
  coinflip:
    "Coinflip: Choose heads or tails. If your choice matches the coin, you win.",
  russianroulette: "Russian Roulette: Take a chance with a 1/6 risk of losing.",
  //add more game rules as needed
};

export async function execute(interaction) {
  const gameType = interaction.data.options
    ?.find((o) => o.name === "game")
    ?.value?.toLowerCase();

  if (!gameType || !GAME_RULES[gameType]) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Unknown game type. Command should look like "/rule rps".',
        flags: 64,
      },
    };
  }

  if (gameType == "rps") {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Rock Paper Scissors is a game played between you and the bot. The possible shapes are "rock", "paper", and "scissors", and you can assign bet value that you would win when you win against the bot, and lose if you lost the match.\n`,
      },
    };
  }
  if (gameType == "coinflip") {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Coinflip is a game played between you and the bot. You can choose either "heads" or "tails", and assign a bet value that you would win when you win against the bot, and lose if you lost the match.\n`,
      },
    };
  }
  if (gameType == "russianroulette") {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Russian Roulette is a game where you test your luck. When you play this game, you will pull the trigger on the revolver, and hit a live round with a 1/6 probability. If you are lucky and hit the live round, you will "die" and be kicked from the server.\n`,
      },
    };
  }
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: GAME_RULES[gameType] },
  };
}

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
        content: `**ROCK PAPER SCISSORS RULES**
**Objective:**
Choose one of three options (rock, paper, or scissors) and beat the bot's choice to win chips.
**How to Play:**
1. Place your bet using /rps hoice> <bet amount>
   - Example: /rps rock 100
2. The bot randomly selects its choice
3. The winner is determined by the classic rules
4. Results are displayed immediately
**Winning Rules:**
• **Rock beats Scissors** - Rock crushes scissors
• **Scissors beats Paper** - Scissors cut paper
• **Paper beats Rock** - Paper covers rock
**Outcomes:**
**You Win (1:1 payout):**
• Your choice beats the bot's choice
• You receive your bet back plus an equal amount
**You Lose:**
• Bot's choice beats your choice
• You lose your bet amount
**Tie:**
• Both you and the bot choose the same option
• Your bet is refunded (no profit, no loss)`,
      },
    };
  }

  if (gameType == "coinflip") {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `**COINFLIP RULES**
**Objective:**
Predict which side of the coin will land face-up and win chips if your prediction is correct.
**How to Play:**
1. Place your bet using /coinflip <choice> <bet amount>
   - Example: /coinflip heads 100
2. A virtual coin is flipped
3. The coin lands on either heads or tails (50/50 chance)
4. Results are displayed immediately
**Choices:**
• **Heads** - The "heads" side of the coin
• **Tails** - The "tails" side of the coin
**Winning:**
• If your choice matches the coin result, you win
• You receive your bet back plus an equal amount
**Losing:**
• If your choice does not match the coin result, you lose
• You lose your entire bet amount`,
      },
    };
  }

  if (gameType == "russianroulette") {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `**RUSSIAN ROULETTE RULES**
**Objective:**
Test your luck by pulling the trigger on a revolver with one live round. Survive to stay in the server.
**How to Play:**
1. Use /russianroulette to play
2. You "pull the trigger" on a virtual revolver
3. The revolver has 6 chambers with 1 live round
4. Results are determined immediately
**Outcomes:**
**You Survive (5/6 chance - 83.3%):**
• The chamber is empty (click)
• You remain in the server
• You can play again if you dare
**You "Die" (1/6 chance - 16.7%):**
• The chamber has the live round (bang)
• You are immediately kicked from the Discord server
• This is a permanent consequence until you are re-invited
**Important Warnings:**
⚠️ **This game has real consequences**
⚠️ **You will be kicked from the server if you lose**
⚠️ **You must be re-invited to return**
⚠️ **No chips or items are involved**
**Server Kick:**
• If you hit the live round, you are automatically kicked
• No automatic re-entry after being kicked
• Your account data (chips, inventory) may be preserved
Think carefully before playing - the consequences are real and immediate.`,
      },
    };
  }

  if (gameType == "blackjack") {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `**BLACKJACK RULES**

**Objective:**
Beat the dealer by getting a hand value closer to 21 than the dealer's hand without exceeding 21.

**Card Values:**
• Number cards (2-10): Card value
• Face cards (Jack, Queen, King): 10 points each
• Ace: 11 points (automatically counts as 1 if hand would bust)

**Game Phases:**

**1. Initial Deal:**
• You place your bet using /blackjack <bet amount>
• You receive 2 cards (both visible to you)
• Dealer receives 2 cards (only 1 card shown to you)

**2. Player Actions:**
After seeing your initial hand, you can choose:

• **Hit**: Draw another card to increase your hand value. You can hit multiple times until you stand or bust.
• **Stand**: Keep your current hand and end your turn. The dealer will then play.
• **Double Down**: Double your original bet, receive exactly one more card, and immediately stand. You must have enough chips to double your bet. This option is only available on your first action.

**3. Dealer's Turn:**
After you stand (or double down), the dealer reveals their hidden card and plays automatically:
• Dealer must hit on 16 or less
• Dealer must stand on 17 or more

**Winning Conditions:**
• **You win** if your hand is closer to 21 than the dealer's, or if the dealer busts (exceeds 21)
• **You lose** if you bust, or if the dealer's hand is closer to 21 than yours
• **Tie (Push)** if both hands have the same value. Your bet is refunded.

**Payouts:**
• Win: You receive your bet back plus an equal amount (1:1 payout)
• Loss: You lose your bet
• Tie: Your bet is returned

**Busting:**
If your hand value exceeds 21, you immediately bust and lose, regardless of the dealer's hand.`,
      },
    };
  }

  if (gameType == "poker") {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `**TEXAS HOLD'EM POKER RULES**

**Objective:**
Win chips by either having the best 5-card poker hand at showdown, or by making all other players fold.

**Game Setup:**
• 2-8 players per table
• Each player starts with their current chip balance
• Minimum balance required: 1,000 chips
• Small Blind: 50 chips, Big Blind: 100 chips

**Joining & Leaving:**
• Use /poker join to join the lobby or to start a game
• If you join mid-game, you'll enter at the start of the next hand
• Use /poker leave to leave after your current hand finishes
• Use /poker start to begin the game (requires 2-8 players)

**Blinds:**
• The dealer position rotates clockwise each hand
• Player left of dealer posts Small Blind (50 chips)
• Next player posts Big Blind (100 chips)
• Blinds are forced bets that start the pot

**Betting Rounds:**

**1. Pre-Flop:**
• Each player receives 2 cards (private, sent via DM)
• Betting starts with player left of big blind
• Players can: Fold, Call (match current bet), or Raise

**2. Flop:**
• 3 community cards dealt face-up on the board
• Another betting round begins (starting left of dealer)
• Players can: Check (bet 0), Bet, Call, Raise, or Fold

**3. Turn:**
• 1 additional community card dealt
• Another betting round occurs

**4. River:**
• Final community card dealt
• Final betting round occurs

**5. Showdown:**
• Remaining players reveal their hands
• Best 5-card hand using any combination of 2 hole cards + 5 community cards wins the pot

**Player Actions:**
• **Fold**: Give up your hand and forfeit the pot. You lose any chips already bet.
• **Check**: Pass action to next player (only when no bet to call)
• **Call**: Match the current bet amount
• **Raise**: Increase the bet by at least the minimum raise amount
  - Minimum raise = the previous bet/raise amount
  - Raise buttons: X1, X2, X3, X5 (multipliers of minimum raise), or All-In
• **All-In**: Bet all your remaining chips

**Betting Rules:**
• Minimum bet: 100 chips (big blind amount)
• No maximum bet (true no-limit)
• If a player raises, all other players must call, raise, or fold
• Betting round ends when all active players have matched the highest bet

**Action Timer:**
• You have 30 seconds to act on your turn
• If time expires, you automatically fold

**Hand Rankings (Best to Worst):**
1. Royal Flush: A-K-Q-J-10, all same suit
2. Straight Flush: 5 cards in sequence, all same suit
3. Four of a Kind: 4 cards of same rank
4. Full House: 3 of a kind + a pair
5. Flush: 5 cards of same suit
6. Straight: 5 cards in sequence
7. Three of a Kind: 3 cards of same rank
8. Two Pair: 2 different pairs
9. One Pair: 2 cards of same rank
10. High Card: Highest card when no other hand is made

**Winning the Pot:**
• Last player remaining (all others folded) wins entire pot
• At showdown, best hand wins the pot
• If two players have equal hands, the pot is split evenly

**Game End:**
• Game ends when only 1 player remains
• All remaining chips are paid out to players
• Final standings show profit/loss for each player
• Make sure to use /poker leave, if you wish to exit the game

**Thread Information:**
• Game creates a dedicated Discord thread for all game updates
• Hole cards are sent privately via DM
• Community cards, pot size, and player actions posted in thread`,
      },
    };
  }

  if (gameType == "roulette") {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `**ROULETTE RULES**

**Objective:**
Predict where the ball will land on the spinning roulette wheel and win based on your bet type.

**The Wheel:**
• Numbers 0-36 plus 00 (American Roulette)
• Red numbers: 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
• Black numbers: 2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
• Green numbers: 0 and 00

**How to Play:**
1. Place your bet using /roulette <bet amount>
2. The roulette board and bet type options will appear
3. Select your bet type from the buttons
4. For some bets, you'll need to select specific numbers or enter them in a modal
5. The wheel spins and the result is revealed
6. Win or lose based on whether the ball lands on your bet

**Bet Types and Payouts:**

**Inside Bets (Higher Risk, Higher Reward):**

• **Single (35:1)**: Bet on one specific number (0, 00, or 1-36)
  - Enter the exact number you want to bet on
  - Highest payout but lowest probability

• **Split (17:1)**: Bet on two adjacent numbers
  - Numbers must be next to each other horizontally or vertically on the table
  - Example: 5 and 8, or 14 and 17

• **Street (11:1)**: Bet on a row of three consecutive numbers
  - Covers 3 horizontal numbers
  - Example: 1-2-3, 4-5-6, or 31-32-33

• **Corner (8:1)**: Bet on four numbers that form a square
  - Numbers must be adjacent in a 2x2 grid
  - Example: 1-2-4-5, or 14-15-17-18

• **Five (6:1)**: Special bet covering 0, 00, 1, 2, and 3
  - Only bet that covers exactly 5 numbers
  - Automatically executed when selected

• **Line (5:1)**: Bet on two adjacent streets (6 numbers total)
  - Covers 6 consecutive numbers across two rows
  - Example: 1-6, 7-12, or 31-36

**Outside Bets (Lower Risk, Lower Reward):**

• **Dozen (2:1)**: Bet on 12 consecutive numbers
  - 1st Dozen: 1-12
  - 2nd Dozen: 13-24
  - 3rd Dozen: 25-36

• **Column (2:1)**: Bet on one of three vertical (on the board) columns
  - Column 1: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34

  - Column 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35

  - Column 3: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36

• **Red (1:1)**: Bet on any red number (18 numbers total)
  - Automatically executed when selected
  - Wins if ball lands on any red number

• **Black (1:1)**: Bet on any black number (18 numbers total)
  - Automatically executed when selected
  - Wins if ball lands on any black number

• **Low 1-18 (1:1)**: Bet on numbers 1 through 18
  - Automatically executed when selected

• **High 19-36 (1:1)**: Bet on numbers 19 through 36
  - Automatically executed when selected

**Winning & Losing:**
• If the ball lands on a number covered by your bet, you win according to the payout ratio
• Your winnings = (bet amount x payout multiplier)
• If the ball lands on a number not covered by your bet, you lose your bet amount
• 0 and 00 cause all outside bets (red/black, odd/even, low/high) to lose

**Example:**
• Bet 100 chips on "Single number 17" (35:1 payout)
• Ball lands on 17: You win 3,500 chips
• Ball lands on any other number: You lose 100 chips

**Number Entry:**
• For Single bets: Enter one number (0, 00, or 1-36)
• For Split bets: Enter two adjacent numbers separated by comma (example: "5,8")
• All other bets use button selection`,
      },
    };
  }
  if (gameType == "slots") {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `**SLOT MACHINE RULES**

**Objective:**
Spin three reels and match symbols on the center payline to win chips.

**How to Play:**
1. Place your bet using /slots <bet amount> (or use 0 for free practice spins)
2. The slot machine spins automatically with a 4-second animation
3. Reels stop one by one from left to right
4. Your winnings are calculated based on matching symbols on the CENTER ROW ONLY

**The Reels:**
Each reel has 3 visible positions:
\`\`\`
  │ 🍒 │ 💎 │ ⭐ │  ← Top row (not counted)
 ▶ 🍋 │ 🔔  7️⃣ ◀  ← CENTER PAYLINE (this is what counts!)
  │ ❤️ │ 🎁 │ 🤑 │  ← Bottom row (not counted)
\`\`\`

**Symbol Rarity and Values:**
From most common to rarest:

• **🍒 Cherry**: Very common (40%) - 2-of-a-kind: 1.5x | 3-of-a-kind: 4x
• **🍋 Lemon**: Common (35%) - 2-of-a-kind: 2x | 3-of-a-kind: 5x
• **❤️ Heart**: Common (35%) - 2-of-a-kind: 2x | 3-of-a-kind: 5x
• **💀 Skull**: Uncommon (20%) - No payout (instant loss)
• **🔔 Bell**: Uncommon (20%) - 2-of-a-kind: 3x | 3-of-a-kind: 8x
• **🎁 Gift**: Uncommon (20%) - 2-of-a-kind: 3x | 3-of-a-kind: 8x
• **⭐ Star**: Rare (10%) - 2-of-a-kind: 4x | 3-of-a-kind: 12x
• **🤑 Money Face**: Very rare (5%) - 2-of-a-kind: 5x | 3-of-a-kind: 15x
• **7️⃣ Lucky Seven**: Extremely rare (4%) - 2-of-a-kind: 7x | 3-of-a-kind: 50x
• **💎 Diamond**: Jackpot (1%) - 2-of-a-kind: 10x | 3-of-a-kind: 100x

**Winning Combinations:**

**Three-of-a-Kind (Best):**
• All 3 symbols on the center payline match
• Example: 🍒 | 🍒 | 🍒 = 4x your bet
• Highest payout for each symbol

**Two-of-a-Kind:**
• Any 2 matching symbols on the center payline (in any position)
• Example: 🍋 | 🔔 | 🍋 = 2x your bet
• Lower payout than three-of-a-kind

**No Match:**
• No matching symbols on center payline
• You lose your bet

**Payouts:**
• Your winnings = (bet amount) x (multiplier)
• Example 1: Bet 100 chips, get 3 Diamonds (💎) → Win 10,000 chips
• Example 2: Bet 100 chips, get 2 Stars (⭐) → Win 400 chips
• Example 3: Bet 100 chips, no match → Lose 100 chips

**Free Play Mode:**
• Use /slots 0 to spin without risking chips
• Results show what you would have won/lost
• No actual chip balance changes
• Good for practicing and seeing payout rates`,
      },
    };
  }

  if (gameType == "stocks") {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `**STOCK MARKET RULES**

**Objective:**
Buy stocks at low prices and sell them at high prices to make a profit. Stock prices fluctuate over time based on market states.

**Available Commands:**
• **/stocks list** - View all available stocks and their current prices
• **/stocks buy <symbol> <quantity>** - Purchase shares of a stock
• **/stocks sell <symbol> <quantity>** - Sell shares you own

**How Stocks Work:**

**Prices:**
• Each stock has a current price displayed in chips
• Prices change over time based on market conditions

**Buying Stocks:**
1. Check /stocks list to see available stocks and prices
2. Use /stocks buy <name> <quantity> to purchase shares
   - Example: /stocks buy TECH 5 (buy 5 shares of TECH)
3. The total cost is: (current price) x (quantity)
4. Chips are immediately deducted from your balance
5. You must have enough chips to complete the purchase

**Selling Stocks:**
1. You can only sell stocks you currently own
2. Use /stocks sell <symbol> <quantity>
   - Example: /stocks sell TECH 3 (sell 3 shares of TECH)
3. Shares are sold at the current market price
4. Proceeds = (current price) x (quantity)
5. Chips are immediately added to your balance

**Key Rules:**
• You can buy as many shares as you can afford
• You can sell any quantity of shares you own 
• Prices update automatically over time
• Each player's stock portfolio is tracked separately
• No limit to number of different stocks you can own`,
      },
    };
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: GAME_RULES[gameType] },
  };
}

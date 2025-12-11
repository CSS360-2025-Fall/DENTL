import { InteractionResponseType } from "discord-interactions";

// Define rules for each game type
const GAME_RULES = {
  rps: 
    "Rock Paper Scissors: Choose rock, paper, or scissors. Rock beats scissors, scissors beats paper, and paper beats rock. If both choose the same, it's a tie.",
  coinflip:
    "Coinflip: Choose heads or tails. If your choice matches the coin, you win.",
  russianroulette: 
    "Russian Roulette: Take a chance with a 1/6 risk of losing.",
  blackjack:
    "Blackjack: Aim to get a hand value of 21 or as close as possible without going over. Beat the dealer to win.",
  poker: 
    "Poker: Texas Hold'em rules apply. Use your two private cards and five community cards to make the best hand.",
  roulette:
    "Roulette: Place bets on where the ball will land on the spinning wheel. Various bet types with different payouts are available.",
  slots:
    "Slots: Spin the reels and match symbols on the center payline to win chips. Different symbols have different payout rates.",
  stocks:
    "Stocks: Buy and sell stocks based on fluctuating market prices to make a profit.",
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
      embeds: [
        {
          title: "🃏 TEXAS HOLD'EM POKER RULES",
          description: `**Objective:** Win chips by either having the best 5-card poker hand at showdown, or by making all other players fold.`,
          color: 0x2ecc71,
          fields: [
            {
              name: "📋 Game Setup",
              value: `• 2-8 players per table
• Each player starts with their current chip balance
• Minimum balance required: 1,000 chips
• Small Blind: 50 chips | Big Blind: 100 chips`,
              inline: false
            },
            {
              name: "🎮 Commands",
              value: `• **/poker join** - Join the lobby or active game
• **/poker leave** - Leave after current hand finishes
• **/poker start** - Start the game (requires 2-8 players)
• **/poker end** - (Admin only) End the game immediately`,
              inline: false
            },
            {
              name: "🔄 Blinds & Dealer",
              value: `• Dealer position rotates clockwise each hand
• Player left of dealer posts Small Blind (50 chips)
• Next player posts Big Blind (100 chips)
• Blinds are forced bets that start the pot`,
              inline: false
            },
            {
              name: "🎲 Betting Rounds",
              value: `**1. Pre-Flop:** Each player gets 2 hole cards (private, sent via DM). Betting starts left of big blind.

**2. Flop:** 3 community cards dealt face-up. Betting round begins.

**3. Turn:** 4th community card dealt. Another betting round.

**4. River:** 5th and final community card dealt. Final betting round.

**5. Showdown:** Remaining players reveal hands. Best 5-card hand wins.`,
              inline: false
            },
            {
              name: "💰 Player Actions",
              value: `• **Fold** - Give up hand and forfeit pot
• **Check** - Pass action to next player (only when no bet to call)
• **Call** - Match the current bet amount
• **Raise** - Increase bet (buttons: X1, X2, X3, X5 multipliers or All-In)
• **All-In** - Bet all remaining chips`,
              inline: false
            },
            {
              name: "📏 Betting Rules",
              value: `• Minimum bet: 100 chips (big blind amount)
• No maximum bet (true no-limit poker)
• Minimum raise = previous bet/raise amount
• If player raises, all others must call, raise, or fold
• Betting round ends when all active players matched highest bet`,
              inline: false
            },
            {
              name: "⏱️ Action Timer",
              value: `• You have **30 seconds** to act on your turn
• If time expires, you **automatically fold**`,
              inline: false
            },
            {
              name: "🏆 Hand Rankings (Best to Worst)",
              value: `1️⃣ Royal Flush - A-K-Q-J-10, all same suit
2️⃣ Straight Flush - 5 cards in sequence, same suit
3️⃣ Four of a Kind - 4 cards of same rank
4️⃣ Full House - 3 of a kind + a pair
5️⃣ Flush - 5 cards of same suit
6️⃣ Straight - 5 cards in sequence
7️⃣ Three of a Kind - 3 cards of same rank
8️⃣ Two Pair - 2 different pairs
9️⃣ One Pair - 2 cards of same rank
🔟 High Card - Highest card when no other hand`,
              inline: false
            },
            {
              name: "🎯 Winning the Pot",
              value: `• Last player remaining (all others folded) wins entire pot
• At showdown, best hand wins the pot
• If two players have equal hands, pot is split evenly`,
              inline: false
            },
            {
              name: "🏁 Game End",
              value: `• Game ends when only 1 player remains
• Game ends when admin uses /poker end
• All remaining chips paid out to players
• Final standings show profit/loss for each player`,
              inline: false
            },
            {
              name: "💬 Thread Information",
              value: `• Game creates a dedicated Discord thread for updates
• Hole cards sent privately via DM
• Community cards, pot size, and player actions posted in thread`,
              inline: false
            }
          ],
          footer: {
            text: "Joining mid-game? You'll enter at the start of the next hand!"
          }
        }
      ]
    }
  };
}

if (gameType == "roulette") {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: "🎰 ROULETTE RULES",
          description: `**Objective:** Predict where the ball will land on the spinning roulette wheel and win based on your bet type.`,
          color: 0xe74c3c,
          fields: [
            {
              name: "🎡 The Wheel",
              value: `• Numbers 0-36 plus 00 (American Roulette)
• **Red numbers:** 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
• **Black numbers:** 2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
• **Green numbers:** 0 and 00`,
              inline: false
            },
            {
              name: "🎮 How to Play",
              value: `1. Use **/roulette <bet amount>**
2. Roulette board and bet type buttons appear
3. Select your bet type
4. For some bets, select specific numbers or enter in modal
5. Wheel spins and result is revealed
6. Win or lose based on where ball lands`,
              inline: false
            },
            {
              name: "💎 Inside Bets (High Risk, High Reward)",
              value: `**Single (35:1)** - One specific number (0, 00, or 1-36)
**Split (17:1)** - Two adjacent numbers (horizontal or vertical)
**Street (11:1)** - Row of 3 consecutive numbers
**Corner (8:1)** - 4 numbers forming a square
**Five (6:1)** - Special bet: 0, 00, 1, 2, 3
**Line (5:1)** - Two adjacent streets (6 numbers)`,
              inline: false
            },
            {
              name: "💰 Outside Bets (Lower Risk, Lower Reward)",
              value: `**Dozen (2:1)** - 12 consecutive numbers
  • 1st Dozen: 1-12
  • 2nd Dozen: 13-24
  • 3rd Dozen: 25-36

**Column (2:1)** - One of three vertical columns
  • Column 1: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
  • Column 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
  • Column 3: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36`,
              inline: false
            },
            {
              name: "🎲 Even Money Bets (1:1)",
              value: `**🔴 Red** - Any red number (18 numbers)
**⚫ Black** - Any black number (18 numbers)
**Low (1-18)** - Numbers 1 through 18
**High (19-36)** - Numbers 19 through 36`,
              inline: false
            },
            {
              name: "✅ Winning & Losing",
              value: `**Win:** Ball lands on number covered by your bet
• Winnings = (bet amount) × (payout multiplier)

**Lose:** Ball lands on number not covered by your bet
• You lose your bet amount

**Special Note:** 0 and 00 cause all outside bets (red/black, low/high) to lose`,
              inline: false
            },
            {
              name: "📝 Number Entry",
              value: `• **Single bets:** Enter one number (0, 00, or 1-36)
• **Split bets:** Enter two adjacent numbers separated by comma
  Example: "5,8" or "14,17"
• **All other bets:** Use button selection`,
              inline: false
            },
            {
              name: "💵 Example Payouts",
              value: `• Bet 100 on Single number 17 (35:1) → Ball lands on 17 → Win 3,500 chips
• Bet 100 on Red (1:1) → Ball lands on red → Win 100 chips (receive 200 total)
• Bet 100 on Dozen 1-12 (2:1) → Ball lands on 7 → Win 200 chips`,
              inline: false
            }
          ],
          footer: {
            text: "Tip: Inside bets = higher risk/reward | Outside bets = safer but lower payout"
          }
        }
      ]
    }
  };
}

if (gameType == "slots") {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: "🎰 SLOT MACHINE RULES",
          description: `**Objective:** Spin three reels and match symbols on the center payline to win chips.`,
          color: 0xf39c12,
          fields: [
            {
              name: "🎮 How to Play",
              value: `1. Use **/slots <bet amount>** (or use 0 for free practice)
2. Slot machine spins automatically (4-second animation)
3. Reels stop one by one from left to right
4. Winnings calculated based on **CENTER ROW ONLY**`,
              inline: false
            },
            {
              name: "🎡 The Reels",
              value: `Each reel has 3 visible positions:
\`\`\`
   │ 🍒 │ 💎 │ ⭐ │  ← Top (not counted)
▶ 🍋 │ 🔔 │ 7️⃣ ◀  ← CENTER PAYLINE ✓
   │ ❤️ │ 🎁 │ 🤑 │  ← Bottom (not counted)
\`\`\`
**Only the center row determines your win!**`,
              inline: false
            },
            {
              name: "💀 Common Symbols",
              value: `**💀 Skull** (20% chance) - No payout
**🍒 Cherry** (40%) - 2-match: 1.5x | 3-match: 4x
**🍋 Lemon** (35%) - 2-match: 2x | 3-match: 5x
**❤️ Heart** (35%) - 2-match: 2x | 3-match: 5x`,
              inline: false
            },
            {
              name: "🔔 Uncommon Symbols",
              value: `**🔔 Bell** (20%) - 2-match: 3x | 3-match: 8x
**🎁 Gift** (20%) - 2-match: 3x | 3-match: 8x`,
              inline: false
            },
            {
              name: "⭐ Rare Symbols",
              value: `**⭐ Star** (10%) - 2-match: 4x | 3-match: 12x
**🤑 Money Face** (5%) - 2-match: 5x | 3-match: 15x
**7️⃣ Lucky Seven** (4%) - 2-match: 7x | 3-match: 50x`,
              inline: false
            },
            {
              name: "💎 Jackpot Symbol",
              value: `**💎 Diamond** (1% chance - RAREST)
• 2-match: **10x** payout
• 3-match: **100x** payout (JACKPOT!)`,
              inline: false
            },
            {
              name: "🏆 Winning Combinations",
              value: `**Three-of-a-Kind (Best):**
All 3 symbols on center payline match
Example: 🍒 | 🍒 | 🍒 = 4x your bet

**Two-of-a-Kind:**
Any 2 matching symbols on center payline (any position)
Example: 🍋 | 🔔 | 🍋 = 2x your bet

**No Match:**
No matching symbols = You lose your bet`,
              inline: false
            },
            {
              name: "💰 Payout Calculation",
              value: `Your winnings = (bet amount) × (multiplier)

**Examples:**
• Bet 100, get 3 Diamonds (💎) → Win **10,000 chips**
• Bet 100, get 2 Stars (⭐) → Win **400 chips**
• Bet 100, get 3 Cherries (🍒) → Win **400 chips**
• Bet 100, no match → Lose **100 chips**`,
              inline: false
            },
            {
              name: "🆓 Free Play Mode",
              value: `Use **/slots 0** to practice without risk:
• No chips bet or lost
• Results show what you would have won/lost
• Perfect for learning symbol values and payout rates`,
              inline: false
            },
            {
              name: "🎬 Animation",
              value: `• Spins last about **4 seconds** total
• Left reel stops first, then center, then right
• Creates suspense as you watch for matches
• Message updates in real-time during spin`,
              inline: false
            }
          ],
          footer: {
            text: "Pro tip: Diamonds are rare but worth the wait! 💎"
          }
        }
      ]
    }
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

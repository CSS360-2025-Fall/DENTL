import { InteractionResponseType } from 'discord-interactions';
import { isAdmin, DiscordRequest } from "../core/utils.js";
import { getBalance, addBalance } from "../economy/db.js"; // Changed: addBalance instead of validateAndLockBet

// Poker Config
const BIG_BLIND = 100;
const SMALL_BLIND = 50;
const MIN_BALANCE_REQUIRED = BIG_BLIND * 10; // 1000 chips minimum
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const ACTION_TIMEOUT_MS = 30000; // 30 seconds


let pokerSession = null; // One game per server

// ============ DECK & CARD UTILITIES ============
function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const deck = [];
  for (let s of suits) for (let r of ranks) deck.push(r + s);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function testDeck() {
    const suits = ["♠", "♠", "♥", "♥"];
  const ranks = ["2", "3", "4", "5", "6", "6", "A", "10", "10", "J", "Q", "K", "A"];
  const deck = [];
  for (let s of suits) for (let r of ranks) deck.push(r + s);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ============ POKER HAND EVALUATION ============

function cardRank(card) {
  const rank = card.slice(0, -1);
  const rankMap = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  return rankMap[rank];
}

function cardSuit(card) {
  return card.slice(-1);
}

function evaluateHand(cards) {
  // cards should be 7 cards (2 hole + 5 community)
  // Find the best 5-card combination
  const allCombos = getCombinations(cards, 5);
  let bestScore = 0;
  
  for (const combo of allCombos) {
    const score = scoreHand(combo);
    if (score > bestScore) {
      bestScore = score;
    }
  }
  
  return bestScore;
}

function getCombinations(array, size) {
  // Generate all possible combinations of 'size' elements from array
  if (size === 0) return [[]];
  if (array.length === 0) return [];
  
  const [first, ...rest] = array;
  const withoutFirst = getCombinations(rest, size);
  const withFirst = getCombinations(rest, size - 1).map(combo => [first, ...combo]);
  
  return [...withFirst, ...withoutFirst];
}

function scoreHand(hand) {
  // hand is exactly 5 cards
  // Returns a score where higher = better hand
  // Score format: [handType] * 10^10 + [highCard1] * 10^8 + [highCard2] * 10^6 + ...
  
  const ranks = hand.map(cardRank).sort((a, b) => b - a);
  const suits = hand.map(cardSuit);
  
  const rankCounts = {};
  ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
  
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);
  
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(ranks);
  
  // 9. Royal Flush (A-K-Q-J-10 of same suit)
  if (isFlush && isStraight && ranks[0] === 14) {
    return 9 * Math.pow(10, 10) + ranks[0] * Math.pow(10, 8);
  }
  
  // 8. Straight Flush
  if (isFlush && isStraight) {
    return 8 * Math.pow(10, 10) + ranks[0] * Math.pow(10, 8);
  }
  
  // 7. Four of a Kind
  if (counts[0] === 4) {
    const quadRank = uniqueRanks.find(r => rankCounts[r] === 4);
    const kicker = uniqueRanks.find(r => rankCounts[r] === 1);
    return 7 * Math.pow(10, 10) + quadRank * Math.pow(10, 8) + kicker * Math.pow(10, 6);
  }
  
  // 6. Full House
  if (counts[0] === 3 && counts[1] === 2) {
    const tripRank = uniqueRanks.find(r => rankCounts[r] === 3);
    const pairRank = uniqueRanks.find(r => rankCounts[r] === 2);
    return 6 * Math.pow(10, 10) + tripRank * Math.pow(10, 8) + pairRank * Math.pow(10, 6);
  }
  
  // 5. Flush
  if (isFlush) {
    return 5 * Math.pow(10, 10) + 
           ranks[0] * Math.pow(10, 8) + 
           ranks[1] * Math.pow(10, 6) + 
           ranks[2] * Math.pow(10, 4) + 
           ranks[3] * Math.pow(10, 2) + 
           ranks[4];
  }
  
  // 4. Straight
  if (isStraight) {
    return 4 * Math.pow(10, 10) + ranks[0] * Math.pow(10, 8);
  }
  
  // 3. Three of a Kind
  if (counts[0] === 3) {
    const tripRank = uniqueRanks.find(r => rankCounts[r] === 3);
    const kickers = uniqueRanks.filter(r => rankCounts[r] === 1).sort((a, b) => b - a);
    return 3 * Math.pow(10, 10) + 
           tripRank * Math.pow(10, 8) + 
           kickers[0] * Math.pow(10, 6) + 
           kickers[1] * Math.pow(10, 4);
  }
  
  // 2. Two Pair
  if (counts[0] === 2 && counts[1] === 2) {
    const pairs = uniqueRanks.filter(r => rankCounts[r] === 2).sort((a, b) => b - a);
    const kicker = uniqueRanks.find(r => rankCounts[r] === 1);
    return 2 * Math.pow(10, 10) + 
           pairs[0] * Math.pow(10, 8) + 
           pairs[1] * Math.pow(10, 6) + 
           kicker * Math.pow(10, 4);
  }
  
  // 1. One Pair
  if (counts[0] === 2) {
    const pairRank = uniqueRanks.find(r => rankCounts[r] === 2);
    const kickers = uniqueRanks.filter(r => rankCounts[r] === 1).sort((a, b) => b - a);
    return 1 * Math.pow(10, 10) + 
           pairRank * Math.pow(10, 8) + 
           kickers[0] * Math.pow(10, 6) + 
           kickers[1] * Math.pow(10, 4) + 
           kickers[2] * Math.pow(10, 2);
  }
  
  // 0. High Card
  return 0 * Math.pow(10, 10) + 
         ranks[0] * Math.pow(10, 8) + 
         ranks[1] * Math.pow(10, 6) + 
         ranks[2] * Math.pow(10, 4) + 
         ranks[3] * Math.pow(10, 2) + 
         ranks[4];
}

function checkStraight(ranks) {
  // ranks should be sorted descending
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
  
  // Check for regular straight
  for (let i = 0; i < uniqueRanks.length - 4; i++) {
    if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
      return true;
    }
  }
  
  // Check for A-2-3-4-5 (wheel)
  if (uniqueRanks.includes(14) && uniqueRanks.includes(5) && 
      uniqueRanks.includes(4) && uniqueRanks.includes(3) && 
      uniqueRanks.includes(2)) {
    return true;
  }
  
  return false;
}

function getHandName(score) {
  const handType = Math.floor(score / Math.pow(10, 10));
  const handNames = {
    9: "Royal Flush",
    8: "Straight Flush",
    7: "Four of a Kind",
    6: "Full House",
    5: "Flush",
    4: "Straight",
    3: "Three of a Kind",
    2: "Two Pair",
    1: "Pair",
    0: "High Card"
  };
  return handNames[handType] || "Unknown";
}

// ============ DISCORD API HELPERS ============
async function createThread(channelId, name) {
  try {
    const res = await DiscordRequest(`channels/${channelId}/threads`, {
      method: "POST",
      body: { name, type: 11, auto_archive_duration: 60 }
    });
    const data = await res.json();
    return data.id;
  } catch (err) {
    console.error("Failed to create thread:", err);
    return null;
  }
}

async function sendThreadMessage(threadId, content) {
  try {
    await DiscordRequest(`channels/${threadId}/messages`, {
      method: "POST",
      body: { content }
    });
  } catch (err) {
    console.error("Failed to send thread message:", err);
  }
}

async function sendDM(userId, content) {
  try {
    const dmRes = await DiscordRequest(`users/@me/channels`, {
      method: "POST",
      body: { recipient_id: userId }
    });
    const dmData = await dmRes.json();
    await DiscordRequest(`channels/${dmData.id}/messages`, {
      method: "POST",
      body: { content }
    });
  } catch (err) {
    console.error(`Failed to DM user ${userId}:`, err);
  }
}

// ============ SESSION MANAGEMENT ============
function blankSession(channelId) {
  return {
    status: "waiting",
    threadId: null,
    channelId,
    players: [],
    waitList: [],
    leaveList: [],
    dealerPos: 0,
    handNum: 0,
    currentHand: null,
    pendingActions: new Map()
  };
}

function setupHand(players, dealerPos) {
  const actionOrder = [];
  for (let i = 0; i < players.length; i++) {
    actionOrder.push(players[(dealerPos + 1 + i) % players.length].userId);
  }
  
  return {
    phase: "preflop",
    deck: createDeck(),
    // deck: testDeck(), // For testing specific scenarios
    board: [],
    holeCards: {},
    pot: 0,
    bets: {},
    currentBets: {},
    actionOrder,
    currentPlayerIndex: 0,
    lastRaise: BIG_BLIND,
    minRaise: BIG_BLIND,
    folded: new Set(),
    allIn: new Set(),
    timeouts: {},
    moves: {}
  };
}

// ============ GAME FLOW ============
async function startHand(session) {
  // Add waiting players with their current balance
  for (const uid of session.waitList) {
    const balance = getBalance(uid);
    if (balance < MIN_BALANCE_REQUIRED) {
      await sendThreadMessage(
        session.threadId,
        `Player ${uid} can't join - insufficient chips (needs ${MIN_BALANCE_REQUIRED}).`
      );
      continue;
    }
    const player = {
      userId: uid,
      username: `Player${session.players.length}`,
      stack: balance,
      seat: session.players.length,
      isActive: true,
      buyIn: balance
    };
    session.players.push(player);
    await sendThreadMessage(session.threadId, `${player.username} joined the table with ${balance} chips!`);
  }
  session.waitList = [];

  // Track all players who ever participated (for final standings)
  if (!session.allParticipants) {
    session.allParticipants = [];
  }

  // Remove leaving players and pay them out
  for (const leavingUserId of session.leaveList) {
    const leavingPlayer = session.players.find(p => p.userId === leavingUserId);
    if (leavingPlayer && leavingPlayer.stack >= 0) {
      const profit = leavingPlayer.stack - leavingPlayer.buyIn;
      addBalance(leavingUserId, profit);
      
      const profitMsg = profit > 0 ? `(+${profit} profit)` : profit < 0 ? `(${profit} loss)` : "(broke even)";
      
      // Add to all participants list before removing
      session.allParticipants.push({
        userId: leavingPlayer.userId,
        username: leavingPlayer.username,
        finalStack: leavingPlayer.stack,
        buyIn: leavingPlayer.buyIn,
        leftEarly: true
      });
      
      await sendThreadMessage(
        session.threadId,
        `${leavingPlayer.username} left with ${leavingPlayer.stack} chips ${profitMsg}`
      );
    }
    session.players = session.players.filter(p => p.userId !== leavingUserId);
  }
  session.leaveList = [];

  // Check player count
  if (session.players.length === 1) {
    await endGameAndSettle(session);
    return;
  }

  if (session.players.length < MIN_PLAYERS) {
    session.status = "waiting";
    await sendThreadMessage(
      session.threadId,
      `Waiting for more players (${session.players.length}/${MIN_PLAYERS})...`
    );
    return;
  }

  session.handNum++;
  session.dealerPos = (session.dealerPos + 1) % session.players.length;
  const smallBlindPos = (session.dealerPos + 1) % session.players.length;
  const bigBlindPos = (smallBlindPos + 1) % session.players.length;

  session.currentHand = setupHand(session.players, session.dealerPos);
  const hand = session.currentHand;

  // Post blinds
  session.players[smallBlindPos].stack -= SMALL_BLIND;
  session.players[bigBlindPos].stack -= BIG_BLIND;
  hand.currentBets[session.players[smallBlindPos].userId] = SMALL_BLIND;
  hand.currentBets[session.players[bigBlindPos].userId] = BIG_BLIND;
  hand.bets[session.players[smallBlindPos].userId] = SMALL_BLIND;
  hand.bets[session.players[bigBlindPos].userId] = BIG_BLIND;
  hand.pot = SMALL_BLIND + BIG_BLIND;

  // Deal hole cards
  for (const player of session.players) {
    const card1 = hand.deck.pop();
    const card2 = hand.deck.pop();
    hand.holeCards[player.userId] = [card1, card2];
    await sendDM(player.userId, `🎴 Your cards: ${card1} ${card2}`);
  }

  await sendThreadMessage(
    session.threadId,
    `🃏 **Hand #${session.handNum}**\nDealer: ${session.players[session.dealerPos].username}\nSmall Blind (${SMALL_BLIND}): ${session.players[smallBlindPos].username}\nBig Blind (${BIG_BLIND}): ${session.players[bigBlindPos].username}\nPot: ${hand.pot} chips\nCards dealt! Check your DMs.`
  );

  await advanceTurn(session);
}

async function advanceTurn(session) {
  const hand = session.currentHand;

  // Check if betting round is complete
  if (isBettingRoundComplete(session)) {
    await completeBettingRound(session);
    return;
  }

  // Find next active player
  let attempts = 0;
  while (attempts < session.players.length) {
    const currentUserId = hand.actionOrder[hand.currentPlayerIndex];
    const player = session.players.find(p => p.userId === currentUserId);

    if (!hand.folded.has(currentUserId) && !hand.allIn.has(currentUserId) && player.stack > 0) {
      // Clear any existing timeout for this player first
      if (hand.timeouts[currentUserId]) {
        clearTimeout(hand.timeouts[currentUserId].timer);
        delete hand.timeouts[currentUserId];
      }
      await promptPlayerAction(session, currentUserId);
      return;
    }

    hand.currentPlayerIndex = (hand.currentPlayerIndex + 1) % hand.actionOrder.length;
    attempts++;
  }

  // If we exhausted all players, betting round is complete
  await completeBettingRound(session);
}

async function handlePlayerAction(session, userId, action, amount = 0) {
  const hand = session.currentHand;
  const player = session.players.find(p => p.userId === userId);

  // Clear timeout immediately when action is taken
  if (hand.timeouts[userId]) {
    clearTimeout(hand.timeouts[userId].timer);
    
    // Update the prompt message to remove buttons
    try {
      await DiscordRequest(`channels/${session.threadId}/messages/${hand.timeouts[userId].messageId}`, {
        method: "PATCH",
        body: {
          content: `${player.username}'s turn ended.`,
          components: []
        }
      });
    } catch (err) {
      console.error("Failed to update message after action", err);
    }
    
    delete hand.timeouts[userId];
  }

  // TRACK THAT THIS PLAYER HAS ACTED
  hand.moves[userId] = action;

  const currentBet = hand.currentBets[userId] || 0;
  const allBets = Object.values(hand.currentBets);
  const maxBet = allBets.length > 0 ? Math.max(...allBets) : 0;

  let message = `${player.username} `;

  switch (action) {
    case "fold":
      hand.folded.add(userId);
      message += "folds";
      break;
    case "check":
      message += "checks";
      break;
    case "call":
      const toCall = Math.min(maxBet - currentBet, player.stack);
      if (toCall > 0) {
        player.stack -= toCall;
        hand.currentBets[userId] = currentBet + toCall;
        hand.bets[userId] = (hand.bets[userId] || 0) + toCall;
        hand.pot += toCall;
        message += `calls ${toCall}`;
        if (player.stack === 0) hand.allIn.add(userId);
      } else {
        message += "checks";
      }
      break;
    case "raise":
      player.stack -= amount;
      hand.currentBets[userId] = currentBet + amount;
      hand.bets[userId] = (hand.bets[userId] || 0) + amount;
      hand.pot += amount;
      hand.minRaise = amount - (maxBet - currentBet);
      message += `raises to ${hand.currentBets[userId]}`;
      if (player.stack === 0) hand.allIn.add(userId);
      // RESET moves after a raise
      hand.moves = { [userId]: action };
      break;
    case "allin":
      const allinAmount = player.stack;
      player.stack = 0;
      hand.currentBets[userId] = currentBet + allinAmount;
      hand.bets[userId] = (hand.bets[userId] || 0) + allinAmount;
      hand.pot += allinAmount;
      hand.allIn.add(userId);
      message += `goes ALL-IN (${allinAmount})`;
      if (hand.currentBets[userId] > maxBet) {
        hand.moves = { [userId]: action };
      }
      break;
  }

  await sendThreadMessage(session.threadId, message);

  // Move to next player
  hand.currentPlayerIndex = (hand.currentPlayerIndex + 1) % hand.actionOrder.length;
  await advanceTurn(session);
}

async function promptPlayerAction(session, userId) {
  const hand = session.currentHand;
  const player = session.players.find(p => p.userId === userId);
  
  // Safety check - if player already folded or is all-in, skip
  if (hand.folded.has(userId) || hand.allIn.has(userId)) {
    hand.currentPlayerIndex = (hand.currentPlayerIndex + 1) % hand.actionOrder.length;
    await advanceTurn(session);
    return;
  }

  const currentBet = hand.currentBets[userId] || 0;
  const allBets = Object.values(hand.currentBets);
  const maxBet = allBets.length > 0 ? Math.max(...allBets) : 0;
  const toCall = maxBet - currentBet;

  const buttons = createActionButtons(session, userId);

  try {
    const response = await DiscordRequest(`channels/${session.threadId}/messages`, {
      method: "POST",
      body: {
        content: `⏰ <@${player.userId}>'s turn (30 seconds) | Pot: ${hand.pot} | To call: ${toCall} | Your stack: ${player.stack}\n<@${userId}> Use the buttons below to act!`,
        components: buttons.length > 0 ? [{ type: 1, components: buttons }] : []
      }
    });
    const msgData = await response.json();
    
    // Set timeout with proper 30 second delay
    const timeoutTimer = setTimeout(async () => {
      // Double-check player hasn't already acted
      if (hand.moves[userId]) return;
      
      await sendThreadMessage(session.threadId, `${player.username} auto-folded (timeout)`);
      
      // Update message to remove buttons
      try {
        await DiscordRequest(`channels/${session.threadId}/messages/${msgData.id}`, {
          method: "PATCH",
          body: {
            content: `${player.username} auto-folded (timeout)`,
            components: []
          }
        });
      } catch (err) {
        console.error("Failed to update timeout message", err);
      }
      
      delete hand.timeouts[userId];
      await handlePlayerAction(session, userId, "fold", 0);
    }, ACTION_TIMEOUT_MS); // This ensures it's actually 30000ms = 30 seconds

    hand.timeouts[userId] = {
      timer: timeoutTimer,
      messageId: msgData.id
    };
  } catch (err) {
    console.error("Failed to send action buttons", err);
  }
}

async function completeBettingRound(session) {
  const hand = session.currentHand;

  // Clear all remaining timeouts
  for (const userId in hand.timeouts) {
    if (hand.timeouts[userId]) {
      clearTimeout(hand.timeouts[userId].timer);
      try {
        await DiscordRequest(`channels/${session.threadId}/messages/${hand.timeouts[userId].messageId}`, {
          method: "PATCH",
          body: {
            content: "Round complete.",
            components: []
          }
        });
      } catch (err) {
        console.error("Failed to clear timeout message", err);
      }
    }
  }
  hand.timeouts = {};

  // Check if only one player left (everyone else folded)
  const activePlayers = session.players.filter(p => !hand.folded.has(p.userId));

  if (activePlayers.length === 1) {
    // Award pot to last remaining player
    const winner = activePlayers[0];
    winner.stack += hand.pot;
    await sendThreadMessage(
      session.threadId,
      `**${winner.username} wins ${hand.pot} chips (all others folded)!**`
    );
    await endHand(session, winner.userId);
    return;
  }

  // If all players folded (edge case), just end the hand
  if (activePlayers.length === 0) {
    await sendThreadMessage(session.threadId, "All players folded. Hand ended.");
    await endHand(session, null);
    return;
  }

  // Advance phase
  if (hand.phase === "preflop") {
    hand.phase = "flop";
    hand.board.push(hand.deck.pop(), hand.deck.pop(), hand.deck.pop());
    await sendThreadMessage(session.threadId, `\n🎴 **FLOP:** ${hand.board.join(" ")} | Pot: ${hand.pot}`);
  } else if (hand.phase === "flop") {
    hand.phase = "turn";
    hand.board.push(hand.deck.pop());
    await sendThreadMessage(session.threadId, `\n🎴 **TURN:** ${hand.board.join(" ")} | Pot: ${hand.pot}`);
  } else if (hand.phase === "turn") {
    hand.phase = "river";
    hand.board.push(hand.deck.pop());
    await sendThreadMessage(session.threadId, `\n🎴 **RIVER:** ${hand.board.join(" ")} | Pot: ${hand.pot}`);
  } else {
    // Showdown
    await showdown(session);
    return;
  }

  // Reset for next betting round
  hand.currentBets = {};
  hand.currentPlayerIndex = 0;
  hand.moves = {};
  await advanceTurn(session);
}

async function showdown(session) {
  const hand = session.currentHand;
  const activePlayers = session.players.filter(p => !hand.folded.has(p.userId));

  // Safety check
  if (activePlayers.length === 0) {
    await sendThreadMessage(session.threadId, "No players remain. Hand ended.");
    await endHand(session, null);
    return;
  }

  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    winner.stack += hand.pot;
    await sendThreadMessage(
      session.threadId,
      `**${winner.username} wins ${hand.pot} chips (all others folded)!**`
    );
    await endHand(session, winner.userId);
    return;
  }

  let bestScore = -1;
  let winners = [];
  let resultMessage = "\n🏆 **SHOWDOWN:**\n";

  // Evaluate all hands
  const playerHands = [];
  for (const player of activePlayers) {
    const playerCards = [...hand.holeCards[player.userId], ...hand.board];
    const score = evaluateHand(playerCards);
    const handName = getHandName(score);
    playerHands.push({ player, score, handName });
    resultMessage += `${player.username}: ${hand.holeCards[player.userId].join(" ")} - ${handName}\n`;

    if (score > bestScore) {
      bestScore = score;
      winners = [player];
    } else if (score === bestScore) {
      winners.push(player);
    }
  }

  // Handle ties
  if (winners.length > 1) {
    const splitPot = Math.floor(hand.pot / winners.length);
    resultMessage += `\n**Split pot!** ${winners.map(w => w.username).join(", ")} each win ${splitPot} chips!`;
    winners.forEach(winner => {
      winner.stack += splitPot;
    });
  } else {
    const winner = winners[0];
    resultMessage += `\n**${winner.username} wins ${hand.pot} chips with ${getHandName(bestScore)}!**`;
    winner.stack += hand.pot;
  }

  await sendThreadMessage(session.threadId, resultMessage);
  await endHand(session, winners[0].userId);
}

// ============ NEW: Check if betting round is complete ============
function isBettingRoundComplete(session) {
  const hand = session.currentHand;
  
  if (!hand.moves) {
    hand.moves = {};
  }
  
  const activePlayers = session.players.filter(p => 
    !hand.folded.has(p.userId) && 
    !hand.allIn.has(p.userId) && 
    p.stack > 0
  );
  
  if (activePlayers.length <= 1) {
    return true;
  }
  
  const allHaveActed = activePlayers.every(p => {
    const userId = p.userId;
    return hand.moves[userId] !== undefined;
  });
  
  if (!allHaveActed) {
    return false;
  }
  
  // SAFE maxBet calculation
  const activeBets = activePlayers.map(p => hand.currentBets[p.userId] || 0);
  const maxBet = activeBets.length > 0 ? Math.max(...activeBets) : 0;
  const allBetsEqual = activeBets.every(bet => bet === maxBet);
  
  return allBetsEqual;
}

// ============ HELPER: Create Action Buttons ============
function createActionButtons(session, userId) {
  const hand = session.currentHand;
  const player = session.players.find(p => p.userId === userId);
  const currentBet = hand.currentBets[userId] || 0;
  
  // SAFE maxBet calculation
  const allBets = Object.values(hand.currentBets);
  const maxBet = allBets.length > 0 ? Math.max(...allBets) : 0;
  const toCall = maxBet - currentBet;
  
  const buttons = [];
  
  // Fold button (always available)
  buttons.push({ 
    type: 2, 
    custom_id: `poker_fold`, 
    style: 4, 
    label: "Fold" 
  });
  
  // Check or Call button
  if (toCall === 0) {
    buttons.push({ 
      type: 2, 
      custom_id: `poker_check`, 
      style: 2, 
      label: "Check" 
    });
  } else if (player.stack >= toCall) {
    buttons.push({ 
      type: 2, 
      custom_id: `poker_call`, 
      style: 3, 
      label: `Call ${toCall}` 
    });
  }
  
  // Raise buttons (only if player has chips beyond the call amount)
  if (player.stack > toCall) {
    const raiseBase = hand.minRaise;
    
    // 1x raise
    const raise1x = toCall + raiseBase;
    if (player.stack >= raise1x) {
      buttons.push({ 
        type: 2, 
        custom_id: `poker_raise_1x`, 
        style: 1, 
        label: `Raise ${raiseBase} (to ${maxBet + raiseBase})` 
      });
    }
    
    // 2x raise
    const raise2x = toCall + (raiseBase * 2);
    if (player.stack >= raise2x) {
      buttons.push({ 
        type: 2, 
        custom_id: `poker_raise_2x`, 
        style: 1, 
        label: `Raise ${raiseBase * 2}` 
      });
    }
  }
  
  // All-in button (always available if player has chips)
  if (player.stack > 0) {
    buttons.push({ 
      type: 2, 
      custom_id: `poker_allin`, 
      style: 4, 
      label: `All-In (${player.stack})` 
    });
  }
  
  return buttons.slice(0, 5);
}

async function endHand(session, winnerId) {
  // Remove broke players
  const brokePlayers = session.players.filter(p => p.stack <= 0);
  for (const brokePlayer of brokePlayers) {
    await sendThreadMessage(session.threadId, `${brokePlayer.username} is out of chips!`);
  }
  
  session.players = session.players.filter(p => p.stack > 0);
  
  // Check if game should end
  if (session.players.length < 2) {
    await endGameAndSettle(session);
    return;
  }
  
  // Start next hand after 5 second delay
  setTimeout(() => {
    if (session && session.status === "active") {
      startHand(session);
    }
  }, 5000);
}

async function endGameAndSettle(session) {
  session.status = "ended";

  // Initialize all participants list if it doesn't exist
  if (!session.allParticipants) {
    session.allParticipants = [];
  }

  // Add remaining players to all participants
  for (const player of session.players) {
    // Check if already in allParticipants (they might have left and rejoined)
    const existingEntry = session.allParticipants.find(p => p.userId === player.userId);
    if (!existingEntry) {
      session.allParticipants.push({
        userId: player.userId,
        username: player.username,
        finalStack: player.stack,
        buyIn: player.buyIn,
        leftEarly: false
      });
    } else {
      // Update their final stack if they're still in
      existingEntry.finalStack = player.stack;
      existingEntry.leftEarly = false;
    }
  }

  // Settle all remaining players
  for (const player of session.players) {
    const profit = player.stack - player.buyIn;
    addBalance(player.userId, profit);
  }

  // Build final standings message
  let standingsMsg = "\n\n🎲 **Game Over! Final Standings:**\n";
  
  for (const participant of session.allParticipants) {
    const profit = participant.finalStack - participant.buyIn;
    let profitMsg;
    
    if (profit > 0) {
      profitMsg = `(+${profit} profit)`;
    } else if (profit < 0) {
      profitMsg = `(${profit} loss)`;
    } else {
      profitMsg = "(broke even)";
    }
    
    standingsMsg += `${participant.username}: ${participant.finalStack} chips ${profitMsg}\n`;
  }
  
  standingsMsg += "\n👋 **Table closed. Thanks for playing!**";

  await sendThreadMessage(session.threadId, standingsMsg);
  pokerSession = null;
}

// ============ SLASH COMMAND HANDLERS ============
function errorReply(msg) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: msg, flags: 64 }
  };
}

async function handleJoin(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const username = interaction.member?.user?.username ?? interaction.user?.username;
  const channelId = interaction.channel_id;
  
  // Check balance
  const balance = getBalance(userId);
  if (balance < MIN_BALANCE_REQUIRED) {
    return errorReply(`You need at least ${MIN_BALANCE_REQUIRED} chips to join. You have ${balance} chips.`);
  }
  
  if (!pokerSession || pokerSession.status === "ended") {
    pokerSession = blankSession(channelId);
  }
  
  if (pokerSession.players.find(p => p.userId === userId) || pokerSession.waitList.includes(userId)) {
    return errorReply("You're already in the game or lobby.");
  }
  
  if (pokerSession.status === "waiting") {
    if (pokerSession.players.length >= MAX_PLAYERS) {
      return errorReply(`Table full (${MAX_PLAYERS} players).`);
    }
    
    // Add player
    pokerSession.players.push({ 
      userId, 
      username, 
      stack: balance,
      seat: pokerSession.players.length, 
      isActive: true,
      buyIn: balance
    });
    
    // FIRST PLAYER - Create lobby message
    if (pokerSession.players.length === 1) {
      try {
        const lobbyMessage = await DiscordRequest(`channels/${channelId}/messages`, {
          method: "POST",
          body: {
            content: `🎲 **Poker Game Starting!**\n` +
                     `Use \`/poker join\` to join the game!\n\n` +
                     `**Players at table (${pokerSession.players.length}/${MAX_PLAYERS}):**\n` +
                     `1. ${username} - ${balance} chips\n\n` +
                     `Use \`/poker start\` when ready to begin!`
          }
        });
        const lobbyData = await lobbyMessage.json();
        pokerSession.lobbyMessageId = lobbyData.id;
      } catch (err) {
        console.error("Failed to create lobby message:", err);
      }
      
      // Ephemeral response to the command user
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { 
          content: `You created the poker lobby with ${balance} chips!`,
          flags: 64 // Ephemeral
        }
      };
    } 
    // SUBSEQUENT PLAYERS - Update lobby message
    else {
      try {
        if (pokerSession.lobbyMessageId) {
          const playerList = pokerSession.players
            .map((p, idx) => `${idx + 1}. ${p.username} - ${p.stack} chips`)
            .join('\n');
          
          await DiscordRequest(`channels/${channelId}/messages/${pokerSession.lobbyMessageId}`, {
            method: "PATCH",
            body: {
              content: `🎲 **Poker Game Starting!**\n` +
                       `Use \`/poker join\` to join the game!\n\n` +
                       `**Players at table (${pokerSession.players.length}/${MAX_PLAYERS}):**\n` +
                       `${playerList}\n\n` +
                       `Use \`/poker start\` when ready to begin!`
            }
          });
        }
      } catch (err) {
        console.error("Failed to update lobby message:", err);
      }
      
      // PUBLIC announcement message
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { 
          content: `**${username}** has joined the game with ${balance} chips! (${pokerSession.players.length}/${MAX_PLAYERS} players)`
          // NO flags: 64, so it's public
        }
      };
    }
  } 
  // ACTIVE GAME - Join waitlist
  else if (pokerSession.status === "active") {
    pokerSession.waitList.push(userId);
    
    if (pokerSession.threadId) {
      await sendThreadMessage(pokerSession.threadId, `${username} will join from the next deal with ${balance} chips.`);
    }
    
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { 
        content: `**${username}** will join the poker game at the next hand with ${balance} chips!`
      }
    };
  }
}

async function handleLeave(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const username = interaction.member?.user?.username ?? interaction.user?.username;
  
  if (!pokerSession) {
    return errorReply("No game to leave.");
  }
  
  const player = pokerSession.players.find(p => p.userId === userId);
  const isWaiting = pokerSession.waitList.includes(userId);
  
  if (!player && !isWaiting) {
    return errorReply("You're not in the game.");
  }
  
  if (pokerSession.status === "active") {
    if (!pokerSession.leaveList.includes(userId)) {
      pokerSession.leaveList.push(userId);
    }
    if (pokerSession.threadId) {
      await sendThreadMessage(pokerSession.threadId, `${username} will leave after this hand.`);
    }
    return errorReply("You'll leave after this hand. Your remaining chips will be paid out.");
  } else {
    // Leaving before game starts - just remove from lobby
    if (player) {
      pokerSession.players = pokerSession.players.filter(p => p.userId !== userId);
      return errorReply(`You left the lobby.`);
    } else {
      pokerSession.waitList = pokerSession.waitList.filter(uid => uid !== userId);
      return errorReply(`You left the waitlist.`);
    }
  }
}

async function handleStart(interaction) {
  const channelId = interaction.channel_id;
  
  if (!pokerSession || pokerSession.status !== "waiting") {
    return errorReply("No lobby to start.");
  }
  
  if (pokerSession.players.length < MIN_PLAYERS) {
    return errorReply(`Need at least ${MIN_PLAYERS} players (currently ${pokerSession.players.length}).`);
  }
  
  // Create thread
  pokerSession.threadId = await createThread(channelId, "🃏 Poker Table");
  if (!pokerSession.threadId) {
    return errorReply("Failed to create game thread.");
  }
  
  pokerSession.status = "active";
  await sendThreadMessage(
    pokerSession.threadId, 
    `🎲 **Poker Game Starting!**\nPlayers: ${pokerSession.players.map(p => p.username).join(", ")}\n\nGame begins in 3 seconds...`
  );
  
  // Start first hand
  setTimeout(() => {
    if (pokerSession && pokerSession.status === "active") {
      startHand(pokerSession);
    }
  }, 3000);
  
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: "Game started! Check the poker thread.", flags: 64 }
  };
}

async function handleEnd(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  
  if (!isAdmin(userId)) {
    return errorReply("⛔ Admins only.");
  }
  
  if (!pokerSession || pokerSession.status !== "active") {
    return errorReply("No active game to end.");
  }
  
  pokerSession.status = "ended";
  
  if (pokerSession.threadId) {
    await sendThreadMessage(pokerSession.threadId, "🛑 Game ended by admin. Settling chips...");
  }
  
  // Settle each player based on profit/loss
  for (const player of pokerSession.players) {
    const profit = player.stack - player.buyIn;
    addBalance(player.userId, profit);
    
    if (pokerSession.threadId) {
      const profitMsg = profit >= 0 ? `+${profit}` : `${profit}`;
      await sendThreadMessage(
        pokerSession.threadId, 
        `${player.username}: ${profitMsg} profit/loss settled`
      );
    }
  }
  
  pokerSession = null;
  
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: "Game ended. All chips settled.", flags: 64 }
  };
}

// ============ BUTTON INTERACTION HANDLER ============
export async function interact(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const customId = interaction.data.custom_id;
  
  if (!pokerSession || !pokerSession.currentHand) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "No active poker hand.", flags: 64 }
    };
  }
  
  const hand = pokerSession.currentHand;
  const currentUserId = hand.actionOrder[hand.currentPlayerIndex];
  
  if (userId !== currentUserId) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "Not your turn!", flags: 64 }
    };
  }
  
  const player = pokerSession.players.find(p => p.userId === userId);
  const currentBet = hand.currentBets[userId] || 0;
  const allBets = Object.values(hand.currentBets);
  const maxBet = allBets.length > 0 ? Math.max(...allBets) : 0;
  const toCall = maxBet - currentBet;
  
  // Handle button action
  if (customId === "poker_fold") {
    await handlePlayerAction(pokerSession, userId, "fold");
  } else if (customId === "poker_check") {
    if (toCall === 0) {
      await handlePlayerAction(pokerSession, userId, "check");
    } else {
      return errorReply("Cannot check, you must call or fold.");
    }
  } else if (customId === "poker_call") {
    await handlePlayerAction(pokerSession, userId, "call");
  } else if (customId === "poker_allin") {
    await handlePlayerAction(pokerSession, userId, "allin");
  } else if (customId.startsWith("poker_raise_")) {
    const multiplier = customId === "poker_raise_1x" ? 1 : 
                      customId === "poker_raise_2x" ? 2 :
                      customId === "poker_raise_3x" ? 3 :
                      customId === "poker_raise_5x" ? 5 : 1;
    const raiseAmount = toCall + (hand.minRaise * multiplier);
    
    if (player.stack >= raiseAmount) {
      await handlePlayerAction(pokerSession, userId, "raise", raiseAmount);
    } else {
      return errorReply("Not enough chips for that raise.");
    }
  }
  
  return {
    type: InteractionResponseType.UPDATE_MESSAGE,
    data: { content: "Action recorded!", components: [] }
  };
}

// ============ MAIN COMMAND EXPORT ============
export async function execute(interaction) {
  const subcommand = interaction.data.options?.[0]?.name;
  
  switch (subcommand) {
    case "join":
      return await handleJoin(interaction);
    case "leave":
      return await handleLeave(interaction);
    case "start":
      return await handleStart(interaction);
    case "end":
      return await handleEnd(interaction);
    default:
      return errorReply("Unknown poker command.");
  }
}

// Command definition for registration
export const data = {
  name: "poker",
  description: "Texas Hold'em Poker game",
  type: 1,
  options: [
    { name: "join", type: 1, description: "Join the poker lobby" },
    { name: "leave", type: 1, description: "Leave the poker table" },
    { name: "start", type: 1, description: "Start the game" },
    { name: "end", type: 1, description: "End the game (admin only)" }
  ]
};

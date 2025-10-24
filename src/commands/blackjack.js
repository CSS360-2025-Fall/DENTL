import { InteractionResponseType } from 'discord-interactions';
import { getBalance } from "../economy/db.js";
import { validateAndLockBet } from "../economy/bets.js";

const sessions = new Map();

function getShuffledDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = [2,3,4,5,6,7,8,9,10,'J','Q','K','A'];
  let deck = [];
  for (let suit of suits) for (let rank of ranks) deck.push({ suit, rank });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function handValue(hand) {
  let value = 0, aces = 0;
  for (let card of hand) {
    if (typeof card.rank === 'number') value += card.rank;
    else if (card.rank === 'A') { value += 11; aces++; }
    else value += 10;
  }
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return value;
}

function buttonRow() {
  return [
    {
      type: 1,
      components: [
        { type: 2, custom_id: 'bj_hit', style: 1, label: 'Hit' },
        { type: 2, custom_id: 'bj_stand', style: 2, label: 'Stand' },
        { type: 2, custom_id: 'bj_double', style: 3, label: 'Double Down' }
      ]
    }
  ];
}

export async function execute(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const bet = Number(interaction.data.options?.find(o => o.name === 'bet')?.value ?? 0);

  if (sessions.has(userId)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "You already have a Blackjack game in progress.", flags: 64 }
    };
  }

  const check = validateAndLockBet(userId, bet);
  if (!check.ok) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: check.error, flags: 64 }
    };
  }

  const deck = getShuffledDeck();
  const player = [deck.pop(), deck.pop()];
  const house = [deck.pop(), deck.pop()];

  sessions.set(userId, {
    deck, player, house, bet, doubled: false, done: false, settle: check.settle
  });

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content:
        `Your hand: ${player.map(c => `${c.rank}${c.suit}`).join(' ')} (Value: ${handValue(player)})\n` +
        `House shows: ${house[0].rank}${house[0].suit}\n` +
        `Your bet: ${bet} chips\nChoose your action.`,
      components: buttonRow()
    }
  };
}

export async function interact(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const session = sessions.get(userId);

  if (!session || session.done) {
    return {
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: { content: "No active Blackjack game!", components: [] }
    };
  }

  let response = '';

  if (interaction.data.custom_id === 'bj_hit') {
    session.player.push(session.deck.pop());
    const value = handValue(session.player);

    if (value > 21) {
      session.done = true;
      session.settle.lose();
      response =
        `You drew ${session.player[session.player.length-1].rank}${session.player[session.player.length-1].suit}. Hand value: ${value}. You bust! Lost ${session.bet} chips.\n` +
        `Your hand: ${session.player.map(c => `${c.rank}${c.suit}`).join(' ')} (Value: ${value})`;
      sessions.delete(userId);
      return {
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: { content: response, components: [] }
      };
    } else {
      response =
        `Your hand: ${session.player.map(c => `${c.rank}${c.suit}`).join(' ')} (Value: ${value})\n` +
        `House shows: ${session.house[0].rank}${session.house[0].suit}\nChoose your action.`;
      return {
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: { content: response, components: buttonRow() }
      };
    }
  }

  if (interaction.data.custom_id === 'bj_stand' || session.done) {
    let houseValue = handValue(session.house);
    while (houseValue < 17) {
      session.house.push(session.deck.pop());
      houseValue = handValue(session.house);
    }
    const playerValue = handValue(session.player);
    session.done = true;

    // Both hands always shown in results:
    let playerHandStr = `Your hand: ${session.player.map(c => `${c.rank}${c.suit}`).join(' ')} (Value: ${playerValue})`;
    let houseHandStr = `House hand: ${session.house.map(c => `${c.rank}${c.suit}`).join(' ')} (Value: ${houseValue})`;

    if (houseValue > 21 || playerValue > houseValue) {
      session.settle.win();
      response = `${houseHandStr}\n${playerHandStr}\nYou win! Won ${session.bet} chips.`;
    } else if (playerValue === houseValue) {
      session.settle.tie();
      response = `${houseHandStr}\n${playerHandStr}\nTie! Bet refunded (${session.bet} chips).`;
    } else {
      session.settle.lose();
      response = `${houseHandStr}\n${playerHandStr}\nYou lose! Lost ${session.bet} chips.`;
    }
    sessions.delete(userId);
    return {
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: { content: response, components: [] }
    };
  }

  if (interaction.data.custom_id === 'bj_double') {
    const chips = getBalance(userId);
    if (session.doubled) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: "Already doubled down!", flags: 64 }
      };
    }
    if (chips < session.bet) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: "Not enough chips to double down.", flags: 64 }
      };
    }
    validateAndLockBet(userId, session.bet);
    session.bet *= 2;
    session.player.push(session.deck.pop());
    session.doubled = true;

    const value = handValue(session.player);

    if (value > 21) {
      session.done = true;
      session.settle.lose();
      response =
        `You doubled down and drew ${session.player[session.player.length-1].rank}${session.player[session.player.length-1].suit}.` +
        `Your hand: ${session.player.map(c => `${c.rank}${c.suit}`).join(' ')} (Value: ${value})\n You bust! Lost ${session.bet} chips.`;
      sessions.delete(userId);
      return {
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: { content: response, components: [] }
      };
    } else {
      let houseValue = handValue(session.house);
      while (houseValue < 17) {
        session.house.push(session.deck.pop());
        houseValue = handValue(session.house);
      }
      session.done = true;

      let playerHandStr = `Your hand: ${session.player.map(c => `${c.rank}${c.suit}`).join(' ')} (Value: ${value})`;
      let houseHandStr = `House hand: ${session.house.map(c => `${c.rank}${c.suit}`).join(' ')} (Value: ${houseValue})`;
      if (houseValue > 21 || value > houseValue) {
        session.settle.win();
        response = `${houseHandStr}\n${playerHandStr}\nYou win! Won ${session.bet} chips.`;
      } else if (value === houseValue) {
        session.settle.tie();
        response = `${houseHandStr}\n${playerHandStr}\nTie! Bet refunded (${session.bet} chips).`;
      } else {
        session.settle.lose();
        response = `${houseHandStr}\n${playerHandStr}\nYou lose! Lost ${session.bet} chips.`;
      }
      sessions.delete(userId);
      return {
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: { content: response, components: [] }
      };
    }
  }

  // Fallback
  return {
    type: InteractionResponseType.UPDATE_MESSAGE,
    data: { content: "Unknown action.", components: [] }
  };
}

export const data = {
  name: "blackjack",
  description: "Play blackjack vs the dealer (bot)",
  options: [
    { name: "bet", type: 4, description: "Your wager", required: true }
  ]
};

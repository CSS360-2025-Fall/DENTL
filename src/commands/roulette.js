import { InteractionResponseType } from 'discord-interactions';
import { validateBet } from "../economy/bets.js";
import { getBalance, addBalance } from "../economy/db.js";

/**
** Interaction Flow **

User types /roulette 100
↓
InteractionType.APPLICATION_COMMAND
↓
Loads roulette.js via loadCommand()
↓
Calls ROULETTE.execute()
↓
Shows bet type buttons

User clicks "Single (35:1)" button
↓
InteractionType.MESSAGE_COMPONENT
↓
custom_id starts with "roulette_"
↓
Calls ROULETTE.interact()
↓
Shows modal for number input

User types "17" and submits modal
↓
InteractionType.MODAL_SUBMIT
↓
custom_id starts with "roulette_modal_"
↓
Calls ROULETTE.handleModalSubmit()
↓
Validates input, executes game, shows result

*/

const sessions = new Map();

// Stage 1: Show bet type buttons
function rouletteButtons() {
  const betTypes = [
    { id: 'single', label: 'Single (35:1)', style: 1 },
    { id: 'split', label: 'Split (17:1)', style: 1 },
    { id: 'street', label: 'Street (11:1)', style: 1 },
    { id: 'corner', label: 'Corner (8:1)', style: 1 },
    { id: 'five', label: 'Five (6:1)', style: 2 },
    { id: 'line', label: 'Line (5:1)', style: 2 },
    { id: 'dozen', label: 'Dozen (2:1)', style: 2 },
    { id: 'column', label: 'Column (2:1)', style: 2 },
    { id: 'low', label: '1-18 (1:1)', style: 3 },
    { id: 'high', label: '19-36 (1:1)', style: 3 },
    { id: 'red', label: '🔴 Red (1:1)', style: 3 },
    { id: 'black', label: '⚫ Black (1:1)', style: 3 }
  ];
  
  const rows = [];
  
  // Row 1: buttons 1-4
  rows.push({
    type: 1,
    components: betTypes.slice(0, 4).map(bt => ({
      type: 2,
      custom_id: `roulette_type_${bt.id}`,
      style: bt.style,
      label: bt.label
    }))
  });
  
  // Row 2: buttons 4-8
  rows.push({
    type: 1,
    components: betTypes.slice(4, 8).map(bt => ({
      type: 2,
      custom_id: `roulette_type_${bt.id}`,
      style: bt.style,
      label: bt.label
    }))
  });
  
  // Row 3: buttons 8-12
  rows.push({
    type: 1,
    components: betTypes.slice(8, 12).map(bt => ({
      type: 2,
      custom_id: `roulette_type_${bt.id}`,
      style: bt.style,
      label: bt.label
    }))
  });
  
  return rows;
}

// show follow-up buttons for bets that need number selection
function getFollowUpButtons(betType) {
  
  // DOZEN BET - 3 buttons (1 row)
  if (betType === 'dozen') {
    return [
      {
        type: 1,
        components: [
          { type: 2, custom_id: 'roulette_select_dozen_1', label: '1st Dozen (1-12)', style: 1 },
          { type: 2, custom_id: 'roulette_select_dozen_2', label: '2nd Dozen (13-24)', style: 1 },
          { type: 2, custom_id: 'roulette_select_dozen_3', label: '3rd Dozen (25-36)', style: 1 }
        ]
      }
    ];
  }
  
  // COLUMN BET - 3 buttons (1 row)
  if (betType === 'column') {
    return [
      {
        type: 1,
        components: [
          { type: 2, custom_id: 'roulette_select_column_1', label: 'Column 1', style: 1 },
          { type: 2, custom_id: 'roulette_select_column_2', label: 'Column 2', style: 1 },
          { type: 2, custom_id: 'roulette_select_column_3', label: 'Column 3', style: 1 }
        ]
      }
    ];
  }

  // STREET BET - 12 buttons (3 rows)
  if (betType === 'street') {
    const streets = [];
    for (let i = 1; i <= 34; i += 3) {
      streets.push({
        type: 2,
        custom_id: `roulette_select_street_${i}`,
        label: `${i}-${i+1}-${i+2}`,
        style: 1
      });
    }
    
    // Split into rows of 5
    const rows = [];
    for (let i = 0; i < streets.length; i += 5) {
      rows.push({
        type: 1,
        components: streets.slice(i, i + 5)
      });
    }
    return rows;
  }

  // LINE BET - 11 buttons (3 rows)
  if (betType === 'line') {
    const lines = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31];
    const lineButtons = lines.map(start => ({
      type: 2,
      custom_id: `roulette_select_line_${start}`,
      label: `${start}-${start+5}`,
      style: 1
    }));
    
    // Split into rows of 5
    const rows = [];
    for (let i = 0; i < lineButtons.length; i += 5) {
      rows.push({
        type: 1,
        components: lineButtons.slice(i, i + 5)
      });
    }
    return rows;
  }

  // CORNER BET - 22 buttons (5 rows)
  if (betType === 'corner') {
    const corners = [];
    
    // Generate all valid corner bets
    // Corners are formed by 4 numbers in a square on the roulette table
    for (let row = 1; row <= 33; row += 3) {
      for (let col = 0; col < 2; col++) {
        const topLeft = row + col;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + 3;
        const bottomRight = bottomLeft + 1;
        
        corners.push({
          type: 2,
          custom_id: `roulette_select_corner_${topLeft}`,
          label: `${topLeft}-${topRight}-${bottomLeft}-${bottomRight}`,
          style: 1
        });
      }
    }
    
    // Split into rows of 5
    const rows = [];
    for (let i = 0; i < corners.length; i += 5) {
      rows.push({
        type: 1,
        components: corners.slice(i, i + 5)
      });
    }
    return rows;
  }

  // Fallback for unknown bet types
  return [];
}

// Helper: Spin the wheel
function getRouletteBoard() {
  return `\`\`\`
 ┌────┬────┬────┐
 │  1 │  2 │  3 │
 │  4 │  5 │  6 │
 │  7 │  8 │  9 │
 │ 10 │ 11 │ 12 │
 │ 13 │ 14 │ 15 │
 │ 16 │ 17 │ 18 │
 │ 19 │ 20 │ 21 │
 │ 22 │ 23 │ 24 │
 │ 25 │ 26 │ 27 │
 │ 28 │ 29 │ 30 │
 │ 31 │ 32 │ 33 │
 │ 34 │ 35 │ 36 │
 └────┴────┴────┘
  [0]      [00]
\`\`\``;
}

// Helper: Spin the wheel
function spinWheel() {
  const numbers = [0, '00', ...Array.from({length: 36}, (_, i) => i + 1)];
  return numbers[Math.floor(Math.random() * numbers.length)];
}

// Helper: Get numbers covered by bet
function getBetNumbers(betType, selection) {
  const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const blacks = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
  
  switch(betType) {
    case 'red': return reds;
    case 'black': return blacks;
    case 'low': return Array.from({length: 18}, (_, i) => i + 1);
    case 'high': return Array.from({length: 18}, (_, i) => i + 19);
    case 'five': return [0, '00', 1, 2, 3];
    case 'single':
      return [selection === '00' ? '00' : parseInt(selection)];
    case 'split':
      return selection.split(',').map(n => parseInt(n.trim()));
    case 'dozen':
      if (selection === '1') return Array.from({length: 12}, (_, i) => i + 1);
      if (selection === '2') return Array.from({length: 12}, (_, i) => i + 13);
      if (selection === '3') return Array.from({length: 12}, (_, i) => i + 25);
      break;
    case 'column':
      if (selection === '1') return [1,4,7,10,13,16,19,22,25,28,31,34];
      if (selection === '2') return [2,5,8,11,14,17,20,23,26,29,32,35];
      if (selection === '3') return [3,6,9,12,15,18,21,24,27,30,33,36];
      break;
    case 'street':
      const start = parseInt(selection);
      return [start, start + 1, start + 2];
    case 'line':
      const lineStart = parseInt(selection);
      return Array.from({length: 6}, (_, i) => lineStart + i);
    case 'corner':
      const topLeft = parseInt(selection);
      return [topLeft, topLeft + 1, topLeft + 3, topLeft + 4];
  }
  return [];
}

// Helper: Get payout multiplier
function getPayout(betType) {
  const payouts = {
    single: 35, split: 17, street: 11, corner: 8,
    five: 6, line: 5, dozen: 2, column: 2,
    low: 1, high: 1, red: 1, black: 1
  };
  return payouts[betType] || 0;
}

// Execute game and determine win/loss
function executeGame(session, userId, betType, selection) {
  const winningNumber = spinWheel();
  const betNumbers = getBetNumbers(betType, selection);
  const isWin = betNumbers.includes(winningNumber);
  const payout = getPayout(betType);

  let response;
  if (isWin) {
    const winAmount = session.bet * payout;
    // create balance logic here
    addBalance(userId, winAmount);

    response = `🎰 **Wheel: ${winningNumber}**\n\n✅ **YOU WIN!**\n${betType.toUpperCase()} (${payout}:1)\nWinnings: ${winAmount} chips`;
  } else {
    // create balance logic here
    addBalance(userId, -session.bet);

    response = `🎰 **Wheel: ${winningNumber}**\n\n❌ **You Lost**\nYour bet: ${betNumbers.join(', ')}\nLost: ${session.bet} chips`;
  }

  sessions.delete(userId);
  
  return {
    type: InteractionResponseType.UPDATE_MESSAGE,
    data: { content: response, components: [] }
  };
}



export async function execute(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const bet = Number(interaction.data.options?.find(o => o.name === 'bet')?.value ?? 0);

  // check if user is in existing roulette game
  if (sessions.has(userId)) {
    sessions.delete(userId);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "You already have a Roulette game in progress... Ending past session!", flags: 64 }
    };
  }

  const check = validateBet(userId, bet);
  if (!check.ok) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: check.error, flags: 64 }
    };
  }

  // if user has placed a valid bet than set the session
  sessions.set(userId, { bet: bet });
  
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `🎰 Roulette Game\nYour bet: ${bet} chips\n${getRouletteBoard()}\nSelect the type of bet you would like to make!`,
      components: rouletteButtons()
    }
  };
}

export async function interact(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const session = sessions.get(userId);

  if (!session) {
    sessions.delete(userId);
    return {
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: { content: "No active Roulette game!", components: [] }
    };
  }

  const customId = interaction.data.custom_id;

  // ===== STAGE 1: User selected bet TYPE =====
  if (customId.startsWith('roulette_type_')) {
    const betType = customId.replace('roulette_type_', '');
    session.betType = betType;

    // Fixed bets - execute immediately
    const fixedBets = ['red', 'black', 'low', 'high', 'five'];
    if (fixedBets.includes(betType)) {
      return executeGame(session, userId, betType, null);
    }

    // Text input bets - show modal
    if (['single', 'split'].includes(betType)) {
      return {
        type: InteractionResponseType.MODAL,
        data: {
          custom_id: `roulette_modal_${betType}`,
          title: betType === 'single' ? 'Single Number Bet' : 'Split Bet',
          components: [{
            type: 1,
            components: [{
              type: 4, // TEXT_INPUT
              custom_id: 'number_input',
              label: betType === 'single' 
                ? 'Enter number (0, 00, or 1-36)' 
                : 'Enter two adjacent numbers (e.g., 5,8)',
              style: 1,
              required: true,
              placeholder: betType === 'single' ? '17' : '5,8'
            }]
          }]
        }
      };
    }

    // Button-based bets
    sessions.set(userId, session);
    const followUpButtons = getFollowUpButtons(betType);
    
    return {
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content: `🎰 **${betType.toUpperCase()} Bet (${getPayout(betType)}:1)\n${getRouletteBoard()}\n**\nSelect your numbers:`,
        components: followUpButtons
      }
    };
  }

  // ===== STAGE 2: User selected specific numbers (button-based) =====
  if (customId.startsWith('roulette_select_')) {
    const parts = customId.split('_');
    const selection = parts[3]; // Just get the selection (e.g., '1', '5', '17')
    
    // Use the betType already stored in session
    return executeGame(session, userId, session.betType, selection);
  }

  // Fallback
  return {
    type: InteractionResponseType.UPDATE_MESSAGE,
    data: { content: "Unknown action.", components: [] }
  };
}

// ===== MODAL SUBMISSION HANDLER =====
export async function handleModalSubmit(interaction) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const session = sessions.get(userId);

  if (!session) {

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "No active game found!", flags: 64 }
    };
  }

  const betType = interaction.data.custom_id.replace('roulette_modal_', '');
  const input = interaction.data.components[0].components[0].value;

    // Validate single number
    if (betType === 'single') {
    const num = input.trim();
    
    // Special cases
    if (num === '0' || num === '00') {
        return executeGame(session, userId, betType, num);
    }
    
    // Regular numbers 1-36
    const numValue = parseInt(num, 10);
    if (isNaN(numValue) || numValue < 1 || numValue > 36) {
        sessions.delete(userId);
        return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '❌ Invalid! Must be 0, 00, or 1-36.', flags: 64 }
        };
    }
    
    return executeGame(session, userId, betType, num);
    }

    // Validate split
    if (betType === 'split') {
    const numbers = input.split(',').map(n => n.trim());
    if (numbers.length !== 2 || numbers.some(n => isNaN(n))) {
        sessions.delete(userId);
        return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '❌ Invalid! Enter two numbers like "5,8".', flags: 64 }
        };
    }

    const [num1, num2] = numbers.map(Number);
    
    // Check if numbers are in valid range
    if (num1 < 1 || num1 > 36 || num2 < 1 || num2 > 36) {
        sessions.delete(userId);
        return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '❌ Numbers must be between 1-36!', flags: 64 }
        };
    }
    
    // Check horizontal adjacency (same row, difference of 1)
    const row1 = Math.floor((num1 - 1) / 3);
    const row2 = Math.floor((num2 - 1) / 3);
    const horizontallyAdjacent = row1 === row2 && Math.abs(num1 - num2) === 1;
    
    // Check vertical adjacency (difference of 3)
    const verticallyAdjacent = Math.abs(num1 - num2) === 3;
    
    const isAdjacent = horizontallyAdjacent || verticallyAdjacent;
    
    if (!isAdjacent) {
        sessions.delete(userId);
        return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '❌ Numbers must be adjacent on the table!', flags: 64 }
        };
    }

    return executeGame(session, userId, betType, `${num1},${num2}`);
    }
}
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const CARD_WIDTH = 60;
const CARD_HEIGHT = 90;
const X_GAP = 80;
const Y_GAP = 20;

let deck = [];
let tableau = [[], [], [], [], [], [], []];
let foundations = [[], [], [], []]; // One pile per suit
let waste = []; // For cards drawn from deck (optional)
let stock = []; // Remaining deck cards after deal (optional)

let dragging = false;
let dragStart = null;
let draggedCards = [];
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragX = 0;
let dragY = 0;

let gameStartedAt = Date.now();
let score = 0;

// Create and shuffle deck
function createDeck() {
  deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// Deal cards to tableau
function dealCards() {
  let deckIndex = 0;
  for (let col = 0; col < 7; col++) {
    for (let cardCount = 0; cardCount <= col; cardCount++) {
      const faceUp = cardCount === col;
      const card = deck[deckIndex];
      card.faceUp = faceUp;
      tableau[col].push(card);
      deckIndex++;
    }
  }
  stock = deck.slice(deckIndex);
  waste = [];
}

// Draw card rectangle with suit and rank
function drawCard(card, x, y) {
  if (!card.faceUp) {
    ctx.fillStyle = 'gray';
    ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x, y, CARD_WIDTH, CARD_HEIGHT);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('🂠', x + 18, y + 55);
  } else {
    ctx.fillStyle = card.suit === '♥' || card.suit === '♦' ? '#FFEEEE' : 'white';
    ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x, y, CARD_WIDTH, CARD_HEIGHT);
    ctx.fillStyle = card.suit === '♥' || card.suit === '♦' ? 'red' : 'black';
    ctx.font = '20px Arial';
    ctx.fillText(card.rank + card.suit, x + 10, y + 30);
  }
}

// Draw tableau columns
function drawTableau() {
  for (let col = 0; col < 7; col++) {
    let x = 10 + col * X_GAP;
    let y = 10;
    for (const card of tableau[col]) {
      drawCard(card, x, y);
      y += Y_GAP;
    }
  }
}

// Draw foundations
function drawFoundations() {
  for (let i = 0; i < 4; i++) {
    let x = 600 + i * (CARD_WIDTH + 10);
    let y = 10;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x, y, CARD_WIDTH, CARD_HEIGHT);
    if (foundations[i].length > 0) {
      let topCard = foundations[i][foundations[i].length - 1];
      drawCard(topCard, x, y);
    } else {
      // Draw empty slot
      ctx.fillStyle = '#EEE';
      ctx.fillRect(x + 5, y + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10);
    }
  }
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTableau();
  drawFoundations();

  // Draw dragged cards on top if dragging
  if (dragging) {
    let y = dragY;
    for (const card of draggedCards) {
      drawCard(card, dragX, y);
      y += Y_GAP;
    }
  }

  // Draw score and timer
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, 10, 580);
  let elapsed = Math.floor((Date.now() - gameStartedAt) / 1000);
  ctx.fillText(`Time: ${elapsed}s`, 700, 580);
}

// Helpers for game rules
function isRed(suit) {
  return suit === '♥' || suit === '♦';
}

function rankToNumber(rank) {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank);
}

// Check if moving cards to tableau column is valid (alternating color and descending rank)
function canPlaceOnTableau(cardToPlace, destCol) {
  let destPile = tableau[destCol];
  if (destPile.length === 0) {
    return cardToPlace.rank === 'K'; // Only kings on empty spots
  }
  let topCard = destPile[destPile.length - 1];
  return (
    topCard.faceUp &&
    isRed(cardToPlace.suit) !== isRed(topCard.suit) &&
    rankToNumber(cardToPlace.rank) === rankToNumber(topCard.rank) - 1
  );
}

// Check if moving card to foundation pile is valid (same suit ascending rank)
function canPlaceOnFoundation(cardToPlace, foundationIndex) {
  let pile = foundations[foundationIndex];
  if (pile.length === 0) {
    return cardToPlace.rank === 'A';
  }
  let topCard = pile[pile.length - 1];
  return (
    cardToPlace.suit === topCard.suit &&
    rankToNumber(cardToPlace.rank) === rankToNumber(topCard.rank) + 1
  );
}

// Get foundation index for suit
function foundationIndexForSuit(suit) {
  switch (suit) {
    case '♠': return 0;
    case '♥': return 1;
    case '♦': return 2;
    case '♣': return 3;
  }
}

// Find card under mouse in tableau (top card first)
function getCardAtPosition(mx, my) {
  for (let col = 0; col < 7; col++) {
    let x = 10 + col * X_GAP;
    let y = 10;
    const colCards = tableau[col];
    for (let i = colCards.length - 1; i >= 0; i--) {
      let cy = y + i * Y_GAP;
      if (!colCards[i].faceUp) continue;
      if (
        mx >= x &&
        mx <= x + CARD_WIDTH &&
        my >= cy &&
        my <= cy + CARD_HEIGHT
      ) {
        return { col, index: i };
      }
    }
  }
  return null;
}

// Mouse events for drag & drop
canvas.addEventListener('mousedown', (e) => {
  if (dragging) return; // Ignore if already dragging
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const cardPos = getCardAtPosition(mx, my);
  if (cardPos) {
    const { col, index } = cardPos;
    dragging = true;
    dragStart = { col, index };
    draggedCards = tableau[col].slice(index);
    dragOffsetX = mx - (10 + col * X_GAP);
    dragOffsetY = my - (10 + index * Y_GAP);
    dragX = mx - dragOffsetX;
    dragY = my - dragOffsetY;
    tableau[col] = tableau[col].slice(0, index);
    draw();
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  dragX = mx - dragOffsetX;
  dragY = my - dragOffsetY;
  draw();
});

canvas.addEventListener('mouseup', (e) => {
  if (!dragging) return;
  dragging = false;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  let dropped = false;

  // Try to drop on tableau columns first
  for (let col = 0; col < 7; col++) {
    let x = 10 + col * X_GAP;
    if (mx >= x && mx <= x + CARD_WIDTH) {
      // Validate move for entire stack
      if (canPlaceOnTableau(draggedCards[0], col)) {
        tableau[col] = tableau[col].concat(draggedCards);
        dropped = true;
      }
      break;
    }
  }

  // If not dropped on tableau, try foundations if only one card dragged
  if (!dropped && draggedCards.length === 1) {
    for (let i = 0; i < 4; i++) {
      let x = 600 + i * (CARD_WIDTH + 10);
      let y = 10;
      if (
        mx >= x &&
        mx <= x + CARD_WIDTH &&
        my >= y &&
        my <= y + CARD_HEIGHT &&
        canPlaceOnFoundation(draggedCards[0], i)
      ) {
        foundations[i].push(draggedCards[0]);
        dropped = true;
        score += 10;
        break;
      }
    }
  }

  // Return cards to original place if drop invalid
  if (!dropped) {
    tableau[dragStart.col] = tableau[dragStart.col].concat(draggedCards);
  }

  // Flip top card of each tableau column if needed
  for (let col = 0; col < 7; col++) {
    let colCards = tableau[col];
    if (colCards.length > 0) {
      let lastCard = colCards[colCards.length - 1];
      if (!lastCard.faceUp) {
        lastCard.faceUp = true;
        score += 5;
      }
    }
  }

  draggedCards = [];
  draw();
});

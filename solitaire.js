window.onload = () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const CARD_WIDTH = 70;
  const CARD_HEIGHT = 100;

  let cards = [];

  function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let deck = [];

    for (let suit of suits) {
      for (let value of values) {
        deck.push({ suit, value, x: 0, y: 0 });
      }
    }

    return deck;
  }

  function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  function dealCards() {
    cards = createDeck();
    shuffleDeck(cards);

    let x = 20;
    let y = 20;

    for (let i = 0; i < cards.length; i++) {
      cards[i].x = x;
      cards[i].y = y;

      x += 15;
      if (x > canvas.width - CARD_WIDTH) {
        x = 20;
        y += 25;
      }
    }
  }

  function drawCards() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let card of cards) {
      ctx.fillStyle = 'white';
      ctx.fillRect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT);
      ctx.strokeRect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT);

      ctx.fillStyle = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
      ctx.font = '16px Arial';
      ctx.fillText(`${card.value}${card.suit}`, card.x + 10, card.y + 25);
    }
  }

  dealCards();
  drawCards();
};

const createDeck = () => {
  const suits = ['H', 'D', 'C', 'S'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];

  suits.forEach((suit) => {
    values.forEach((value) => {
      deck.push(`${value}${suit}`);
    });
  });

  return deck;
};

const shuffleDeck = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const dealCards = (deck, numPlayers) => {
  const hands = Array(numPlayers).fill().map(() => []);
  for (let i = 0; i < deck.length; i++) {
    hands[i % numPlayers].push(deck[i]);
  }
  return hands;
};

module.exports = {
  createDeck,
  shuffleDeck,
  dealCards,
};

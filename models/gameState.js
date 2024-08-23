const cardUtils = require('../utils/cardUtils');

let gameProperties = {
  players: [],
  deck: [],
  currentTurn: 0,
  tricks: [],
  scores: {},
  waitingRoom: [],
  cards: [],
  pendingPasses: {}
};

//update action
// { prop: 'propName', value: 'propValue', action: 'add/remove/update'}
const updateGameProperties = (updateAction) => {
  // Value will often, perhaps always, be the websocket ref
  const { prop, value, action, message, payload } = updateAction;

  if (prop === 'waiting_room') {
    handleWaitingRoomUpdate(value, action)
  }

  if (prop === 'joinGame') {
    handlePlayerJoin(value, message)
  }

  if (prop === 'cards') {
    if (message === 'set_cards') {
      handleSetCards(value, payload)
    }
  }

  // console.log('gameProperties >>>>>', gameProperties)
}

const handleSetCards = (webSocket, cards) => {
  gameProperties.cards = cards;

  if (gameProperties.players.length !== 4) {
    console.log('add computer players')
    addComputerPlayers(webSocket);
  }
}

const handleDealCards = (webSocket) => {
  const { createDeck, shuffleDeck, dealCards } = cardUtils
  const deck = createDeck();
  const shuffled = shuffleDeck(deck);
  const hands = dealCards(shuffled, 4);

  const playerHands = hands.map((hand, i) => {
    return {
      playerId: i + 1,
      cards: hands[i]
    }
  })

  updateGameProperties({ prop: 'cards', value: webSocket, message: 'set_cards', payload: playerHands })
};

const initializeGame = (webSocket) => {
  handleDealCards(webSocket);
  sendCardsDealt();
}

const sendCardsDealt = () => {
  const { players } = gameProperties;

  players.forEach(player => {
    const { ref: webSocket } = player;

    const requestBody = {
      message: 'cardsDealt',
      players: [
        ...players.map(player => {
          return {
            name: player.name,
            id: player.id,
            cards: player.ref === webSocket ? gameProperties.cards.find(hand => hand.playerId === player.id) : null,
            remainingCards: 13
          }
        })
      ]
    };

    if (webSocket) {
      webSocket.send(JSON.stringify(requestBody));
      sendPlayerAddedEvent(webSocket);
    }

  })
}

const handleWaitingRoomUpdate = (value, action) => {
  if (action === 'add') {
    gameProperties.waitingRoom.push({
      ref: value,
      cards: []
    })
  }

  if (action === 'remove') {
    gameProperties.waitingRoom = gameProperties.waitingRoom.filter(playerInRoom => playerInRoom.ref !== value);
  }
}

const isPlayerInGame = (webSocket) => {
  return !!gameProperties.players.find(player => player.ref === webSocket);
}

const handlePlayerJoin = (webSocket, message) => {
  const playerIsInGame = isPlayerInGame(webSocket);

  if (!playerIsInGame) {
    const playerInWaitingRoom = gameProperties.waitingRoom.find(player => player.ref === webSocket);
    const currentPlayerIndex = gameProperties.players.length + 1;

    gameProperties.players.push({
      ...playerInWaitingRoom,
      ref: webSocket,
      name: message.playerName,
      id: currentPlayerIndex
    });

    gameProperties.waitingRoom = gameProperties.waitingRoom.filter(player => player.ref !== webSocket);

    gameProperties.players.forEach(player => {
      sendPlayerAddedEvent(player.ref)
    })
  } else {
    console.log('player is in game')
  }
}

const addComputerPlayers = (webSocket) => {
  for (let i = 0; gameProperties.players.length < 4; i++) {
    if (!gameProperties.players[i]) {
      gameProperties.players.push({
        ref: null,
        name: 'computer',
        id: i + 1
      })
    }
  };
};

const sendPlayerAddedEvent = (webSocket) => {
  webSocket.send(JSON.stringify({
    message: 'playerJoined',
    players: [
      ...gameProperties.players.map(player => {
        const isCurrentPlayer = player.ref === webSocket;
        const playerCards = isCurrentPlayer ? gameProperties.cards.find(hand => hand.playerId === player.id) : null;
        return {
          name: player.name,
          id: player.id,
          cards: playerCards,
          remainingCards: 13
        }
      })
    ]
  }));
};

const selectCardsToPass = (webSocket, cards) => {
  const player = gameProperties.players.find(player => player.ref === webSocket);

  if (!player) {
    console.log("Player not found.");
    return;
  }

  // Store the selected cards in pendingPasses
  gameProperties.pendingPasses[player.id] = cards;

  console.log(`Player ${player.name} selected ${cards.join(", ")} to pass.`);

  // After the player selects cards, check if computer players need to select
  handleComputerSelections();

  // Check if all players (human and computer) have selected their cards
  if (Object.keys(gameProperties.pendingPasses).length === gameProperties.players.length) {
    processAllPasses();
  }
};

const getCardValue = (card) => {
  const value = card.slice(0, -1); // Get the value part of the card (e.g., '2', 'J', 'K')
  const cardValueMap = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return cardValueMap[value];
};

const processAllPasses = () => {
  console.log("Processing all card passes...");

  let passes = [];

  // Loop over each player and get their selected cards from pendingPasses
  gameProperties.players.forEach(player => {
    const cardsToPass = gameProperties.pendingPasses[player.id];
    passes.push({ from: player, cards: cardsToPass });
  });

  // Perform the pass action for each player (cyclically)
  passes.forEach((pass, i) => {
    const targetPlayer = gameProperties.players[(i + 1) % gameProperties.players.length];
    const passFromCards = gameProperties.cards.find(c => c.playerId === pass.from.id);
    passCardsBetweenPlayers(passFromCards, targetPlayer, pass.cards);
  });

  // Clear pendingPasses after all cards have been passed
  gameProperties.pendingPasses = {};
};

// Passing multiple cards between players
const passCardsBetweenPlayers = (fromPlayer, toPlayer, cards) => {
  // Remove cards from the fromPlayer's hand
  cards.forEach(card => {
    const cardIndex = fromPlayer.cards.indexOf(card);
    if (cardIndex !== -1) {
      fromPlayer.cards.splice(cardIndex, 1);
    }
  });

  // Add the cards to the toPlayer's hand
  const toPlayerCards = gameProperties.cards.find(c => c.playerId === toPlayer.id);
  toPlayerCards.cards.push(...cards);

  console.log(`${cards.join(", ")} passed from ${fromPlayer.name} to ${toPlayer.name}`);
};

const handleComputerSelections = () => {
  // For each computer player (ref === null), select the highest cards to pass
  gameProperties.players.forEach(player => {
    if (player.ref === null && !gameProperties.pendingPasses[player.id]) {
      const cardsToPass = selectHighestCards(player, 3); // Select 3 cards to pass
      gameProperties.pendingPasses[player.id] = cardsToPass;
      console.log(`Computer ${player.name} selected ${cardsToPass.join(", ")} to pass.`);
    }
  });
};

// Logic to select the highest heart cards or highest value cards if no hearts are available
const selectHighestCards = (player, numCardsToPass) => {
  console.log('player', player)
  console.log(gameProperties)
  const playerCards = gameProperties.cards.find(p => p.playerId === player.id).cards;
  const hearts = playerCards.filter(card => card.includes('H')); // Filter out hearts
  const otherCards = playerCards.filter(card => !card.includes('H')); // Non-heart cards

  let selectedCards = [];

  // Select highest heart cards first
  if (hearts.length > 0) {
    const highestHearts = hearts
      .sort((a, b) => getCardValue(b) - getCardValue(a)) // Sort hearts in descending order
      .slice(0, numCardsToPass); // Take the top N heart cards
    selectedCards.push(...highestHearts);
  }

  // If not enough hearts, fill the rest with highest non-heart cards
  if (selectedCards.length < numCardsToPass) {
    const highestOtherCards = otherCards
      .sort((a, b) => getCardValue(b) - getCardValue(a)) // Sort non-hearts in descending order
      .slice(0, numCardsToPass - selectedCards.length); // Take the top N non-heart cards
    selectedCards.push(...highestOtherCards);
  }

  return selectedCards;
};
module.exports = {
  gameProperties,
  updateGameProperties,
  sendPlayerAddedEvent,
  handleDealCards,
  initializeGame,
  selectCardsToPass
};

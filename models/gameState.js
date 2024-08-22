const cardUtils = require('../utils/cardUtils');

let gameProperties = {
  players: [],
  deck: [],
  currentTurn: 0,
  tricks: [],
  scores: {},
  waitingRoom: [],
  cards: []
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
      console.log('set Cards')
      handleSetCards(value, payload)
    }
  }

  // console.log('gameProperties >>>>>', gameProperties)
}

const handleSetCards = (webSocket, cards) => {
  gameProperties.cards = cards;
  console.log('as;dlfkjas;ldkfj')
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
            cards: player.ref === webSocket ? gameProperties.cards.find(hand => hand.playerId === player.id) : null
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
        return {
          name: player.name,
          id: player.id,
          cards: player.ref === webSocket ? gameProperties.cards.find(hand => hand.playerId === player.id) : null
        }
      })
    ]
  }));
};

module.exports = {
  gameProperties,
  updateGameProperties,
  sendPlayerAddedEvent,
  handleDealCards,
  initializeGame
};

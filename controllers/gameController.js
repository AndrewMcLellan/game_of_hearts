const gameState = require('../models/gameState');
const cardUtils = require('../utils/cardUtils');

const { gameProperties, updateGameProperties, initializeGame } = gameState;

const handleGameAction = (webSocket, message) => {
  switch (message.action) {
    case 'passCard':
      console.log('card passed by player');
      //add logic here
      break;
    case 'playCard':
      console.log('player played card');
      break;
    case 'joinGame':
      updateGameProperties({ prop: message.action, value: webSocket, message: message });
      break;
    case 'dealCards':
      initializeGame(webSocket)
      break;
  }
};

const handlePlayerDisconnect = (webSocket) => {
  console.log('handle player disconnect');

  // if 'playerIsInGame' then they are no longer in the waiting_room
  const playerIsInGame = !!gameProperties.players.find(player => player.ref === webSocket);
  const updateProp = playerIsInGame ? 'players' : 'waiting_room';

  updateGameProperties({ prop: updateProp, value: webSocket, action: 'remove' });
};

module.exports = {
  handleGameAction,
  handlePlayerDisconnect
}
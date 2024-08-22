const { updateGameProperties } = require('../models/gameState');
const gameController = require('./gameController');

const handleConnection = (webSocket) => {
  console.log('new player connected');

  updateGameProperties({ prop: 'waiting_room', value: webSocket, action: 'add' });

  webSocket.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    gameController.handleGameAction(webSocket, parsedMessage);
  });

  webSocket.on('close', () => {
    console.log('player disconnected');
    gameController.handlePlayerDisconnect(webSocket);
  });
};

module.exports = {
  handleConnection
}
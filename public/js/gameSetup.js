class GameSetup {
  constructor(webSocket) {
    this.webSocket = webSocket;
    this.initSetup();
    this.joinRequest = {
      playerName: "",
      action: "joinGame"
    };
    this.dealRequest = {
      action: 'dealCards'
    }
  }

  initSetup() {
    this.setupInputField();
    this.setupButton();
    this.setupMessageNet();
    this.setupHandlePlayerIsReady();
  }

  setupMessageNet = () => {
    this.webSocket.onmessage = (e) => {
      this.handleIncomingMessage(JSON.parse(e.data))
    }
  }

  handleIncomingMessage = (messageData) => {
    if (messageData.message === 'playerJoined') {
      this.handlePlayerJoin(messageData)
    }

    if (messageData.message === 'cardsDealt') {
      this.renderCards(messageData);
    }
  }

  setupInputField = () => {
    const target = document.getElementById('name-input');
    const button = document.getElementById('join-button');

    target.addEventListener('input', (e) => {
      this.updateJoinRequest({
        playerName: e.target.value,
      })

      if (!this.joinRequest.playerName) {
        button.disabled = true
      } else if (button.disabled && this.joinRequest.playerName) {
        button.disabled = false
      }
    })
  }

  updateJoinRequest = (updateObject) => {
    this.joinRequest = {
      ...this.joinRequest,
      ...updateObject
    }
  }

  setupButton = () => {
    const button = document.getElementById('join-button');

    button.addEventListener('click', () => {
      this.webSocket.send(JSON.stringify(this.joinRequest));
    });
  }

  setupHandlePlayerIsReady = () => {
    const dealButton = document.getElementById('deal-button');

    dealButton.addEventListener('click', (e) => {
      this.webSocket.send(JSON.stringify(this.dealRequest));
    })
  }

  renderCards = (messageData) => {
    const { players } = messageData;
    const player = players.find(p => !!p.cards);
    const currentPlayerPrefix = `player-${player.id}`
    const currentElement = document.getElementById(currentPlayerPrefix);

    // The server sends an array of all players, but will only send cards for the current player.
    if (player.cards) {
      const cardsWrapper = document.getElementById(`player-${player.id}-cards`);

      player.cards.cards.forEach(card => {
        // const cardEl = document.createElement('div');
        const cardImg = document.createElement('img');
        const cardButton = document.createElement('button');

        cardImg.src = `./assets/images/${cardImageMapping[card]}`
        cardImg.width = '100'


        cardButton.appendChild(cardImg);

        cardsWrapper.appendChild(cardButton);
      })

      currentElement.appendChild(cardsWrapper);
    }
  }

  handlePlayerJoin = (messageData) => {
    const { players } = messageData;

    players.forEach(player => {
      const currentPlayerPrefix = `player-${player.id}`
      const currentPlayerLabel = document.getElementById(`${currentPlayerPrefix}-label`)
      const currentPlayerIsCurrentClient = this.joinRequest.playerName === player.name;
      const currentPlayerIdentifier = `${currentPlayerIsCurrentClient ? '(you)' : ''}`;

      currentPlayerLabel.innerText = `player ${player.id} - ${player.name} ${currentPlayerIdentifier}`;
    })
  }
}

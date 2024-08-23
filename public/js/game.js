class HeartsGame {
  constructor({
    webSocket
  }) {
    const game = new GameSetup(webSocket)
    this.webSocket = webSocket;
    this.passButton = document.getElementById('pass-cards-button');
    this.init();
    this.cardsToPass = [];
  }

  init = () => {
    this.setupListeners();
  }

  handleSendMessage = (messageBody) => {
    this.webSocket.send(JSON.stringify(messageBody));
  }

  setupListeners = () => {
    this.setupCardsDealtListener();
    this.setupPassClickListener();
  }

  setupCardsDealtListener = () => {
    document.addEventListener('cards-dealt', (e) => {
      const { detail } = e;
      const { players } = detail;
      this.playerId = players.find(p => !!p.cards.cards.length).id;
      this.setupCardClickListeners()
    })
  }
  setupCardClickListeners = () => {
    const allPlayerCards = document.getElementsByClassName('current-player-card');

    for (let i = 0; i < allPlayerCards.length; i++) {
      allPlayerCards[i].addEventListener('click', (e) => {
        this.handlePassChoices(e, allPlayerCards[i]);
      })
    }
  }

  setupPassClickListener = () => {
    this.passButton.addEventListener('click', () => {
      const messageBody = {
        action: 'passCards',
        data: {
          cards: this.cardsToPass,
          playerId: this.playerId
        }
      };

      this.handleSendMessage(messageBody);
    }
    )
  }
  handlePassChoices = (e, cardEl) => {
    if (!this.cardsToPass.includes(e.currentTarget.value)) {
      console.log(e)
      console.log(e.currentTarget)
      this.cardsToPass.push(e.currentTarget.value);
      cardEl.style.top = '-20px';
    } else {
      this.cardsToPass = this.cardsToPass.filter(c => c !== e.currentTarget.value);
      cardEl.style.top = '0px';
    }

    if (this.cardsToPass.length === 3) {
      this.passButton.disabled = false;
    }
  }
}


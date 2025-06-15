import { Game, GameEvent } from './services/game';
import { Player } from './services/player';
import { StandardUNORules, QuickUNORules } from './services/gameRules';
import { StandardUNODeckFactory, SmallUNODeckFactory } from './services/deck';
import { Card, CardColor, CardType, WildCard } from './services/cards';
import './styles.css';

// UI Controller class to handle the interaction between the UI and the game logic
class UnoGameUI {
    private game: Game | null = null;
    private humanPlayer: Player;
    private opponents: Player[] = [];
    private selectedCard: Card | null = null;
    private selectedColor: CardColor | null = null;

    constructor() {
        this.humanPlayer = new Player('You');
        this.setupEventListeners();
    }

    // Initialize the game
    private initGame(gameType: 'standard' | 'quick'): void {
        // Create opponents
        this.opponents = [
            new Player('Computer 1'),
            new Player('Computer 2'),
            new Player('Computer 3')
        ];

        // Create the game with the selected rules and deck
        if (gameType === 'standard') {
            this.game = new Game(
                [this.humanPlayer, ...this.opponents],
                new StandardUNORules(),
                new StandardUNODeckFactory()
            );
        } else {
            this.game = new Game(
                [this.humanPlayer, ...this.opponents],
                new QuickUNORules(),
                new SmallUNODeckFactory()
            );
        }

        // Add event listeners to the game
        this.game.addEventListener(this.handleGameEvent.bind(this));
    }

    // Set up event listeners for UI elements
    private setupEventListeners(): void {
        // Start game button
        const startGameButton = document.getElementById('start-game');
        if (startGameButton) {
            startGameButton.addEventListener('click', () => {
                const gameTypeSelect = document.getElementById('game-type') as HTMLSelectElement;
                const gameType = gameTypeSelect.value as 'standard' | 'quick';
                this.startNewGame(gameType);
            });
        }

        // Draw card button
        const drawCardButton = document.getElementById('draw-card');
        if (drawCardButton) {
            drawCardButton.addEventListener('click', () => {
                this.drawCard();
            });
        }

        // Call UNO button
        const callUnoButton = document.getElementById('call-uno');
        if (callUnoButton) {
            callUnoButton.addEventListener('click', () => {
                this.callUno();
            });
        }
    }

    // Start a new game
    private startNewGame(gameType: 'standard' | 'quick'): void {
        // Clear the UI
        this.clearUI();

        // Clear the human player's hand
        this.humanPlayer.clearHand();

        // Initialize the game
        this.initGame(gameType);

        // Start the game
        if (this.game) {
            this.game.start();
        }

        // Enable the draw card button
        const drawCardButton = document.getElementById('draw-card') as HTMLButtonElement;
        if (drawCardButton) {
            drawCardButton.disabled = false;
        }
    }

    // Handle game events
    private handleGameEvent(event: GameEvent, data: any): void {
        // Log the event
        this.logEvent(event, data);

        // Update the UI based on the event
        switch (event) {
            case GameEvent.GAME_START:
                this.updateGameInfo();
                this.renderOpponents();
                this.renderPlayerHand();
                this.renderTopCard(data.topCard);
                break;

            case GameEvent.TURN_START:
                this.updateGameInfo();
                this.enablePlayerActions(data.player === this.humanPlayer);

                // Handle computer player turns automatically
                if (data.player !== this.humanPlayer && this.game) {
                    // Add a small delay to make the computer's move visible
                    setTimeout(() => {
                        this.makeComputerMove(data.player);
                    }, 1000);
                }
                break;

            case GameEvent.CARD_PLAYED:
                this.renderTopCard(data.card);
                this.renderPlayerHand();
                this.renderOpponents();
                break;

            case GameEvent.CARD_DRAWN:
                this.renderPlayerHand();
                break;

            case GameEvent.DIRECTION_CHANGE:
                this.updateGameInfo();
                break;

            case GameEvent.GAME_END:
                this.handleGameEnd(data.winner, data.score);
                break;
        }
    }

    // Update the game information display
    private updateGameInfo(): void {
        if (!this.game) return;

        const currentPlayerElement = document.getElementById('current-player');
        const directionElement = document.getElementById('game-direction');
        const gameStatusElement = document.getElementById('game-status');

        if (currentPlayerElement) {
            const currentPlayer = this.game.getCurrentPlayer();
            currentPlayerElement.textContent = `Current Player: ${currentPlayer.getName()}`;
        }

        if (directionElement) {
            const direction = this.game.direction === 1 ? 'Clockwise' : 'Counter-Clockwise';
            directionElement.textContent = `Direction: ${direction}`;
        }

        if (gameStatusElement) {
            gameStatusElement.textContent = 'Game Status: In Progress';
        }
    }

    // Render the opponents' hands
    private renderOpponents(): void {
        const opponentsContainer = document.querySelector('.opponents-container');
        if (!opponentsContainer || !this.game) return;

        // Clear the container
        opponentsContainer.innerHTML = '';

        // Render each opponent
        this.opponents.forEach(opponent => {
            const opponentElement = document.createElement('div');
            opponentElement.className = 'opponent';

            const nameElement = document.createElement('div');
            nameElement.className = 'opponent-name';
            nameElement.textContent = opponent.getName();
            opponentElement.appendChild(nameElement);

            const cardsElement = document.createElement('div');
            cardsElement.className = 'opponent-cards';

            // Create card backs for each card in the opponent's hand
            const cardCount = opponent.getCardCount();
            for (let i = 0; i < cardCount; i++) {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.style.backgroundColor = '#2980b9';
                cardElement.style.marginLeft = i > 0 ? '-50px' : '0';
                cardsElement.appendChild(cardElement);
            }

            opponentElement.appendChild(cardsElement);
            opponentsContainer.appendChild(opponentElement);
        });
    }

    // Render the player's hand
    private renderPlayerHand(): void {
        const playerHandElement = document.getElementById('player-hand');
        if (!playerHandElement || !this.game) return;

        // Clear the container
        playerHandElement.innerHTML = '';

        // Get the player's hand
        const hand = this.humanPlayer.getHand();

        // Render each card
        hand.forEach(card => {
            const cardElement = this.createCardElement(card);

            // Add click event to the card
            cardElement.addEventListener('click', () => {
                this.handleCardClick(card);
            });

            playerHandElement.appendChild(cardElement);
        });

        // Enable/disable the Call UNO button
        const callUnoButton = document.getElementById('call-uno') as HTMLButtonElement;
        if (callUnoButton) {
            callUnoButton.disabled = hand.length !== 1;
        }
    }

    // Render the top card
    private renderTopCard(card: Card): void {
        const discardPileElement = document.getElementById('discard-pile');
        if (!discardPileElement || !card) return;

        // Clear the container
        discardPileElement.innerHTML = '';

        // Create the card element
        const cardElement = this.createCardElement(card);
        discardPileElement.appendChild(cardElement);
    }

    // Create a card element
    private createCardElement(card: Card): HTMLElement {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';

        // Add color class
        switch (card.getColor()) {
            case CardColor.RED:
                cardElement.classList.add('card-red');
                break;
            case CardColor.BLUE:
                cardElement.classList.add('card-blue');
                break;
            case CardColor.GREEN:
                cardElement.classList.add('card-green');
                break;
            case CardColor.YELLOW:
                cardElement.classList.add('card-yellow');
                break;
            case CardColor.WILD:
                cardElement.classList.add('card-wild');
                break;
        }

        // Add card value
        const valueElement = document.createElement('div');
        valueElement.className = 'card-value';
        valueElement.textContent = card.getValue();
        cardElement.appendChild(valueElement);

        return cardElement;
    }

    // Handle card click
    private handleCardClick(card: Card): void {
        if (!this.game) return;

        const topCard = this.game.getTopCard();
        if (!topCard) return;

        // Check if it's the player's turn
        if (this.game.getCurrentPlayer() !== this.humanPlayer) {
            this.logEvent('info', { message: "It's not your turn!" });
            return;
        }

        // Check if the card can be played
        if (!card.canPlayOn(topCard)) {
            this.logEvent('info', { message: "You can't play this card!" });
            return;
        }

        // If it's a wild card, show color selection
        if (card instanceof WildCard) {
            this.selectedCard = card;
            this.showColorSelection();
        } else {
            // Play the card
            this.playCard(card);
        }
    }

    // Show color selection for wild cards
    private showColorSelection(): void {
        // Create a modal for color selection
        const modal = document.createElement('div');
        modal.className = 'color-selection-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';

        // Create the color selection container
        const container = document.createElement('div');
        container.style.backgroundColor = 'white';
        container.style.padding = '20px';
        container.style.borderRadius = '10px';
        container.style.textAlign = 'center';

        // Add title
        const title = document.createElement('h2');
        title.textContent = 'Select a color';
        container.appendChild(title);

        // Add color options
        const colors = [
            { name: 'Red', value: CardColor.RED, bgColor: '#e74c3c' },
            { name: 'Blue', value: CardColor.BLUE, bgColor: '#3498db' },
            { name: 'Green', value: CardColor.GREEN, bgColor: '#2ecc71' },
            { name: 'Yellow', value: CardColor.YELLOW, bgColor: '#f1c40f' }
        ];

        const colorContainer = document.createElement('div');
        colorContainer.style.display = 'flex';
        colorContainer.style.justifyContent = 'center';
        colorContainer.style.gap = '10px';
        colorContainer.style.marginTop = '20px';

        colors.forEach(color => {
            const colorButton = document.createElement('button');
            colorButton.style.width = '50px';
            colorButton.style.height = '50px';
            colorButton.style.backgroundColor = color.bgColor;
            colorButton.style.border = 'none';
            colorButton.style.borderRadius = '5px';
            colorButton.style.cursor = 'pointer';

            colorButton.addEventListener('click', () => {
                this.selectedColor = color.value;
                document.body.removeChild(modal);

                if (this.selectedCard && this.selectedCard instanceof WildCard) {
                    this.selectedCard.setColor(this.selectedColor);
                    this.playCard(this.selectedCard);
                    this.selectedCard = null;
                    this.selectedColor = null;
                }
            });

            colorContainer.appendChild(colorButton);
        });

        container.appendChild(colorContainer);
        modal.appendChild(container);
        document.body.appendChild(modal);
    }

    // Play a card
    private playCard(card: Card): void {
        if (!this.game) return;

        // Play the card
        const success = this.game.playCard(card);

        if (!success) {
            this.logEvent('error', { message: "Failed to play the card!" });
        }
    }

    // Draw a card
    private drawCard(): void {
        if (!this.game) return;

        // Check if it's the player's turn
        if (this.game.getCurrentPlayer() !== this.humanPlayer) {
            this.logEvent('info', { message: "It's not your turn!" });
            return;
        }

        // Draw a card
        const card = this.game.drawCard();

        if (!card) {
            this.logEvent('error', { message: "Failed to draw a card!" });
        }
    }

    // Call UNO
    private callUno(): void {
        if (!this.game) return;

        // Check if the player has UNO
        if (this.humanPlayer.hasUno()) {
            this.logEvent('info', { message: "You called UNO!" });
        } else {
            this.logEvent('info', { message: "You don't have UNO!" });
        }
    }

    // Make a move for a computer player
    private makeComputerMove(player: Player): void {
        if (!this.game) return;

        const topCard = this.game.getTopCard();
        if (!topCard) return;

        // Find a playable card
        const playableCard = player.findPlayableCard(topCard);

        if (playableCard) {
            // If it's a wild card, set a color
            if (playableCard.getColor() === CardColor.WILD) {
                const chosenColor = player.chooseColor();
                if (playableCard instanceof WildCard) {
                    playableCard.setColor(chosenColor);
                }
            }

            // Play the card
            this.game.playCard(playableCard);
        } else {
            // Draw a card if no playable card is found
            const drawnCard = this.game.drawCard();

            // If the drawn card can be played, play it
            if (drawnCard && drawnCard.canPlayOn(topCard)) {
                // If it's a wild card, set a color
                if (drawnCard.getColor() === CardColor.WILD) {
                    const chosenColor = player.chooseColor();
                    if (drawnCard instanceof WildCard) {
                        drawnCard.setColor(chosenColor);
                    }
                }

                // Play the drawn card
                setTimeout(() => {
                    if (this.game) {
                        this.game.playCard(drawnCard);
                    }
                }, 1000);
            }
        }
    }

    // Enable/disable player actions
    private enablePlayerActions(enable: boolean): void {
        const drawCardButton = document.getElementById('draw-card') as HTMLButtonElement;
        if (drawCardButton) {
            drawCardButton.disabled = !enable;
        }
    }

    // Handle game end
    private handleGameEnd(winner: Player, score: number): void {
        // Update game status
        const gameStatusElement = document.getElementById('game-status');
        if (gameStatusElement) {
            gameStatusElement.textContent = `Game Status: Ended - ${winner.getName()} won with a score of ${score}`;
        }

        // Disable player actions
        this.enablePlayerActions(false);

        // Show a message
        alert(`Game Over! ${winner.getName()} won with a score of ${score}`);
    }

    // Log an event to the game log
    private logEvent(event: string, data: any): void {
        const logContainer = document.getElementById('log-container');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';

        let message = '';

        if (event === 'info' || event === 'error') {
            message = data.message;
        } else {
            switch (event) {
                case GameEvent.GAME_START:
                    message = `Game started with ${data.players.length} players. Top card: ${data.topCard.toString()}`;
                    break;

                case GameEvent.TURN_START:
                    message = `${data.player.getName()}'s turn. Top card: ${data.topCard.toString()}`;
                    break;

                case GameEvent.CARD_PLAYED:
                    message = `${data.player.getName()} played ${data.card.toString()}`;
                    break;

                case GameEvent.CARD_DRAWN:
                    if (data.count) {
                        message = `${data.player.getName()} drew ${data.count} cards`;
                    } else {
                        message = `${data.player.getName()} drew a card`;
                    }
                    break;

                case GameEvent.UNO_CALLED:
                    message = `${data.player.getName()} called UNO!`;
                    break;

                case GameEvent.DIRECTION_CHANGE:
                    message = `Direction changed to ${data.direction === 1 ? 'clockwise' : 'counter-clockwise'}`;
                    break;

                case GameEvent.PLAYER_SKIPPED:
                    message = `${data.player.getName()} was skipped`;
                    break;

                case GameEvent.GAME_END:
                    message = `Game ended. ${data.winner.getName()} won with a score of ${data.score}`;
                    break;

                default:
                    message = `Unknown event: ${event}`;
            }
        }

        logEntry.textContent = message;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // Clear the UI
    private clearUI(): void {
        // Clear the opponents container
        const opponentsContainer = document.querySelector('.opponents-container');
        if (opponentsContainer) {
            opponentsContainer.innerHTML = '';
        }

        // Clear the player's hand
        const playerHandElement = document.getElementById('player-hand');
        if (playerHandElement) {
            playerHandElement.innerHTML = '';
        }

        // Clear the discard pile
        const discardPileElement = document.getElementById('discard-pile');
        if (discardPileElement) {
            discardPileElement.innerHTML = '';
        }

        // Clear the game log
        const logContainer = document.getElementById('log-container');
        if (logContainer) {
            logContainer.innerHTML = '';
        }

        // Reset game info
        const currentPlayerElement = document.getElementById('current-player');
        const directionElement = document.getElementById('game-direction');
        const gameStatusElement = document.getElementById('game-status');

        if (currentPlayerElement) {
            currentPlayerElement.textContent = 'Current Player: ';
        }

        if (directionElement) {
            directionElement.textContent = 'Direction: Clockwise';
        }

        if (gameStatusElement) {
            gameStatusElement.textContent = 'Game Status: Not Started';
        }

        // Disable player actions
        this.enablePlayerActions(false);
    }
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UnoGameUI();
});

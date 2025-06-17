import { Game, GameEvent } from './services/game';
import { Player } from './services/player';
import {StandardUNODeckFactory, SmallUNODeckFactory, mostlyWildDeckFactory} from './services/deck';
import { Card, WildCard } from './services/cards';
import { CardColor} from "./types/types";
import { CpuPlayer } from './services/cpuPlayer';
import './styles.css';
import { Logger } from './services/logging';



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

        // Escuchar eventos de log y actualizar el DOM
        window.addEventListener('log-message', (e: any) => {
            const logContainer = document.getElementById('log-container');
            if (logContainer) {
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                logEntry.textContent = e.detail;
                logContainer.appendChild(logEntry);
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        });

        // Escuchar el evento emitido por las cartas Wild cuando se juegan
        window.addEventListener('wild-card-played', (e: any) => { // e debería ser ColorSelectionEvent
            // Solo mostrar modal si el evento es para un jugador humano
            if (e.detail.isHumanPlayer && e.detail.card) {
                this.selectedCard = e.detail.card;
                this.showColorSelection();
            }
        });
    }

    // Initialize the game
    private initGame(gameType: 'standard' | 'quick' | 'wild'): void {
        // Crear oponentes CPU usando la nueva clase
        this.opponents = [
            new CpuPlayer('Computer 1'),
            new CpuPlayer('Computer 2'),
            new CpuPlayer('Computer 3')
        ];

        // Crear el juego solo con los jugadores y la baraja
        if (gameType === 'standard') {
            this.game = new Game(
                [this.humanPlayer, ...this.opponents],
                new StandardUNODeckFactory()
            );
        } else if (gameType === 'quick') {
            this.game = new Game(
                [this.humanPlayer, ...this.opponents],
                new SmallUNODeckFactory()
            );
        } else {
            this.game = new Game(
                [this.humanPlayer, ...this.opponents],
                new mostlyWildDeckFactory(),
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
    private startNewGame(gameType: 'standard' | 'quick' | 'wild'): void {
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
                // La lógica de la CPU ahora es manejada internamente por Game.ts en startTurn
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
            const maxWidth = 250; // ancho máximo del área de cartas del oponente (ajusta según tu diseño)
            const cardWidth = 100; // ancho de cada carta (igual que en CSS)
            const minOverlap = 20; // solapamiento mínimo entre cartas
            for (let i = 0; i < cardCount; i++) {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.style.backgroundColor = '#2980b9';

                // Calcular el margen para que no se desborde
                let overlap = cardWidth - minOverlap;
                if (cardCount > 1) {
                    overlap = Math.max(
                        cardWidth - (maxWidth / (cardCount - 1)),
                        minOverlap
                    );
                }
                cardElement.style.marginLeft = i > 0 ? `-${overlap}px` : '0';

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
        return card.toCardElement()
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

        // Play the card (ahora la carta maneja sus propios eventos)
        this.playCard(card);
    }

    // Show color selection for wild cards
    private showColorSelection(): void {
        const modal = document.getElementById('color-selection-modal');
        if (!modal) return;

        modal.style.display = 'flex';

        const setupColorButton = (id: string, color: CardColor) => {
            const button = document.getElementById(id);
            if (button) {
                const newButton = button.cloneNode(true);
                button.parentNode?.replaceChild(newButton, button);

                newButton.addEventListener('click', () => {
                    modal.style.display = 'none';
                    if (this.selectedCard && this.selectedCard instanceof WildCard) {
                        this.selectedCard.setColor(color);

                        // Actualizar visualmente la carta en el montón de descarte
                        if (this.game && this.game.getTopCard() === this.selectedCard) {
                            this.renderTopCard(this.selectedCard);
                        }
                        Logger.getInstance().log(`${this.humanPlayer.getName()} chose ${color} for the Wild card.`);

                        if (this.game) {
                            this.game.completeWildCardPlay(this.selectedCard);
                        }
                        this.selectedCard = null;
                    }
                });
            }
        };

        setupColorButton('color-red', CardColor.RED);
        setupColorButton('color-blue', CardColor.BLUE);
        setupColorButton('color-green', CardColor.GREEN);
        setupColorButton('color-yellow', CardColor.YELLOW);
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

    // Enable/disable player actions
    private enablePlayerActions(enable: boolean): void {

        const playerHandElement = document.getElementById('player-hand');
        const cardElements = playerHandElement ? Array.from(playerHandElement.children) : [];
        for (const cardElement of cardElements) {
            if (enable) {
                cardElement.classList.remove('div-disabled');
            } else {
                cardElement.classList.add('div-disabled');
            }
        }

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
        Logger.getInstance().log(message);
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
        if (logContainer) logContainer.innerHTML = '';

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



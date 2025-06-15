import { Card, CardColor, WildCard } from './cards';
import { Deck, DeckFactory, StandardUNODeckFactory } from './deck';
import { Player } from './player';
import { Direction, GameRules, GameState, StandardUNORules } from './gameRules';

export enum GameEvent {
    GAME_START = 'game_start',
    TURN_START = 'turn_start',
    CARD_PLAYED = 'card_played',
    CARD_DRAWN = 'card_drawn',
    UNO_CALLED = 'uno_called',
    DIRECTION_CHANGE = 'direction_change',
    PLAYER_SKIPPED = 'player_skipped',
    GAME_END = 'game_end'
}

export type GameEventListener = (event: GameEvent, data: any) => void;

export class Game implements GameState {
    players: Player[] = [];
    currentPlayerIndex: number = 0;
    direction: Direction = Direction.CLOCKWISE;
    deck: Deck;
    private topCard: Card | null = null;
    private rules: GameRules;
    private deckFactory: DeckFactory;
    private eventListeners: GameEventListener[] = [];
    private skipFlag: boolean = false;
    private winner: Player | null = null;
    private gameOver: boolean = false;

    constructor(
        players: Player[] = [],
        rules: GameRules = new StandardUNORules(),
        deckFactory: DeckFactory = new StandardUNODeckFactory()
    ) {
        this.players = players;
        this.rules = rules;
        this.deckFactory = deckFactory;
        this.deck = this.deckFactory.createDeck();
    }

    // Event handling
    addEventListener(listener: GameEventListener): void {
        this.eventListeners.push(listener);
    }

    removeEventListener(listener: GameEventListener): void {
        const index = this.eventListeners.indexOf(listener);
        if (index !== -1) {
            this.eventListeners.splice(index, 1);
        }
    }

    private emitEvent(event: GameEvent, data: any = {}): void {
        for (const listener of this.eventListeners) {
            listener(event, data);
        }
    }

    // Game initialization
    start(): void {
        if (this.players.length < 2) {
            throw new Error('At least 2 players are required to start the game');
        }

        // Create a new deck
        this.deck = this.deckFactory.createDeck();

        // Deal initial cards to players
        const initialCardCount = this.rules.initialCardCount();
        for (const player of this.players) {
            const cards = this.deck.drawMultiple(initialCardCount);
            player.addCards(cards);
        }

        // Draw the first card to start the discard pile
        let firstCard = this.deck.draw();

        // If the first card is a wild card, we need to set a color
        if (firstCard instanceof WildCard) {
            // For the first card, we'll just set a random color
            const colors = [CardColor.RED, CardColor.BLUE, CardColor.GREEN, CardColor.YELLOW];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            firstCard.setColor(randomColor);
        }

        this.topCard = firstCard;

        // Set the current player to the first player
        this.currentPlayerIndex = 0;

        // Emit game start event
        this.emitEvent(GameEvent.GAME_START, {
            players: this.players,
            topCard: this.topCard
        });

        // Start the first turn
        this.startTurn();
    }

    // Turn management
    private startTurn(): void {
        if (this.gameOver) {
            return;
        }

        const currentPlayer = this.getCurrentPlayer();

        this.emitEvent(GameEvent.TURN_START, {
            player: currentPlayer,
            topCard: this.topCard
        });
    }

    // Player actions
    playCard(card: Card): boolean {
        if (this.gameOver) {
            return false;
        }

        const currentPlayer = this.getCurrentPlayer();

        // Check if the card can be played
        if (!this.topCard || !this.rules.canPlayCard(card, this.topCard, currentPlayer)) {
            return false;
        }

        // Remove the card from the player's hand
        const playedCard = currentPlayer.playCard(card);
        if (!playedCard) {
            return false; // Player doesn't have the card
        }

        // Apply the card's effect
        this.rules.handleCardPlay(playedCard, currentPlayer, this);

        // Update the top card
        this.deck.discard(playedCard);
        this.topCard = playedCard;

        // Emit card played event
        this.emitEvent(GameEvent.CARD_PLAYED, {
            player: currentPlayer,
            card: playedCard
        });

        // Check if the player has won
        if (this.checkWinCondition()) {
            return true;
        }

        // Check if the player has UNO
        if (currentPlayer.hasUno()) {
            this.emitEvent(GameEvent.UNO_CALLED, {
                player: currentPlayer
            });
        }

        // Move to the next player's turn
        this.nextTurn();

        return true;
    }

    drawCard(): Card | null {
        if (this.gameOver) {
            return null;
        }

        const currentPlayer = this.getCurrentPlayer();
        const card = this.deck.draw();

        if (card) {
            currentPlayer.addCard(card);

            this.emitEvent(GameEvent.CARD_DRAWN, {
                player: currentPlayer,
                card: card
            });

            // If the drawn card can be played, the player can choose to play it
            // Otherwise, the turn passes to the next player
            if (!card.canPlayOn(this.topCard!)) {
                this.nextTurn();
            }

            return card;
        }

        return null;
    }

    // GameState interface implementation
    skipNextPlayer(): void {
        this.skipFlag = true;
        this.emitEvent(GameEvent.PLAYER_SKIPPED, {
            player: this.getNextPlayer()
        });
    }

    reverseDirection(): void {
        this.direction = this.direction === Direction.CLOCKWISE 
            ? Direction.COUNTER_CLOCKWISE 
            : Direction.CLOCKWISE;

        this.emitEvent(GameEvent.DIRECTION_CHANGE, {
            direction: this.direction
        });
    }

    nextPlayerDraws(count: number): void {
        const nextPlayer = this.getNextPlayer();
        const cards = this.deck.drawMultiple(count);
        nextPlayer.addCards(cards);

        this.emitEvent(GameEvent.CARD_DRAWN, {
            player: nextPlayer,
            cards: cards,
            count: count
        });
    }

    getCurrentPlayer(): Player {
        return this.players[this.currentPlayerIndex];
    }

    getNextPlayer(): Player {
        const nextIndex = this.rules.getNextPlayerIndex(
            this.currentPlayerIndex,
            this.players.length,
            this.direction
        );
        return this.players[nextIndex];
    }

    getTopCard(): Card | null {
        return this.topCard;
    }

    // Move to the next player's turn
    private nextTurn(): void {
        // Calculate the next player index
        let nextIndex = this.rules.getNextPlayerIndex(
            this.currentPlayerIndex,
            this.players.length,
            this.direction
        );

        // If the skip flag is set, skip the next player
        if (this.skipFlag) {
            nextIndex = this.rules.getNextPlayerIndex(
                nextIndex,
                this.players.length,
                this.direction
            );
            this.skipFlag = false;
        }

        this.currentPlayerIndex = nextIndex;
        this.startTurn();
    }

    // Check if a player has won
    private checkWinCondition(): boolean {
        const winner = this.rules.checkWinCondition(this.players);

        if (winner) {
            this.winner = winner;
            this.gameOver = true;

            const score = this.rules.calculateScore(winner, this.players);

            this.emitEvent(GameEvent.GAME_END, {
                winner: winner,
                score: score
            });

            return true;
        }

        return false;
    }

    // Get the current game state
    getGameState(): {
        players: Player[];
        currentPlayerIndex: number;
        direction: Direction;
        topCard: Card | null;
        winner: Player | null;
        gameOver: boolean;
    } {
        return {
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            direction: this.direction,
            topCard: this.topCard,
            winner: this.winner,
            gameOver: this.gameOver
        };
    }

    // Add a player to the game
    addPlayer(player: Player): void {
        if (this.gameOver) {
            throw new Error('Cannot add player after game has ended');
        }

        this.players.push(player);
    }

    // Reset the game to start a new round
    reset(): void {
        this.deck = this.deckFactory.createDeck();
        this.topCard = null;
        this.currentPlayerIndex = 0;
        this.direction = Direction.CLOCKWISE;
        this.skipFlag = false;
        this.winner = null;
        this.gameOver = false;

        // Clear players' hands
        for (const player of this.players) {
            player.clearHand();
        }
    }
}

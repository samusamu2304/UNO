import { Card, CardColor, WildCard } from './cards';
import { Deck } from './deck';
import { Player } from './player';

export interface GameRules {
    // Initial setup
    initialCardCount(): number;
    
    // Card playing rules
    canPlayCard(card: Card, topCard: Card, player: Player): boolean;
    handleCardPlay(card: Card, player: Player, game: GameState): void;
    
    // Turn management
    getNextPlayerIndex(currentPlayerIndex: number, playerCount: number, direction: Direction): number;
    
    // Win conditions
    checkWinCondition(players: Player[]): Player | null;
    
    // Scoring
    calculateScore(winner: Player, players: Player[]): number;
}

export enum Direction {
    CLOCKWISE = 1,
    COUNTER_CLOCKWISE = -1
}

export interface GameState {
    players: Player[];
    currentPlayerIndex: number;
    direction: Direction;
    deck: Deck;
    skipNextPlayer(): void;
    reverseDirection(): void;
    nextPlayerDraws(count: number): void;
    getCurrentPlayer(): Player;
    getNextPlayer(): Player;
}

// Standard UNO rules implementation
export class StandardUNORules implements GameRules {
    initialCardCount(): number {
        return 7; // Standard UNO starts with 7 cards per player
    }
    
    canPlayCard(card: Card, topCard: Card, player: Player): boolean {
        return card.canPlayOn(topCard);
    }
    
    handleCardPlay(card: Card, player: Player, game: GameState): void {
        // Apply the card's effect
        card.playEffect(game);
        
        // For wild cards, we need to set the color
        if (card instanceof WildCard) {
            const chosenColor = player.chooseColor();
            card.setColor(chosenColor);
        }
    }
    
    getNextPlayerIndex(currentPlayerIndex: number, playerCount: number, direction: Direction): number {
        return (currentPlayerIndex + direction + playerCount) % playerCount;
    }
    
    checkWinCondition(players: Player[]): Player | null {
        for (const player of players) {
            if (player.hasWon()) {
                return player;
            }
        }
        return null;
    }
    
    calculateScore(winner: Player, players: Player[]): number {
        let score = 0;
        for (const player of players) {
            if (player !== winner) {
                score += player.calculateHandScore();
            }
        }
        return score;
    }
}

// Example of a custom rule set: Quick UNO
export class QuickUNORules implements GameRules {
    initialCardCount(): number {
        return 5; // Start with fewer cards for a quicker game
    }
    
    canPlayCard(card: Card, topCard: Card, player: Player): boolean {
        return card.canPlayOn(topCard);
    }
    
    handleCardPlay(card: Card, player: Player, game: GameState): void {
        // Apply the card's effect
        card.playEffect(game);
        
        // For wild cards, we need to set the color
        if (card instanceof WildCard) {
            const chosenColor = player.chooseColor();
            card.setColor(chosenColor);
        }
    }
    
    getNextPlayerIndex(currentPlayerIndex: number, playerCount: number, direction: Direction): number {
        return (currentPlayerIndex + direction + playerCount) % playerCount;
    }
    
    checkWinCondition(players: Player[]): Player | null {
        for (const player of players) {
            // In Quick UNO, a player wins when they have 2 or fewer cards
            if (player.getCardCount() <= 2) {
                return player;
            }
        }
        return null;
    }
    
    calculateScore(winner: Player, players: Player[]): number {
        // Simplified scoring for Quick UNO
        let score = 0;
        for (const player of players) {
            if (player !== winner) {
                score += player.getCardCount() * 10;
            }
        }
        return score;
    }
}

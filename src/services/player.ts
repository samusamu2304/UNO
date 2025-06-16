import { Card, CardColor } from './cards';
import { PlayerStrategy } from './playerStrategy';

export class Player {
    private hand: Card[] = [];
    private name: string;
    private strategy?: PlayerStrategy;

    constructor(name: string, strategy?: PlayerStrategy) {
        this.name = name;
        this.strategy = strategy;
    }

    getName(): string {
        return this.name;
    }

    getHand(): Card[] {
        // Devuelve la referencia real SOLO para CpuPlayer, copia para el resto
        if (this.constructor.name === 'CpuPlayer') {
            return this.hand;
        }
        return [...this.hand];
    }

    getCardCount(): number {
        return this.hand.length;
    }

    addCard(card: Card): void {
        this.hand.push(card);
    }

    addCards(cards: Card[]): void {
        this.hand.push(...cards);
    }

    // Find a card in the player's hand that can be played on the top card
    findPlayableCard(topCard: Card): Card | null {
        for (const card of this.hand) {
            if (card.canPlayOn(topCard)) {
                return card;
            }
        }
        return null;
    }

    // Play a specific card from the player's hand
    playCard(card: Card): Card | null {
        const index = this.hand.findIndex(c => 
            c.getColor() === card.getColor() && 
            c.getValue() === card.getValue() && 
            c.getType() === card.getType()
        );

        if (index !== -1) {
            return this.hand.splice(index, 1)[0];
        }

        return null;
    }

    // Check if the player has a specific card
    hasCard(card: Card): boolean {
        return this.hand.some(c => 
            c.getColor() === card.getColor() && 
            c.getValue() === card.getValue() && 
            c.getType() === card.getType()
        );
    }

    // Check if the player has any playable card
    hasPlayableCard(topCard: Card): boolean {
        return this.hand.some(card => card.canPlayOn(topCard));
    }

    // Check if the player has UNO (only one card left)
    hasUno(): boolean {
        return this.hand.length === 1;
    }

    // Check if the player has won (no cards left)
    hasWon(): boolean {
        return this.hand.length === 0;
    }

    // Calculate the score of the player's hand (used when a player wins)
    calculateHandScore(): number {
        return this.hand.reduce((score, card) => {
            // This is a simplified scoring system, can be customized
            switch (card.getType()) {
                case 'number':
                    return score + parseInt(card.getValue(), 10);
                case 'skip':
                case 'reverse':
                case 'draw_two':
                    return score + 20;
                case 'wild':
                case 'wild_draw_four':
                    return score + 50;
                default:
                    return score;
            }
        }, 0);
    }

    // For AI players: choose a color when playing a wild card
    chooseColor(): CardColor {
        // Count the colors in the player's hand
        const colorCounts = new Map<CardColor, number>();

        for (const card of this.hand) {
            const color = card.getColor();
            if (color !== CardColor.WILD) {
                colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
            }
        }

        // Find the most common color
        let mostCommonColor = CardColor.RED; // Default
        let maxCount = 0;

        for (const [color, count] of colorCounts.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonColor = color;
            }
        }

        return mostCommonColor;
    }

    // Clear the player's hand
    clearHand(): void {
        this.hand = [];
    }

    setStrategy(strategy: PlayerStrategy) {
        this.strategy = strategy;
    }

    makeMove(game: any) {
        if (this.strategy) {
            this.strategy.makeMove(game, this);
        }
    }
}

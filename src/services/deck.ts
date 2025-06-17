import { CardColor } from '../types/types';
import { Card, NumberCard, SkipCard, ReverseCard, DrawTwoCard, WildCard, WildDrawFourCard } from './cards';

export interface DeckFactory {
    createDeck(): Deck;
}

export class Deck {
    private cards: Card[] = [];
    private discardPile: Card[] = [];
    private topCard: Card | null = null;

    constructor(cards: Card[] = []) {
        this.cards = cards;
    }

    shuffle(): void {
        // Fisher-Yates shuffle algorithm
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw(): Card | null {
        if (this.cards.length === 0) {
            this.reuseDiscardPile();
            if (this.cards.length === 0) {
                return null; // No cards left even after reusing discard pile
            }
        }
        return this.cards.pop() || null;
    }

    drawMultiple(count: number): Card[] {
        const drawnCards: Card[] = [];
        for (let i = 0; i < count; i++) {
            const card = this.draw();
            if (card) {
                drawnCards.push(card);
            } else {
                break; // No more cards to draw
            }
        }
        return drawnCards;
    }

    discard(card: Card): void {
        if (this.topCard) {
            // Si la carta que estaba en el tope era una WildCard, resetea su color elegido.
            if (this.topCard instanceof WildCard) {
                (this.topCard as WildCard).resetColor();
            }
            this.discardPile.push(this.topCard);
        }
        this.topCard = card;
    }

    getTopCard(): Card | null {
        return this.topCard;
    }

    getRemainingCardCount(): number {
        return this.cards.length;
    }

    private reuseDiscardPile(): void {
        if (this.discardPile.length === 0) {
            return;
        }
        
        // Keep the top card separate
        const currentTopCard = this.topCard;
        
        // Move all cards from discard pile to the deck
        this.cards = [...this.discardPile];
        this.discardPile = [];
        
        // Restore the top card
        this.topCard = currentTopCard;
        
        // Shuffle the deck
        this.shuffle();
    }
}

export class StandardUNODeckFactory implements DeckFactory {
    createDeck(): Deck {
        const cards: Card[] = [];
        
        // Add number cards (0-9) for each color
        // One 0 and two 1-9 for each color
        const colors = [CardColor.RED, CardColor.BLUE, CardColor.GREEN, CardColor.YELLOW];
        
        for (const color of colors) {
            // Add one 0 card
            cards.push(new NumberCard(color, '0'));
            
            // Add two of each 1-9 card
            for (let i = 1; i <= 9; i++) {
                cards.push(new NumberCard(color, i.toString()));
                cards.push(new NumberCard(color, i.toString()));
            }
            
            // Add two of each action card (Skip, Reverse, Draw Two)
            for (let i = 0; i < 2; i++) {
                cards.push(new SkipCard(color));
                cards.push(new ReverseCard(color));
                cards.push(new DrawTwoCard(color));
            }
        }
        
        // Add Wild cards and Wild Draw Four cards
        for (let i = 0; i < 4; i++) {
            cards.push(new WildCard());
            cards.push(new WildDrawFourCard());
        }
        
        const deck = new Deck(cards);
        deck.shuffle();
        return deck;
    }
}

// Example of a custom deck factory
export class SmallUNODeckFactory implements DeckFactory {
    createDeck(): Deck {
        const cards: Card[] = [];
        
        // Add number cards (0-5) for each color
        const colors = [CardColor.RED, CardColor.BLUE, CardColor.GREEN, CardColor.YELLOW];
        
        for (const color of colors) {
            // Add one 0 card
            cards.push(new NumberCard(color, '0'));
            
            // Add one of each 1-5 card
            for (let i = 1; i <= 5; i++) {
                cards.push(new NumberCard(color, i.toString()));
            }
            
            // Add one of each action card
            cards.push(new SkipCard(color));
            cards.push(new ReverseCard(color));
            cards.push(new DrawTwoCard(color));
        }
        
        // Add Wild cards and Wild Draw Four cards
        for (let i = 0; i < 2; i++) {
            cards.push(new WildCard());
            cards.push(new WildDrawFourCard());
        }
        
        const deck = new Deck(cards);
        deck.shuffle();
        return deck;
    }
}

export class mostlyWildDeckFactory implements DeckFactory {
    createDeck(): Deck {
        const cards: Card[] = [];

        // Add mostly Wild cards
        for (let i = 0; i < 20; i++) {
            cards.push(new WildCard());
            cards.push(new WildDrawFourCard());
        }

        // Add a few number cards
        const colors = [CardColor.RED, CardColor.BLUE, CardColor.GREEN, CardColor.YELLOW];
        for (const color of colors) {
            for (let i = 0; i < 2; i++) {
                cards.push(new NumberCard(color, '0'));
                cards.push(new NumberCard(color, '1'));
            }
        }

        const deck = new Deck(cards);
        deck.shuffle();
        return deck;
    }
}
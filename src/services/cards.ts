export enum CardColor {
    RED = 'red',
    BLUE = 'blue',
    GREEN = 'green',
    YELLOW = 'yellow',
    WILD = 'wild'
}

export enum CardType {
    NUMBER = 'number',
    SKIP = 'skip',
    REVERSE = 'reverse',
    DRAW_TWO = 'draw_two',
    WILD = 'wild',
    WILD_DRAW_FOUR = 'wild_draw_four'
}

export interface CardEffect {
    apply(game: Game): void;
}

export abstract class Card {
    protected constructor(
        protected readonly color: CardColor,
        protected readonly value: string,
        protected readonly type: CardType
    ) {}

    getColor(): CardColor {
        return this.color;
    }

    getValue(): string {
        return this.value;
    }

    getType(): CardType {
        return this.type;
    }

    abstract canPlayOn(topCard: Card): boolean;
    abstract playEffect(game: Game): void;

    toString(): string {
        return `${this.color} ${this.value}`;
    }
}

export class NumberCard extends Card {
    constructor(color: CardColor, value: string) {
        super(color, value, CardType.NUMBER);
    }

    canPlayOn(topCard: Card): boolean {
        return this.color === topCard.getColor() || 
               this.value === topCard.getValue() ||
               topCard.getColor() === CardColor.WILD;
    }

    playEffect(game: Game): void {
        // Number cards have no special effect
    }
}

export class SkipCard extends Card {
    constructor(color: CardColor) {
        super(color, 'SKIP', CardType.SKIP);
    }

    canPlayOn(topCard: Card): boolean {
        return this.color === topCard.getColor() || 
               topCard.getType() === CardType.SKIP ||
               topCard.getColor() === CardColor.WILD;
    }

    playEffect(game: Game): void {
        game.skipNextPlayer();
    }
}

export class ReverseCard extends Card {
    constructor(color: CardColor) {
        super(color, 'REVERSE', CardType.REVERSE);
    }

    canPlayOn(topCard: Card): boolean {
        return this.color === topCard.getColor() || 
               topCard.getType() === CardType.REVERSE ||
               topCard.getColor() === CardColor.WILD;
    }

    playEffect(game: Game): void {
        game.reverseDirection();
    }
}

export class DrawTwoCard extends Card {
    constructor(color: CardColor) {
        super(color, 'DRAW TWO', CardType.DRAW_TWO);
    }

    canPlayOn(topCard: Card): boolean {
        return this.color === topCard.getColor() || 
               topCard.getType() === CardType.DRAW_TWO ||
               topCard.getColor() === CardColor.WILD;
    }

    playEffect(game: Game): void {
        game.nextPlayerDraws(2);
        game.skipNextPlayer();
    }
}

export class WildCard extends Card {
    private newColor: CardColor | null = null;

    constructor() {
        super(CardColor.WILD, 'WILD', CardType.WILD);
    }

    canPlayOn(topCard: Card): boolean {
        // Wild cards can be played on any card
        return true;
    }

    setColor(color: CardColor): void {
        if (color !== CardColor.WILD) {
            this.newColor = color;
        }
    }

    getColor(): CardColor {
        return this.newColor || CardColor.WILD;
    }

    playEffect(game: Game): void {
        // The effect is just changing the color, which is handled by setColor
    }
}

export class WildDrawFourCard extends WildCard {
    constructor() {
        super();
    }

    getType(): CardType {
        return CardType.WILD_DRAW_FOUR;
    }

    getValue(): string {
        return 'WILD DRAW FOUR';
    }

    playEffect(game: Game): void {
        game.nextPlayerDraws(4);
        game.skipNextPlayer();
    }
}

// Forward declaration for the Game interface used by card effects
export interface Game {
    skipNextPlayer(): void;
    reverseDirection(): void;
    nextPlayerDraws(count: number): void;
}

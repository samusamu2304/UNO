import { Game } from './game';
import reverseImage from '../assets/cardIcons/arrow_reverse_icon.svg';

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
        protected readonly type: CardType,
        protected readonly imageURL? : string
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

    hasImage(): boolean {
        return !!this.imageURL;
    }

    getImageURL(): string {
        return this.imageURL || '';
    }
    toCardElement(): HTMLElement {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';

        // Añadir clase de color
        cardElement.classList.add(`card-${this.getColor()}`);


        // Imagen si existe
        if (this.hasImage()) {
            const iconElement = document.createElement('img');
            iconElement.src = this.getImageURL();
            iconElement.className = 'card-icon';
            cardElement.appendChild(iconElement);
        } else {
            // Si no hay imagen, mostrar el valor como texto
            const textElement = document.createElement('span');
            textElement.textContent = this.getValue();
            cardElement.appendChild(textElement);
        }

        return cardElement;
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
        super(color, 'REVERSE', CardType.REVERSE, reverseImage);
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
        super(color, '+2', CardType.DRAW_TWO);
    }

    canPlayOn(topCard: Card): boolean {
        return this.color === topCard.getColor() || 
               topCard.getType() === CardType.DRAW_TWO ||
               topCard.getColor() === CardColor.WILD;
    }

    playEffect(game: any): void {
        // Aplica el efecto automáticamente
        game.nextPlayerDraws(2);
        game.skipNextPlayer();
    }
}

export class WildCard extends Card {
    private newColor: CardColor | null = null;

    constructor() {
        super(CardColor.WILD, '', CardType.WILD);
    }

    canPlayOn(topCard: Card): boolean {
        // Wild cards can be played on any card
        return true;
    }

    setColor(color: CardColor): void {
            this.newColor = color;
    }

    getColor(): CardColor {
        return this.newColor || CardColor.WILD;
    }

    playEffect(game: Game): void {
        // Para wild cards, pedir color al jugador actual
        const currentPlayer = game.getCurrentPlayer();
        const chosenColor = currentPlayer.chooseColor();
        this.setColor(chosenColor);
    }

    toCardElement(): HTMLElement {
        const cardElement = super.toCardElement();
        if (!this.newColor) {
            cardElement.classList.add('grid-bg');
        } else {
            cardElement.classList.remove('grid-bg');
        }
        return cardElement;
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
        return '+4';
    }

    playEffect(game: Game): void {
        // Pedir color y aplicar efecto automáticamente
        super.playEffect(game);
        game.nextPlayerDraws(4);
        game.skipNextPlayer();
    }
}


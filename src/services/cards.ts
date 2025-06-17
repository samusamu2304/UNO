import { Player } from './player';
import { CpuPlayer } from './cpuPlayer';
import reverseImage from '../assets/cardIcons/arrow_reverse_icon.svg';
import { GameState, CardColor, CardType } from '../types/types';

// Evento personalizado para la selección de color
export interface ColorSelectionEvent extends CustomEvent {
    detail: {
        card: WildCard;
        isHumanPlayer: boolean; // Añadimos un flag para distinguir si es jugador humano
    };
}



// Resto de cartas igual, usando GameState

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

        // Aplicar clase de color basada en getColor(). Para WildCard, esto usará newColor si está seteado, o CardColor.WILD.
        cardElement.classList.add(`card-${this.getColor()}`);

        // Imagen si existe, o valor como texto
        if (this.hasImage()) {
            const iconElement = document.createElement('img');
            iconElement.src = this.getImageURL();
            iconElement.className = 'card-icon';
            cardElement.appendChild(iconElement);
        } else {
            const value = this.getValue();
            if (value) {
                const textElement = document.createElement('span');
                textElement.className = 'card-value';
                textElement.textContent = value;
                cardElement.appendChild(textElement);
            }
        }
        return cardElement;
    }

    // Método para emitir eventos
    protected emitEvent(eventName: string, detail: any): void {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }

    abstract canPlayOn(topCard: Card): boolean;
    abstract playEffect(game: GameState): void;

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

    playEffect(game: GameState): void {
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

    playEffect(game: GameState): void {
        game.skipNextPlayer(1);
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

    playEffect(game: GameState): void {
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
        game.skipNextPlayer(1);
    }
}

export class WildCard extends Card {
    private newColor: CardColor | null = null;

    constructor() {
        super(CardColor.WILD, '', CardType.WILD);
    }

    canPlayOn(topCard: Card): boolean {
        return true;
    }

    setColor(color: CardColor): void {
        this.newColor = color;
    }

    // Método para resetear el color elegido cuando la carta vuelve al mazo/descarte
    resetColor(): void {
        this.newColor = null;
    }

    getColor(): CardColor {
        // Devuelve el color elegido si existe, sino el color base de la WildCard.
        return this.newColor || super.getColor(); // super.getColor() devolverá CardColor.WILD
    }

    playEffect(game: GameState): void {
        const currentPlayer = game.getCurrentPlayer();
        const isHumanPlayer = !(currentPlayer instanceof CpuPlayer);

        if (isHumanPlayer) {
            this.emitEvent('wild-card-played', {
                card: this,
                isHumanPlayer: true
            });
        } else {
            const chosenColor = currentPlayer.chooseColor();
            this.setColor(chosenColor);
        }
    }

    // toCardElement se hereda de Card y ahora funcionará correctamente
    // para mostrar el color elegido o el fondo de card-wild.
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

    playEffect(game: GameState): void {
        const currentPlayer = game.getCurrentPlayer();
        const isHumanPlayer = !(currentPlayer instanceof CpuPlayer);

        if (isHumanPlayer) {
            this.emitEvent('wild-card-played', {
                card: this,
                isHumanPlayer: true
            });
        } else {
            const chosenColor = currentPlayer.chooseColor();
            this.setColor(chosenColor);
            this.completeEffect(game);
        }
    }

    completeEffect(game: GameState): void {
        game.nextPlayerDraws(4);
        game.skipNextPlayer(1);
    }
}

export class SkipTwoCard extends Card {
    constructor(color: CardColor) {
        super(color, 'SKIP TWO', CardType.SKIP_TWO);
    }

    canPlayOn(topCard: Card): boolean {
        return this.color === topCard.getColor() ||
               topCard.getType() === CardType.SKIP_TWO ||
               topCard.getColor() === CardColor.WILD;
    }

    playEffect(game: GameState): void {
        game.skipNextPlayer(2);
    }
}



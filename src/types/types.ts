import { Card} from "../services/cards";
import {Player} from "../services/player";

export enum CardColor { RED = 'red', BLUE = 'blue', GREEN = 'green', YELLOW = 'yellow', WILD = 'wild' }
export enum CardType { NUMBER = 'number', SKIP = 'skip', REVERSE = 'reverse', DRAW_TWO = 'draw_two', WILD = 'wild', WILD_DRAW_FOUR = 'wild_draw_four' }

export interface GameState {
    skipNextPlayer(): void;
    reverseDirection(): void;
    nextPlayerDraws(count: number): void;
    getTopCard(): Card | null;
    playCard(card: Card): boolean;
    drawCard(): Card | null;
    getCurrentPlayer(): Player | null;
}
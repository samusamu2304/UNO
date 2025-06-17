import { Card} from "../services/cards";
import {Player} from "../services/player";
import { Direction} from "../services/game";

export enum CardColor { RED = 'red', BLUE = 'blue', GREEN = 'green', YELLOW = 'yellow', WILD = 'wild' }
export enum CardType { NUMBER = 'number', SKIP = 'skip', REVERSE = 'reverse', DRAW_TWO = 'draw_two', WILD = 'wild', WILD_DRAW_FOUR = 'wild_draw_four', SKIP_TWO = 'skip_two' }

export interface GameState {
    skipNextPlayer(n : number): void;
    reverseDirection(): void;
    nextPlayerDraws(count: number): void;
    getTopCard(): Card | null;
    playCard(card: Card): boolean;
    drawCard(): Card | null;
    getCurrentPlayer(): Player | null;
    getDirection(): Direction.CLOCKWISE | Direction.COUNTER_CLOCKWISE;
    setDirection(direction: Direction.CLOCKWISE | Direction.COUNTER_CLOCKWISE): void;
}
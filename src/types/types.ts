import { Card} from "../services/cards";
import {Player} from "../services/player";
import {Direction} from "../services/game";
import {Deck} from "../services/deck";

export enum CardColor { RED = 'red', BLUE = 'blue', GREEN = 'green', YELLOW = 'yellow', WILD = 'wild' }
export enum CardType {
    NUMBER = 'number',
    SKIP = 'skip',
    REVERSE = 'reverse',
    DRAW_TWO = 'draw_two',
    WILD = 'wild',
    WILD_DRAW_FOUR = 'wild_draw_four',
    SKIP_TWO = 'skip_two',
}

export enum DeckType {
    STANDARD = 'standard',
    SMALL = 'small',
    MWILD = 'wild',
}

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
    setDeck(type : DeckType): void;
    start(): void;
}

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
export interface GameView {
    onGameEvent(event: GameEvent, data?: any): void;
}
export enum GameRequestType {
    PLAY_CARD = 'play_card',
    DRAW_CARD = 'draw_card',
    CALL_UNO = 'call_uno',
    SET_DECK = 'set_deck',
    START_GAME = 'start_game'
}
export interface GameRequest {
    action: GameRequestType;
    payload?: any;
}
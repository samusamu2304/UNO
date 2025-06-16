import { Game } from './game';
import { Player } from './player';

export interface PlayerStrategy {
    makeMove(game: Game, player: Player): void;
}


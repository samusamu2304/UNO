import { Player } from './player';
import {GameState} from "../types/types";

export interface PlayerStrategy {
    makeMove(game: GameState, player: Player): void;
}


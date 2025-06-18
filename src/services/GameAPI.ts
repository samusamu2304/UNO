import {GameRequest, GameRequestType, GameState} from "../types/types";
import {Card} from "./cards";

export interface GameAPI {
    sendGameRequest(request: GameRequest): Promise<any>;
}

export class LocalGameAPI implements GameAPI {
    private game : GameState;

    constructor(game : GameState) {
        this.game = game;
    }

    async sendGameRequest(request: GameRequest): Promise<any> {
        switch (request.action) {
            case GameRequestType.PLAY_CARD:
                if (request.payload?.card) {
                    const card = Card.fromJSON(request.payload.card);
                    this.game.playCard(card);
                }
                break
            case GameRequestType.DRAW_CARD:
                return this.game.drawCard();
            case GameRequestType.CALL_UNO:
                // por ahora no implementamos lógica para "call uno"
                return true;
            case GameRequestType.SET_DECK:
                if (request.payload?.deck) {
                    this.game.setDeck(request.payload.deck);
                }
                break;
            case GameRequestType.START_GAME:
                this.game.start();
                break;
            default:
                throw new Error("Acción no soportada: " + request.action);
        }
    }
}
//TODO: Keep transitioning all the game to api requests, and make it compatible with websockets
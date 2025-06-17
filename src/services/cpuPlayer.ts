import { Player } from './player';
import { Card, WildCard } from './cards';
import { GameState} from "../types/types";
import { PlayerStrategy } from './playerStrategy';
import { CardColor} from "../types/types";

export class CpuStrategy implements PlayerStrategy {
    makeMove(game: GameState, player: Player): void {
        const topCard = game.getTopCard();
        if (!topCard) return;
        const playableCard = player.findPlayableCard(topCard);
        if (playableCard) {
            if (playableCard.getColor() === CardColor.WILD && playableCard instanceof WildCard) {
                const chosenColor = player.chooseColor();
                playableCard.setColor(chosenColor);
            }
            game.playCard(playableCard);
        } else {
            const drawnCard = game.drawCard();
            if (drawnCard && drawnCard.canPlayOn(topCard)) {
                if (drawnCard.getColor() === CardColor.WILD && drawnCard instanceof WildCard) {
                    const chosenColor = player.chooseColor();
                    drawnCard.setColor(chosenColor);
                }
                game.playCard(drawnCard);
            }
        }
    }
}

export class CpuPlayer extends Player {
    constructor(name: string) {
        super(name, new CpuStrategy());
    }
}

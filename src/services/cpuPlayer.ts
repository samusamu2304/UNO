import { Player } from './player';
import { Card, CardColor, WildCard } from './cards';
import { Game } from './game';
import { PlayerStrategy } from './playerStrategy';

export class CpuStrategy implements PlayerStrategy {
    makeMove(game: Game, player: Player): void {
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

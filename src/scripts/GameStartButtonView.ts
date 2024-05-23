import { Application, Container, Graphics } from 'pixi.js'
import {Button} from '@pixi/ui'
import { GameplayState } from './Enum/GameplayState';
import { GameManager } from './Managers/GameManager';

export class GameStartButtonView extends Container{
   public gameManager : GameManager
   private app : Application
   constructor()
   {
        super();
        let width = 100;
        let height = 50;

        this.gameManager = GameManager.instance
        this.app = GameManager.instance.app;
        const button = new Button(
        new Graphics()
            .rect(-width/2, -height/2, width, height)
            .fill(0xFFFFFF)
    );
        this.addChild(button.view);
        this.app.stage.addChild(this);
        button.onPress.connect(() => GameManager.instance.gameplayPod.setGameplayState(GameplayState.GameplayState));
    }
}


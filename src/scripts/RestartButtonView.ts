import { Application, Container,Assets } from 'pixi.js'
import {FancyButton} from '@pixi/ui'
import { GameplayState } from './Enum/GameplayState';
import { GameManager } from './Managers/GameManager';
import { gsap } from "gsap";


export class RestartButtonView extends Container{
   public gameManager : GameManager
   private app : Application
   constructor()
   {
        super();
        
        this.doInit();
    }

    private async doInit(){
        await Assets.loadBundle('uiSprite');
        this.gameManager = GameManager.instance
        this.app = GameManager.instance.app;
        this.setupSubscribe();

        const button = new FancyButton({
            defaultView: `restart`,
            // hoverView: `start`,
            // pressedView: `start`,
            // text: 'Click me!',
            anchor:0.5,
            animations: {
                 hover: {
                     props: {
                         scale: {
                             x: 1.1,
                             y: 1.1,
                         }
                     },
                     duration: 100,
                 },
                //  pressed: {
                //      props: {
                //          scale: {
                //              x: 0.9,
                //              y: 0.9,
                //          }
                //      },
                //      duration: 100,
                //  }
             }
        });
   
        button.height = 50;
        button.width = 100;
        button.scale = 0;
        this.addChild(button);
        this.app.stage.addChild(this);
        button.onPress.connect(() => {
            this.onClose().then(()=>{
                GameManager.instance.gameplayPod.setGameplayState(GameplayState.GameplayState)
            });
        });

    }

    private setupSubscribe(){
        this.gameManager.gameplayPod.gameplayState.subscribe(state=>{
            if(state !== GameplayState.GameplayState)
                this.onOpen();
        });
    }

    private onOpen(){
        gsap.to(this,{
            pixi:{
                scale:1
            },
            duration:.3,
        })
    }

    private async onClose(){
       await gsap.to(this,{
            pixi:{
                scale:0
            },
            duration:.3,
        })
    }
}


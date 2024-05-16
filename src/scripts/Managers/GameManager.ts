import { Application } from 'pixi.js'
import { GameplayPod } from '../Pods/GameplayPod'
import { BallTypeView } from '../Components/BallTypeView'

export class GameManager {
    private static _instance: GameManager

    public app: Application
    public gameplayPod: GameplayPod
    public engine: Matter.Engine
    public elements: BallTypeView[] = []

    private static getInstance() {
        if (!GameManager._instance) {
            GameManager._instance = new GameManager()
        }

        return GameManager._instance
    }

    static get instance(): GameManager {
        return this.getInstance()
    }

    doInit(app: Application, engine: Matter.Engine): void {
        this.app = app
        this.engine = engine

        this.gameplayPod = new GameplayPod()
        this.gameplayPod.loadData()
    }

    findSpriteWithRigidbody(rb: Matter.Body): BallTypeView {
        return this.elements.find((element) => element.getBody() === rb)
    }
}

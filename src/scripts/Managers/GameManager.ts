import { Container } from 'pixi.js'
import { GameplayPod } from '../Pods/GameplayPod'
import { BallTypeView } from '../Components/BallTypeView'
import { BehaviorSubject } from 'rxjs'

export class GameManager {
    private static _instance: GameManager

    public currentScene: Container
    public gameplayPod: GameplayPod
    public engine: Matter.Engine
    public currentStaticBall: BehaviorSubject<BallTypeView> = new BehaviorSubject<BallTypeView>(undefined)
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

    public doInit(scene: Container, engine: Matter.Engine) {
        this.currentScene = scene
        this.engine = engine

        this.gameplayPod = new GameplayPod()
    }

    public changeStateBallView(view: BallTypeView) {
        this.currentStaticBall.next(view)
    }

    public findSpriteWithRigidbody(rb: Matter.Body): BallTypeView {
        return this.elements.find((element) => element.getBody() === rb)
    }
}

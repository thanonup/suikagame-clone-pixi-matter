import { Application, Container, Graphics } from 'pixi.js'
import { GameplayPod } from '../Pods/GameplayPod'
import { Bodies, Composite } from 'matter-js'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'
import { BallStateType } from '../Types/BallStateType'
import { BallTypePod } from './Pod/BallTypePod'
import { BallBean } from '../Beans/BallBean'
import { Subscription } from 'rxjs'

export class BallTypeView extends Container {
    private app: Application
    private gameplayPod: GameplayPod
    private engine: Matter.Engine

    private circle: Graphics
    private rigidBody: Matter.Body

    private diposeSubscription: Subscription

    private pod: BallTypePod
    private gameManager: GameManager

    constructor() {
        super()
        this.gameManager = GameManager.instance

        this.app = this.gameManager.app
        this.gameplayPod = this.gameManager.gameplayPod
        this.engine = this.gameManager.engine

        GameObjectConstructor(this.app, this)
    }

    public doInit(bean: BallBean) {
        this.pod = new BallTypePod(bean)

        this.circle = new Graphics()
        this.circle.circle(0, 0, bean.size).fill(bean.colorCode)

        this.addChild(this.circle)

        this.rigidBody = Bodies.circle(
            this.circle.getBounds().x + this.circle.width / 2,
            this.circle.getBounds().y + this.circle.height / 2,
            bean.size,
            {
                label: 'Ball',
                restitution: 0.3,
                isStatic: true,
            }
        )

        Composite.add(this.engine.world, [this.rigidBody])

        this.diposeSubscription = this.pod.ballStateType.subscribe((x) => {
            switch (x) {
                case BallStateType.Static:
                    this.gameManager.currentStaticBall = this
                    break
                case BallStateType.Idle:
                    this.rigidBody.isStatic = false
                    break
                case BallStateType.Merge:
                    break
            }
        })
    }

    public update() {
        this.position.set(this.rigidBody.position.x, this.rigidBody.position.y)
        this.rotation = this.rigidBody.angle
    }

    public getBody(): Matter.Body {
        return this.rigidBody
    }

    public getPod(): BallTypePod {
        return this.pod
    }

    public onDestroy() {
        this.pod = undefined
        this.diposeSubscription?.unsubscribe()
    }
}

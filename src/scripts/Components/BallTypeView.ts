import { Application, Container, Graphics } from 'pixi.js'
import { GameplayPod } from '../Pods/GameplayPod'
import { Bodies, Composite } from 'matter-js'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'
import { BallStateType } from '../Types/BallStateType'
import { BallTypePod } from './Pod/BallTypePod'
import { BallBean } from '../Beans/BallBean'
import { Subscription, timer } from 'rxjs'
import Matter from 'matter-js'

export class BallTypeView extends Container {
    private scene: Container
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

        this.scene = this.gameManager.currentScene
        this.gameplayPod = this.gameManager.gameplayPod
        this.engine = this.gameManager.engine

        GameObjectConstructor(this.scene, this)
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
                restitution: 0.2,
                isStatic: true,
                angle: 4.7,
            }
        )

        Composite.add(this.engine.world, [this.rigidBody])

        this.diposeSubscription = this.pod.ballStateType.subscribe((x) => {
            switch (x) {
                case BallStateType.Static:
                    this.gameManager.changeStateBallView(this)
                    break
                case BallStateType.Idle:
                    this.freezeBall(false)
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

    public freezeBall(isFreeze: boolean) {
        Matter.Body.setStatic(this.rigidBody, isFreeze)
    }

    public movePosition(xPos: number) {
        Matter.Body.setPosition(this.rigidBody, { x: xPos, y: this.rigidBody.position.y })
    }

    public onDestroy() {
        this.pod = undefined
        this.diposeSubscription?.unsubscribe()

        this?.destroy()
    }

    normalize(val: number, min: number, max: number): number {
        return +Math.max(min, Math.min(val, max)).toFixed(2)
        //  return Math.Clamp(+((val - min) / (max - min)).toFixed(2), 0, 1)
    }

    inverseNormalize(normalizeVal: number, min: number, max: number): number {
        return +(normalizeVal * (max - min) + min).toFixed(2)
    }
}

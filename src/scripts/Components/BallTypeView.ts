import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js'
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

    private circle: Sprite
    private rigidBody: Matter.Body

    private diposeSubscription: Subscription
    private beanSubscription: Subscription
    private delaySubscription: Subscription

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

    public doInit(bean: BallBean, index: number) {
        this.pod = new BallTypePod(bean)
        this.pod.currentIndex = index

        this.circle = Sprite.from(bean.assetKey)
        this.circle.anchor.set(0.5)

        this.addChild(this.circle)

        this.setSubscription()
    }

    private setSubscription() {
        this.diposeSubscription = this.pod.ballStateType.subscribe((x) => {
            switch (x) {
                case BallStateType.Static:
                    this.gameManager.changeStateBallView(this)
                    break
                case BallStateType.IdleFromStatic:
                    this.freezeBall(false)
                    this.delaySubscription?.unsubscribe()
                    this.delaySubscription = timer(500).subscribe((_) => {
                        this.pod.changeBallState(BallStateType.Idle)
                    })
                    break
                case BallStateType.Idle:
                    this.delaySubscription?.unsubscribe()
                    this.freezeBall(false)
                    break
                case BallStateType.Merge:
                    this.delaySubscription?.unsubscribe()
                    this.delaySubscription = timer(500).subscribe((_) => {
                        this.pod.changeBallState(BallStateType.Idle)
                    })
                    break
            }
        })

        this.beanSubscription = this.pod.currentBallBean.subscribe((bean) => {
            this.circle.texture = Texture.from(bean.assetKey)
            this.circle.setSize(bean.size * 2)

            const oldBody = this.rigidBody

            this.rigidBody = undefined
            this.rigidBody = Bodies.circle(
                this.circle.getBounds().x + this.circle.width / 2,
                this.circle.getBounds().y + this.circle.height / 2,
                bean.size,
                {
                    label: 'Ball',
                    restitution: 0.2,
                    isStatic: this.pod.ballStateType.value == BallStateType.Static ? true : false,
                    // angle: 4.7,
                    mass: bean.mass,
                }
            )

            Composite.add(this.engine.world, [this.rigidBody])

            if (oldBody != undefined) {
                Composite.remove(this.engine.world, [oldBody])
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
        this.beanSubscription?.unsubscribe()
        this.delaySubscription?.unsubscribe()

        this?.destroy()
    }

    normalize(val: number, min: number, max: number): number {
        return +Math.max(min, Math.min(val, max)).toFixed(2)
    }

    inverseNormalize(normalizeVal: number, min: number, max: number): number {
        return +(normalizeVal * (max - min) + min).toFixed(2)
    }
}

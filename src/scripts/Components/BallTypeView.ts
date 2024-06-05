import { Container, ObservablePoint, Point, Sprite, Texture, Ticker } from 'pixi.js'
import { GameplayPod } from '../Pods/GameplayPod'
import { Bodies, Composite } from 'matter-js'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'
import { BallStateType } from '../Types/BallStateType'
import { BallTypePod } from './Pod/BallTypePod'
import { BallBean } from '../Beans/BallBean'
import { Subscription, timer } from 'rxjs'
import Matter from 'matter-js'
import { gsap } from 'gsap'
import { sound } from '@pixi/sound'
import { mergeParticleView } from '../mergeParticleView'

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
    public ticker: Ticker

    private targetPosition: Container = new Container()
    // private sub: gsap.core.Omit<gsap.core.Tween, 'then'>
    private movingTween: gsap.core.Tween
    private mergingTween: gsap.core.Tween
    private gameoverTween: gsap.core.Tween

    private oldSize: number

    private mergeParticle: mergeParticleView
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
        this.mergeParticle = new mergeParticleView(this.pod)

        this.circle = Sprite.from(bean.assetKey)
        this.circle.anchor.set(0.5)

        this.addChild(this.circle)
        this.addChild(this.mergeParticle)

        this.setSubscription()
        this.setupTicker()
    }

    private setupTicker() {
        this.ticker = new Ticker()
        this.ticker.add(() => {
            Matter.Body.setPosition(this.rigidBody, {
                x: this.targetPosition.x,
                y: this.rigidBody.position.y,
            })
        })
    }

    private setSubscription() {
        this.beanSubscription = this.pod.currentBallBean.subscribe((bean) => {
            this.circle.texture = Texture.from(bean.assetKey)
            this.circle.setSize(bean.size * 2)

            const oldBody = this.rigidBody
            if (oldBody) this.oldSize = oldBody.circleRadius

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

        this.diposeSubscription = this.pod.ballStateType.subscribe((x) => {
            switch (x) {
                case BallStateType.Static:
                    this.gameManager.changeStateBallView(this)
                    break
                case BallStateType.IdleFromStatic:
                    this.freezeBall(false)
                    this.delaySubscription?.unsubscribe()
                    this.rigidBody.force.y = 0.05
                    this.delaySubscription = timer(500).subscribe((_) => {
                        this.pod.changeBallState(BallStateType.Idle)
                    })
                    break
                case BallStateType.Idle:
                    this.delaySubscription?.unsubscribe()
                    this.freezeBall(false)
                    break
                case BallStateType.Merge: {
                    this.mergeParticle.play()
                    let scaleDownSize = this.oldSize / this.rigidBody.circleRadius
                    Matter.Body.scale(this.rigidBody, scaleDownSize, scaleDownSize)

                    const originImageScale: number = this.circle.scale._x
                    this.mergingTween = gsap.to(this, {
                        duration: 0.2,
                        onUpdate: (x) => {
                            // console.log(this.circle.scale)
                            let targetSize = this.pod.currentBallBean.value.size * this.mergingTween.progress()
                            let sizeMultiply = targetSize / this.rigidBody.circleRadius
                            this.circle.scale = originImageScale * this.mergingTween.progress()
                            Matter.Body.scale(this.rigidBody, sizeMultiply, sizeMultiply)
                        },
                    })

                    this.delaySubscription?.unsubscribe()
                    this.delaySubscription = timer(250).subscribe((_) => {
                        this.pod.changeBallState(BallStateType.Idle)
                    })
                    break
                }
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

    public tweenPosition(target: number, duration: number) {
        this.targetPosition.position = this.rigidBody.position
        this.ticker.start()
        this.movingTween?.kill()

        this.movingTween = gsap.to(this.targetPosition, {
            x: target,
            duration,
            onComplete: () => {
                this.ticker.stop()
            },
        })
    }

    public tweenPositionRelease(target: number | Point, doOnComplete: Function) {
        this.targetPosition.position = this.rigidBody.position
        this.ticker.start()
        this.movingTween?.kill()
        let duration = 0.2
        const startPos = this.targetPosition.x
        let isCallBack: boolean = false
        // if (typeof target === 'number') this.sub = await gsap.to(this.targetPosition, { x: target, duration: 0.3 })
        // else this.sub = await gsap.to(this.targetPosition, { x: target.x, y: target.y, duration: 0.3 })

        if (typeof target === 'number')
            this.movingTween = gsap.to(this.targetPosition, {
                x: target,
                duration,
                onUpdate: () => {
                    const progress = this.normalize(this.targetPosition.x, startPos, target)

                    if (!isCallBack && progress >= 0.4) {
                        isCallBack = true

                        doOnComplete()
                    }
                },
                onComplete: () => {
                    this.ticker.stop()
                },
                onInterrupt: () => {
                    this.ticker.stop()
                    doOnComplete()
                },
            })
        else
            this.movingTween = gsap.to(this.targetPosition, {
                x: target.x,
                y: target.y,
                duration,
                onComplete: () => {
                    this.ticker.stop()
                    doOnComplete()
                },
                onInterrupt: () => {
                    this.ticker.stop()
                    doOnComplete()
                },
            })

        return this.movingTween
    }

    public tweenGameOverBallOnLine() {
        if (this.gameoverTween == undefined || null) {
            this.gameoverTween = gsap.fromTo(
                this,
                { alpha: 1 },
                {
                    alpha: 0.2,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 20,
                    onComplete: () => {
                        this.alpha = 1
                    },
                }
            )
        }
    }

    public onDestroy() {
        this.pod = undefined
        this.diposeSubscription?.unsubscribe()
        this.beanSubscription?.unsubscribe()
        this.delaySubscription?.unsubscribe()
        this.gameoverTween?.kill()
        this.mergeParticle?.onDestroy()

        this?.destroy()
    }

    normalize(val: number, min: number, max: number): number {
        return +((val - min) / (max - min)).toFixed(4)
    }

    inverseNormalize(normalizeVal: number, min: number, max: number): number {
        return +(normalizeVal * (max - min) + min).toFixed(2)
    }
}

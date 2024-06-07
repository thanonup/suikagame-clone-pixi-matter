import { Application, Container, Graphics } from 'pixi.js'
import { GameManager } from '../Managers/GameManager'
import { GameplayPod } from '../Pods/GameplayPod'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { Bodies, Composite } from 'matter-js'
import { GameScene } from '../Scenes/GameScene'
import Matter from 'matter-js'
import { Subscription, timer } from 'rxjs'
import { GameplayState } from '../Enum/GameplayState'
import { BallStateType } from '../Types/BallStateType'
import { gsap } from 'gsap'
import { BallTypeView } from './BallTypeView'
import { IMediaInstance, sound } from '@pixi/sound'

export class GameOverView extends Container {
    private app: Application
    private scene: Container
    private gameManager: GameManager
    private gameplayPod: GameplayPod
    private engine: Matter.Engine

    private lineGameover: Graphics
    private lineYPosition: number

    private ballsInLine: BallTypeView[] = []

    private gameOverLineBody: Matter.Body
    private gameOverAlertBody: Matter.Body

    private alertStartTween: gsap.core.Tween
    private alertTween: gsap.core.Tween

    private heightGameOverLine: number

    private disposeGameOver: Subscription
    private disposeGameOverAlert: Subscription
    private disposeState: Subscription

    private soundWarning: IMediaInstance

    constructor() {
        super()

        this.gameManager = GameManager.instance

        this.app = this.gameManager.app
        this.scene = this.gameManager.currentScene
        this.gameplayPod = this.gameManager.gameplayPod
        this.engine = this.gameManager.engine

        GameObjectConstructor(this.scene, this)

        Matter.Events.on(this.engine, 'collisionStart', (event) => this.onCollisionEnter(event))
        Matter.Events.on(this.engine, 'collisionActive', (event) => this.onCollisionStay(event))
    }

    public doInit(width: number, height) {
        this.heightGameOverLine = height
        this.lineYPosition = this.getGameOverPosition()

        this.gameOverLineBody = Bodies.rectangle(this.app.screen.width / 2, this.lineYPosition, width, height, {
            label: 'gemeOverBody',
            isStatic: true,
            isSensor: true,
        })

        this.gameOverAlertBody = Bodies.rectangle(
            this.app.screen.width / 2,
            this.gameOverLineBody.position.y + height / 2 + 35,
            width,
            70,
            {
                label: 'gemeOverAlert',
                isStatic: true,
                isSensor: true,
            }
        )

        Composite.add(this.engine.world, [this.gameOverLineBody, this.gameOverAlertBody])

        this.lineGameover = new Graphics()
        this.lineGameover
            .rect(0, height - 10, width, 10)
            .fill(0xff3050)
            .pivot.set(width / 2, height / 2)
        this.lineGameover.visible = false

        this.addChild(this.lineGameover)

        this.createSubscription()
    }

    private createSubscription() {
        this.disposeState = this.gameplayPod.gameplayState.subscribe((state) => {
            if (state != GameplayState.GameplayState) {
                this.lineGameover.visible = false
                this.lineGameover.alpha = 0

                this.alertStartTween?.kill()
                this.alertTween?.kill()
            }
        })
    }

    private setTweenLine() {
        if (this.alertStartTween == undefined || null) {
            this.alertStartTween = gsap.fromTo(
                this.lineGameover,
                { alpha: 0 },
                {
                    alpha: 1,
                    duration: 0.25,
                    onComplete: () => {
                        if (this.alertTween == undefined || null) {
                            this.alertTween = gsap.fromTo(
                                this.lineGameover,
                                { alpha: 1 },
                                { alpha: 0.2, duration: 0.25, repeat: -1, yoyo: true, repeatDelay: 0.2 }
                            )
                        }
                    },
                }
            )
        }
    }

    private onCollisionEnter(event: Matter.IEventCollision<Matter.Engine>) {}

    private onCollisionStay(event: Matter.IEventCollision<Matter.Engine>) {
        if (this.isBallsIngameOverZone(event) && this.disposeGameOver == undefined) {
            this.disposeGameOver = timer(3000).subscribe((_) => {
                this.gameManager.gameplayPod.setGameplayState(GameplayState.GameOverState)
                this.ballsInLine.forEach((x) => x.tweenGameOverBallOnLine())
            })
        } else if (!this.isBallsIngameOverZone(event) && this.disposeGameOver != undefined) {
            this.disposeGameOver?.unsubscribe()
            this.disposeGameOver = undefined
        }

        this.checkBallsIngameOverAlertlZone(event)
    }

    private checkBallsIngameOverAlertlZone(event: Matter.IEventCollision<Matter.Engine>) {
        let isBallsInZone = false

        event.pairs.forEach((collision) => {
            const bodys = [collision.bodyA, collision.bodyB]
            const ballBody = bodys.find((x) => x.label == 'Ball')
            const gameOverAlertlBody = bodys.find((x) => x.label == 'gemeOverAlert')

            if (ballBody != undefined && gameOverAlertlBody != undefined) {
                isBallsInZone = true
            }
        })

        if (isBallsInZone) {
            if (this.disposeGameOverAlert == undefined) {
                this.disposeGameOverAlert = timer(1500).subscribe((_) => {
                    this.lineGameover.visible = true
                    this.setTweenLine()

                    sound.play('warning', { loop: true, volume: 0.4 })
                })
            }
        } else {
            if (this.disposeGameOverAlert != undefined) {
                sound.stop('warning')
                this.disposeGameOverAlert?.unsubscribe()
                this.disposeGameOverAlert = undefined

                this.lineGameover.visible = false
                this.lineGameover.alpha = 0

                this.alertStartTween?.kill()
                this.alertTween?.kill()

                this.alertStartTween = undefined
                this.alertStartTween = null

                this.alertTween = undefined
                this.alertTween = null
            }
        }
    }

    private isBallsIngameOverZone(event: Matter.IEventCollision<Matter.Engine>): boolean {
        let isBallsInZone = false
        this.ballsInLine = []
        event.pairs.forEach((collision) => {
            const bodys = [collision.bodyA, collision.bodyB]
            const ballBody = bodys.find((x) => x.label == 'Ball')
            const gameOverBody = bodys.find((x) => x.label == 'gemeOverBody')

            if (ballBody != undefined && gameOverBody != undefined) {
                const element = this.gameManager.findSpriteWithRigidbody(ballBody)
                if (element?.getPod().ballStateType.value == BallStateType.Idle) {
                    isBallsInZone = true
                    this.ballsInLine.push(element)
                }
            }
        })
        return isBallsInZone
    }
    private getGameOverPosition(): number {
        return this.app.screen.height / 2 - GameScene.GAME_CONTROLLER_HEIGHT / 2 + 550 // 70
    }

    public resize() {
        this.lineYPosition = this.getGameOverPosition()

        Matter.Body.setPosition(this.gameOverLineBody, {
            x: this.app.screen.width / 2,
            y: this.lineYPosition,
        })

        Matter.Body.setPosition(this.gameOverAlertBody, {
            x: this.app.screen.width / 2,
            y: this.gameOverLineBody.position.y + this.heightGameOverLine / 2 + 35,
        })

        this.lineGameover.position.set(this.gameOverLineBody.position.x, this.gameOverLineBody.position.y)
    }

    public onDestroy() {
        this.disposeGameOver?.unsubscribe()
        this.disposeGameOverAlert?.unsubscribe()

        Matter.Composite.remove(this.gameManager.engine.world, this.gameOverAlertBody)
        Matter.Composite.remove(this.gameManager.engine.world, this.gameOverLineBody)

        this.disposeGameOver = undefined
        this.disposeGameOverAlert = undefined
    }
}

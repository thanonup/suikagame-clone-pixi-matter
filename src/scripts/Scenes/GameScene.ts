import { GameplayPod } from '../Pods/GameplayPod'
import { BallTypeView } from '../Components/BallTypeView'
import { Bodies, Composite } from 'matter-js'
import { GameManager } from '../Managers/GameManager'
import Matter from 'matter-js'
import { GameController } from '../Components/GameController'
import { Subscription, interval, take, timer } from 'rxjs'
import { BallStateType } from '../Types/BallStateType'
import { GameplayState } from '../Enum/GameplayState'
import { RestartButtonView } from '../UI/RestartButtonView'
import * as PIXI from 'pixi.js'
import { gsap } from 'gsap'
import { PixiPlugin } from 'gsap/PixiPlugin'
import { GameScoreView } from '../UI/GameScoreView'
import { Assets } from 'pixi.js'
import { BallTypePod } from '../Components/Pod/BallTypePod'
import { GameOverView } from '../Components/GameOverView'
import { sound } from '@pixi/sound'

gsap.registerPlugin(PixiPlugin)
PixiPlugin.registerPIXI(PIXI)

export class GameScene extends PIXI.Container {
    public static readonly GAME_CONTROLLER_WIDTH: number = 350
    public static readonly GAME_CONTROLLER_HEIGHT: number = 637

    private gameManager: GameManager
    private app: PIXI.Application
    private engine: Matter.Engine
    private gameplayPod: GameplayPod

    private floorGraphic: PIXI.Graphics
    private groundBody: Matter.Body
    private wallLeftBody: Matter.Body
    private wallRightBody: Matter.Body

    private ball: BallTypeView
    private ballPositionY: number

    private disposeSpawner: Subscription
    private disposeTimer: Subscription
    private disposeGameoverTimer: Subscription
    private disposeIntervalTimer: Subscription

    private gameController: GameController
    private restartButtonView: RestartButtonView
    private gameScoreView: GameScoreView
    private gameOverView: GameOverView

    constructor(app: PIXI.Application, engine: Matter.Engine) {
        super()

        this.gameManager = GameManager.instance
        this.gameManager.doInit(this, app, engine)

        this.app = app
        this.engine = this.gameManager.engine
        this.gameplayPod = this.gameManager.gameplayPod

        Matter.Events.on(this.engine, 'collisionStart', (event) => this.onCollisionEnter(event))
        Matter.Events.on(this.engine, 'collisionActive', (event) => this.onCollisionStay(event))

        app.stage.hitArea = app.screen
    }

    public async doInit() {
        await this.gameplayPod.loadData()
        await Assets.loadBundle('gameAssets')

        this.SubscribeSetup()

        this.gameController = new GameController()
        this.gameController.doInit(GameScene.GAME_CONTROLLER_WIDTH, GameScene.GAME_CONTROLLER_HEIGHT)
        this.gameController.pivot.set(this.gameController.width / 2, this.gameController.height / 2)
        this.gameController.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 20)

        this.floorGraphic = new PIXI.Graphics()
        this.floorGraphic
            .rect(0, 0, GameScene.GAME_CONTROLLER_WIDTH, 20)
            .fill(0xffffff)
            .pivot.set(this.floorGraphic.width / 2, this.floorGraphic.height / 2)
        this.floorGraphic.position.set(
            this.gameController.x,
            this.gameController.y + this.gameController.height / 2 + this.floorGraphic.height / 2
        )

        this.addChild(this.floorGraphic)

        this.groundBody = Bodies.rectangle(
            this.floorGraphic.getBounds().x + this.floorGraphic.width / 2,
            this.floorGraphic.getBounds().y + this.floorGraphic.height / 2,
            this.floorGraphic.width,
            this.floorGraphic.height,
            {
                label: 'Ground',
                isStatic: true,
            }
        )

        this.wallLeftBody = Bodies.rectangle(
            this.floorGraphic.getBounds().x - this.floorGraphic.height / 2,
            this.app.screen.height / 2 - this.floorGraphic.height / 2,
            this.floorGraphic.height,
            this.gameController.height + this.floorGraphic.height,
            {
                label: 'WallLeft',
                isStatic: true,
            }
        )

        this.wallRightBody = Bodies.rectangle(
            this.floorGraphic.getBounds().x + this.floorGraphic.width + this.floorGraphic.height / 2,
            this.app.screen.height / 2 - this.floorGraphic.height / 2,
            this.floorGraphic.height,
            this.gameController.height + this.floorGraphic.height,
            {
                label: 'WallRight',
                isStatic: true,
            }
        )

        this.gameOverView = new GameOverView()
        this.gameOverView.doInit(this.floorGraphic.width, 130)

        // this.gameOverBody.render.visible = false;
        Composite.add(this.engine.world, [this.groundBody, this.wallLeftBody, this.wallRightBody])

        console.log('------All Bodies-------')
        console.log(Composite.allBodies(this.engine.world))

        this.on('removed', () => {
            this.onDestroy()
        })

        this.restartButtonView = new RestartButtonView()
        this.restartButtonView.position.set(this.app.screen.width / 2, this.app.screen.height / 2)
        this.gameScoreView = new GameScoreView(this.floorGraphic)
    }

    private ballSpawnAndSetting() {
        this.ballPositionY = this.getCurrentYPositionBall()

        this.ball = new BallTypeView()
        this.ball.position.set(this.app.screen.width / 2, this.ballPositionY)

        this.ball.doInit(this.gameManager.gameplayPod.ballBeans[0], 0)
        this.gameManager.elements.push(this.ball)

        this.disposeSpawner = this.gameManager.currentStaticBall.subscribe((ball) => {
            if (ball == undefined) {
                this.ball = undefined
                this.disposeTimer = timer(1000).subscribe((_) => {
                    this.ball = new BallTypeView()
                    this.ball.position.set(this.app.screen.width / 2, this.ballPositionY)

                    const randIndex = this.randomIntFromInterval(0, this.gameplayPod.availableIndexSpawnBall)
                    this.ball.doInit(this.gameManager.gameplayPod.ballBeans[randIndex], randIndex)
                    this.gameManager.elements.push(this.ball)
                })
            }
        })
    }

    private onCollisionEnter(event: Matter.IEventCollision<Matter.Engine>) {
        if (this.gameplayPod.gameplayState.value != GameplayState.GameplayState) return
        event.pairs.forEach((collision) => this.doOnTrigger(collision))
    }

    private onCollisionStay(event: Matter.IEventCollision<Matter.Engine>) {
        if (this.gameplayPod.gameplayState.value != GameplayState.GameplayState) return
        event.pairs.forEach((collision) => this.doOnTrigger(collision))
    }

    private doOnTrigger(collision: Matter.Pair) {
        let [bodyA, bodyB] = [collision.bodyA, collision.bodyB]

        if (bodyA.label == 'Ball' && bodyB.label == 'Ball') this.OnMerge(bodyA, bodyB)
    }

    private OnMerge(bodyA: Matter.Body, bodyB: Matter.Body) {
        let elementA
        let elementB
        if (bodyA.position.y < bodyA.position.y) {
            elementA = this.gameManager.findSpriteWithRigidbody(bodyA)
            elementB = this.gameManager.findSpriteWithRigidbody(bodyB)
        } else {
            elementA = this.gameManager.findSpriteWithRigidbody(bodyB)
            elementB = this.gameManager.findSpriteWithRigidbody(bodyA)
        }

        if (elementA && elementB) {
            const ballAPod: BallTypePod = elementA.getPod()
            const ballBPod: BallTypePod = elementB.getPod()

            if (ballAPod.currentBallBean.value.ballType == ballBPod.currentBallBean.value.ballType) {
                if (
                    (ballAPod.ballStateType.value == BallStateType.Idle &&
                        ballBPod.ballStateType.value == BallStateType.Idle) ||
                    (ballAPod.ballStateType.value == BallStateType.IdleFromStatic &&
                        ballBPod.ballStateType.value == BallStateType.Idle) ||
                    (ballAPod.ballStateType.value == BallStateType.Idle &&
                        ballBPod.ballStateType.value == BallStateType.IdleFromStatic)
                ) {
                    this.gameManager.increaseScore(ballAPod.currentBallBean.value.score)
                    this.removeElement(elementA)

                    if (ballBPod.currentIndex < this.gameManager.gameplayPod.ballBeans.length - 1) {
                        ballBPod.currentIndex++

                        sound.play('merge')

                        ballBPod.changeCurrentBallBean(this.gameManager.gameplayPod.ballBeans[ballBPod.currentIndex])
                        if (
                            ballBPod.currentIndex > this.gameManager.gameplayPod.availableIndexSpawnBall &&
                            this.gameManager.gameplayPod.availableIndexSpawnBall <
                                this.gameManager.gameplayPod.maxAvailableIndexSpawnBall
                        ) {
                            this.gameManager.gameplayPod.availableIndexSpawnBall = ballBPod.currentIndex
                        }
                    } else {
                        this.gameManager.increaseScore(ballBPod.currentBallBean.value.score)
                        this.removeElement(elementB)
                    }
                }
            }
        }
    }

    removeElement(element: BallTypeView) {
        element.onDestroy()
        Matter.Composite.remove(this.engine.world, element.getBody())
        this.gameManager.elements = this.gameManager.elements.filter((el: BallTypeView) => el != element)
        // console.log(`Removed id ${element.getBody().id}. Elements left: ${this.gameManager.elements.length}`)
    }

    public update() {
        this.gameManager.elements.forEach((x) => x.update())
    }

    public resize() {
        this.ballPositionY = this.getCurrentYPositionBall()

        this.gameController.resize()
        this.gameOverView.resize()

        this.floorGraphic.position.set(
            this.gameController.x,
            this.gameController.y + this.gameController.height / 2 + this.floorGraphic.height / 2
        )

        Matter.Body.setPosition(this.groundBody, {
            x: this.floorGraphic.getBounds().x + this.floorGraphic.width / 2,
            y: this.floorGraphic.getBounds().y + this.floorGraphic.height / 2,
        })

        Matter.Body.setPosition(this.wallLeftBody, {
            x: this.floorGraphic.getBounds().x - this.floorGraphic.height / 2,
            y: this.app.screen.height / 2 - this.floorGraphic.height / 2,
        })

        Matter.Body.setPosition(this.wallRightBody, {
            x: this.floorGraphic.getBounds().x + this.floorGraphic.width + this.floorGraphic.height / 2,
            y: this.app.screen.height / 2 - this.floorGraphic.height / 2,
        })

        if (this.ball != undefined) {
            Matter.Body.setPosition(this.ball.getBody(), {
                x: this.app.screen.width / 2,
                y: this.ballPositionY,
            })
        }

        this.gameManager.elements.forEach((x) => {
            if (x.getPod().ballStateType.value != BallStateType.Static) {
                x.freezeBall(true)
                const newPos = this.getNewPositionResize(x.getBody().position.x, x.getBody().position.y, x.width)
                console.log(newPos)
                Matter.Body.setPosition(x.getBody(), {
                    x: newPos.x,
                    y: newPos.y,
                })
                x.freezeBall(false)
            }
        })

        this.gameManager.originalScreen = { width: this.app.screen.width, height: this.app.screen.height }
    }

    private getCurrentYPositionBall(): number {
        return this.app.screen.height / 2 - GameScene.GAME_CONTROLLER_HEIGHT / 2 + 40
    }

    private SubscribeSetup() {
        this.gameplayPod.gameplayState.subscribe((state) => {
            this.unSubscription()

            switch (state) {
                case GameplayState.GameplayState: {
                    this.gameManager.elements.forEach((x) => this.removeElement(x))
                    this.gameplayPod.restartGame()
                    this.gameManager.score.next(0)
                    this.ballSpawnAndSetting()
                    break
                }
                case GameplayState.GameOverState:
                    if (this.gameManager.currentStaticBall.value != undefined)
                        this.removeElement(this.gameManager.currentStaticBall.value)
                    sound.stop('warning')
                    sound.play('gameover', {
                        end: 0.98,
                        complete: () => {
                            let elements = this.gameManager.elements.sort((a, b) => a.position.y - b.position.y)
                            this.disposeIntervalTimer = interval(80)
                                .pipe(take(elements.length))
                                .subscribe((index) => {
                                    sound.play('destroy')
                                    this.gameManager.increaseScore(elements[index].getPod().currentBallBean.value.score)
                                    this.removeElement(elements[index])
                                    if (index === elements.length - 1)
                                        this.gameplayPod.setGameplayState(GameplayState.ResultState)
                                })
                        },
                    })

                    break
            }
        })
    }

    private unSubscription() {
        this.disposeSpawner?.unsubscribe()
        this.disposeTimer?.unsubscribe()
        this.disposeGameoverTimer?.unsubscribe()
        this.disposeIntervalTimer?.unsubscribe()

        this.disposeSpawner = undefined
        this.disposeTimer = undefined
        this.disposeGameoverTimer = undefined
        this.disposeIntervalTimer = undefined
    }

    public onDestroy() {
        this.unSubscription()

        this?.destroy()
    }

    getNewPositionResize(xPos: number, yPos: number, ballWidth: number) {
        const normalizeXValue = this.normalize(
            xPos,
            this.gameManager.originalScreen.width / 2 - this.gameController.width / 2 + ballWidth / 2,
            this.gameManager.originalScreen.width / 2 + this.gameController.width / 2 - ballWidth / 2
        )

        const normalizeYValue = this.normalize(
            yPos,
            this.gameManager.originalScreen.height / 2 - this.gameController.height / 2 + ballWidth / 2,
            this.gameManager.originalScreen.height / 2 + this.gameController.height / 2 - ballWidth / 2
        )

        return {
            x: this.inverseNormalize(
                normalizeXValue,
                this.app.screen.width / 2 - this.gameController.width / 2 + ballWidth / 2,
                this.app.screen.width / 2 + this.gameController.width / 2 - ballWidth / 2
            ),
            y: this.inverseNormalize(
                normalizeYValue,
                this.app.screen.height / 2 - this.gameController.height / 2 + ballWidth / 2,
                this.app.screen.height / 2 + this.gameController.height / 2 - ballWidth / 2
            ),
        }
    }

    randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    normalize(val: number, min: number, max: number): number {
        return +((val - min) / (max - min)).toFixed(4)
    }

    inverseNormalize(normalizeVal: number, min: number, max: number): number {
        return +(normalizeVal * (max - min) + min).toFixed(1)
    }
}

import { Application, Assets, Container, Graphics, Loader, Renderer, Sprite } from 'pixi.js'
import { GameplayPod } from '../Pods/GameplayPod'
import { BallTypeView } from '../Components/BallTypeView'
import { Bodies, Composite } from 'matter-js'
import { GameManager } from '../Managers/GameManager'
import Matter from 'matter-js'
import { GameController } from '../Components/GameController'
import { Subscription, timer } from 'rxjs'
import { BallStateType } from '../Types/BallStateType'
import { GameplayState } from '../Enum/GameplayState'

export class GameScene extends Container {
    public static readonly GAME_CONTROLLER_WIDTH: number = 350
    public static readonly GAME_CONTROLLER_HEIGHT: number = 637

    private gameManager: GameManager
    private app: Application
    private engine: Matter.Engine
    private gameplayPod: GameplayPod

    private floorGraphic: Graphics
    private groundBody: Matter.Body
    private wallLeftBody: Matter.Body
    private wallRightBody: Matter.Body

    private ball: BallTypeView

    private disposeSpawner: Subscription
    private disposeTimer: Subscription
    private gameController: GameController

    constructor(app: Application, engine: Matter.Engine) {
        super()

        this.gameManager = GameManager.instance
        this.gameManager.doInit(this, app, engine)

        this.app = app
        this.engine = this.gameManager.engine
        this.gameplayPod = this.gameManager.gameplayPod

        Matter.Events.on(this.engine, 'collisionStart', (event) => this.onCollision(event))
        app.stage.hitArea = app.screen
    }

    public async doInit() {
        await this.gameplayPod.loadData()

        this.gameController = new GameController()
        this.gameController.doInit(GameScene.GAME_CONTROLLER_WIDTH, GameScene.GAME_CONTROLLER_HEIGHT)
        this.gameController.pivot.set(this.gameController.width / 2, this.gameController.height / 2)
        this.gameController.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 20)

        this.floorGraphic = new Graphics()
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

        Composite.add(this.engine.world, [this.groundBody, this.wallLeftBody, this.wallRightBody])

        this.BallSpawnAndSetting()

        console.log('------All Bodies-------')
        console.log(Composite.allBodies(this.engine.world))

        this.on('removed', () => {
            this.onDestroy()
        })
    }

    private BallSpawnAndSetting() {
        this.ball = new BallTypeView()
        this.ball.position.set(
            this.app.screen.width / 2,
            this.app.screen.height / 2 - GameScene.GAME_CONTROLLER_HEIGHT / 2 + 50
        )
        this.ball.doInit(this.gameManager.gameplayPod.ballBeans[0])
        this.gameManager.elements.push(this.ball)

        this.disposeSpawner = this.gameManager.currentStaticBall.subscribe((ball) => {
            if (ball == undefined) {
                this.ball = undefined
                this.disposeTimer = timer(1500).subscribe((_) => {
                    this.ball = new BallTypeView()
                    this.ball.position.set(
                        this.app.screen.width / 2,
                        this.app.screen.height / 2 - GameScene.GAME_CONTROLLER_HEIGHT / 2 + 50
                    )
                    this.ball.doInit(
                        this.gameManager.gameplayPod.ballBeans[this.randomIntFromInterval(0, this.gameManager.gameplayPod.ballBeans.length - 1)]
                    )
                    this.gameManager.elements.push(this.ball)
                })
            }
        })
    }

    private onCollision(event: Matter.IEventCollision<Matter.Engine>) {
        event.pairs.forEach((collision) => {
            let [bodyA, bodyB] = [collision.bodyA, collision.bodyB]

            if (bodyA.label == 'Ball' && bodyB.label == 'Ball') {
                const element = this.gameManager.findSpriteWithRigidbody(bodyA)
                // if (element) this.removeElement(element)
            }
        })
    }

    removeElement(element: BallTypeView) {
        element.onDestroy()
        Matter.Composite.remove(this.engine.world, element.getBody())
        this.gameManager.elements = this.gameManager.elements.filter((el: BallTypeView) => el != element)
        console.log(`Removed id ${element.getBody().id}. Elements left: ${this.gameManager.elements.length}`)
    }

    public update() {
        this.gameManager.elements.forEach((x) => x.update())
    }

    public resize() {
        this.gameController.resize()

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
                y: this.app.screen.height / 2 - GameScene.GAME_CONTROLLER_HEIGHT / 2 + 50,
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

    private SubscribeSetup(){
        this.gameplayPod.gameplayState.subscribe(state=>{
            switch(state)
            {
                case GameplayState.StartState :
                        break;
                case GameplayState.GameplayState :
                        this.BallSpawnAndSetting();
                        break;
                case GameplayState.EndState :
                        break;
            }

        });
    }
    
    public onDestroy() {
        this.disposeSpawner?.unsubscribe()
        this.disposeTimer?.unsubscribe()

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

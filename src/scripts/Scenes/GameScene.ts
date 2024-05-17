import { Application, Assets, Container, Graphics, Loader, Renderer, Sprite } from 'pixi.js'
import { GameplayPod } from '../Pods/GameplayPod'
import { BallTypeView } from '../Components/BallTypeView'
import { Bodies, Composite } from 'matter-js'
import { GameManager } from '../Managers/GameManager'
import Matter from 'matter-js'
import { GameController } from '../Components/GameController'
import { Subscription, timer } from 'rxjs'

export class GameScene extends Container {
    private gameManager: GameManager
    private app: Application
    private engine: Matter.Engine
    private gameplayPod: GameplayPod

    private disposeSpawner: Subscription
    private disposeTimer: Subscription
    private gameController: GameController

    constructor(app: Application, engine: Matter.Engine) {
        super()

        this.gameManager = GameManager.instance
        this.gameManager.doInit(this, engine)

        this.app = app
        this.engine = this.gameManager.engine
        this.gameplayPod = this.gameManager.gameplayPod

        Matter.Events.on(this.engine, 'collisionStart', (event) => this.onCollision(event))
        app.stage.hitArea = app.screen
    }

    public async doInit() {
        await this.gameplayPod.loadData()

        const floorGraphic = new Graphics()
        floorGraphic
            .rect(this.app.screen.width / 2, this.app.screen.height - 20, 350, 20)
            .fill(0xffffff)
            .pivot.set(floorGraphic.width / 2, floorGraphic.height / 2)

        this.addChild(floorGraphic)

        var ground = Bodies.rectangle(
            floorGraphic.getBounds().x + floorGraphic.width / 2,
            floorGraphic.getBounds().y + floorGraphic.height / 2,
            floorGraphic.width,
            floorGraphic.height,
            {
                label: 'Ground',
                isStatic: true,
            }
        )

        var leftWall = Bodies.rectangle(
            floorGraphic.getBounds().x - floorGraphic.height / 2,
            window.innerHeight / 2,
            floorGraphic.height,
            window.innerHeight,
            {
                label: 'WallLeft',
                isStatic: true,
            }
        )

        var rightWall = Bodies.rectangle(
            floorGraphic.getBounds().x + floorGraphic.width + floorGraphic.height / 2,
            window.innerHeight / 2,
            floorGraphic.height,
            window.innerHeight,
            {
                label: 'WallRight',
                isStatic: true,
            }
        )

        Composite.add(this.engine.world, [ground, leftWall, rightWall])

        this.gameController = new GameController()
        this.gameController.doInit(floorGraphic.width, floorGraphic.getBounds().y)
        this.gameController.position.set(floorGraphic.getBounds().x, 0)

        const ball = new BallTypeView()
        ball.position.set(this.app.screen.width / 2, 50)
        ball.doInit(this.gameManager.gameplayPod.ballBeans[0])
        this.gameManager.elements.push(ball)

        this.disposeSpawner = this.gameManager.currentStaticBall.subscribe((ball) => {
            if (ball == undefined) {
                this.disposeTimer = timer(1500).subscribe((_) => {
                    const ball = new BallTypeView()
                    ball.position.set(this.app.screen.width / 2, 50)
                    ball.doInit(this.gameManager.gameplayPod.ballBeans[0])
                    this.gameManager.elements.push(ball)
                })
            }
        })

        console.log('------All Bodies-------')
        console.log(Composite.allBodies(this.engine.world))

        this.on('removed', () => {
            this.onDestroy()
        })
    }

    private onCollision(event: Matter.IEventCollision<Matter.Engine>) {
        event.pairs.forEach((collision) => {
            let [bodyA, bodyB] = [collision.bodyA, collision.bodyB]

            if (bodyA.label == 'Ball' && bodyB.label == 'Ball') {
                const element = this.gameManager.findSpriteWithRigidbody(bodyA)
                if (element) this.removeElement(element)
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

    public onDestroy() {
        this.disposeSpawner?.unsubscribe()
        this.disposeTimer?.unsubscribe()

        this?.destroy()
    }
}

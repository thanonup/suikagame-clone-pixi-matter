import { Application, Assets, Container, Graphics, Loader, Renderer, Sprite } from 'pixi.js'
import { GameplayPod } from '../Pods/GameplayPod'
import { BallTypeView } from '../Components/BallTypeView'
import { Bodies, Composite } from 'matter-js'
import { GameManager } from '../Managers/GameManager'
import Matter from 'matter-js'

export class GameScene extends Container {
    private gameManager: GameManager
    private app: Application
    private engine: Matter.Engine
    private gameplayPod: GameplayPod

    constructor(app: Application, engine: Matter.Engine) {
        super()

        this.gameManager = GameManager.instance
        this.gameManager.doInit(app, engine)

        this.app = this.gameManager.app
        this.engine = this.gameManager.engine
        this.gameplayPod = this.gameManager.gameplayPod

        Matter.Events.on(this.engine, 'collisionStart', (event) => this.onCollision(event))
    }

    public doInit() {
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

        const ball1 = new BallTypeView()
        ball1.position.set(this.app.screen.width / 2 - 100, 50)
        ball1.doInit(20)
        this.gameManager.elements.push(ball1)

        const ball2 = new BallTypeView()
        ball2.position.set(this.app.screen.width / 2 - 120, 300)
        ball2.doInit(20)
        this.gameManager.elements.push(ball2)

        const ball3 = new BallTypeView()
        ball3.position.set(this.app.screen.width / 2 + 100, 50)
        ball3.doInit(20)
        this.gameManager.elements.push(ball3)

        const ball4 = new BallTypeView()
        ball4.position.set(this.app.screen.width / 2 + 120, 300)
        ball4.doInit(20)
        this.gameManager.elements.push(ball4)

        console.log('------All Bodies-------')
        console.log(Composite.allBodies(this.engine.world))
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
        //  element.beforeUnload()
        Matter.Composite.remove(this.engine.world, element.getBody())
        this.app.stage.removeChild(element)
        this.gameManager.elements = this.gameManager.elements.filter((el: BallTypeView) => el != element)
        console.log(`Removed id ${element.getBody().id}. Elements left: ${this.gameManager.elements.length}`)
    }

    public update() {
        //  console.log('update')

        this.gameManager.elements.forEach((x) => x.update())
    }
}

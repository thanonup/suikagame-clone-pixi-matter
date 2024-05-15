import { Application, Assets, Container, Graphics, Loader, Renderer, Sprite } from 'pixi.js'
import { GameplayPod } from '../Pods/GameplayPod'
import { BallTypeView } from '../Components/BallTypeView'
import { Bodies, Composite } from 'matter-js'
import { GameManager } from '../Managers/GameManager'

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
        ball1.doInit(this.app.screen.width / 2 + 10, 50, 20)
        this.gameManager.elements.push(ball1)

        const ball2 = new BallTypeView()
        ball2.doInit(this.app.screen.width / 2, 300, 20)
        this.gameManager.elements.push(ball2)

        console.log('------All Bodies-------')
        console.log(Composite.allBodies(this.engine.world))
    }

    public update() {
        console.log('update')

        this.gameManager.elements.forEach((x) => x.update())
    }
}

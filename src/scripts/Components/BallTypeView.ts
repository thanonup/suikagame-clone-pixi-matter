import { Application, Container, Graphics } from 'pixi.js'
import { GameplayPod } from '../Pods/GameplayPod'
import { Bodies, Composite } from 'matter-js'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'

export class BallTypeView extends Container {
    private app: Application
    private gameplayPod: GameplayPod
    private engine: Matter.Engine

    private circle: Graphics
    private rigidBody: Matter.Body

    private initSize: number
    private initYPos: number

    private gameManager: GameManager

    constructor() {
        super()
        this.gameManager = GameManager.instance

        this.app = this.gameManager.app
        this.gameplayPod = this.gameManager.gameplayPod
        this.engine = this.gameManager.engine

        GameObjectConstructor(this.app, this)
    }

    public doInit(xPos: number, yPos: number, size: number) {
        this.initSize = size
        this.initYPos = yPos
        this.x = xPos
        this.y = yPos
        this.circle = new Graphics()
        this.circle.circle(0, 0, size).fill(0x705537)

        this.addChild(this.circle)

        this.rigidBody = Bodies.circle(
            this.circle.getBounds().x + this.circle.width / 2,
            this.circle.getBounds().y + this.circle.height / 2,
            this.initSize,
            {
                label: 'Ball',
                restitution: 0.3,
                // isStatic: true,
            }
        )

        Composite.add(this.engine.world, [this.rigidBody])
    }

    public update() {
        this.position.set(this.rigidBody.position.x, this.rigidBody.position.y)
        this.rotation = this.rigidBody.angle
    }
}

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

export class GameOverView extends Container {
    private app: Application
    private scene: Container
    private gameManager: GameManager
    private gameplayPod: GameplayPod
    private engine: Matter.Engine

    private lineGameover: Graphics

    private gameOverLineBody: Matter.Body
    private gameOverCheckBody: Matter.Body

    private disposeGameOver: Subscription

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
        this.gameOverLineBody = Bodies.rectangle(
            this.app.screen.width / 2,
            this.app.screen.height / 2 - GameScene.GAME_CONTROLLER_HEIGHT / 2 + 100,
            width,
            height,
            {
                label: 'gemeOverBody',
                isStatic: true,
                isSensor: true,
            }
        )

        Composite.add(this.engine.world, [this.gameOverLineBody])

        this.lineGameover = new Graphics()
        this.lineGameover
            .rect(this.gameOverLineBody.position.x, this.gameOverLineBody.position.y + height / 4, width, height / 2)
            .fill(0xffffff)
            .pivot.set(width / 2, height / 2)

        this.addChild(this.lineGameover)
    }

    private onCollisionEnter(event: Matter.IEventCollision<Matter.Engine>) {}

    private onCollisionStay(event: Matter.IEventCollision<Matter.Engine>) {
        if (this.isBallsIngameOverZone(event) && this.disposeGameOver == undefined) {
            this.disposeGameOver = timer(3000).subscribe((_) => {
                this.gameManager.gameplayPod.setGameplayState(GameplayState.GameOverState)
            })
        } else if (!this.isBallsIngameOverZone(event) && this.disposeGameOver != undefined) {
            this.disposeGameOver?.unsubscribe()
            this.disposeGameOver = undefined
        }
    }

    private isBallsIngameOverZone(event: Matter.IEventCollision<Matter.Engine>): boolean {
        let isBallsInZone = false
        event.pairs.forEach((collision) => {
            const bodys = [collision.bodyA, collision.bodyB]
            const ballBody = bodys.find((x) => x.label == 'Ball')
            const gameOverBody = bodys.find((x) => x.label == 'gemeOverBody')

            if (ballBody != undefined && gameOverBody != undefined) {
                const element = this.gameManager.findSpriteWithRigidbody(ballBody)
                if (element?.getPod().ballStateType.value == BallStateType.Idle) isBallsInZone = true
            }
        })
        return isBallsInZone
    }

    public resize() {
        Matter.Body.setPosition(this.gameOverLineBody, {
            x: this.app.screen.width / 2,
            y: this.app.screen.height / 2 - GameScene.GAME_CONTROLLER_HEIGHT / 2 + 100,
        })
    }

    public onDestroy() {
        this.disposeGameOver?.unsubscribe()
    }
}

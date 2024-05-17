import { Application, Graphics } from 'pixi.js'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'
import { BallStateType } from '../Types/BallStateType'

export class GameController extends Graphics {
    private app: Application

    private gameManager: GameManager
    constructor() {
        super()

        this.gameManager = GameManager.instance
        this.app = this.gameManager.app
        GameObjectConstructor(this.app, this)
    }

    public doInit(width: number, height: number) {
        this.rect(0, 0, width, height).fill(0xff0000).alpha = 0.2

        this.eventMode = 'static'
        this.cursor = 'pointer'
        this.on('pointerdown', (event) => {
            const currentStaticBall = this.gameManager.currentStaticBall
            if (currentStaticBall) {
                currentStaticBall.getPod().changeBallState(BallStateType.Idle)

                currentStaticBall.movePosition(event.x)

                const postionX = currentStaticBall.getBody().position.x

                if (postionX + currentStaticBall.width / 2 > this.x + this.width) {
                    currentStaticBall.movePosition(this.width + this.x - currentStaticBall.width / 2)
                }

                if (postionX - currentStaticBall.width / 2 < this.x) {
                    currentStaticBall.movePosition(this.x + currentStaticBall.width / 2)
                }

                this.gameManager.currentStaticBall = undefined
            } else {
                console.log('noting ball')
            }
        })
    }
}

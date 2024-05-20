import { Application, Container, Graphics } from 'pixi.js'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'
import { BallStateType } from '../Types/BallStateType'
import { BallTypeView } from './BallTypeView'
import { GameScene } from '../Scenes/GameScene'

export class GameController extends Graphics {
    private app: Application
    private scene: Container
    private isClick: boolean = false

    private gameManager: GameManager
    constructor() {
        super()

        this.gameManager = GameManager.instance
        this.scene = this.gameManager.currentScene
        this.app = this.gameManager.app

        // console.log(this.scene)
        GameObjectConstructor(this.scene, this)
    }

    public doInit(width: number, height: number) {
        this.rect(0, 0, width, height).fill(0xff0000).alpha = 0.2

        this.eventMode = 'static'
        this.cursor = 'pointer'

        this.on('pointerup', (event) => {
            this.isClick = false
            this.onMouseUp(event.x)
        })
        this.on('pointerdown', () => {
            this.isClick = true
        })

        this.on('pointermove', (event) => {
            if (this.isClick) {
                this.limitMoveBall(event.x)
            }
        })

        window.addEventListener('pointerup', (event) => {
            if (this.isClick) {
                this.isClick = false
                this.onMouseUp(event.x)
            }
        })

        window.addEventListener('pointermove', (event) => {
            if (this.isClick) {
                this.limitMoveBall(event.x)
            }
        })
    }

    private limitMoveBall(xPos: number) {
        const currentStaticBall = this.gameManager.currentStaticBall.value

        if (currentStaticBall) {
            currentStaticBall.movePosition(xPos)
            const positionX = currentStaticBall.getBody().position.x

            //offsetScreen = (Width controller size - 375) default screen
            const offsetScreen = (375 - GameScene.GAME_CONTROLLER_WIDTH) / 2

            if (positionX > this.width) {
                currentStaticBall.movePosition(this.width + offsetScreen - currentStaticBall.width / 2)
            }

            if (positionX - currentStaticBall.width / 2 < offsetScreen) {
                currentStaticBall.movePosition(offsetScreen + currentStaticBall.width / 2)
            }
        }
    }

    private onMouseUp(xPos: number) {
        const currentStaticBall = this.gameManager.currentStaticBall.value
        if (currentStaticBall) {
            currentStaticBall.getPod().changeBallState(BallStateType.Idle)
            this.limitMoveBall(xPos)
            this.gameManager.changeStateBallView(undefined)
        } else {
            console.log('noting ball')
        }
    }

    public resize() {
        console.log('resize gameController')

        this.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 20)
    }

    public onDestroy() {
        this?.destroy()
    }
}

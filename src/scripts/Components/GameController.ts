import { Application, Container, Graphics } from 'pixi.js'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'
import { BallStateType } from '../Types/BallStateType'
import { GameplayState } from '../Enum/GameplayState'

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

            if (positionX > this.app.screen.width / 2 + this.width / 2 - currentStaticBall.width / 2) {
                currentStaticBall.movePosition(this.app.screen.width / 2 + this.width / 2 - currentStaticBall.width / 2)
            }

            if (positionX < this.app.screen.width / 2 - this.width / 2 + currentStaticBall.width / 2) {
                currentStaticBall.movePosition(this.app.screen.width / 2 - this.width / 2 + currentStaticBall.width / 2)
            }
        }
    }

    private onMouseUp(xPos: number) {

        if(this.gameManager.gameplayPod.gameplayState.value != GameplayState.GameplayState)
            return;

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
        this.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 20)
    }

    public onDestroy() {
        this?.destroy()
    }
}
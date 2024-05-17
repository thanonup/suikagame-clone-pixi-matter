import { Application, Graphics } from 'pixi.js'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'
import { BallStateType } from '../Types/BallStateType'
import { BallTypeView } from './BallTypeView'

export class GameController extends Graphics {
    private app: Application
    private isClick: boolean = false

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
        const currentStaticBall = this.gameManager.currentStaticBall

        if (currentStaticBall) {
            currentStaticBall.movePosition(xPos)
            const positionX = currentStaticBall.getBody().position.x
            if (positionX + currentStaticBall.width / 2 > this.x + this.width) {
                currentStaticBall.movePosition(this.width + this.x - currentStaticBall.width / 2)
            }
            if (positionX - currentStaticBall.width / 2 < this.x) {
                currentStaticBall.movePosition(this.x + currentStaticBall.width / 2)
            }
        }
    }

    private onMouseUp(xPos: number) {
        const currentStaticBall = this.gameManager.currentStaticBall
        if (currentStaticBall) {
            currentStaticBall.getPod().changeBallState(BallStateType.Idle)
            this.limitMoveBall(xPos)
            this.gameManager.currentStaticBall = undefined
        } else {
            console.log('noting ball')
        }
    }
}

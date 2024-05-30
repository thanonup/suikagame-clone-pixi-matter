import { Application, Container, Graphics } from 'pixi.js'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'
import { BallStateType } from '../Types/BallStateType'
import { GameplayState } from '../Enum/GameplayState'
import { Observable, Subscription, observable, timer } from 'rxjs'

export class GameController extends Graphics {
    private app: Application
    private scene: Container
    private isClick: boolean = false

    private movingTween: gsap.core.Tween

    private isMouseMove: boolean = false
    private mouseMoveTimer: Subscription

    private gameManager: GameManager
    constructor() {
        super()

        this.gameManager = GameManager.instance
        this.scene = this.gameManager.currentScene
        this.app = this.gameManager.app

        // console.log(this.scene)
        GameObjectConstructor(this.scene, this)
        this.setupSubscribe()
    }

    private setupSubscribe() {
        this.gameManager.gameplayPod.gameplayState.subscribe((state) => {
            this.movingTween?.kill()
        })
    }

    public doInit(width: number, height: number) {
        this.rect(0, 0, width, height).fill(0xff0000).alpha = 0.01

        this.eventMode = 'static'
        this.cursor = 'pointer'

        this.on('pointerup', (event) => {
            if (this.isAvailableMove()) return

            this.isClick = false
            this.onMouseUp(event.x)
        })
        this.on('pointerdown', (event) => {
            if (this.isAvailableMove()) return

            this.isClick = true

            this.onMouseDown(event.x)
            this.mouseMoveTimer = timer(200).subscribe(() => {
                this.isMouseMove = true
            })
        })

        this.on('pointermove', (event) => {
            if (this.isAvailableMove()) return

            if (!this.isMouseMove) return

            if (this.isClick) {
                this.limitMoveBall(event.x)
            }
        })

        window.addEventListener('pointerup', (event) => {
            if (this.isAvailableMove()) return

            if (this.isClick) {
                this.isClick = false
                this.onMouseUp(event.x)
            }
        })

        window.addEventListener('pointermove', (event) => {
            if (this.isAvailableMove()) return

            if (!this.isMouseMove) return

            if (this.isClick) {
                this.movingTween?.kill()
                this.limitMoveBall(event.x)
            }
        })

        window.addEventListener('blur', () => {
            this.doOnOutOfFocus()
        })

        window.addEventListener('contextmenu', () => {
            this.doOnOutOfFocus()
        })
    }

    private doOnOutOfFocus() {
        if (this.isClick) {
            if (this.isAvailableMove()) return
            this.mouseMoveTimer?.unsubscribe()
            this.isClick = false

            const currentStaticBall = this.gameManager.currentStaticBall.value
            if (currentStaticBall) {
                currentStaticBall.getPod().changeBallState(BallStateType.IdleFromStatic)
                this.gameManager.changeStateBallView(undefined)
            }
        }
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

    private getClampPositionX(xPos: number) {
        const currentStaticBall = this.gameManager.currentStaticBall.value
        if (currentStaticBall) {
            if (xPos > this.app.screen.width / 2 + this.width / 2 - currentStaticBall.width / 2)
                xPos = this.app.screen.width / 2 + this.width / 2 - currentStaticBall.width / 2

            if (xPos < this.app.screen.width / 2 - this.width / 2 + currentStaticBall.width / 2) {
                xPos = this.app.screen.width / 2 - this.width / 2 + currentStaticBall.width / 2
            }
        }
        return xPos
    }

    private onMouseUp(xPos: number) {
        this.mouseMoveTimer?.unsubscribe()

        const currentStaticBall = this.gameManager.currentStaticBall.value

        if (currentStaticBall) {
            xPos = this.getClampPositionX(xPos)
            if (!this.isMouseMove) {
                this.movingTween = currentStaticBall.tweenPositionRelease(xPos, () => {
                    currentStaticBall.getPod().changeBallState(BallStateType.IdleFromStatic)
                })
                this.gameManager.changeStateBallView(undefined)
            } else {
                this.gameManager.changeStateBallView(undefined)
                currentStaticBall.getPod().changeBallState(BallStateType.IdleFromStatic)
            }
        }

        this.isMouseMove = false
    }

    private onMouseDown(xPos: number) {
        const currentStaticBall = this.gameManager.currentStaticBall.value

        if (currentStaticBall) {
            currentStaticBall.tweenPosition(this.getClampPositionX(xPos), 0.1)
        }
    }

    private isAvailableMove(): boolean {
        return this.gameManager.gameplayPod.gameplayState.value != GameplayState.GameplayState
    }

    public resize() {
        this.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 20)
    }

    public onDestroy() {
        this?.destroy()
    }
}

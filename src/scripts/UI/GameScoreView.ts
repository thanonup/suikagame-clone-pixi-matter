import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { GameManager } from '../Managers/GameManager'
import { Subscription, interval, takeWhile } from 'rxjs'
import { GameplayState } from '../Enum/GameplayState'

export class GameScoreView extends Container {
    private scoreText: Text
    private gameManager: GameManager
    private app: Application
    private score: number = 0
    private tweeningScore: Subscription = undefined
    private floorGraphic: Graphics

    constructor(floorGraphic: Graphics) {
        super()
        this.floorGraphic = floorGraphic

        this.gameManager = GameManager.instance
        this.app = this.gameManager.app

        const style = new TextStyle({
            fontFamily: 'Verdana',
            fontSize: 30,
        })
        this.scoreText = new Text('0', style)
        this.scoreText.anchor = 0.5
        this.position.set(this.floorGraphic.getBounds().x + 30, 30)
        this.addChild(this.scoreText)
        this.app.stage.addChild(this)
        this.setupSubScribe()
    }

    private setupSubScribe() {
        this.gameManager.score.subscribe((score) => {
            if (this.gameManager.gameplayPod.gameplayState.value != GameplayState.GameplayState) return

            const intervalTime = interval(50)
            this.tweeningScore?.unsubscribe()
            this.tweeningScore = intervalTime.pipe(takeWhile(() => this.score < score)).subscribe(() => {
                this.score++
                this.scoreText.text = this.score
            })
        })

        this.gameManager.gameplayPod.gameplayState.subscribe((state) => {
            if (state === GameplayState.GameplayState) {
                this.score = 0
                this.scoreText.text = this.score
            }

            switch (state) {
                case GameplayState.GameplayState: {
                    this.score = 0
                    this.scoreText.text = this.score
                    break
                }
                case GameplayState.GameOverState: {
                    this.tweeningScore?.unsubscribe()
                    this.score = this.gameManager.score.value
                    this.scoreText.text = this.score
                    break
                }
            }
        })
    }
}

import { Application, Container, Text, TextStyle } from 'pixi.js'
import { GameManager } from '../Managers/GameManager'
import { Observable, Subject, Subscription, interval, take, takeUntil, takeWhile, timer } from 'rxjs'

export class GameScoreView extends Container {
    private scoreText: Text
    private gameManager: GameManager
    private app: Application
    private score: number = 0
    private tweeningScore: Subscription = undefined

    constructor() {
        super()
        this.gameManager = GameManager.instance
        this.app = this.gameManager.app

        const style = new TextStyle({
            fontFamily: 'Verdana',
            fontSize: 30,
        })
        this.scoreText = new Text('0', style)
        this.scoreText.anchor = 0.5
        this.position.set(this.app.screen.width / 2, 30)
        this.addChild(this.scoreText)
        this.app.stage.addChild(this)
        this.setupSubScribe()
    }

    private setupSubScribe() {
        this.gameManager.score.subscribe((score) => {
            console.log(score)
            const intervalTime = interval(50)

            this.tweeningScore?.unsubscribe()
            this.tweeningScore = intervalTime.pipe(takeWhile(() => this.score < score)).subscribe(() => {
                this.score++
                this.scoreText.text = this.score
            })
        })
    }
}

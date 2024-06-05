import { Application, Container, FillGradient, Graphics, Point, Text, TextStyle } from 'pixi.js'
import { GameManager } from '../Managers/GameManager'
import { Subscription, interval, takeWhile } from 'rxjs'
import { GameplayState } from '../Enum/GameplayState'
import { GameplayPod } from '../Pods/GameplayPod'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameScene } from '../Scenes/GameScene'
import { gsap } from 'gsap'

export class GameScoreView extends Container {
    private scene: Container

    private mockPosition: Graphics

    private scoreText: Text
    private hightScore: Text

    private score: number = 0

    private tweeningScore: Subscription = undefined

    private inTween: gsap.core.Tween
    private outTween: gsap.core.Tween

    private app: Application
    private gameManager: GameManager
    private gameplayPod: GameplayPod

    constructor() {
        super()

        this.gameManager = GameManager.instance
        this.scene = this.gameManager.currentScene
        this.gameplayPod = this.gameManager.gameplayPod
        this.app = this.gameManager.app

        GameObjectConstructor(this.scene, this)
    }

    public doInit() {
        this.mockPosition = new Graphics()
        this.mockPosition.rect(0, 0, 120, 70).fill(0xff0000)

        this.scoreText = new Text(
            '0',
            new TextStyle({
                fontFamily: 'PoetsenOne-Regular',
                fontSize: 30,
                stroke: { color: '#ffffff', width: 5, join: 'round' },
                fill: '#3D3D3D',
            })
        )
        this.scoreText.anchor = 0

        this.hightScore = new Text(
            'HighScore : xx',
            new TextStyle({
                fontFamily: 'PoetsenOne-Regular',
                fontSize: 14,
                stroke: { color: '#ffffff', width: 5, join: 'round' },
                fill: '#3D3D3D',
            })
        )
        this.hightScore.position.set(0, this.scoreText.height / 2 + 15)
        this.hightScore.anchor = 0

        this.addChild(this.mockPosition, this.scoreText, this.hightScore)

        this.setupTween()
        this.setupSubScribe()
    }

    private setupTween() {
        this.inTween = gsap.to(this, {
            x: this.x,
            y: this.y,
            duration: 0.5,
            ease: 'back.out',
        })

        this.inTween.pause()

        this.outTween = gsap.to(this, {
            x: this.x,
            y: -100,
            duration: 0.5,
            ease: 'back.in',
        })
        this.outTween.pause()
    }

    private setupSubScribe() {
        this.gameManager.score.subscribe((score) => {
            // if (this.gameManager.gameplayPod.gameplayState.value != GameplayState.GameplayState) return

            const intervalTime = interval(50)
            this.tweeningScore?.unsubscribe()
            this.tweeningScore = intervalTime.pipe(takeWhile(() => this.score < score)).subscribe(() => {
                this.score++
                this.scoreText.text = this.score
            })
        })

        this.gameManager.gameplayPod.gameplayState.subscribe((state) => {
            switch (state) {
                case GameplayState.GameplayState:
                    this.score = 0
                    this.scoreText.text = this.score

                    this.gameplayPod.getScoreData()
                    let score = this.gameplayPod.highScoreBean.highScore
                    this.hightScore.text = `HighScore :  ${this.gameplayPod.highScoreBean.highScore}`

                    if (score == 0) {
                        this.hightScore.visible = false
                    } else {
                        this.hightScore.visible = true
                    }
                    this.outTween.seek(0.5, false)
                    this.inTween.restart()

                    break
                case GameplayState.ResultState:
                    this.tweeningScore?.unsubscribe()
                    this.score = this.gameManager.score.value
                    this.scoreText.text = this.score

                    this.gameplayPod.saveHightScore(this.score)
                    this.outTween.restart()

                    break
            }
        })
    }

    public onResize() {
        switch (this.gameManager.gameplayPod.gameplayState.value) {
            case GameplayState.GameplayState:
                if (this.inTween.progress() > 0) {
                    this.inTween.reverse()
                    this.inTween.pause()
                }
                console.log('gameplay')
                break
            case GameplayState.ResultState:
                this.y = -100
                break
        }
    }
}

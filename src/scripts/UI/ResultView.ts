import { Application, Container, Assets, Graphics, Text } from 'pixi.js'
import { FancyButton } from '@pixi/ui'
import { GameplayState } from '../Enum/GameplayState'
import { GameManager } from '../Managers/GameManager'
import { gsap } from 'gsap'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { sound } from '@pixi/sound'

export class ResultView extends Container {
    private scene: Container
    private objectGroup: Container
    private gameManager: GameManager
    private app: Application

    private dimBackground: Graphics
    private gameOverText: Text
    private headerText: Text
    private scoreText: Text
    private brakingScoreText: Text
    private restartButton: FancyButton

    private loopHighScoreTween: gsap.core.Tween

    constructor() {
        super()
        this.gameManager = GameManager.instance
        this.app = this.gameManager.app
        this.scene = this.gameManager.currentScene

        GameObjectConstructor(this.scene, this)
        this.doInit()
    }

    private doInit() {
        this.createUI()
        this.setupSubscribe()

        this.visible = false
    }

    private createUI() {
        this.objectGroup = new Container()

        this.dimBackground = new Graphics()
        this.dimBackground.rect(0, 0, this.app.screen.width, this.app.screen.height).fill(0x000000).alpha = 0.8
        this.dimBackground.pivot.set(this.dimBackground.width / 2, this.dimBackground.height / 2)
        this.dimBackground.interactive = true

        this.gameOverText = new Text('GAME OVER', {
            fill: '#ffffff',
            fontFamily: 'PoetsenOne-Regular',
            fontSize: 30,
            stroke: { color: '#ff0000', width: 5, join: 'round' },
        })

        this.gameOverText.position.set(0, -60)
        this.gameOverText.anchor.set(0.5, 1)

        this.headerText = new Text('- Your Score -', {
            fill: '#ffffff',
            fontFamily: 'PoetsenOne-Regular',
            fontSize: 20,
        })

        this.headerText.position.set(0, -30)
        this.headerText.anchor.set(0.5, 1)

        this.scoreText = new Text('0000000', {
            fill: '#ffffff',
            fontFamily: 'PoetsenOne-Regular',
            fontSize: 20,
        })

        this.scoreText.position.set(0, 0)
        this.scoreText.anchor.set(0.5, 1)

        this.brakingScoreText = new Text('*New \n HighScore!*', {
            fill: '#000000',
            fontFamily: 'PoetsenOne-Regular',
            fontSize: 20,
            align: 'center',
            stroke: { color: '#FFD02C', width: 5, join: 'round' },
        })

        this.brakingScoreText.position.set(-80, -100)
        this.brakingScoreText.anchor.set(0.5, 1)
        this.brakingScoreText.angle = -30

        this.restartButton = new FancyButton({
            defaultView: `restart`,
            anchor: 0.5,
            animations: {
                hover: {
                    props: {
                        scale: {
                            x: 1.1,
                            y: 1.1,
                        },
                    },
                    duration: 100,
                },
                pressed: {
                    props: {
                        scale: {
                            x: 0.9,
                            y: 0.9,
                        },
                    },
                    duration: 100,
                },
            },
        })

        this.restartButton.height = 50
        this.restartButton.width = 100
        this.restartButton.position.set(0, 30)

        this.restartButton.onPress.connect(() => {
            GameManager.instance.gameplayPod.setGameplayState(GameplayState.GameplayState)
        })

        this.objectGroup.addChild(
            this.gameOverText,
            this.headerText,
            this.scoreText,
            this.restartButton,
            this.brakingScoreText
        )

        this.addChild(this.dimBackground, this.objectGroup)
    }

    private setupSubscribe() {
        this.gameManager.gameplayPod.gameplayState.subscribe((state) => {
            switch (state) {
                case GameplayState.GameplayState:
                    sound.stop('win')
                    this.onClose()
                    break
                case GameplayState.ResultState:
                    this.loopHighScoreTween?.kill()
                    this.visible = true
                    this.brakingScoreText.visible = false
                    this.onOpen()
                    break
            }
        })
    }

    private onOpen() {
        this.scoreText.text = this.gameManager.score.value
        gsap.to(this.objectGroup, {
            pixi: {
                scale: 1,
            },
            duration: 0.3,
            onComplete: () => {
                this.brakingScoreText.scale = 0
                this.brakingScoreText.visible = this.gameManager.score.value > this.gameManager.gameplayPod.oldHighScore
                if (this.brakingScoreText.visible) {
                    sound.play('win')
                    gsap.to(this.brakingScoreText, {
                        pixi: {
                            scale: 1,
                        },
                        duration: 0.3,
                        onComplete: () => {
                            this.loopHighScoreTween = gsap.fromTo(
                                this.brakingScoreText,
                                {
                                    pixi: {
                                        scale: 1,
                                    },
                                },
                                {
                                    pixi: {
                                        scale: 0.5,
                                    },
                                    ease: 'expo.inOut',
                                    duration: 1,
                                    yoyo: true,
                                    repeat: -1,
                                    repeatDelay: 0.2,
                                }
                            )
                        },
                    })
                }
            },
        })
        gsap.fromTo(
            this.objectGroup,
            { alpha: 0 },
            {
                duration: 0.2,
                alpha: 1,
            }
        )

        gsap.fromTo(
            this.dimBackground,
            { alpha: 0 },
            {
                duration: 0.4,
                alpha: 0.8,
            }
        )
    }

    private onClose() {
        this.loopHighScoreTween?.kill()
        gsap.to(this.objectGroup, {
            pixi: {
                scale: 0,
            },
            duration: 0.4,
        })
        gsap.fromTo(
            this.objectGroup,
            { alpha: 1 },
            {
                duration: 0.2,
                alpha: 0,
            }
        )
        gsap.fromTo(
            this.dimBackground,
            { alpha: 0.8 },
            {
                duration: 0.4,
                alpha: 0,
                onComplete: () => {
                    this.visible = false
                },
            }
        )
    }

    public resize() {
        this.dimBackground?.setSize(this.app.screen.width, this.app.screen.height)
    }
}

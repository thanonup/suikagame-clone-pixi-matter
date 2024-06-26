import * as PIXI from 'pixi.js'
import { BallBean } from '../Beans/BallBean'
import { Layout, LayoutStyles } from '@pixi/layout'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'
import { FancyButton, ScrollBox } from '@pixi/ui'
import { gsap } from 'gsap'
import { GameScene } from '../Scenes/GameScene'
import { GameplayState } from '../Enum/GameplayState'

export class ScrollCellView extends PIXI.Container {
    private scene: PIXI.Container
    private gameManager: GameManager

    private scrollBox: ScrollBox
    private scrollBg: PIXI.Sprite

    private button: FancyButton
    private scrollContainer: PIXI.Container

    private app: PIXI.Application
    private dimBackground: PIXI.Graphics

    private tweening: gsap.core.Tween
    private inTween: gsap.core.Tween
    private outTween: gsap.core.Tween

    private isShow: boolean = false

    constructor(scene: PIXI.Container) {
        super()

        this.gameManager = GameManager.instance
        this.scene = scene
        this.app = this.gameManager.app

        const width = 250
        this.createDim()
        this.createScrollBox(width)
        this.createScrollBg(width)
        this.createScrollContainer()
        this.createButton()
        this.setupTween()

        this.addChild(this.dimBackground, this.button, this.scrollContainer)
        this.position.set(this.app.screen.width / 2, this.app.screen.height / 2)
        GameObjectConstructor(this.scene, this)

        this.gameManager.gameplayPod.gameplayState.subscribe((state) => {
            switch (state) {
                case GameplayState.GameplayState:
                    this.outTween.seek(0.5, false)
                    this.inTween.restart()

                    break
                case GameplayState.ResultState:
                    this.onHide()
                    this.outTween.restart()
                    break
            }
        })
    }

    private createScrollContainer() {
        this.scrollContainer = new PIXI.Container()

        this.scrollContainer.addChild(this.scrollBg, this.scrollBox)
        this.scrollContainer.alpha = 0
        this.scrollContainer.position.set(
            0 - this.scrollBg.width / 2,
            -GameScene.GAME_CONTROLLER_HEIGHT / 2 - this.scrollBg.height
        )
    }

    private createScrollBg(width: number) {
        this.scrollBg = PIXI.Sprite.from('frame')
        this.scrollBg.width = width
        this.scrollBg.height = width * 1.5
    }

    private createDim() {
        this.dimBackground = new PIXI.Graphics()
        this.dimBackground
            .rect(0, 0, GameScene.GAME_CONTROLLER_WIDTH + 40, GameScene.GAME_CONTROLLER_HEIGHT + 40)
            .fill(0x000000).alpha = 0.2
        this.dimBackground.pivot.set(this.dimBackground.width / 2, this.dimBackground.height / 2)
        this.dimBackground.interactive = true
        this.dimBackground.visible = false
    }

    private createScrollBox(width: number) {
        const pad = 10
        this.scrollBox = new ScrollBox({
            elementsMargin: 25,
            width: width - pad,
            height: width * 1.5 - 35,
            radius: 10,
            padding: 10,
        })
        this.scrollBox.position.set(pad, pad)

        this.gameManager.gameplayPod.ballBeans.forEach((bean) => {
            this.scrollBox.addItem(this.createCell(bean))
        })
    }

    private createButton() {
        this.button = new FancyButton({
            defaultView: `menu`,
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

        this.button.height = 50
        this.button.width = 50

        this.button.onPress.connect(() => {
            this.onTicker()
        })

        this.button.position.set(GameScene.GAME_CONTROLLER_WIDTH / 2 - 50, -GameScene.GAME_CONTROLLER_HEIGHT / 2 + 25)
    }

    private createCell(bean: BallBean) {
        const globalStyles: LayoutStyles = {
            root: {
                background: '#2a2a2a',
                width: '90%',
                height: '95%',
                borderRadius: 5,
                position: 'center',
                padding: 15,
                align: 'left',
            },
            header: {
                width: ' 20%',
                height: '100%',
                position: 'left',
            },
            body: {
                height: '100%',
                width: '70%',
                position: 'right',
            },
            score: {
                width: '20%',
                height: '100%',
                position: 'right',
            },
        }

        const circle = PIXI.Sprite.from(bean.assetKey)
        const nameText = bean.name
        const score = bean.score.toString()

        const layoutCell = new Layout({
            id: 'root',
            content: {
                header: {
                    content: circle,
                },
                body: {
                    content: nameText,
                },
                score: {
                    content: score,
                },
            },
            globalStyles,
        })

        layoutCell.width = 225
        layoutCell.height = 50

        circle.height = layoutCell.height
        circle.width = layoutCell.height

        return layoutCell
    }

    private setupTween() {
        this.inTween = gsap.to(this.button, {
            x: this.button.x,
            y: this.button.y,
            alpha: 1,
            duration: 0.5,
            ease: 'back.out',
        })

        this.inTween.pause()

        this.outTween = gsap.to(this.button, {
            x: this.button.x,
            y: -GameScene.GAME_CONTROLLER_HEIGHT / 2 - 100,
            alpha: 0,
            duration: 0.5,
            ease: 'back.in',
        })
        this.outTween.pause()
    }

    private onHide() {
        this.dimBackground.visible = false
        const duration = 0.5
        this.isShow = false

        if (this.tweening != undefined) this.tweening.kill()
        this.tweening = gsap.to(this.scrollContainer, {
            pixi: {
                y: -GameScene.GAME_CONTROLLER_HEIGHT / 2 - this.scrollBg.height,
                x: 0 - this.scrollBg.width / 2,
                alpha: 0,
            },
            duration,
            onComplete: () => {},
            onInterrupt: () => {},
        })
    }

    private onShow() {
        this.dimBackground.visible = true

        const duration = 0.5
        this.isShow = true
        if (this.tweening != undefined) this.tweening.kill()

        this.tweening = gsap.to(this.scrollContainer, {
            pixi: {
                y: 0 - this.scrollBg.height / 2,
                x: 0 - this.scrollBg.width / 2,
                alpha: 1,
            },
            duration,
            onComplete: () => {},
            onInterrupt: () => {},
        })
    }

    public onTicker() {
        if (this.isShow) this.onHide()
        else this.onShow()
    }

    public resize() {
        this.position.set(this.app.screen.width / 2, this.app.screen.height / 2)
    }
}

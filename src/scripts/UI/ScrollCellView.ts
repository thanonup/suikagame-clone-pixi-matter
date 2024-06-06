import * as PIXI from 'pixi.js'
import { BallBean } from '../Beans/BallBean'
import { Layout, LayoutStyles } from '@pixi/layout'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'
import { FancyButton, ScrollBox } from '@pixi/ui'
import { gsap } from 'gsap'

export class ScrollCellView extends PIXI.Container {
    private scene: PIXI.Container
    private gameManager: GameManager
    private scrollBox: ScrollBox
    private button: FancyButton
    private gameController: PIXI.Container

    private tweening: gsap.core.Tween

    private isShow: boolean = false

    constructor(scene: PIXI.Container, gameController: PIXI.Container) {
        super()

        this.gameManager = GameManager.instance
        this.scene = scene
        this.gameController = gameController

        const width = 250
        this.scrollBox = new ScrollBox({
            background: '#ffffff',
            elementsMargin: 25,
            width: width,
            height: width * 1.5,
            radius: 10,
            padding: 10,
        })

        this.gameManager.gameplayPod.ballBeans.forEach((bean) => {
            this.scrollBox.addItem(this.createCell(bean))
        })

        GameObjectConstructor(this.scene, this)

        this.scrollBox.alpha = 0
        this.scrollBox.position.set(
            0 - this.scrollBox.width / 2,
            -this.gameController.height / 2 - this.scrollBox.height
        )

        this.button = this.createButton()
        this.button.position.set(this.gameController.width / 2 - 50, -this.gameController.height / 2 + 25)

        this.addChild(this.scrollBox, this.button)
        this.position.set(this.gameManager.app.screen.width / 2, this.gameManager.app.screen.height / 2)
    }

    private createButton(): FancyButton {
        let button = new FancyButton({
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

        button.height = 50
        button.width = 50

        button.onPress.connect(() => {
            this.onTicker()
        })

        return button
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

        layoutCell.width = 250
        layoutCell.height = 50

        circle.height = layoutCell.height
        circle.width = layoutCell.height

        return layoutCell
    }

    private onHide() {
        const duration = 0.5
        this.isShow = false

        if (this.tweening != undefined) this.tweening.kill()
        this.tweening = gsap.to(this.scrollBox, {
            pixi: {
                y: -this.gameController.height / 2 - this.scrollBox.height,
                x: 0 - this.scrollBox.width / 2,
                alpha: 0,
            },
            duration,
            onComplete: () => {},
            onInterrupt: () => {},
        })
    }

    private onShow() {
        const duration = 0.5
        this.isShow = true
        if (this.tweening != undefined) this.tweening.kill()

        this.tweening = gsap.to(this.scrollBox, {
            pixi: {
                y: 0 - this.scrollBox.height / 2,
                x: 0 - this.scrollBox.width / 2,
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
}

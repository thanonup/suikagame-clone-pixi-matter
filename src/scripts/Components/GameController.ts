import { Application, Graphics } from 'pixi.js'
import { GameObjectConstructor } from '../Plugins/GameObjectConstructor'
import { GameManager } from '../Managers/GameManager'

export class GameController extends Graphics {
    app: Application
    constructor() {
        super()

        this.app = GameManager.instance.app
        GameObjectConstructor(this.app, this)
    }

    public doInit(width: number, height: number) {
        this.rect(0, 0, width, height).fill(0xff0000).alpha = 0.2

        this.eventMode = 'static'
        this.cursor = 'pointer'
        this.on('pointerdown', () => {
            console.log('Click Area')
        })
    }
}

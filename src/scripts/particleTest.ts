import * as PIXI from 'pixi.js'
import { Emitter, EmitterConfigV3, Particle } from '@pixi/particle-emitter'
import * as application from '@pixi/display'
import { GameManager } from './Managers/GameManager'

export class particleTest extends application.Container {
    private app: PIXI.Application
    private particleObject: Particle
    private emitter: Emitter
    constructor() {
        super()

        this.app = GameManager.instance.app
        this.doInit()
    }

    private async doInit() {
        this.emitter = await this.loadEmitter()
        this.particleObject = new Particle(this.emitter)
        var elapsed = Date.now()
        let updateId

        const rendererOptions = {
            width: this.app.stage.width,
            height: this.app.stage.height,
            view: this.app.stage,
        }

        const update = () => {
            // Update the next frame
            updateId = requestAnimationFrame(update)
            const now = Date.now()
            if (this.emitter) {
                // update emitter (convert to seconds)
                this.emitter.update((now - elapsed) * 0.001)
            }
            // // call update hook for specialist examples
            // if (this.updateHook) {
            //     this.updateHook(now - elapsed)
            // }
            elapsed = now
        }
        // Start emitting
        this.emitter.emit = true
        // Start the update
        update()
    }

    private async loadEmitter() {
        var emitter = await PIXI.Assets.load<EmitterConfigV3>('assets/font/PixiJs_particle/emitter.json')
        return new Emitter(this, emitter)
    }
}

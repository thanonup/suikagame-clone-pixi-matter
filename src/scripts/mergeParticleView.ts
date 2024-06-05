import * as PIXI from 'pixi.js'
import { GameManager } from './Managers/GameManager'
import { Emitter, EmitterConfigV3 } from '@barvynkoa/particle-emitter'
import { Subscription } from 'rxjs'
import { BallTypePod } from './Components/Pod/BallTypePod'

export class mergeParticleView extends PIXI.Container {
    private app: PIXI.Application
    private emitter: Emitter

    private pod: BallTypePod
    private beanSubscription: Subscription

    constructor(pod: BallTypePod) {
        super()

        this.pod = pod
        this.app = GameManager.instance.app
        this.doInit()
        this.tickerSetup()
        this.setupSubscribe()
    }

    private setupSubscribe() {
        this.beanSubscription = this.pod.currentBallBean.subscribe((bean) => {
            this.loadEmitter().then((emitter) => {
                this.emitter = emitter
                this.emitter.emit = false
                this.emitter.autoUpdate = true
            })
        })
    }

    private async doInit() {
        this.app.stage.addChild(this)
        this.position.set(0, 0)
    }

    private tickerSetup() {}

    private async loadEmitter() {
        await PIXI.Assets.loadBundle('particle')
        var emitter = await PIXI.Assets.load<EmitterConfigV3>('emitter')
        emitter.behaviors[2].config.speed.list = [
            { time: 0, value: 150 * (this.pod.currentBallBean.value.size / 20) },
            { time: 1, value: 200 * (this.pod.currentBallBean.value.size / 20) },
        ]
        emitter.behaviors[0].config.color.list = this.pod.currentBallBean.value.color

        await PIXI.Assets.load('particle')

        return new Emitter(this, emitter)
    }

    public play() {
        this.emitter.emit = true
        this.emitter.resetPositionTracking()
    }

    public onDestroy() {
        this.pod = undefined
        this.emitter = undefined
        this.beanSubscription?.unsubscribe()
        this?.destroy()
    }
}

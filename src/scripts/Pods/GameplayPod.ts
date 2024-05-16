import { Assets } from 'pixi.js'
import { BallBean } from '../Beans/BallBean'

export class GameplayPod {
    public ballBeans: BallBean[] = []

    public async loadData() {
        const data = await Assets.load<BallBean[]>('/assets/ball-data.json')
        this.ballBeans = data

        console.log('------Data Ball-------')
        console.log(this.ballBeans)
    }
}

import { Assets } from 'pixi.js'
import { BallBean } from '../Beans/BallBean'
import { GameplayState } from '../Enum/GameplayState'
import { BehaviorSubject } from 'rxjs';

export class GameplayPod {
    public ballBeans: BallBean[] = []
    public gameplayState:BehaviorSubject<GameplayState> = new BehaviorSubject<GameplayState>(GameplayState.StartState);

    public async loadData() {
        const data = await Assets.load<BallBean[]>('/assets/ball-data.json')
        this.ballBeans = data

        console.log('------Data Ball-------')
        console.log(this.ballBeans)
    }
}

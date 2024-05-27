import { Assets } from 'pixi.js'
import { BallBean } from '../Beans/BallBean'
import { GameplayState } from '../Enum/GameplayState'
import { BehaviorSubject } from 'rxjs'

export class GameplayPod {
    public ballBeans: BallBean[] = []
    public availableIndexSpawnBall: number = 0
    public maxAvailableIndexSpawnBall: number = 5
    public gameplayState: BehaviorSubject<GameplayState> = new BehaviorSubject<GameplayState>(
        GameplayState.GameplayState
    )

    public async loadData() {
        const data = await Assets.load<BallBean[]>('/assets/ball-data.json')
        this.ballBeans = data

        console.log('------Data Ball-------')
        console.log(this.ballBeans)
    }

    public setGameplayState(state: GameplayState) {
        this.gameplayState.next(state)
    }

    public restartGame() {
        this.availableIndexSpawnBall = 0
    }
}

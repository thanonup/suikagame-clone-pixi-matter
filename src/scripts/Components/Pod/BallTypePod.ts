import { BallBean } from '../../Beans/BallBean'
import { BallStateType } from '../../Types/BallStateType'
import { BehaviorSubject } from 'rxjs'

export class BallTypePod {
    public currentBallBean: BallBean
    public ballStateType: BehaviorSubject<BallStateType> = new BehaviorSubject<BallStateType>(BallStateType.Static)

    constructor(ballBean: BallBean) {
        this.currentBallBean = ballBean
    }

    public changeBallState(state: BallStateType) {
        this.ballStateType.next(state)
    }
}

import { BallBean } from '../../Beans/BallBean'
import { BallStateType } from '../../Types/BallStateType'
import { BehaviorSubject } from 'rxjs'

export class BallTypePod {
    public currentIndex: number
    public initSize: number
    public currentBallBean: BehaviorSubject<BallBean> = new BehaviorSubject<BallBean>(undefined)
    public ballStateType: BehaviorSubject<BallStateType> = new BehaviorSubject<BallStateType>(BallStateType.Static)

    constructor(ballBean: BallBean) {
        this.currentBallBean.next(ballBean)
        this.initSize = ballBean.size
    }

    public setCurrentIndex(index: number) {
        this.currentIndex = index
    }

    public changeBallState(state: BallStateType) {
        this.ballStateType.next(state)
    }

    public changeCurrentBallBean(bean: BallBean) {
        this.currentBallBean.next(bean)
        this.changeBallState(BallStateType.Merge)
    }
}

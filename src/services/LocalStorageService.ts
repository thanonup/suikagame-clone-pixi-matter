import { ScoreSaveBean } from '../scripts/Beans/ScoreSaveBean'

export class LocalStorageService {
    private highScoreBean: ScoreSaveBean

    public getDataScoreData(): ScoreSaveBean {
        let data = localStorage.getItem('scoreData')
        if (data == null || data == undefined) {
            this.highScoreBean = new ScoreSaveBean(0)
        } else {
            this.highScoreBean = JSON.parse(data)
        }

        // console.log(this.highScoreBean)
        return this.highScoreBean
    }

    public saveSettingData(): void {
        //  console.log(this.highScoreBean)
        localStorage.setItem('scoreData', JSON.stringify(this.highScoreBean))
    }
}

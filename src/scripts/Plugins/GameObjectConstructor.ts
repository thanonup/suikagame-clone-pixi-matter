import { Application } from 'pixi.js'

export function GameObjectConstructor(app: Application, gameObject: any) {
    app.stage.addChild(gameObject)

    // scene.events.on("shutdown", () => {
    //     gameObject.destroy(true);
    // });
}

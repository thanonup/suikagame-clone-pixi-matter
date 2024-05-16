import { Application } from 'pixi.js'

export function GameObjectConstructor(app: Application, gameObject: any) {
    app.stage.addChild(gameObject)

    //app.stage.addEventListener()
    // scene.events.on("shutdown", () => {
    //     gameObject.destroy(true);
    // });
}

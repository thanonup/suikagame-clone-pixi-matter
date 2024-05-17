import { Container } from 'pixi.js'

export function GameObjectConstructor(scene: Container, gameObject: any) {
    scene.addChild(gameObject)

    scene.on('removed', () => {
        if (gameObject.onDestroy() != undefined) gameObject.onDestroy()
    })
}

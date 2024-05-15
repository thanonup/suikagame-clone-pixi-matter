import { GameScene } from './scripts/Scenes/GameScene'
import { Application } from 'pixi.js'
import { Bodies, Composite, Engine, Render, Runner } from 'matter-js'

const bootstrap = async () => {
    const backgroundColor = '#fee2b0'

    const app = new Application()

    await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor,
    })

    var container = document.getElementById('container')

    const engine = Engine.create()
    const render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            showAngleIndicator: true,
            showVelocity: true,
            background: 'transparent',
            wireframeBackground: 'transparent',
        },
    })

    render.canvas.id = 'canvas2'
    render.canvas.style.position = 'absolute'

    Render.run(render)

    const runner = Runner.create()
    Runner.run(runner, engine)

    container.appendChild(app.canvas)

    let gameScene = new GameScene(app, engine)
    app.stage.addChild(gameScene)
    gameScene.doInit()
    app.ticker.add(gameScene.update, gameScene)

    app.ticker.add((delta) => {})
}

bootstrap()

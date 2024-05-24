import { GameScene } from './scripts/Scenes/GameScene'
import { Application, Assets } from 'pixi.js'
import { Engine, Render, Runner } from 'matter-js'
import { timer } from 'rxjs'
import Matter from 'matter-js'

const bootstrap = async () => {
    const backgroundColor = '#fee2b0'

    const app = new Application()

    await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor,
    })

    await preload()

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
    render.canvas.style.pointerEvents = 'none'

    Render.run(render)

    const runner = Runner.create()
    Runner.run(runner, engine)

    container.appendChild(app.canvas)

    let gameScene = new GameScene(app, engine)
    app.stage.addChild(gameScene)
    gameScene.doInit().then(() => {
        app.ticker.add(gameScene.update, gameScene)

        resize()
    })

    timer(2000).subscribe((_) => {
        // FOR REMOVE SCENE
        // app.ticker.remove(gameScene.update, gameScene)
        // app.stage.removeChild(gameScene)
    })

    window.addEventListener('resize', resize)

    function resize() {
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        app.renderer.canvas.style.width = `${windowWidth}px`
        app.renderer.canvas.style.height = `${windowHeight}px`
        window.scrollTo(0, 0)
        app.renderer.resize(windowWidth, windowHeight)

        render.bounds.max.x = windowWidth
        render.bounds.max.y = windowHeight
        render.options.width = windowWidth
        render.options.height = windowHeight
        render.canvas.width = windowWidth
        render.canvas.height = windowHeight
        Matter.Render.setPixelRatio(render, window.devicePixelRatio)

        gameScene.resize()
    }
}

async function preload() {
    await Assets.addBundle('uiSprite', {
        start: 'src/sprites/Start.png',
        gameOver: 'src/sprites/GameOver.png',
        restart: 'src/sprites/restart.png',
    })

    await Assets.add({ alias: 'pixelFont', src: 'assets/font/Pixelpoint.ttf' })
}

bootstrap()

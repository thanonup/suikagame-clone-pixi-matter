import { GameScene } from './scripts/Scenes/GameScene'
import { Application, Assets } from 'pixi.js'
import { Engine, Render, Runner } from 'matter-js'
import Matter from 'matter-js'
import { sound } from '@pixi/sound'

const bootstrap = async () => {
    const backgroundColor = '#0C4214'

    const app = new Application()
    //globalThis.__PIXI_APP__ = app

    await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor,
    })

    await preload()

    var container = document.getElementById('container')

    const engine = Engine.create({ gravity: { y: 1.5 } })
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

    // Render.run(render)

    const runner = Runner.create()
    Runner.run(runner, engine)

    container.appendChild(app.canvas)

    let gameScene = new GameScene(app, engine)
    app.stage.addChild(gameScene)
    gameScene.doInit().then(() => {
        app.ticker.add(gameScene.update, gameScene)

        resize()
        window.addEventListener('resize', resize)

        sound.play('musicBackground', { start: 2.5, volume: 0.25, loop: true })
    })

    // timer(1000).subscribe((_) => {
    //     // FOR REMOVE SCENE
    //     app.ticker.remove(gameScene.update, gameScene)
    //     app.stage.removeChild(gameScene)
    // })

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
    await Assets.addBundle('particle', {
        emitter: 'assets/PixiJs_particle/emitter.json',
        testEmitter: 'assets/PixiJs_particle/test_particle.json',
    })

    await Assets.add({ alias: 'particle', src: 'assets/sprites/particle.png' })

    await Assets.add({ alias: 'ball-data', src: 'assets/ball-data.json' })

    await Assets.addBundle('uiSprite', {
        start: 'assets/sprites/Start.png',
        gameOver: 'assets/sprites/GameOver.png',
        restart: 'assets/sprites/restart.png',
        signwood: 'assets/sprites/signwood.png',
        forestbackgorund: 'assets/sprites/forest-backgorund.png',
        fade: 'assets/sprites/fade.png',
    })

    await Assets.addBundle('gameAssets', {
        chick: 'assets/game-assets/chick.png',
        cow: 'assets/game-assets/cow.png',
        deer: 'assets/game-assets/deer.png',
        dragon: 'assets/game-assets/dragon.png',
        goat: 'assets/game-assets/goat.png',
        monkey: 'assets/game-assets/monkey.png',
        pig: 'assets/game-assets/pig.png',
        rabbit: 'assets/game-assets/rabbit.png',
        rat: 'assets/game-assets/rat.png',
        tiger: 'assets/game-assets/tiger.png',
        turtle: 'assets/game-assets/turtle.png',
        wolf: 'assets/game-assets/wolf.png',
    })

    await Assets.addBundle('jungle_btn', {
        about: 'assets/sprites/jungle/btn/about.png',
        close: 'assets/sprites/jungle/btn/close.png',
        menu: 'assets/sprites/jungle/btn/menu.png',
        frame: 'assets/sprites/jungle/level_select/bg.png',
    })

    await Assets.addBundle('fontsLoad', {
        sakuraBlossom: {
            src: 'fonts/sakura-blossom.ttf',
            data: { family: 'sakura-blossom' },
        },
        poetsenOneRegular: {
            src: 'fonts/PoetsenOne-Regular.ttf',
            data: { family: 'PoetsenOne-Regular' },
        },
    })

    sound.add({
        musicBackground: 'sounds/pudding-bgm.mp3',
        destroy: 'sounds/destroy-sound.mp3',
        drop1: 'sounds/drop-sound.mp3',
        drop2: 'sounds/drop2-sound.mp3',
        merge: 'sounds/merge-sound.mp3',
        warning: 'sounds/warning-sound.mp3',
        gameover: 'sounds/gameover-sound.mp3',
        win: 'sounds/winsound.mp3',
    })
}

bootstrap()

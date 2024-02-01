declare global {
    namespace sc {
        interface QuickMenuButtonGroup extends ig.ButtonGroup {
            setButtons(this: this, ...buttons: sc.RingMenuButton[]): void
        }
        interface RingMenuButton {
            ringPos: { ring: number; index: number }
        }

        interface QuickRingMenu {
            currentRingIndex: number
            rings: Record<
                number,
                {
                    offset: number
                    angles: Vec2[]
                    buttons: Record<number, sc.RingMenuButton>
                    maxSize: number
                }
            >
            highestRingIndex: number

            _createRingButton(this: this, name: string, id: number, angle: Vec2, defaultAngle: Vec2, description?: string): sc.RingMenuButton
        }

        namespace AdditionalRingButton {
            type ImageConfig = () => {
                gfx: ig.Image
                pos: Vec2
                srcPos: Vec2
                size: Vec2
            }
            type Config = {
                name: string
                pressEvent?: (button: sc.RingMenuButton) => void
                keepPressed?: boolean
                description?: string
                id?: number
                additionalInit?: (button: sc.RingMenuButton) => void
            } & (
                | {
                      image: ImageConfig
                      _imageDataCached: ReturnType<ImageConfig>
                  }
                | {
                      draw: (renderer: ig.GuiRenderer, button: sc.RingMenuButton) => void
                  }
                | {}
            )
        }
        interface QuickRingMenuConstructor {
            ringConfigs: Record<number, Record<number, sc.AdditionalRingButton.Config>>
            addConfigFunctionList: (() => void)[]
        }
    }
}

let quickRingMenuIns: sc.QuickRingMenu

function setDefaultConfig() {
    const defaultDraw = (renderer: ig.GuiRenderer, button: sc.RingMenuButton) => {
        renderer.addGfx(button.gfx, 0, 0, 400, 304, 32, 32)
        button.active
            ? button.focus
                ? renderer.addGfx(button.gfx, 0, 0, 400, 336, 32, 32).setAlpha(button.alpha)
                : button.pressed && renderer.addGfx(button.gfx, 0, 0, 400, 336, 32, 32)
            : button.focus && renderer.addGfx(button.gfx, 0, 0, 400, 272, 32, 32)
        renderer.addGfx(button.gfx, 8, 8, 432 + (button.state - 1) * 16, 352 + (button.active ? 0 : 16), 16, 16)
    }
    sc.QuickRingMenu.ringConfigs[0] ??= {}
    sc.QuickRingMenu.ringConfigs[0][0] = {
        name: 'items',
        id: sc.QUICK_MENU_STATE.ITEMS,
        draw: defaultDraw,
        additionalInit: button => {
            quickRingMenuIns.items = button
            button.addChildGui(new sc.ItemTimerOverlay(button))
        },
    }
    sc.QuickRingMenu.ringConfigs[0][2] = {
        name: 'analyze',
        id: sc.QUICK_MENU_STATE.CHECK,
        draw: defaultDraw,
        additionalInit: button => {
            quickRingMenuIns.check = button
        },
    }
    sc.QuickRingMenu.ringConfigs[0][4] = {
        name: 'party',
        id: sc.QUICK_MENU_STATE.PARTY,
        draw: defaultDraw,
        additionalInit: button => {
            quickRingMenuIns.party = button
        },
    }
    sc.QuickRingMenu.ringConfigs[0][6] = {
        name: 'map',
        id: sc.QUICK_MENU_STATE.MAP,
        draw: defaultDraw,
        additionalInit: button => {
            quickRingMenuIns.map = button
        },
    }
}

export function getRingMaxSize(ring: number) {
    return (ring + 1) * 8
}

export function quickMenuExtension() {
    /* in prestart */

    sc.QuickMenuButtonGroup.inject({
        setButtons(...args) {
            args.forEach((btn, i) => btn && this.addFocusGui(btn as ig.FocusGui, 0, i + 1))
        },

        doButtonTraversal(inputRegained) {
            if (!inputRegained) {
                sc.control.menuConfirm() && this.invokeCurrentButton()

                const dirVec: Vec2 = Vec2.createC(ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X), ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y))
                if (Vec2.isZero(dirVec)) return

                const angles = quickRingMenuIns.rings[quickRingMenuIns.currentRingIndex]?.angles
                if (!angles) return
                const closest =
                    angles.reduce(
                        (acc: [number, number], vec: Vec2, i: number) => {
                            const dist = Vec2.distance(dirVec, vec)
                            if (dist < acc[0]) return [dist, i] as [number, number]
                            return acc
                        },
                        [1000, -1]
                    )[1] +
                    1 +
                    quickRingMenuIns.rings[quickRingMenuIns.currentRingIndex].offset
                if (this.elements[0][closest]) this.focusCurrentButton(0, closest)
            }
        },
    })

    sc.QuickRingMenu.ringConfigs = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {} }
    sc.QuickRingMenu.addConfigFunctionList = []
    setDefaultConfig()

    sc.QuickRingMenu.inject({
        init() {
            sc.QuickRingMenu.addConfigFunctionList.forEach(f => f())
            this.currentRingIndex = 0
            quickRingMenuIns = this
            this.parent()
            this.buttongroup.addPressCallback(button1 => {
                const button = button1 as sc.RingMenuButton
                const ringPos = button.ringPos
                if (!ringPos) return
                const config = sc.QuickRingMenu.ringConfigs[ringPos.ring][ringPos.index]
                if (config?.pressEvent) {
                    config.pressEvent(button)
                    this._unfocusAll()
                }
            })
        },
        show() {
            this.parent()
            this.currentRingIndex = 0
        },
        update() {
            this.parent()
            if (sc.quickmodel.activeState && sc.quickmodel.isQuickNone()) {
                const add = ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_SHOULDER) ? -1 : ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_SHOULDER) ? 1 : 0
                if (add != 0) {
                    this.currentRingIndex += add
                    if (this.currentRingIndex < 0) {
                        this.currentRingIndex = this.highestRingIndex
                    } else if (this.currentRingIndex >= this.highestRingIndex + 1) {
                        this.currentRingIndex = 0
                    }
                    ;(sc.BUTTON_SOUND.submit as ig.SoundWebAudio).play()
                }
            }
        },
        createButtons() {
            function angleVec(angle: number): Vec2 {
                angle = (angle + 180) % 360
                return {
                    x: Math.sin((angle * Math.PI) / 180),
                    y: Math.cos((angle * Math.PI) / 180),
                }
            }
            this.rings = {}

            const ringCountToInit = 5
            const allButtons: sc.RingMenuButton[] = []
            let nextId: number = Object.keys(sc.QUICK_MENU_STATE).length

            for (let ring = 0; ring < ringCountToInit; ring++) {
                const ringConfs = sc.QuickRingMenu.ringConfigs[ring]
                if (!ringConfs) continue
                let angles: Vec2[] = []
                const maxSize = getRingMaxSize(ring)
                for (let angle = 0; angle < 360; angle += 360 / maxSize) {
                    angles.push(angleVec(angle))
                }

                const multiplier = (ring + 1) * 35
                const positions = angles.map(vec => Vec2.addC(Vec2.mulC(Vec2.create(vec), multiplier), 56))

                const buttons: Record<string, sc.RingMenuButton> = {}

                const offset = ring == 0 ? 0 : Object.keys(sc.QUICK_MENU_STATE).length - 1
                const defaultPos = ring == 0 ? positions[0] : this.rings[0].angles[0]

                const confs = sc.QuickRingMenu.ringConfigs[ring]
                for (let index = 0; index < maxSize; index++) {
                    const conf = confs[index]
                    if (!conf) continue

                    const id = conf.id ?? nextId
                    const button = this._createRingButton(conf.name, id, positions[index], defaultPos, conf.description)
                    button.ringPos = { ring, index }
                    if (conf.additionalInit) conf.additionalInit(button)
                    if (conf.keepPressed !== undefined) button.keepPressed = conf.keepPressed
                    if (conf.id === undefined) {
                        // @ts-expect-error
                        sc.QUICK_MENU_STATE[conf.name.toUpperCase()] = id
                        nextId++
                    }
                    allButtons.push(button)
                    buttons[index] = button
                }
                angles = angles.filter((_, i) => ringConfs[i])
                this.rings[ring] = {
                    offset,
                    buttons,
                    angles,
                    maxSize,
                }
            }

            this.highestRingIndex = Object.keys(this.rings)
                .map(Number)
                .reduce((acc, val) => (acc < val ? val : acc), 0)

            this.buttongroup.setButtons(...allButtons)
        },
        // @ts-expect-error why??
        _createRingButton(this: sc.QuickRingMenu, name: string, id: number, angle: Vec2, defaultAngle: Vec2, description?: string) {
            const button = new sc.RingMenuButton(id, Math.floor(angle.x - 16) + 1, Math.floor(angle.y - 16) + 1)
            button.data = description ?? ig.lang.get('sc.gui.quick-menu.description.' + name)
            button.endPosActive.x = Math.floor(defaultAngle.x - 16) + 1
            button.endPosActive.y = Math.floor(defaultAngle.y - 16) + 5
            this.addChildGui(button)
            this.buttons[id - 1] = button
            return button
        },
    })

    sc.RingMenuButton.inject({
        updateDrawables(renderer) {
            const ringPos = this.ringPos
            const conf = sc.QuickRingMenu.ringConfigs[ringPos.ring][ringPos.index]
            if ('draw' in conf) return conf.draw(renderer, this)
            /* stolen */
            renderer.addGfx(this.gfx, 0, 0, 400, 304, 32, 32)
            this.active
                ? this.focus
                    ? renderer.addGfx(this.gfx, 0, 0, 400, 336, 32, 32).setAlpha(this.alpha)
                    : this.pressed && renderer.addGfx(this.gfx, 0, 0, 400, 336, 32, 32)
                : this.focus && renderer.addGfx(this.gfx, 0, 0, 400, 272, 32, 32)
            /* stolen end */
            if (!conf || !('image' in conf)) return

            let data = (conf._imageDataCached ??= conf.image())
            const { pos, srcPos, size } = data
            renderer.addGfx(data.gfx, pos.x, pos.y, srcPos.x, srcPos.y, size.x, size.y)
        },
    })
}

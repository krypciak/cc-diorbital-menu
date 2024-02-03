import { addDefaultWidgeds } from './defaultWidgets'
import './global'

declare global {
    namespace sc {
        interface QuickMenuButtonGroup extends ig.ButtonGroup {
            lastDir: Vec2
            elements: sc.RingMenuButton[][]

            setButtons(this: this, ...buttons: sc.RingMenuButton[]): void
            doButtonTraversal(this: this, focusRegained?: boolean, dirOverride?: Vec2): void
        }
        interface RingMenuButton {
            title: string
            ringId: number
        }

        interface QuickRingMenu {
            currentRingIndex: number
            ringAngles: Record<number, { pure: Vec2; position: Vec2 }>
            selectedToMoveButton?: sc.RingMenuButton
            dummyButtonsCreated?: boolean
            availibleWidgetsButtonGroup: sc.QuickMenuButtonGroup
            possibleSelGridIds: number[]
            editModeOn: boolean

            createButton(this: this, widget: sc.QuickMenuWidget): sc.RingMenuButton
            setButtonId(this: this, button: sc.RingMenuButton, id: number): void
            enterEditMode(this: this): void
            exitEditMode(this: this): void
            showDummyButtons(this: this): void
            hideDummyButtons(this: this): void
            nextRing(this: this, add: number): void
        }
        interface QuickRingMenuConstructor {
            ringConfiguration: Record<number, string>
            widgets: Record<string, sc.QuickMenuWidget>
            instance: QuickRingMenu
            addConfigFunctionList: (() => void)[]
        }
    }
}

export function getRingMaxSize(ring: number) {
    return (ring + 1) * 8
}

function angleVec(angle: number): Vec2 {
    angle = (angle + 180) % 360
    return {
        x: Math.sin((angle * Math.PI) / 180),
        y: Math.cos((angle * Math.PI) / 180),
    }
}

function getIdFromRingPos(ring: number, index: number): number {
    return ring * 1000 + index
}

function getRingPosFromId(id: number) {
    return { ring: Math.floor(id / 1000), index: id % 1000 }
}

function getWidgetFromId(id: number) {
    return sc.QuickRingMenu.widgets[sc.QuickRingMenu.ringConfiguration[id]]
}

const ringCountToInit = 4
const possibleIds: number[] = []
for (let ring = 0; ring < ringCountToInit; ring++) {
    const maxSize = getRingMaxSize(ring)
    for (let index = 0; index < maxSize; index++) possibleIds.push(getIdFromRingPos(ring, index))
}

function getAllIdsFromRing(ring: number) {
    return Object.keys(sc.QuickRingMenu.ringConfiguration)
        .map(Number)
        .filter(id => getRingPosFromId(id).ring == ring)
}

function patchButtonTraversal() {
    sc.QuickMenuButtonGroup.inject({
        setButtons(...args) {
            args.forEach((btn, i) => btn && this.addFocusGui(btn as ig.FocusGui, 0, i))
        },
        doButtonTraversal(inputRegained, dirOverride?: Vec2) {
            if (!inputRegained || dirOverride) {
                sc.control.menuConfirm() && this.invokeCurrentButton()

                const dirVec: Vec2 = dirOverride ?? Vec2.createC(ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X), ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y))
                if (Vec2.isZero(dirVec)) return
                this.lastDir = dirVec

                const ids = getAllIdsFromRing(sc.QuickRingMenu.instance.currentRingIndex)
                if (ids.length == 0) return
                const angles = ids.map(id => sc.QuickRingMenu.instance.ringAngles[id].pure)

                const closestIndex = angles.reduce(
                    (acc: [number, number], vec: Vec2, i: number) => {
                        const dist = Vec2.distance(dirVec, vec)
                        if (dist < acc[0]) return [dist, i] as [number, number]
                        return acc
                    },
                    [1000, -1]
                )[1]
                const id = ids[closestIndex]
                for (let i = 0; i < this.elements[0].length; i++) {
                    const button = this.elements[0][i]
                    if (button?.ringId == id) {
                        this.focusCurrentButton(0, i)
                        break
                    }
                }
            }
        },
    })
}

const localStorageConfigId = 'quickMenuConfig'
function saveConfig(possibleSelGridIds: number[]) {
    const save = { ...sc.QuickRingMenu.ringConfiguration }
    for (const id of possibleIds) {
        const name = save[id]
        if (name.startsWith('dummy')) delete save[id]
    }
    for (const id of possibleSelGridIds) delete save[id]
    localStorage.setItem(localStorageConfigId, JSON.stringify(save))
}
function loadConfig() {
    sc.QuickRingMenu.ringConfiguration = JSON.parse(
        localStorage.getItem(localStorageConfigId) ??
            JSON.stringify({
                [getIdFromRingPos(0, 0)]: 'items',
                [getIdFromRingPos(0, 2)]: 'analyze',
                [getIdFromRingPos(0, 4)]: 'party',
                [getIdFromRingPos(0, 6)]: 'map',
            })
    )
}

export function initExtensionVars() {
    sc.QuickRingMenu.widgets = {}
    sc.QuickRingMenu.addWidget = (widget: sc.QuickMenuWidget) => {
        const key = widget.key ?? widget.name
        if (sc.QuickRingMenu.widgets[key]) throw new Error(`Widget: "${widget.key}" already assigned.`)
        sc.QuickRingMenu.widgets[key] = widget
    }
    sc.QuickRingMenu.addConfigFunctionList = []
    sc.QuickRingMenu.addFunctionBeforeInit = func => {
        sc.QuickRingMenu.addConfigFunctionList.push(func)
    }
}

export function quickMenuExtension() {
    /* in prestart */

    loadConfig()

    patchButtonTraversal()

    addDefaultWidgeds()

    sc.QuickRingMenu.inject({
        init() {
            sc.QuickRingMenu.addConfigFunctionList.forEach(f => f())

            sc.QuickRingMenu.instance = this
            this.ringAngles = {}

            this.currentRingIndex = -1
            this.nextRing(1)

            for (let ring = 0; ring < ringCountToInit; ring++) {
                const multiplier = (ring + 1) * 35
                const maxSize = getRingMaxSize(ring)
                for (let angle = 0, index = 0; angle < 360; angle += 360 / maxSize, index++) {
                    const pure = angleVec(angle)
                    const position = Vec2.addC(Vec2.mulC(Vec2.create(pure), multiplier), 56)
                    const id = getIdFromRingPos(ring, index)
                    this.ringAngles[id] = { pure, position }
                }
            }

            /* the last ring is not accually a ring, but a selection "menu" */
            const selW = 4
            const selGridPos: Vec2 = { x: 207, y: -80 }
            this.possibleSelGridIds = Object.keys(sc.QuickRingMenu.widgets)
                .sort()
                .map((name, i) => {
                    const id = getIdFromRingPos(ringCountToInit, i)
                    sc.QuickRingMenu.ringConfiguration[id] = name
                    const y = Math.floor(i / selW)
                    const x = (i % selW) + (y % 2) / 2
                    const position = Vec2.create(selGridPos)
                    Vec2.addC(position, x * 33, y * 17)
                    this.ringAngles[id] = { pure: Vec2.create() /* the last ring is a grid, not a ring */, position }
                    return id
                })

            this.parent()
            this.buttongroup.addPressCallback(button1 => {
                const button = button1 as sc.RingMenuButton
                const config = getWidgetFromId(button.ringId)
                if (config?.pressEvent) {
                    config.pressEvent(button)
                    this._unfocusAll()
                }
            })
        },
        enter() {
            this.parent()
            this.selectedToMoveButton = undefined
            this.exitEditMode()
            this.currentRingIndex = -1
            this.nextRing(1)
        },
        nextRing(add) {
            let maxIte = 10
            do {
                this.currentRingIndex += add
                if (this.currentRingIndex < 0) {
                    this.currentRingIndex = ringCountToInit - 1
                } else if (this.currentRingIndex >= ringCountToInit) {
                    this.currentRingIndex = 0
                }
                /* prevent freeze */
                maxIte--
                if (maxIte <= 0) {
                    this.currentRingIndex = 0
                    break
                }
            } while (getAllIdsFromRing(this.currentRingIndex).length == 0)
        },
        update() {
            this.parent()
            if (sc.quickmodel.activeState && sc.quickmodel.isQuickNone()) {
                const add = ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_SHOULDER) ? -1 : ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_SHOULDER) ? 1 : 0
                if (add != 0) {
                    this.nextRing(add)
                    this.buttongroup.doButtonTraversal(false, this.buttongroup.lastDir)
                    sc.BUTTON_SOUND.submit.play()
                }

                const isGamepad = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD
                if (isGamepad ? ig.gamepad.isButtonPressed(ig.BUTTONS.FACE2 /* x */) : ig.input.pressed('dash') /* right click */) {
                    if (!this.selectedToMoveButton) {
                        if (this.editModeOn) {
                            this.selectedToMoveButton = focusedButton
                            sc.BUTTON_SOUND.toggle_on.play()
                        } else {
                            sc.BUTTON_SOUND.submit.play()
                        }
                        this.enterEditMode()
                    } else {
                        const fromB = this.selectedToMoveButton
                        const toB = focusedButton
                        if (toB) {
                            let fromWidget: string = sc.QuickRingMenu.ringConfiguration[fromB.ringId]
                            let toWidget: string = sc.QuickRingMenu.ringConfiguration[toB.ringId]

                            const fromRing: number = getRingPosFromId(fromB.ringId).ring
                            const toRing: number = getRingPosFromId(toB.ringId).ring
                            if (fromRing == ringCountToInit) {
                                if (toRing != ringCountToInit) {
                                    sc.QuickRingMenu.ringConfiguration[toB.ringId] = fromWidget
                                }
                            } else {
                                if (toRing == ringCountToInit) {
                                    sc.QuickRingMenu.ringConfiguration[fromB.ringId] = `dummy${fromB.ringId}`
                                } else {
                                    sc.QuickRingMenu.ringConfiguration[fromB.ringId] = toWidget
                                    sc.QuickRingMenu.ringConfiguration[toB.ringId] = fromWidget
                                }
                            }

                            saveConfig(this.possibleSelGridIds)

                            this.selectedToMoveButton = undefined
                            sc.BUTTON_SOUND.toggle_off.play()
                        }
                    }
                }
            }
        },
        createButton(widget) {
            const button = new sc.RingMenuButton(widget.id ?? -1, 0, 0)
            button.title = widget.title ?? ig.lang.get(`sc.gui.quick-menu.title.${widget.name}`) ?? widget.name
            button.data = widget.description ?? ig.lang.get(`sc.gui.quick-menu.description.${widget.name}`) ?? widget.name

            const defaultAngle = this.ringAngles[0].position
            button.endPosActive.x = Math.floor(defaultAngle.x - 16) + 1
            button.endPosActive.y = Math.floor(defaultAngle.y - 16) + 5

            widget.additionalInit && widget.additionalInit(button)
            widget.keepPressed !== undefined && (button.keepPressed = widget.keepPressed)

            return button
        },
        setButtonId(button, id) {
            const positionAngle = this.ringAngles[id].position
            button.endPos = { x: Math.floor(positionAngle.x - 16) + 1, y: Math.floor(positionAngle.y - 16) + 1 }
            button.setPos(button.endPos.x, button.endPos.y)
            button.ringId = id
        },
        createButtons() {
            if (this.buttons) for (const button of this.buttons) this.removeChildGui(button)
            this.buttons = []
            for (let i = 0; i < this.buttongroup.elements[0].length; i++) this.buttongroup.removeFocusGui(0, i)

            /* these default buttons have to be initialized even if they're not displayed (they game will cry otherwise )*/
            /* the !!_ are so they appear at the top of the widget grid */
            const needToInitialze = new Set<string>(['11_items', '11_analyze', '11_party', '11_map'])

            for (const id of [...possibleIds, ...(this.editModeOn ? this.possibleSelGridIds : [])]) {
                const widgetName = sc.QuickRingMenu.ringConfiguration[id]
                if (!widgetName) continue
                const widget = sc.QuickRingMenu.widgets[widgetName]
                if (!widget) {
                    delete sc.QuickRingMenu.ringConfiguration[id]
                    continue
                }
                const button = this.createButton(widget)
                this.setButtonId(button, id)
                this.addChildGui(button)
                this.buttons.push(button)

                needToInitialze.delete(widgetName)
            }

            for (const name of needToInitialze) this.createButton(sc.QuickRingMenu.widgets[name])

            this.buttongroup.setButtons(...this.buttons)
        },
        _createRingButton() {
            throw new Error('cc-quick-menu-ext: This way of creating quick menu buttons is not supported.')
        },
        enterEditMode() {
            this.editModeOn = true
            this.showDummyButtons()
        },
        exitEditMode() {
            this.editModeOn = false
            this.hideDummyButtons()
        },
        showDummyButtons() {
            if (!this.dummyButtonsCreated) {
                for (const id of possibleIds) {
                    sc.QuickRingMenu.addWidget({
                        name: `dummy${id}`,
                        title: `Replacement button ${id}`,
                        description: '',
                    })
                }
                this.dummyButtonsCreated = true
            }
            for (const id of possibleIds) {
                if (sc.QuickRingMenu.ringConfiguration[id]) continue
                sc.QuickRingMenu.ringConfiguration[id] = `dummy${id}`
            }
            this.createButtons()
        },
        hideDummyButtons() {
            let anyHidden = false
            for (const id of possibleIds) {
                const widgetName = sc.QuickRingMenu.ringConfiguration[id]
                if (widgetName && widgetName.startsWith('dummy')) {
                    delete sc.QuickRingMenu.ringConfiguration[id]
                    anyHidden = true
                }
            }
            anyHidden && this.createButtons()
        },
    })

    let focusedButton: sc.RingMenuButton | undefined
    sc.RingMenuButton.inject({
        focusGained() {
            this.parent()
            focusedButton = this
        },
        focusLost() {
            this.parent()
            focusedButton = undefined
        },
        updateDrawables(renderer) {
            const widget = sc.QuickRingMenu.widgets[sc.QuickRingMenu.ringConfiguration[this.ringId]]
            // if ('draw' in widget) return widget.draw(renderer, this)
            /* stolen */
            renderer.addGfx(this.gfx, 0, 0, 400, 304, 32, 32)
            this.active
                ? this.focus
                    ? renderer.addGfx(this.gfx, 0, 0, 400, 336, 32, 32).setAlpha(this.alpha)
                    : this.pressed && renderer.addGfx(this.gfx, 0, 0, 400, 336, 32, 32)
                : this.focus && renderer.addGfx(this.gfx, 0, 0, 400, 272, 32, 32)
            /* stolen end */
            if (!('image' in widget)) return

            let data = (widget._imageDataCached ??= widget.image(this))
            const { pos, srcPos, size } = data
            renderer.addGfx(data.gfx, pos.x, pos.y, srcPos.x, srcPos.y, size.x, size.y)
        },
    })
}

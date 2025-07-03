import { Drawer } from "../drawer/Drawer"
import { Point } from "../drawer/Point"
import { Disposable, DISPOSE } from "../eventLib/Disposable"
import { EventEmitter } from "../eventLib/EventEmitter"
import { EventListener } from "../eventLib/EventListener"

const KEYS = Symbol("keys")

export type KeyCode = "Backspace" | "Tab" | "Enter" | "ShiftLeft" | "ShiftRight" | "ControlLeft" |
    "ControlRight" | "AltLeft" | "AltRight" | "Pause" | "CapsLock" | "Escape" | "Space" | "PageUp" |
    "PageDown" | "End" | "Home" | "ArrowLeft" | "ArrowUp" | "ArrowRight" | "ArrowDown" | "PrintScreen" |
    "Insert" | "Delete" | "Digit0" | "Digit1" | "Digit2" | "Digit3" | "Digit4" | "Digit5" | "Digit6" |
    "Digit7" | "Digit8" | "Digit9" | "KeyA" | "KeyB" | "KeyC" | "KeyD" | "KeyE" | "KeyF" | "KeyG" | "KeyH" |
    "KeyI" | "KeyJ" | "KeyK" | "KeyL" | "KeyM" | "KeyN" | "KeyO" | "KeyP" | "KeyQ" | "KeyR" | "KeyS" |
    "KeyT" | "KeyU" | "KeyV" | "KeyW" | "KeyX" | "KeyY" | "KeyZ" | "MetaLeft" | "MetaRight" | "ContextMenu" |
    "Numpad0" | "Numpad1" | "Numpad2" | "Numpad3" | "Numpad4" | "Numpad5" | "Numpad6" | "Numpad7" | "Numpad8" |
    "Numpad9" | "NumpadMultiply" | "NumpadAdd" | "NumpadSubtract" | "NumpadDecimal" | "NumpadDivide" | "F1" |
    "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8" | "F9" | "F10" | "F11" | "F12" | "NumLock" | "ScrollLock" |
    "Semicolon" | "Equal" | "Comma" | "Minus" | "Period" | "Slash" |
    "Backquote" | "BracketLeft" | "Backslash" | "BracketRight" | "Quote"

export class DrawerInput extends EventListener {
    public readonly mouse = new DrawerInput.Mouse()
    public readonly keyboard = new DrawerInput.Keyboard()
    public readonly touch = new DrawerInput.TouchSurface()
    public readonly onContextMenu = new EventEmitter<{ pos: Point }>()
    /** Triggers every frame */
    public readonly onDraw = new EventEmitter<{ deltaTime: number }>()
    /** The drawer currently being used, only guaranteed to work in event handlers */
    public drawer!: Drawer
    /** Current time in milliseconds */
    public time = -1
    /** Time elapsed since last frame */
    public deltaTime = 0
    public readonly onResize = new EventEmitter()

    public controlCamera(camera: Drawer.Camera, { listener = this as EventListener, zoom = true, translate = true, onUpdate = null as null | (() => void) } = {}) {
        const ZOOM_LEVELS = Drawer.Camera.ZOOM_LEVELS
        if (translate) {
            this.mouse.middle.onDrag.add(listener, ({ delta }) => {
                camera.translate(delta)
                onUpdate?.()
            })
        }

        const preformZoom = (delta: number) => {
            if (!zoom) return
            const level = ZOOM_LEVELS.findIndex(v => v >= camera.scale)
            const newLevel = Math.max(0, Math.min(level + delta, ZOOM_LEVELS.length - 1))
            camera.zoomViewport(ZOOM_LEVELS[newLevel], this.mouse.pos, this.drawer.size)
            onUpdate?.()
        }

        this.mouse.onWheel.add(listener, ({ delta }) => {
            if (this.keyboard.key("ControlLeft").down) {
                preformZoom(delta.y)
                return
            }

            if (translate) {
                if (this.keyboard.key("ShiftLeft").down) {
                    camera.translate(new Point(delta.y, delta.x))
                    onUpdate?.()
                    return
                }

                camera.translate(delta.mul(-1))
                onUpdate?.()
            }
        })

        if (zoom) {
            this.keyboard.key("NumpadAdd").onDown.add(listener, () => preformZoom(1))
            this.keyboard.key("NumpadSubtract").onDown.add(listener, () => preformZoom(-1))
        }
    }

    public processMouseInput(drawer: Drawer, type: "up" | "down" | "move" | "leave" | "enter" | "context", event: MouseEvent, local = true) {
        this.drawer = drawer

        if (type == "leave") {
            this.mouse.over = false
            return
        }

        if (type == "enter") {
            this.mouse.over = true
            void (document.activeElement as HTMLElement)?.blur?.()
            return
        }

        let pos
        if (local) {
            pos = new Point(event.offsetX, event.offsetY)
        } else {
            const boundingRect = drawer.ctx.canvas.getBoundingClientRect()
            pos = new Point(event.pageX - boundingRect.x, event.pageY - boundingRect.y)
        }

        const lastPos = this.mouse.pos
        this.mouse.pos = pos
        const delta = pos.add(lastPos.mul(-1))

        this.mouse.onMove.emit({ pos, lastPos, delta })

        if (type == "context") {
            this.onContextMenu.emit({ pos })
            return
        }

        for (const button of [this.mouse.left, this.mouse.middle, this.mouse.right, this.mouse.any]) {
            if (button.down) {
                button.onMove.emit({ pos, delta, lastPos })

                if (!button.dragging && button.downPos.dist(pos) > this.dragThreshold) {
                    button.dragging = true
                    button.onDragStart.emit({ pos: button.downPos })

                    button.onDrag.emit({
                        pos, start: button.downPos,
                        delta: pos.add(button.downPos.mul(-1)),
                        lastPos: button.downPos
                    })
                }

                if (button.dragging) {
                    button.onDrag.emit({ pos, delta, lastPos, start: button.downPos })
                }
            }

            if (type != "move" && (button.buttonIndex == null || button.buttonIndex == event.button)) {
                if (type == "down") {
                    button.down = true
                    button.downPos = pos
                    button.onDown.emit({ pos })
                }
                if (type == "up") {
                    button.down = false
                    button.onUp.emit({ pos })
                    if (button.dragging) button.onDragEnd.emit({ pos })
                    button.dragging = false
                }
            }

            /* if (type == "leave") {
                button.down = false
                button.onUp.emit({ pos })
                if (button.dragging) button.onDragEnd.emit({ pos })
                button.dragging = false
            } */
        }
    }

    public processDrawEvent(drawer: Drawer, deltaTime: number | null = null) {
        this.drawer = drawer
        if (this.time == -1 && deltaTime == null) {
            this.time = Date.now()
        }

        let actualDeltaTime: number

        if (deltaTime != null) {
            this.time += deltaTime
            actualDeltaTime = deltaTime
        } else {
            actualDeltaTime = Date.now() - this.time
            this.time = Date.now()
        }

        this.mouse.delta = this.mouse.pos.add(this.mouse.lastPos.mul(-1))

        this.deltaTime = actualDeltaTime
        this.onDraw.emit({ deltaTime: actualDeltaTime })

        this.mouse.lastPos = this.mouse.pos
        this.mouse.wheelDelta = Point.zero

        for (const button of [this.mouse.left, this.mouse.middle, this.mouse.right, this.mouse.any]) {
            button.lastDown = button.down
            button.lastDragging = button.dragging
        }

        for (const key of Object.values(this.keyboard[KEYS])) {
            key.lastDown = key.down
        }
    }

    public processKeyboardEvent(drawer: Drawer, type: "up" | "down", event: KeyboardEvent) {
        const target = event.target as HTMLElement
        if (target && (target.tagName.toLowerCase() == "input" || target.tagName.toLowerCase() == "textarea") && !target.dataset.drawerInputIgnore) return

        const key = this.keyboard.key(event.code as KeyCode)
        const text = (
            (event.ctrlKey ? "Ctrl+" : "") +
            (event.altKey ? "Alt+" : "") +
            event.key
        )

        if (type == "down") {
            key.down = true
            key.onDown.emit()
            this.keyboard.onDown.emit({ key, text })
        }

        if (type == "up") {
            key.down = false
            key.onUp.emit()
            this.keyboard.onUp.emit({ key, text })
        }
    }

    public processTouchEvent(drawer: Drawer, type: "start" | "move" | "end", event: TouchEvent) {
        const drawerPos = new Point(this.drawer.ctx.canvas.clientLeft, this.drawer.ctx.canvas.clientTop)

        for (let i = 0, len = event.changedTouches.length; i < len; i++) {
            const touch = event.changedTouches.item(i)
            if (touch == null) continue

            const clientPos = new Point(touch.clientX, touch.clientY)

            let pos = clientPos.add(drawerPos.mul(-1))
            if (this.transformTouchPos) {
                pos = this.transformTouchPos(pos, this.drawer.size.size())
            }

            if (type == "start") {
                this.touch.count++

                const instance = this.touch.list[touch.identifier] = new DrawerInput.TouchInstance(touch.identifier)
                instance.lastPos = instance.pos = pos

                this.touch.onStart.emit({ instance, pos })
            } else {
                const instance = this.touch.list[touch.identifier]
                const lastPos = instance.lastPos = instance.pos
                instance.pos = pos

                if (type == "move") {
                    instance.onMove.emit({ pos, lastPos })
                    this.touch.onMove.emit({ pos, lastPos, instance })
                }

                if (type == "end") {
                    this.touch.count--

                    instance.onEnd.emit({ pos, lastPos })
                    this.touch.onEnd.emit({ pos, lastPos, instance })

                    instance.dispose()
                    delete this.touch.list[touch.identifier]
                }
            }
        }
    }

    public processWheelEvent(event: WheelEvent) {
        const delta = new Point(event.deltaX, event.deltaY)
        this.mouse.wheelDelta = delta
        this.mouse.onWheel.emit({ delta })
    }

    public transformTouchPos: null | ((point: Point, size: Point) => Point) = null

    constructor(
        public dragThreshold = 10
    ) { super() }
}

export namespace DrawerInput {
    export class Mouse extends Disposable {
        public readonly left = new MouseButton(0)
        public readonly right = new MouseButton(2)
        public readonly middle = new MouseButton(1)
        public readonly any = new MouseButton(null)

        /** if the mouse is over the canvas */
        public over = false
        /** Position of the mouse */
        public pos = new Point()
        /** Movement of the mouse since last frame */
        public delta = new Point()
        /** Position of the mouse last frame */
        public lastPos = new Point()
        /** Triggers when the mouse moves */
        public readonly onMove = new EventEmitter<{ pos: Point, delta: Point, lastPos: Point }>()
        public wheelDelta = Point.zero
        public readonly onWheel = new EventEmitter<{ delta: Point }>()
    }

    export class MouseButton extends Disposable {
        /** Is this button down */
        public down = false
        /** Is was this button down last frame */
        public lastDown = false
        public downPos = new Point()
        public dragging = false
        public lastDragging = false
        /** Triggers when this button is pressed */
        public readonly onDown = new EventEmitter<{ pos: Point }>()
        /** Triggers when this button is released */
        public readonly onUp = new EventEmitter<{ pos: Point }>()
        /** Triggers when the mouse moves when this button is down. Only triggers
         *  after the mouse moves a distance from the origin to prevent triggering 
         *  during clicking, to trigger anyway use onMove */
        public readonly onDrag = new EventEmitter<{ pos: Point, delta: Point, lastPos: Point, start: Point }>()
        /** Triggers when dragging starts
         *  @see {onDrag} */
        public readonly onDragStart = new EventEmitter<{ pos: Point }>()
        /** Triggers when dragging stops
         *  @see {onDrag} */
        public readonly onDragEnd = new EventEmitter<{ pos: Point }>()
        /** Triggers when the mouse moves when this button is down. Can trigger
         *  during clicking, to prevent that use onDrag */
        public readonly onMove = new EventEmitter<{ pos: Point, delta: Point, lastPos: Point }>()

        /** Was this button pressed between this and last frame */
        public pressed() {
            return this.down && !this.lastDown
        }

        /** Was this button released between this and last frame */
        public released() {
            return !this.down && this.lastDown
        }

        /** Was this button released between this and last frame and was not dragging */
        public clicked() {
            return !this.down && this.lastDown && !this.lastDragging
        }

        /** Started this button dragging between this and last frame */
        public dragStart() {
            return this.dragging && !this.lastDragging
        }

        /** Ended this button dragging between this and last frame */
        public dragEnd() {
            return !this.dragging && this.lastDragging
        }

        constructor(
            public readonly buttonIndex: number | null
        ) { super() }
    }

    export class Keyboard extends EventListener {
        public readonly onDown = new EventEmitter<{ key: Key, text: string }>()
        public readonly onUp = new EventEmitter<{ key: Key, text: string }>()

        public key(code: KeyCode) {
            if (!(code in this[KEYS])) {
                this[KEYS][code] = new Key(code)
            }
            return this[KEYS][code]
        }

        public [DISPOSE]() {
            super[DISPOSE]()

            Object.values(this[KEYS]).forEach(v => v.dispose())
        }

        protected [KEYS]: Record<string, Key> = {}
    }

    export class Key extends Disposable {
        public down = false
        public lastDown = false

        public pressed() {
            return this.down && !this.lastDown
        }

        public released() {
            return !this.down && this.lastDown
        }

        public readonly onDown = new EventEmitter<void>()
        public readonly onUp = new EventEmitter<void>()

        constructor(public readonly code: KeyCode) { super() }
    }

    export class TouchInstance extends Disposable {
        public readonly onEnd = new EventEmitter<{ pos: Point, lastPos: Point }>()
        public readonly onMove = new EventEmitter<{ pos: Point, lastPos: Point }>()
        public pos = Point.zero
        public lastPos = Point.zero

        constructor(
            public readonly identifier: number
        ) { super() }
    }

    export class TouchSurface extends Disposable {
        public count = 0
        public readonly list: Record<number, TouchInstance> = {}
        public readonly onStart = new EventEmitter<{ instance: TouchInstance, pos: Point }>()
        public readonly onEnd = new EventEmitter<{ instance: TouchInstance, pos: Point, lastPos: Point }>()
        public readonly onMove = new EventEmitter<{ instance: TouchInstance, pos: Point, lastPos: Point }>()
    }
}

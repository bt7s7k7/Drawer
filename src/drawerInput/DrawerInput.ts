import { Drawer } from "../drawer/Drawer"
import { Point } from "../drawer/Point"
import { Disposable, DISPOSE } from "../eventLib/Disposable"
import { EventEmitter } from "../eventLib/EventEmitter"
import { EventListener } from "../eventLib/EventListener"

const KEYS = Symbol("keys")

export class DrawerInput extends Disposable {
    public readonly mouse = new DrawerInput.Mouse()
    public readonly keyboard = new DrawerInput.Keyboard()
    /** Triggers every frame */
    public readonly onDraw = new EventEmitter<{ deltaTime: number }>()
    /** The drawer currently being used, only guaranteed to work in event handlers */
    public drawer!: Drawer
    /** Current time in milliseconds */
    public time = -1
    /** Time elapsed since last frame */
    public deltaTime = 0

    public processMouseInput(drawer: Drawer, type: "up" | "down" | "move" | "leave", event: MouseEvent) {
        this.drawer = drawer
        const pos = type == "leave" ? new Point(NaN, NaN) : new Point(event.offsetX, event.offsetY)
        if (type == "leave") this.mouse.over = false
        else this.mouse.over = true

        const lastPos = this.mouse.pos
        this.mouse.pos = pos
        const delta = pos.add(lastPos.mul(-1))

        this.mouse.onMove.emit({ pos, lastPos, delta })

        for (const button of [this.mouse.left, this.mouse.middle, this.mouse.right]) {
            if (button.down) {
                button.onMove.emit({ pos, delta, lastPos })

                if (!button.dragging && button.downPos.dist(pos) > this.dragThreshold) {
                    button.dragging = true
                    button.onDragStart.emit({ pos })
                }

                if (button.dragging) {
                    button.onDrag.emit({ pos, delta, lastPos })
                }
            }

            if (type != "move" && button.buttonIndex == event.button) {
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

            if (type == "leave") {
                button.down = false
                button.onUp.emit({ pos })
                if (button.dragging) button.onDragEnd.emit({ pos })
                button.dragging = false
            }
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

        this.onDraw.emit({ deltaTime: actualDeltaTime })

        this.mouse.lastPos = this.mouse.pos

        for (const button of [this.mouse.left, this.mouse.middle, this.mouse.right]) {
            button.lastDown = button.down
            button.lastDragging = button.dragging
        }

        for (const key of Object.values(this.keyboard[KEYS])) {
            key.lastDown = key.down
        }
    }

    public processKeyboardEvent(drawer: Drawer, type: "up" | "down", event: KeyboardEvent) {
        // @ts-ignore
        if (event.target?.tagName?.toLowerCase() == "input" || event.target?.tagName?.toLowerCase() == "textarea") return

        const key = this.keyboard.key(event.code)

        if (type == "down") {
            key.down = true
            key.onDown.emit()
        }

        if (type == "up") {
            key.down = false
            key.onUp.emit()
        }
    }

    constructor(
        public dragThreshold = 10
    ) { super() }
}

export namespace DrawerInput {
    export class Mouse extends Disposable {
        public readonly left = new MouseButton(0)
        public readonly right = new MouseButton(2)
        public readonly middle = new MouseButton(1)

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
        public readonly onDrag = new EventEmitter<{ pos: Point, delta: Point, lastPos: Point }>()
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

        /** Started this button dragging between this and last frame */
        public dragStart() {
            return this.dragging && !this.lastDragging
        }

        /** Ended this button dragging between this and last frame */
        public dragEnd() {
            return !this.dragging && this.lastDragging
        }

        constructor(
            public readonly buttonIndex: number
        ) { super() }
    }

    export class Keyboard extends EventListener {
        public readonly onDown = new EventEmitter<{ key: Key }>()
        public readonly onUp = new EventEmitter<{ key: Key }>()

        public key(code: string) {
            if (!(code in this[KEYS])) {
                const key = this[KEYS][code] = new Key(code)

                key.onDown.add(this, () => this.onDown.emit({ key }))
                key.onUp.add(this, () => this.onUp.emit({ key }))
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
        public readonly onDown = new EventEmitter<void>()
        public readonly onUp = new EventEmitter<void>()

        constructor(public readonly code: string) { super() }
    }
}
import { Drawer } from "../drawer/Drawer";
import { Point } from "../drawer/Point";
import { Disposable } from "../eventLib/Disposable";
import { EventEmitter } from "../eventLib/EventEmitter";

export class DrawerInput extends Disposable {
    public readonly mouse = new DrawerInput.Mouse()
    /** Triggers every frame */
    public readonly onDraw = new EventEmitter<{ deltaTime: number }>()
    /** The drawer currently being used, only guaranteed to work in event handlers */
    public drawer!: Drawer
    /** Current time in milliseconds */
    public time = -1
    /** Time elapsed since last frame */
    public deltaTime = 0

    public processMouseInput(drawer: Drawer, type: "up" | "down" | "move", event: MouseEvent) {
        this.drawer = drawer
        const pos = new Point(event.offsetX, event.offsetY)

        const lastPos = this.mouse.pos
        this.mouse.pos = pos
        const delta = pos.add(lastPos.mul(-1))

        this.mouse.onMove.emit({ pos, lastPos, delta, drawer })

        for (const button of [this.mouse.left, this.mouse.middle, this.mouse.right]) {
            if (button.down) {
                button.onMove.emit({ pos, delta, lastPos, drawer })

                if (!button.dragging && button.downPos.dist(pos) > this.dragThreshold) {
                    button.dragging = true
                    button.onDragStart.emit({ pos, drawer })
                }

                if (button.dragging) {
                    button.onDrag.emit({ pos, delta, lastPos, drawer })
                }
            }

            if (type != "move" && button.buttonIndex == event.button) {
                if (type == "down") {
                    button.onDown.emit({ pos, drawer })
                    button.down = true
                    button.downPos = pos
                }
                if (type == "up") {
                    button.onUp.emit({ pos, drawer })
                    if (button.dragging) button.onDragEnd.emit({ pos, drawer })
                    button.down = false
                    button.dragging = false
                }
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

        /** Position of the mouse */
        public pos = new Point()
        /** Movement of the mouse since last frame */
        public delta = new Point()
        /** Position of the mouse last frame */
        public lastPos = new Point()
        /** Triggers when the mouse moves */
        public readonly onMove = new EventEmitter<{ pos: Point, delta: Point, lastPos: Point, drawer: Drawer }>()
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
        public readonly onDown = new EventEmitter<{ pos: Point, drawer: Drawer }>()
        /** Triggers when this button is released */
        public readonly onUp = new EventEmitter<{ pos: Point, drawer: Drawer }>()
        /** Triggers when the mouse moves when this button is down. Only triggers
         *  after the mouse moves a distance from the origin to prevent triggering 
         *  during clicking, to trigger anyway use onMove */
        public readonly onDrag = new EventEmitter<{ pos: Point, delta: Point, lastPos: Point, drawer: Drawer }>()
        /** Triggers when dragging starts
         *  @see {onDrag} */
        public readonly onDragStart = new EventEmitter<{ pos: Point, drawer: Drawer }>()
        /** Triggers when dragging stops
         *  @see {onDrag} */
        public readonly onDragEnd = new EventEmitter<{ pos: Point, drawer: Drawer }>()
        /** Triggers when the mouse moves when this button is down. Can trigger
         *  during clicking, to prevent that use onDrag */
        public readonly onMove = new EventEmitter<{ pos: Point, delta: Point, lastPos: Point, drawer: Drawer }>()

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
}
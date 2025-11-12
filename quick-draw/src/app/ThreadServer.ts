import { unreachable } from "../comTypes/util"
import { Drawer } from "../drawer/Drawer"
import { Point } from "../drawer/Point"
import { ThreadServer } from "../threadServer/ThreadServer"

Drawer.CONTEXT_FACTORY = () => (new OffscreenCanvas(256, 256).getContext("2d") as any) ?? unreachable("Offscreen 2D Canvas is not supported by your browser")

Object.assign(self,
    ...Object.values(import.meta.glob("../drawer/**/*.ts", { eager: true })),
    ...Object.values(import.meta.glob("../comTypes/**/*.ts", { eager: true })),
    { mouse: Point.zero, pressed: false },
)

new class extends ThreadServer {
    public canvas: OffscreenCanvas | null = null
    public drawer: Drawer | null = null
    public size = Point.one
    public update: ((deltaTime: number) => void) | null = null
    public lastFrame = performance.now()

    protected override _handleError(error: string): void {
        super._handleError(error)
        this.update = null
    }

    protected override _beforeCodeUpload(): void {
        this.update = null
    }

    protected override _makeEnvironment(): Record<string, any> {
        return {
            init: null,
            update: null,
            drawer: this.drawer,
        }
    }

    protected override _getFooter(): string {
        return "\nreturn { init, update }"
    }

    protected override _postCodeUpload(result: any): void {
        if (typeof result.update == "function") {
            this.update = result.update
        }
    }

    protected override _handleMessage(message: any): void {
        if (message.kind == "canvas") {
            this.canvas = message.canvas
            this.drawer = new Drawer(this.canvas!.getContext("2d")! as any as CanvasRenderingContext2D)
            this.size = new Point(message.size)
            this.drawer.setSize(this.size)
            return
        }

        if (message.kind == "resize") {
            if (this.drawer == null) return
            if (!this.drawer.size.size().equals(this.size)) return
            const newSize = new Point(message.size)
            if (newSize.equals(this.size)) return
            this.size = newSize
            this.drawer.setSize(this.size)
            return
        }

        if (message.kind == "mousemove") {
            (self as any).mouse = new Point(message.pos)
            return
        }

        if (message.kind == "mousedown") {
            (self as any).pressed = true
            return
        }

        if (message.kind == "mouseup") {
            (self as any).pressed = false
            return
        }

        super._handleMessage(message)
    }

    public override start(): void {
        setInterval(() => {
            const now = performance.now()
            const deltaTime = now - this.lastFrame
            this.lastFrame = now
            this.pcall(() => this.update?.(deltaTime))
        }, 17)

        super.start()
    }
}().start()

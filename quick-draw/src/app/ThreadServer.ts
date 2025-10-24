import { findNthOccurrence, runString, unreachable } from "../comTypes/util"
import { Drawer } from "../drawer/Drawer"
import { Point } from "../drawer/Point"

Drawer.CONTEXT_FACTORY = () => (new OffscreenCanvas(256, 256).getContext("2d") as any) ?? unreachable("Offscreen 2D Canvas is not supported by your browser")

let canvas: OffscreenCanvas | null = null
let drawer: Drawer | null = null

let size = Point.one

Object.assign(self,
    ...Object.values(import.meta.glob("../drawer/**/*.ts", { eager: true })),
    ...Object.values(import.meta.glob("../comTypes/**/*.ts", { eager: true })),
    { mouse: Point.zero, pressed: false },
)

let code = ""
let update: ((deltaTime: number) => void) | null = null
let lastFrame = performance.now()
setInterval(() => {
    const now = performance.now()
    const deltaTime = now - lastFrame
    lastFrame = now
    pcall(() => update?.(deltaTime))
}, 17)

function pcall(thunk: () => void) {
    try {
        thunk()
    } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error(err)
        const errText = err.stack as string
        const errRegexp = new RegExp(`code\\.js:(\\d+):(\\d+)`)
        const match = errText.match(errRegexp) ?? (err.message as string).match(errRegexp)
        let prefix = ""
        if (match) {
            const [line, column] = match.slice(1, 3).map(v => +v)
            const lineStart = line == 1 ? 0 : findNthOccurrence(code, "\n", line - 1)
            const lineEnd = code.indexOf("\n", lineStart + 1)
            const lineCode = code.slice(lineStart, lineEnd == -1 ? code.length : lineEnd)
            const indicator = " ".repeat(column - 1) + "^"
            prefix = lineCode + "\n" + indicator + "\n\n"
        }

        postMessage({ kind: "error", error: prefix + errText })
    }
}

self.addEventListener("message", async (event) => {
    const message = event.data

    if (message.kind == "ping") {
        self.postMessage({ kind: "pong" })
    } else if (message.kind == "canvas") {
        canvas = message.canvas
        drawer = new Drawer(canvas!.getContext("2d")! as any as CanvasRenderingContext2D)
        size = new Point(message.size)
        drawer.setSize(size)
    } else if (message.kind == "resize") {
        if (drawer == null) return
        if (!drawer.size.size().equals(size)) return
        const newSize = new Point(message.size)
        if (newSize.equals(size)) return
        size = newSize
        drawer.setSize(size)
    } else if (message.kind == "code") {
        code = "\n\n" + message.code
        update = null
        pcall(() => {
            const result = runString({
                source: message.code + "\nreturn { init, update }",
                env: {
                    init: null,
                    update: null,
                    drawer,
                },
                url: "virtual://thread/code.js",
            })

            if (!(typeof result == "object" && result != null)) return

            if (typeof result.init == "function") {
                result.init()
            }

            if (typeof result.update == "function") {
                update = result.update
            }
        })
    } else if (message.kind == "mousemove") {
        (self as any).mouse = new Point(message.pos)
    } else if (message.kind == "mousedown") {
        (self as any).pressed = true
    } else if (message.kind == "mouseup") {
        (self as any).pressed = false
    }
})

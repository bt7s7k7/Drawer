import { onUnmounted, shallowReactive } from "vue"
import { useEventListener } from "../vue3gui/util"

export abstract class ThreadController {
    public lastResponse = performance.now()
    public now = performance.now()
    public thread: Worker | null = null

    protected _makeThread() {
        const thread = new this.threadFactory()

        thread.addEventListener("message", event => {
            const message = event.data
            this._handleMessage(message)
        })

        return thread
    }

    protected abstract _handleError(error: string): void

    protected _handleMessage(message: any) {
        if (message.kind == "pong") {
            this.lastResponse = performance.now()
            return
        }

        if (message.kind == "error") {
            this._handleError(message.error)
        }
    }

    protected _handleUpdate() {
        this.now = performance.now()
        this.thread?.postMessage({ kind: "ping" })
    }

    public reset() {
        this.thread?.terminate()
        this.thread = this._makeThread()
        this.lastResponse = performance.now()
    }

    public uploadCode(code: string) {
        this.thread?.postMessage({ kind: "code", code })
    }

    public terminate() {
        this.thread?.terminate()
    }

    constructor(
        public threadFactory: new () => Worker,
    ) {
        return shallowReactive(this)
    }
}

export function useThreadController(factory: new () => ThreadController) {
    const controller = new factory()

    useEventListener("interval", 100, () => {
        controller["_handleUpdate"]()
    })

    onUnmounted(() => {
        controller.terminate()
    })

    controller.reset()

    return controller
}


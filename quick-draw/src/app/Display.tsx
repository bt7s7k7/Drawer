import { defineComponent, nextTick, onUnmounted, ref, Transition, watch } from "vue"
import { unreachable } from "../comTypes/util"
import { Point } from "../drawer/Point"
import { Rect } from "../drawer/Rect"
import { Button } from "../vue3gui/Button"
import { useEventListener, useResizeWatcher } from "../vue3gui/util"
import ThreadServer from "./ThreadServer?worker"

export const Display = (defineComponent({
    name: "Display",
    props: {
        iteration: { type: Number, required: true },
        code: { type: String, required: true },
    },
    emits: {
        error: (message: string) => true,
    },
    setup(props, ctx) {
        function makeThread() {
            const thread = new ThreadServer()

            thread.addEventListener("message", event => {
                const message = event.data
                if (message.kind == "pong") {
                    lastResponse.value = performance.now()
                } else if (message.kind == "error") {
                    ctx.emit("error", message.error)
                }
            })

            return thread
        }

        let thread = makeThread()
        const lastResponse = ref(performance.now())
        const now = ref(performance.now())
        const container = ref<HTMLDivElement>()
        const canvasRef = ref<HTMLCanvasElement>()

        const iteration = ref(0)
        watch(() => props.iteration, () => {
            reset()
        })

        watch(() => props.code, () => {
            reset()
        })

        function reset() {
            thread.terminate()
            thread = makeThread()
            lastResponse.value = performance.now()
            iteration.value++
        }

        function sendCanvas(canvas: any) {
            canvasRef.value = canvas
            if (!canvas) return

            nextTick(() => {
                if (!(canvas instanceof HTMLCanvasElement)) unreachable()

                const offscreenCanvas = canvas.transferControlToOffscreen()
                thread.postMessage({
                    kind: "canvas",
                    canvas: offscreenCanvas,
                    size: Rect.fromDOMRect(container.value!.getBoundingClientRect()).size(),
                }, [offscreenCanvas])

                thread.postMessage({
                    kind: "code",
                    code: props.code,
                })
            })
        }

        useEventListener("interval", 100, () => {
            now.value = performance.now()
            thread.postMessage({ kind: "ping" })
            thread.postMessage({ kind: "resize", size: Rect.fromDOMRect(container.value!.getBoundingClientRect()).size() })
        })

        useEventListener(window, "mousemove", (event) => {
            if (canvasRef.value == null) return
            const pos = new Point(event).sub(Rect.fromDOMRect(canvasRef.value.getBoundingClientRect()).pos())
            thread.postMessage({ kind: "mousemove", pos })
        })

        useEventListener(window, "mouseup", (event) => {
            thread.postMessage({ kind: "mouseup" })
        })

        function mouseDown() {
            thread.postMessage({ kind: "mousedown" })
        }

        onUnmounted(() => {
            thread.terminate()
        })

        useResizeWatcher(() => {
            if (container.value == null) return
            thread.postMessage({ kind: "resize", size: Rect.fromDOMRect(container.value!.getBoundingClientRect()).size() })
        })

        return () => (
            <div class="absolute-fill flex center" ref={container}>
                <canvas onMousedown={mouseDown} key={"canvas" + iteration.value} width="0" height="0" class="w-max-fill h-max-fill shadow" ref={sendCanvas} />
                <Transition name="as-transition-slide-up">
                    {now.value - lastResponse.value > 1000 && (
                        <div class="absolute top-0 border bg-white p-2 m-2">
                            Not Responding <Button label="Reset" variant="danger" onClick={reset} />
                        </div>
                    )}
                </Transition>
            </div>
        )
    },
}))

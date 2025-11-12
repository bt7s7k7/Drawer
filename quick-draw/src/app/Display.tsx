import { defineComponent, nextTick, ref, Transition, watch } from "vue"
import { unreachable } from "../comTypes/util"
import { Point } from "../drawer/Point"
import { Rect } from "../drawer/Rect"
import { ThreadController, useThreadController } from "../threadServer/ThreadController"
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
        const container = ref<HTMLDivElement>()
        const canvasRef = ref<HTMLCanvasElement>()
        const iteration = ref(0)

        const controller = useThreadController(class extends ThreadController {
            protected override _handleError(error: string): void {
                ctx.emit("error", error)
            }

            protected override _handleUpdate(): void {
                super._handleUpdate()
                this.thread?.postMessage({ kind: "resize", size: Rect.fromDOMRect(container.value!.getBoundingClientRect()).size() })
            }

            public override reset(): void {
                super.reset()
                iteration.value++
            }

            constructor() {
                super(ThreadServer)
            }
        })

        watch(() => props.iteration, () => {
            controller.reset()
        })

        watch(() => props.code, () => {
            controller.reset()
        })

        function sendCanvas(canvas: any) {
            canvasRef.value = canvas
            if (!canvas) return

            nextTick(() => {
                if (!(canvas instanceof HTMLCanvasElement)) unreachable()
                if (!controller.thread) return

                const offscreenCanvas = canvas.transferControlToOffscreen()
                controller.thread.postMessage({
                    kind: "canvas",
                    canvas: offscreenCanvas,
                    size: Rect.fromDOMRect(container.value!.getBoundingClientRect()).size(),
                }, [offscreenCanvas])

                controller.uploadCode(props.code)
            })
        }

        useEventListener(window, "mousemove", (event) => {
            if (canvasRef.value == null) return
            const pos = new Point(event).sub(Rect.fromDOMRect(canvasRef.value.getBoundingClientRect()).pos())
            controller.thread?.postMessage({ kind: "mousemove", pos })
        })

        useEventListener(window, "mouseup", (event) => {
            controller.thread?.postMessage({ kind: "mouseup" })
        })

        function mouseDown() {
            controller.thread?.postMessage({ kind: "mousedown" })
        }

        useResizeWatcher(() => {
            if (container.value == null) return
            controller.thread?.postMessage({ kind: "resize", size: Rect.fromDOMRect(container.value!.getBoundingClientRect()).size() })
        })

        return () => (
            <div class="absolute-fill flex center" ref={container}>
                <canvas onMousedown={mouseDown} key={"canvas" + iteration.value} width="0" height="0" class="w-max-fill h-max-fill shadow" ref={sendCanvas} />
                <Transition name="as-transition-slide-up">
                    {controller.now - controller.lastResponse > 1000 && (
                        <div class="absolute top-0 border bg-white p-2 m-2">
                            Not Responding <Button label="Reset" variant="danger" onClick={() => controller.reset()} />
                        </div>
                    )}
                </Transition>
            </div>
        )
    },
}))

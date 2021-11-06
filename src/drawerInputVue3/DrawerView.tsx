import { defineComponent, markRaw, onMounted, onUnmounted, PropType, ref, watch } from "vue"
import { Drawer } from "../drawer/Drawer"
import { DrawerInput } from "../drawerInput/DrawerInput"
import { DrawerInputConsumer } from "../drawerInput/DrawerInputConsumer"

export const DrawerView = defineComponent({
    name: "DrawerView",
    props: {
        drawerInput: {
            type: DrawerInput,
            default: () => markRaw(new DrawerInput())
        },
        consumer: {
            type: Object as PropType<DrawerInputConsumer.Builder>
        }
    },
    setup(props, ctx) {
        const canvas = ref<HTMLCanvasElement>(null!)
        const drawer = ref<Drawer>()

        onMounted(() => {
            let rafId = 0
            drawer.value = markRaw(new Drawer(canvas.value.getContext("2d")!))

            const update = () => {
                props.drawerInput?.processDrawEvent(drawer.value!, null)
                rafId = requestAnimationFrame(update)
            }
            update()

            const keyDown = (event: KeyboardEvent) => props.drawerInput?.processKeyboardEvent(drawer.value!, "down", event)
            const keyUp = (event: KeyboardEvent) => props.drawerInput?.processKeyboardEvent(drawer.value!, "up", event)
            const resize = () => props.drawerInput?.onResize.emit()

            const touchstart = (event: TouchEvent) => props.drawerInput?.processTouchEvent(drawer.value!, "start", event)
            const touchend = (event: TouchEvent) => props.drawerInput?.processTouchEvent(drawer.value!, "end", event)
            const touchmove = (event: TouchEvent) => props.drawerInput?.processTouchEvent(drawer.value!, "move", event)

            window.addEventListener("keydown", keyDown)
            window.addEventListener("keyup", keyUp)
            window.addEventListener("resize", resize)

            window.addEventListener("touchstart", touchstart)
            window.addEventListener("touchend", touchend)
            window.addEventListener("touchcancel", touchend)
            window.addEventListener("touchmove", touchmove)


            onUnmounted(() => {
                cancelAnimationFrame(rafId)
                window.removeEventListener("keydown", keyDown)
                window.removeEventListener("keyup", keyUp)
                window.removeEventListener("resize", resize)

                window.removeEventListener("touchstart", touchstart)
                window.removeEventListener("touchend", touchend)
                window.removeEventListener("touchcancel", touchend)
                window.removeEventListener("touchmove", touchmove)
            })
        })

        let prevConsumer: DrawerInputConsumer | null = null
        onUnmounted(() => prevConsumer?.dispose())

        watch(() => props.consumer, (newConsumer) => {
            prevConsumer?.dispose()

            if (newConsumer) {
                prevConsumer = newConsumer.create(props.drawerInput)
            }
        }, { immediate: true })

        return () => (
            <canvas
                ref={canvas}
                onMousemove={event => props.drawerInput?.processMouseInput(drawer.value!, "move", event)}
                onMousedown={event => props.drawerInput?.processMouseInput(drawer.value!, "down", event)}
                onMouseup={event => props.drawerInput?.processMouseInput(drawer.value!, "up", event)}
                onMouseleave={event => props.drawerInput?.processMouseInput(drawer.value!, "leave", event)}
                onContextmenu={event => event.preventDefault()}
                onWheel={event => props.drawerInput?.processWheelEvent(event)}
            ></canvas>
        )
    }
})
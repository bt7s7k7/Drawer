import { defineComponent, h, markRaw, onMounted, onUnmounted, PropType, ref, watch } from "vue"
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
        },
        drawEvent: { type: String as PropType<"animation-frame" | "timer" | "disabled"> },
        allowContextMenu: { type: Boolean }
    },
    setup(props, ctx) {
        const canvas = ref<HTMLCanvasElement>(null!)
        const drawer = ref<Drawer>()

        onMounted(() => {
            let timerID = 0
            drawer.value = markRaw(new Drawer(canvas.value.getContext("2d")!))

            if (props.drawEvent == "animation-frame" || props.drawEvent == undefined) {
                const update = () => {
                    props.drawerInput?.processDrawEvent(drawer.value!, null)
                    timerID = requestAnimationFrame(update)
                }
                update()
            } else if (props.drawEvent == "timer") {
                timerID = setInterval(() => {
                    try {
                        props.drawerInput?.processDrawEvent(drawer.value!, null)
                    } catch (err) {
                        clearInterval(timerID)
                        throw err
                    }
                }, 17)
            } else if (props.drawEvent == "disabled") {
                props.drawerInput?.processDrawEvent(drawer.value!, null)
            }

            const keyDown = (event: KeyboardEvent) => props.drawerInput?.processKeyboardEvent(drawer.value!, "down", event)
            const keyUp = (event: KeyboardEvent) => props.drawerInput?.processKeyboardEvent(drawer.value!, "up", event)
            const resize = () => props.drawerInput?.onResize.emit()

            const touchstart = (event: TouchEvent) => props.drawerInput?.processTouchEvent(drawer.value!, "start", event)
            const touchend = (event: TouchEvent) => props.drawerInput?.processTouchEvent(drawer.value!, "end", event)
            const touchmove = (event: TouchEvent) => props.drawerInput?.processTouchEvent(drawer.value!, "move", event)

            const mouseMove = (event: MouseEvent) => (props.drawerInput.mouse.over || props.drawerInput.mouse.any.down) && props.drawerInput?.processMouseInput(drawer.value!, "move", event, false)
            const mouseUp = (event: MouseEvent) => props.drawerInput?.processMouseInput(drawer.value!, "up", event, false)

            window.addEventListener("keydown", keyDown)
            window.addEventListener("keyup", keyUp)
            window.addEventListener("resize", resize)

            window.addEventListener("touchstart", touchstart)
            window.addEventListener("touchend", touchend)
            window.addEventListener("touchcancel", touchend)
            window.addEventListener("touchmove", touchmove)

            window.addEventListener("mousemove", mouseMove)
            window.addEventListener("mouseup", mouseUp)

            onUnmounted(() => {
                if (props.drawEvent == "animation-frame" || props.drawEvent == undefined) {
                    cancelAnimationFrame(timerID)
                } else if (props.drawEvent == "timer") {
                    clearInterval(timerID)
                }
                window.removeEventListener("keydown", keyDown)
                window.removeEventListener("keyup", keyUp)
                window.removeEventListener("resize", resize)

                window.removeEventListener("touchstart", touchstart)
                window.removeEventListener("touchend", touchend)
                window.removeEventListener("touchcancel", touchend)
                window.removeEventListener("touchmove", touchmove)

                window.removeEventListener("mousemove", mouseMove)
                window.removeEventListener("mouseup", mouseUp)
            })
        })

        let prevConsumer: DrawerInputConsumer | null = null
        onUnmounted(() => {
            prevConsumer?.dispose()
        })

        watch(() => props.consumer, (newConsumer) => {
            prevConsumer?.dispose()

            if (newConsumer) {
                prevConsumer = newConsumer.create(props.drawerInput)
            }
        }, { immediate: true })

        return () => (
            h("canvas", {
                ref: canvas,
                //onMousemove: (event: any) => props.drawerInput?.processMouseInput(drawer.value!, "move", event),
                onMousedown: (event: any) => props.drawerInput?.processMouseInput(drawer.value!, "down", event),
                //onMouseup: (event: any) => props.drawerInput?.processMouseInput(drawer.value!, "up", event),
                onMouseleave: (event: any) => props.drawerInput?.processMouseInput(drawer.value!, "leave", event),
                onMouseenter: (event: any) => props.drawerInput?.processMouseInput(drawer.value!, "enter", event),
                onContextmenu: props.allowContextMenu ? undefined : (event: any) => event.preventDefault(),
                onWheel: (event: any) => props.drawerInput?.processWheelEvent(event),
            })
        )
    }
})
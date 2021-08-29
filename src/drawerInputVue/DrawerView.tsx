import { css } from '@emotion/css'
import { defineComponent, onMounted, onUnmounted, PropType, ref, watch } from '@vue/composition-api'
import { Drawer } from '../drawer/Drawer'
import { DrawerInput } from '../drawerInput/DrawerInput'
import { DrawerInputConsumer } from '../drawerInput/DrawerInputConsumer'

const style = css({
    touchAction: "none"
})

export const DrawerView = defineComponent({
    name: "DrawerView",
    props: {
        drawerInput: {
            type: DrawerInput,
            default: () => new DrawerInput()
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
            drawer.value = new Drawer(canvas.value.getContext("2d")!)

            const update = () => {
                rafId = requestAnimationFrame(update)

                props.drawerInput?.processDrawEvent(drawer.value!, null)
            }
            update()

            const keyDown = (event: KeyboardEvent) => props.drawerInput?.processKeyboardEvent(drawer.value!, "down", event)
            const keyUp = (event: KeyboardEvent) => props.drawerInput?.processKeyboardEvent(drawer.value!, "up", event)
            const touchstart = (event: TouchEvent) => props.drawerInput?.processTouchEvent(drawer.value!, "start", event)
            const touchend = (event: TouchEvent) => props.drawerInput?.processTouchEvent(drawer.value!, "end", event)
            const touchmove = (event: TouchEvent) => props.drawerInput?.processTouchEvent(drawer.value!, "move", event)

            window.addEventListener("keydown", keyDown)
            window.addEventListener("keyup", keyUp)

            window.addEventListener("touchstart", touchstart)
            window.addEventListener("touchend", touchend)
            window.addEventListener("touchcancel", touchend)
            window.addEventListener("touchmove", touchmove)

            onUnmounted(() => {
                cancelAnimationFrame(rafId)
                window.removeEventListener("keydown", keyDown)
                window.removeEventListener("keyup", keyUp)

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
                class={style}
                on={{
                    mousemove: (event: MouseEvent) => props.drawerInput?.processMouseInput(drawer.value!, "move", event),
                    mousedown: (event: MouseEvent) => props.drawerInput?.processMouseInput(drawer.value!, "down", event),
                    mouseup: (event: MouseEvent) => props.drawerInput?.processMouseInput(drawer.value!, "up", event),
                    contextmenu: (event: Event) => event.preventDefault(),
                    mouseleave: (event: MouseEvent) => props.drawerInput?.processMouseInput(drawer.value!, "leave", event)
                }}
            ></canvas>
        )
    }
})
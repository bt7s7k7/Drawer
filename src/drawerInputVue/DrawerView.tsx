import { defineComponent, onMounted, onUnmounted, ref } from '@vue/composition-api';
import { Drawer } from '../drawer/Drawer';
import { DrawerInput } from '../drawerInput/DrawerInput';

export const DrawerView = defineComponent({
    name: "DrawerView",
    props: {
        drawerInput: {
            type: DrawerInput
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

            onUnmounted(() => cancelAnimationFrame(rafId))
        })

        return () => (
            <canvas
                ref={canvas}
                on={{
                    mousemove: (event: MouseEvent) => props.drawerInput?.processMouseInput(drawer.value!, "move", event),
                    mousedown: (event: MouseEvent) => props.drawerInput?.processMouseInput(drawer.value!, "down", event),
                    mouseup: (event: MouseEvent) => props.drawerInput?.processMouseInput(drawer.value!, "up", event),
                    contextmenu: (event: Event) => event.preventDefault()
                }}
            ></canvas>
        )
    }
})
import { defineComponent, ref } from '@vue/composition-api'
import { Editor } from './components/Editor'

export const App = defineComponent({
    name: "App",
    setup(props, ctx) {
        const canvas = ref<HTMLCanvasElement | null>(null)

        return () => (
            <div class={["vh-100", "d-flex", "vw-100", "flex-row"]}>
                <div class={["w-50", "d-flex", "flex-column"]}>
                    {canvas.value && <Editor canvas={canvas.value} />}
                </div>
                <canvas ref={canvas} class={["w-50", "d-flex", "flex-column", "border-left"]}></canvas>
            </div>
        )
    }
})
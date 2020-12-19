import { Drawer } from '@/drawer/Drawer'
import { computed, defineComponent, onMounted, ref } from '@vue/composition-api'
import { fromTextArea } from "codemirror"
import "codemirror/lib/codemirror.css"
import "codemirror/mode/javascript/javascript"

export const Editor = defineComponent({
    name: "Editor",
    props: {
        canvas: {
            type: HTMLCanvasElement,
            required: true
        }
    },
    setup(props, ctx) {
        const editorTextArea = ref<HTMLTextAreaElement>(null!)

        onMounted(() => {
            const editor = fromTextArea(editorTextArea.value, {
                lineNumbers: true,
                indentWithTabs: true,
                mode: "javascript",
                lint: {}
            })
            editor.getWrapperElement().classList.add("h-100")
        })

        const drawer = computed(() => new Drawer(props.canvas.getContext("2d")!))

        return () => (
            <div class={["flex-fill", "d-flex", "flex-column"]}>
                <div class={["flex-fill"]} style={{ "contain": "strict" }}>
                    <textarea ref={editorTextArea}></textarea>
                </div>
                <div class={["border-top"]} style={{ "flex-basis": "200px", "max-height": "200px", "overflow-y": "scroll" }}>
                </div>
            </div>
        )
    }
})
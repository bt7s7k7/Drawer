import { Drawer } from '@/drawer/Drawer'
import { Point } from '@/drawer/Point'
import { Rect } from '@/drawer/Rect'
import { computed, defineComponent, onMounted, ref, watch } from '@vue/composition-api'
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
        const drawer = computed(() => new Drawer(props.canvas.getContext("2d")!))
        const text = ref(localStorage.getItem("drawer-text") ?? "")
        const errors = ref<Error[]>([])

        onMounted(() => {
            const editor = fromTextArea(editorTextArea.value, {
                lineNumbers: true,
                indentWithTabs: true,
                mode: "javascript",
                lint: {}
            })
            editor.getWrapperElement().classList.add("h-100")
            editor.setValue(text.value)

            editor.on("change", () => {
                text.value = editor.getValue()
                localStorage.setItem("drawer-text", text.value)
            })
        })

        watch(() => text.value, () => {

            errors.value = []

            const providedObjects = {
                ctx: drawer.value,
                Drawer,
                Point,
                Rect
            }

            try {
                var script = new Function(...Object.keys(providedObjects), text.value)
            } catch (err) {
                errors.value.push(err)
            }

            drawer.value.resize()

            if (script!) {
                try {
                    script!(...Object.values(providedObjects))
                } catch (err) {
                    errors.value.push(err)

                }
            }
        }, { immediate: true })

        return () => (
            <div class={["flex-fill", "d-flex", "flex-column"]}>
                <div class={["flex-fill"]} style={{ "contain": "strict" }}>
                    <textarea ref={editorTextArea}></textarea>
                </div>
                <div class={["border-top"]} style={{ "flex-basis": "200px", "max-height": "200px", "overflow-y": "scroll" }}>
                    {errors.value.map((v, i) => (
                        <pre class={["border-bottom", "border-danger", "text-monospace", "p-1", "bg-danger", "text-white", "d-block", "m-0"]}>{v.stack}</pre>
                    ))}
                </div>
            </div>
        )
    }
})
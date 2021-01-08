import { Drawer } from '@/drawer/Drawer'
import { Point } from '@/drawer/Point'
import { Rect } from '@/drawer/Rect'
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from '@vue/composition-api'
import { fromTextArea } from "codemirror"
import "codemirror/lib/codemirror.css"
import "codemirror/mode/javascript/javascript"
import { demos } from '../../../demos'

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
        const text = ref(localStorage.getItem("drawer-text") ?? `/*
    Welcome to Drawer demo.
    
    Click on Show demos to see what you can do with this.
    
    Shorcuts:
        F4 => Collapse editor
*/`)
        const errors = ref<Error[]>([])
        const renderScript = ref<Function | null>(null)
        const mousePos = ref(new Point())

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

            watch(() => text.value, () => {
                editor.getValue() != text.value && editor.setValue(text.value)
            })

            const interval = setInterval(() => {
                if (renderScript.value) {
                    renderScript.value()
                }
            }, 17)

            window.addEventListener("mousemove", event => {
                var pos = new Point(event.clientX, event.clientY)

                var canvasPos = new Rect(props.canvas.getBoundingClientRect()).pos()

                mousePos.value = pos.add(canvasPos.mul(-1))
            })

            onUnmounted(() => {
                clearInterval(interval)
            })
        })

        const lastTimeout = ref(0)

        watch(() => text.value, () => {
            clearTimeout(lastTimeout.value)

            setTimeout(() => {
                errors.value = []

                const providedObjects = {
                    ctx: drawer.value,
                    Drawer,
                    Point,
                    Rect,
                    range: (num: number) => {
                        const length = Math.floor(num)

                        if (length > 1000) throw new RangeError("Length too long")

                        return Array(length).fill(0).map((_, i) => i)
                    },
                    mousePos
                }

                try {
                    var script = new Function(...Object.keys(providedObjects), text.value)
                } catch (err) {
                    renderScript.value = null
                    errors.value.push(err)
                }
                if (script!) {
                    renderScript.value = () => {
                        errors.value = []
                        drawer.value.setNativeSize()

                        try {
                            script!(...Object.values(providedObjects))
                        } catch (err) {
                            errors.value.push(err)
                        }
                    }
                }
            }, 200)
        }, { immediate: true })

        return () => (
            <div class={["flex-fill", "d-flex", "flex-column"]}>
                <div class={["flex-fill"]} style={{ "contain": "strict" }}>
                    <textarea ref={editorTextArea}></textarea>
                </div>
                <div>
                    <b-btn size="sm" squared onClick={() => ctx.root.$bvModal.show("demos-modal")}>
                        Show demos
                        <b-modal hide-ok id="demos-modal" title="Demos">
                            {Object.entries(demos).map(([key, value]) => (
                                <b-btn
                                    squared
                                    variant="white"
                                    size="sm"
                                    block
                                    key={key}
                                    class="text-left"
                                    onClick={() => {
                                        ctx.root.$bvModal.hide("demos-modal")
                                        text.value = value
                                    }}
                                >
                                    {key}
                                </b-btn>
                            ))}
                        </b-modal>
                    </b-btn>
                    <b-btn size="sm" squared to="/input" class="border-left">
                        Show input demo
                    </b-btn>
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
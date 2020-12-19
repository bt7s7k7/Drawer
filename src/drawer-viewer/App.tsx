import { css } from '@emotion/css'
import { defineComponent, ref } from '@vue/composition-api'
import { Editor } from './components/Editor'

const rootClass = css({
    ".editor-pane": {
        width: "50%",
        transition: "width 0.1s linear",
        contain: "strict"
    },
    ".canvas-pane": {
        position: "relative",
        width: "50%",
        transition: "width 0.1s linear",

        ".collapse-button": {
            position: "absolute",
            top: 4,
            left: 4,
            transition: "transform 0.1s linear",
        }
    },
    "&.collapsed": {
        ".editor-pane": {
            width: "0%"
        },
        ".canvas-pane": {
            width: "100%",
            border: "none !important",

            ".collapse-button": {
                transform: "rotate(180deg)"
            }
        }
    }
})

export const App = defineComponent({
    name: "App",
    setup(props, ctx) {
        const canvas = ref<HTMLCanvasElement | null>(null)
        const collapsed = ref(false)

        window.addEventListener("keydown", event => {
            if (event.code == "F4") {
                collapsed.value = !collapsed.value
            }
        })

        return () => (
            <div class={["vh-100", "d-flex", "vw-100", "flex-row", rootClass, collapsed.value && "collapsed"]}>
                <div class={["d-flex", "flex-column", "editor-pane"]}>
                    {canvas.value && <Editor canvas={canvas.value} />}
                </div>
                <div class={["d-flex", "flex-column", "border-left", "canvas-pane"]}>
                    <b-btn size="sm" variant="primary" onClick={() => collapsed.value = !collapsed.value} class="collapse-button">
                        <b-icon-caret-left-fill />
                    </b-btn>
                    <canvas class={["w-100", "h-100"]} ref={canvas} style="object-fit: scale-down"></canvas>
                </div>
            </div>
        )
    }
})
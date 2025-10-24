import { mdiDockLeft } from "@mdi/js"
import "codemirror/mode/javascript/javascript.js"
import { defineComponent, ref } from "vue"
import { escapeHTML } from "../comTypes/util"
import { EditorView } from "../editor/EditorView"
import { EditorState } from "../editor/useEditorState"
import { Button } from "../vue3gui/Button"
import { Display } from "./Display"

const DEFAULT = `\
// Executes once on start
function init() {
    
}

// Executes every frame
function update(deltaTime) {

}
`

const EXAMPLES = [
    {
        name: "Draw", value: `\
let lastPosition = mouse

function init() {
	    
}

function update() {
    if (pressed) {
        drawer
        	.setStyle(Color.black)
        	.beginPath()
        	.move(lastPosition)
        	.lineTo(mouse)
        	.stroke()
    }
    
    lastPosition = mouse
}
`,
    },
] as {name: string, value: string}[]

export const EditorPage = (defineComponent({
    name: "EditorPage",
    setup(props, ctx) {
        const state = new class extends EditorState {
            public iteration = 0

            public handleError = (message: string) => {
                this.errors.push(`<span class="text-danger">${escapeHTML(message)}</span>`)
            }

            public getOutput(): EditorState.OutputTab[] {
                return [
                    {
                        name: "output", label: "Output",
                        content: () => <Display iteration={this.iteration} code={this.code.value} onError={this.handleError} />,
                    },
                ]
            }

            protected _compile(code: string): void {
                this.ready = true
                this.iteration++
            }
        }

        const size = ref(0)
        function nextSize() {
            size.value = (size.value + 1) % 2
            window.dispatchEvent(new CustomEvent("resize"))
        }

        function handleExample(event: Event) {
            const select = event.target as HTMLSelectElement
            const value = select.value
            select.value = ""

            if (value) {
                state.code.value = value
            }
        }

        return () => (
            <EditorView codeRatio={[0.5, 0.25][size.value]} state={state} localStorageId="quick-draw:code" mode="javascript" code={DEFAULT} root>
                <Button clear icon={mdiDockLeft} onClick={nextSize} v-label:right="Collapse code" />
                <Button clear label="Examples">
                    <select class="absolute-fill opacity-0" onChange={handleExample} value="">
                        {EXAMPLES.map(({ name, value }) => (
                            <option value={value}>{name}</option>
                        ))}
                    </select>
                </Button>
            </EditorView>
        )
    },
}))

import { mdiDockLeft } from "@mdi/js"
import "codemirror/mode/javascript/javascript.js"
import { defineComponent, ref } from "vue"
import { escapeHTML } from "../comTypes/util"
import { EditorView } from "../editor/EditorView"
import { EditorState } from "../editor/useEditorState"
import { Button } from "../vue3gui/Button"
import { Display } from "./Display"

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

        return () => (
            <EditorView codeRatio={[0.5, 0.25][size.value]} state={state} localStorageId="quick-draw:code" mode="javascript" root>
                <Button clear icon={mdiDockLeft} onClick={nextSize} v-label:right="Collapse code"></Button>
            </EditorView>
        )
    },
}))

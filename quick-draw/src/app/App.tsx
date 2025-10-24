import { defineComponent } from "vue"
import { DynamicsEmitter } from "../vue3gui/DynamicsEmitter"
import { EditorPage } from "./EditorPage"

export const App = defineComponent({
    name: "App",
    setup(props, ctx) {
        return () => (
            <DynamicsEmitter>
                <EditorPage />
            </DynamicsEmitter>
        )
    },
})

import { defineComponent } from '@vue/composition-api';

export const Input = defineComponent({
    name: "Input",
    setup(props, ctx) {
        return () => (
            <div class={["vh-100", "d-flex", "vw-100", "flex-row", "bg-dark"]}></div>
        )
    }
})

export default Input
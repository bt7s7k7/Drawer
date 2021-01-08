import { defineComponent } from '@vue/composition-api';

export const App = defineComponent({
    name: "App",
    setup(props, ctx) {
        return () => (
            <router-view />
        )
    }
})
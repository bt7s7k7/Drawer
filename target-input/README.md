# Drawer Input

Vue wrapper for [@bt7s7k7/drawer](https://www.npmjs.com/package/@bt7s7k7/drawer)

## Usage

```tsx
import { defineComponent } from "vue"
import { defineDrawerInputConsumer, DrawerView } from "@bt7s7k7/drawer-input"

export const Component = (defineComponent({
    name: "Component",
    setup(props, ctx) {
        const consumer = defineDrawerInputConsumer((self, drawerInput) => {
            drawerInput.onDraw.add(self, () => {
                drawerInput.drawer.setStyle("#ff0000").fillRect()
            })
        })

        return () => (
            <DrawerView consumer={consumer} />
        )
    }
}))
```
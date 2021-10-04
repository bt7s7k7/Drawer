import { ClientEventListener } from "../eventLib/ClientEventListener"
import { IDisposable } from "../eventLib/Disposable"
import { DrawerInput } from "./DrawerInput"

export function defineDrawerInputConsumer(callback: (self: ClientEventListener, drawerInput: DrawerInput) => (IDisposable | void)) {
    return {
        create(drawerInput: DrawerInput) {
            const eventListener = new ClientEventListener()

            const ret = callback(eventListener, drawerInput)

            if (ret) eventListener.guard(ret)

            return eventListener
        }
    }
}

export type DrawerInputConsumer = ReturnType<DrawerInputConsumer.Builder["create"]>

export namespace DrawerInputConsumer {
    export type Builder = ReturnType<typeof defineDrawerInputConsumer>
}
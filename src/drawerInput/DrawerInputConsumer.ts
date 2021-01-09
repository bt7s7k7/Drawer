import { ClientEventListener } from "../eventLib/ClientEventListener"
import { DrawerInput } from "./DrawerInput"

export function defineDrawerInputConsumer(callback: (self: ClientEventListener, drawerInput: DrawerInput) => void) {
    return {
        create(drawerInput: DrawerInput) {
            const eventListener = new ClientEventListener()

            callback(eventListener, drawerInput)

            return eventListener
        }
    }
}
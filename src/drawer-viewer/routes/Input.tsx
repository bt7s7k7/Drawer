import { computed, defineComponent, ref } from '@vue/composition-api'
import { Drawer } from '../../drawer/Drawer'
import { Point } from '../../drawer/Point'
import { DrawerInput } from '../../drawerInput/DrawerInput'
import { defineDrawerInputConsumer } from '../../drawerInput/DrawerInputConsumer'
import { DrawerView } from '../../drawerInputVue/DrawerView'
import { ClientEventListener } from '../../eventLib/ClientEventListener'

const buildCommon = (self: ClientEventListener, drawerInput: DrawerInput) => {
    const traceLayer = new Drawer()

    return {
        clear() {
            drawerInput.drawer
                .setNativeSize()
                .setStyle("black")
                .fillRect(drawerInput.drawer.size)

            traceLayer.matchSize(drawerInput.drawer)
            drawerInput.drawer.blit(traceLayer)
        },
        clearDrag() {
            traceLayer.clear()
        },
        drawPosIndicator(pos: Point) {
            drawerInput.drawer
                .setStyle("white")
                .beginPath()
                .move(pos)
                .lineTo(pos.add(new Point(40, -40)))
                .stroke()
                .fillText(pos.makeKey(), pos.add(new Point(40, -40)), 16, "Arial")
        },
        drawDownIndicator(pos: Point, color: string) {
            drawerInput.drawer
                .setStyle(color)
                .beginPath()
                .arc(pos, 20)
                .move(pos.add(0, 40))
                .lineTo(pos.add(0, 60))
                .move(pos.add(0, -40))
                .lineTo(pos.add(0, -60))
                .stroke()
        },
        drawUpIndicator(pos: Point, color: string) {
            drawerInput.drawer
                .setStyle(color)
                .beginPath()
                .arc(pos, 20)
                .move(pos.add(40, 0))
                .lineTo(pos.add(60, 0))
                .move(pos.add(-40, 0))
                .lineTo(pos.add(-60, 0))
                .stroke()
        },
        drawDragStart(pos: Point, color: string) {
            drawerInput.drawer
                .setStyle(color)
                .beginPath()
                .arc(pos, 20)
                .move(pos.add(40, 40))
                .lineTo(pos.add(60, 60))
                .move(pos.add(-40, -40))
                .lineTo(pos.add(-60, -60))
                .stroke()
        },
        drawDragEnd(pos: Point, color: string) {
            drawerInput.drawer
                .setStyle(color)
                .beginPath()
                .arc(pos, 20)
                .move(pos.add(-40, 40))
                .lineTo(pos.add(-60, 60))
                .move(pos.add(40, -40))
                .lineTo(pos.add(60, -60))
                .stroke()

            traceLayer.clear()
        },
        drawDrag(pos: Point, lastPos: Point, color: string) {
            traceLayer
                .setStyle(color)
                .beginPath()
                .move(lastPos)
                .lineTo(pos)
                .stroke()
        },
        drawKey(key: DrawerInput.Key, down: boolean) {
            drawerInput.drawer
                .setStyle(down ? "#00ff00" : "#ff0000")
                .fillText(key.code, drawerInput.mouse.pos.add(20, 20), 14, "Arial")
        },
        buttons: [
            { button: drawerInput.mouse.left, color: "#ff0000" },
            { button: drawerInput.mouse.middle, color: "#00ff00" },
            { button: drawerInput.mouse.right, color: "#0000ff" },
        ],
        touchColors: [
            "#ffff00",
            "#00ffff",
            "#ff00ff",
            "#ff0000",
            "#00ff00",
            "#0000ff",
        ],
        getTouchColor(id: number) {
            return this.touchColors[id % this.touchColors.length]
        }
    }
}

const reactiveModeConsumer = defineDrawerInputConsumer((self, drawerInput) => {
    const common = buildCommon(self, drawerInput)

    drawerInput.onDraw.add(self, () => {
        common.clear()
    }, true)

    drawerInput.mouse.onMove.add(self, ({ pos }) => {
        common.clear()
        common.drawPosIndicator(pos)
    })

    for (const { button, color } of common.buttons) {

        button.onDown.add(self, ({ pos }) => {
            common.clear()
            common.drawDownIndicator(pos, color)
        })

        button.onUp.add(self, ({ pos }) => {
            common.clear()
            common.drawUpIndicator(pos, color)
            console.log("up", Date.now())
        })

        button.onDragStart.add(self, ({ pos }) => {
            common.clear()
            common.drawDragStart(pos, color)
            console.log("start", Date.now())
        })

        button.onDragEnd.add(self, ({ pos }) => {
            common.clear()
            common.drawDragEnd(pos, color)
            console.log("end", Date.now())
        })

        button.onDrag.add(self, ({ pos, lastPos }) => {
            common.drawDrag(pos, lastPos, color)
        })
    }

    drawerInput.keyboard.onDown.add(self, ({ key }) => {
        common.clear()
        common.drawKey(key, true)
    })

    drawerInput.keyboard.onUp.add(self, ({ key }) => {
        common.clear()
        common.drawKey(key, false)
    })

    drawerInput.touch.onStart.add(self, ({ instance, pos }) => {
        common.clear()
        common.drawDownIndicator(pos, common.getTouchColor(instance.identifier))
    })

    drawerInput.touch.onMove.add(self, ({ instance, pos, lastPos }) => {
        common.clear()
        common.drawDrag(pos, lastPos, common.getTouchColor(instance.identifier))
    })

    drawerInput.touch.onEnd.add(self, ({ instance, pos, lastPos }) => {
        common.clear()
        common.drawUpIndicator(pos, common.getTouchColor(instance.identifier))
        common.drawDrag(pos, lastPos, common.getTouchColor(instance.identifier))
        if (drawerInput.touch.count == 0) {
            common.clearDrag()
        }
    })
})

const frameModeConsumer = defineDrawerInputConsumer((self, drawerInput) => {
    const common = buildCommon(self, drawerInput)

    drawerInput.onDraw.add(self, ({ deltaTime }) => {
        common.clear()
        common.drawPosIndicator(drawerInput.mouse.pos)

        let output = ""
        const log = (text: string) => output += " :: " + text
        log(`deltaTime = ${deltaTime}`)

        for (const { button, color } of common.buttons) {
            if (button.pressed()) common.drawDownIndicator(drawerInput.mouse.pos, color)
            if (button.released()) common.drawUpIndicator(drawerInput.mouse.pos, color)

            if (button.dragging) {
                common.drawDrag(drawerInput.mouse.pos, drawerInput.mouse.lastPos, color)
            }

            if (button.dragStart()) common.drawDragStart(drawerInput.mouse.pos, color)
            if (button.dragEnd()) common.drawDragEnd(drawerInput.mouse.pos, color)

            log(`${button.buttonIndex} ⇒ ${button.down}, ${button.lastDown}`)
        }

        drawerInput.drawer
            .setStyle("white")
            .fillText(output, drawerInput.drawer.size.end().scale(0, 1), 16, "Arial")
    })
})

export const Input = defineComponent({
    name: "Input",
    setup(props, ctx) {
        const frameMode = ref(false)
        const consumer = computed(() => frameMode.value ? frameModeConsumer : reactiveModeConsumer)

        return () => (
            <div class={["vh-100", "d-flex", "vw-100", "flex-row", "position-relative", "align-items-start"]}>
                <b-form-checkbox
                    vModel={frameMode.value}
                    class="text-white m-2"
                >
                    Use frame mode
                </b-form-checkbox>
                <DrawerView consumer={consumer.value} class="position-absolute w-100 h-100" />
            </div>
        )
    }
})

export default Input
import { Color } from "./Color"
import { Point } from "./Point"
import { Rect } from "./Rect"

export class Drawer {
    public size = new Rect()

    constructor(public ctx: CanvasRenderingContext2D = document.createElement("canvas").getContext("2d")!) {
        this.setNativeSize()
    }

    /** Sets the stroke and fill style */
    setStyle(color: Drawer.Style) {
        if (color instanceof Color) color = color.toStyle()
        this.ctx.fillStyle = color
        this.ctx.strokeStyle = color
        return this
    }

    fillRect(rect: Rect = this.size) {
        this.ctx.fillRect(...rect.spread())
        return this
    }

    clear() {
        this.setSize(this.size)
        return this
    }

    strokeRect(rect: Rect) {
        this.ctx.strokeRect(...rect.spread())
        return this
    }

    fillText(text: string, pos: Point, size: number, font: string) {
        var sizeText = size + "px"
        var fontStyle = `${sizeText} ${font}`
        this.ctx.font = fontStyle

        if (this.ctx.font !== fontStyle) {
            throw new Error(`Invalid font for drawer, size = ${size}, font = ${font} (ctx returned ${this.ctx.font})`)
        }

        var lines = text.split("\n")
        lines.forEach((v, i) => {
            var linePos = pos.add(0, size * i)

            this.ctx.fillText(v, ...linePos.spread())
        })

        return this
    }

    /** Changes the rendering context's size to the real size of the canvas element */
    setNativeSize() {
        const canvas = this.ctx.canvas
        const size = new Rect(0, 0, canvas.scrollWidth, canvas.scrollHeight)
        this.setSize(size)

        return this
    }

    setSize(size: Point | Rect) {
        var canvas = this.ctx.canvas
        this.size = size instanceof Point ? new Rect(new Point(), size) : size.origin()
        canvas.width = this.size.width
        canvas.height = this.size.height

        return this
    }

    matchSize(other: Drawer) {
        if (!this.size.equals(other.size)) {
            this.setSize(other.size)
        }
    }

    beginPath() {
        this.ctx.beginPath()
        return this
    }

    /** Adds an arc to a path */
    arc(pos: Point, radius: number, startAngle = 0, endAngle = Math.PI * 2, anticlockwise = false) {
        this.ctx.arc(pos.x, pos.y, radius, startAngle, endAngle, anticlockwise)
        return this
    }

    /** Moves the current path position */
    move(pos: Point) {
        this.ctx.moveTo(pos.x, pos.y)
        return this
    }

    /** Adds a line to a path, from the last path position to the provided position */
    lineTo(pos: Point) {
        this.ctx.lineTo(pos.x, pos.y)
        return this
    }

    /** Strokes the path */
    stroke(path?: Path2D) {
        if (path) {
            this.ctx.stroke(path)
        } else {
            this.ctx.stroke()
        }
        return this
    }

    /** Fills the path */
    fill(path?: Path2D) {
        if (path) {
            this.ctx.fill(path)
        } else {
            this.ctx.fill()
        }
        return this
    }

    /** Sets a linear gradient as a style */
    setLinearGradient(start: Point, end: Point, stops: [number, string][]) {
        let gradient = this.ctx.createLinearGradient(start.x, start.y, end.x, end.y)
        stops.forEach(v => gradient.addColorStop(v[0], v[1]))
        this.setStyle(gradient)
        return this
    }

    /** Pushes the current rendering settings to a stack, can pop with `.restore` */
    save() {
        this.ctx.save()
        return this
    }

    /** Pops the current rendering settings from a stack, previously saved with `.save` */
    restore() {
        this.ctx.restore()
        return this
    }

    /** Sets the current path as a clip */
    clip() {
        this.ctx.clip()
        return this
    }

    /** Adds a rect to the current path */
    rect(rect: Rect) {
        this.ctx.rect(...rect.spread())
        return this
    }

    setStrokeWidth(width: number) {
        this.ctx.lineWidth = width
        return this
    }

    blit(image: CanvasImageSource | Drawer): Drawer
    blit(image: CanvasImageSource | Drawer, dest: Point): Drawer
    blit(image: CanvasImageSource | Drawer, dest: Rect): Drawer
    blit(image: CanvasImageSource | Drawer, dest: Rect, source: Rect): Drawer
    blit(image: CanvasImageSource | Drawer, dest: Rect | Point | null = null, source: Rect | null = null) {
        const realImage = image instanceof Drawer ? image.ctx.canvas : image

        if (!dest) {
            this.ctx.drawImage(realImage, 0, 0)
        } else if (dest instanceof Point) {
            this.ctx.drawImage(realImage, ...dest.spread())
        } else {
            if (!source) {
                this.ctx.drawImage(realImage, ...dest.spread())
            } else {
                // @ts-ignore
                this.ctx.drawImage(realImage, ...source.spread(), ...dest.spread())
            }
        }

        return this
    }

    translate(offset: Point) {
        this.ctx.translate(offset.x, offset.y)
        return this
    }

    rotate(angle: number) {
        this.ctx.rotate(angle)
        return this
    }

    scale(scale: number | Point) {
        if (typeof scale == "number") {
            this.ctx.scale(scale, scale)
        } else {
            this.ctx.scale(scale.x, scale.y)
        }
        return this
    }

    setLineDash(dash: number[]) {
        this.ctx.setLineDash(dash)
        return this
    }

    setLineDashOffset(offset: number) {
        this.ctx.lineDashOffset = offset
        return this
    }
}

export namespace Drawer {
    export type Style = CanvasRenderingContext2D["fillStyle"] | Color
}
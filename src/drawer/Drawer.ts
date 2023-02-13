import { Color } from "./Color"
import { Matrix } from "./Matrix"
import { Point } from "./Point"
import { Rect } from "./Rect"

type GlobalCompositeOperation =
    "color" | "color-burn" | "color-dodge" | "copy" | "darken" | "destination-atop" | "destination-in" |
    "destination-out" | "destination-over" | "difference" | "exclusion" | "hard-light" | "hue" | "lighten" |
    "lighter" | "luminosity" | "multiply" | "overlay" | "saturation" | "screen" | "soft-light" |
    "source-atop" | "source-in" | "source-out" | "source-over" | "xor"

export class Drawer {
    public size = new Rect()

    constructor(public ctx: CanvasRenderingContext2D = document.createElement("canvas").getContext("2d")!, protected readonly fragile: "fragile" | boolean = false) {
        if (!fragile) {
            this.setNativeSize()
        } else {
            this.size = new Rect(0, 0, ctx.canvas.width, ctx.canvas.height)
        }
    }

    /** Sets the stroke and fill style */
    setStyle(color: Drawer.Style) {
        if (color instanceof Color) color = color.toStyle()
        this.ctx.fillStyle = color
        this.ctx.strokeStyle = color
        return this
    }

    setFillStyle(color: Drawer.Style) {
        if (color instanceof Color) color = color.toStyle()
        this.ctx.fillStyle = color
        return this
    }

    setStrokeStyle(color: Drawer.Style) {
        if (color instanceof Color) color = color.toStyle()
        this.ctx.strokeStyle = color
        return this
    }

    setStrokeDash(segments: number[]) {
        this.ctx.setLineDash(segments)
        return this
    }

    setStrokeDashOffset(offset: number) {
        this.ctx.lineDashOffset = offset
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

    fillText(text: string, pos: Point, size: number, font: string): Drawer
    fillText(text: string, pos: Point, options: Drawer.TextOptions): Drawer
    fillText(text: string, pos: Point, sizeOrOptions: number | Drawer.TextOptions, font = "") {
        if (typeof sizeOrOptions == "number") {
            return this.fillText(text, pos, { size: sizeOrOptions, font })
        } else {
            const canvasStyle = globalThis["getComputedStyle"] ? getComputedStyle(this.ctx.canvas) : {
                get fontSize(): string {
                    throw new Error("Inheriting size is not supported in this environment, please explicitly specify size in options")
                },
                get fontFamily(): string {
                    throw new Error("Inheriting font is not supported in this environment, please explicitly specify font in options")
                }
            }

            let size = typeof sizeOrOptions.size == "number" ? sizeOrOptions.size + "px"
                : typeof sizeOrOptions.size == "string" ? sizeOrOptions.size
                    : canvasStyle.fontSize

            let font = sizeOrOptions.font ? sizeOrOptions.font : canvasStyle.fontFamily
            let fontStyle = `${size} ${font}`
            this.ctx.font = fontStyle


            if (this.ctx.font !== fontStyle) {
                throw new Error(`Invalid font for drawer, size = ${size}, font = ${font} (ctx returned ${this.ctx.font})`)
            }

            this.ctx.textAlign = sizeOrOptions.align ?? "start"
            this.ctx.textBaseline = sizeOrOptions.baseline ?? "alphabetic"

            const lines = text.split("\n")
            const measurement = this.ctx.measureText(",Á")
            const lineHeight = measurement.actualBoundingBoxAscent + measurement.actualBoundingBoxDescent
            lines.forEach((v, i) => {
                let linePos = pos.add(0, lineHeight * i)
                if (sizeOrOptions.outline) {
                    if (typeof sizeOrOptions.outline == "function") {
                        sizeOrOptions.outline({
                            metrics: this.ctx.measureText(v),
                            origin: linePos,
                            size: +size.slice(0, -2),
                            align: this.ctx.textAlign,
                            baseline: this.ctx.textBaseline
                        })
                    } else {
                        this.ctx.strokeText(v, ...linePos.spread())
                    }
                }
                this.ctx.fillText(v, ...linePos.spread())

            })

            return this
        }
    }

    /** Changes the rendering context's size to the real size of the canvas element */
    setNativeSize() {
        if (this.fragile) throw new Error("Cannot set size of fragile canvas")

        const canvas = this.ctx.canvas
        const size = new Rect(0, 0, canvas.scrollWidth, canvas.scrollHeight)
        this.setSize(size)

        return this
    }

    setSize(size: Point | Rect) {
        if (this.fragile) throw new Error("Cannot set size of fragile canvas")

        let canvas = this.ctx.canvas
        this.size = size instanceof Point ? new Rect(new Point(), size) : size.origin()

        this.size = new Rect(0, 0, Math.max(this.size.width, 1), Math.max(this.size.height, 1))

        if (canvas.width == this.size.width && canvas.height == this.size.height) {
            this.ctx.clearRect(0, 0, canvas.width, canvas.height)
        } else {
            canvas.width = this.size.width
            canvas.height = this.size.height
        }

        return this
    }

    matchSize(other: Drawer | { width: number, height: number }) {
        const size = "width" in other ? (other instanceof Rect ? other : new Rect(0, 0, other.width, other.height)) : other.size

        if (!this.size.equals(size)) {
            this.setSize(size)
        }

        return this
    }

    beginPath() {
        this.ctx.beginPath()
        return this
    }

    closePath() {
        this.ctx.closePath()
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

    shape(points: Point[]) {
        let first = true
        for (const point of points) {
            if (first) {
                this.move(point)
                first = false
                continue
            }
            this.lineTo(point)
        }

        return this
    }

    /** Sets a linear gradient as a style */
    setLinearGradient(start: Point, end: Point, stops: readonly (readonly [number, string])[]) {
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
    blit(image: ImageData, dest?: Point): Drawer
    blit(image: CanvasImageSource | Drawer, dest: Rect): Drawer
    blit(image: CanvasImageSource | Drawer, dest: Rect, source: Rect): Drawer
    blit(image: CanvasImageSource | Drawer | ImageData, dest: Rect | Point | null = null, source: Rect | null = null) {
        if (image instanceof ImageData) {
            if (dest) {
                this.ctx.putImageData(image, dest!.x, dest!.y)
            } else {
                this.ctx.putImageData(image, 0, 0)
            }
            return this
        }

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

    transform(matrix: Matrix) {
        this.ctx.transform(
            matrix.m11, matrix.m12,
            matrix.m21, matrix.m22,
            matrix.m31, matrix.m32
        )
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

    setGlobalCompositeOperation(operation: GlobalCompositeOperation | null) {
        this.ctx.globalCompositeOperation = operation ?? "source-over"
        return this
    }

    getImageData(source: Rect = this.size) {
        return this.ctx.getImageData(source.x, source.y, source.width, source.height)
    }

    makeEmptyImageData() {
        return new ImageData(this.size.width, this.size.height)
    }
}

export namespace Drawer {
    export type Style = CanvasRenderingContext2D["fillStyle"] | Color

    export interface TextOptions {
        font?: string
        size?: string | number
        align?: CanvasTextAlign
        baseline?: CanvasTextBaseline
        outline?: boolean | ((options: TextRenderingMetrics) => void)
    }

    export interface TextRenderingMetrics {
        origin: Point
        metrics: TextMetrics
        size: number
        align: CanvasTextAlign
        baseline: CanvasTextBaseline
    }
}

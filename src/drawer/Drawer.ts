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
    public readonly size = new Rect()
    public readonly fragile: boolean

    constructor(public ctx: CanvasRenderingContext2D = Drawer.CONTEXT_FACTORY(), options?: { fragile?: boolean } | "fragile") {
        if (options == "fragile") {
            this.fragile = true
        } else if (options) {
            this.fragile = options.fragile ?? false
        } else {
            this.fragile = false
        }

        if (!this.fragile) {
            this.setNativeSize()
        } else {
            this.size = new Rect(0, 0, ctx.canvas.width, ctx.canvas.height)
        }
    }

    /** Sets the stroke and fill style */
    public setStyle(color: Drawer.Style) {
        if (color instanceof Color) color = color.toStyle()
        this.ctx.fillStyle = color
        this.ctx.strokeStyle = color
        return this
    }

    /** Sets only the fill style */
    public setFillStyle(color: Drawer.Style) {
        if (color instanceof Color) color = color.toStyle()
        this.ctx.fillStyle = color
        return this
    }

    /** Sets only the stroke style */
    public setStrokeStyle(color: Drawer.Style) {
        if (color instanceof Color) color = color.toStyle()
        this.ctx.strokeStyle = color
        return this
    }

    /** Sets the line dash, see [`ctx.setLineDash()`](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash) for more information */
    public setStrokeDash(segments: number[]) {
        this.ctx.setLineDash(segments)
        return this
    }

    /** Sets the line dash offset, see [ctx.lineDashOffset](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/lineDashOffset) for more information */
    public setStrokeDashOffset(offset: number) {
        this.ctx.lineDashOffset = offset
        return this
    }

    /** Fills the specified rect with the current fill color, or the whole canvas if not specified. */
    public fillRect(rect: Rect = this.size) {
        this.ctx.fillRect(...rect.spread())
        return this
    }

    /** Clears the canvas. */
    public clear() {
        this.setSize(this.size)
        return this
    }

    /** Strokes the specified rect with the current stroke color, or the whole canvas if not specified. */
    public strokeRect(rect: Rect) {
        this.ctx.strokeRect(...rect.spread())
        return this
    }

    /** Prints text at the specified position. If size or font is not specified attempts to read the CSS font style from the canvas element. */
    public fillText(text: string, pos: Point, size: number, font: string): Drawer
    public fillText(text: string, pos: Point, options: Drawer.TextOptions): Drawer
    public fillText(text: string, pos: Point, sizeOrOptions: number | Drawer.TextOptions, font = "") {
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
            if (sizeOrOptions.modifier) {
                fontStyle = sizeOrOptions.modifier + " " + fontStyle
            }
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
                            drawer: this,
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
    public setNativeSize() {
        if (this.fragile) throw new Error("Cannot set size of fragile canvas")

        const canvas = this.ctx.canvas
        const size = new Rect(0, 0,
            "scrollWidth" in canvas ? canvas.scrollWidth : (canvas as any).width,
            "scrollHeight" in canvas ? canvas.scrollHeight : (canvas as any).height,
        )
        this.setSize(size)

        return this
    }

    /** Changes the size of the canvas. */
    public setSize(size: Point | Rect) {
        if (this.fragile) throw new Error("Cannot set size of fragile canvas")

        const canvas = this.ctx.canvas
        const rect = size instanceof Point ? new Rect(new Point(), size) : size.origin();

        (this as { -readonly [P in keyof this]: this[P] }).size = new Rect(0, 0, Math.max(rect.width, 1), Math.max(rect.height, 1))

        if (canvas.width == this.size.width && canvas.height == this.size.height) {
            this.ctx.clearRect(0, 0, canvas.width, canvas.height)
        } else {
            canvas.width = this.size.width
            canvas.height = this.size.height
        }

        return this
    }

    /** Sets the size of the canvas to match the provided object. */
    public matchSize(other: Drawer | { width: number, height: number }) {
        const size = "width" in other ? (other instanceof Rect ? other : new Rect(0, 0, other.width, other.height)) : other.size

        if (!this.size.equals(size)) {
            this.setSize(size)
        }

        return this
    }

    /** Starts a new path, see [ctx.beginPath()](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/beginPath) for more information */
    public beginPath() {
        this.ctx.beginPath()
        return this
    }

    /** Closes a path by drawing a line to the start point, see [ctx.closePath()](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/beginPath) for more information */
    public closePath() {
        this.ctx.closePath()
        return this
    }

    /** Adds an arc to a path, see [ctx.arc()](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/arc) for more information */
    public arc(pos: Point, radius: number, startAngle = 0, endAngle = Math.PI * 2, anticlockwise = false) {
        this.ctx.arc(pos.x, pos.y, radius, startAngle, endAngle, anticlockwise)
        return this
    }

    /** Adds an ellipse to a path, see [ctx.ellipse()](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/ellipse) for more information */
    public ellipse(pos: Point, radius: Point, rotation = 0, startAngle = 0, endAngle = Math.PI * 2, anticlockwise = false) {
        this.ctx.ellipse(pos.x, pos.y, radius.x, radius.y, rotation, startAngle, endAngle, anticlockwise)
        return this
    }

    /** Adds a movement to the path */
    public move(pos: Point) {
        this.ctx.moveTo(pos.x, pos.y)
        return this
    }

    /** Adds a line to a path, from the last path position to the provided position */
    public lineTo(pos: Point) {
        this.ctx.lineTo(pos.x, pos.y)
        return this
    }

    /** Adds a bezier curve to the path */
    public bezierTo(cp1: Point, cp2: Point, pos: Point) {
        this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pos.x, pos.y)
        return this
    }

    /** Strokes the path */
    public stroke(path?: Path2D) {
        if (path) {
            this.ctx.stroke(path)
        } else {
            this.ctx.stroke()
        }
        return this
    }

    /** Fills the path */
    public fill(path?: Path2D) {
        if (path) {
            this.ctx.fill(path)
        } else {
            this.ctx.fill()
        }
        return this
    }

    /** Adds a polygon to the path */
    public shape(points: Point[]) {
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
    public setLinearGradient(start: Point, end: Point, stops: readonly (readonly [number, string])[]) {
        let gradient = this.ctx.createLinearGradient(start.x, start.y, end.x, end.y)
        stops.forEach(v => gradient.addColorStop(v[0], v[1]))
        this.setStyle(gradient)
        return this
    }

    /** Sets a radial gradient as a style */
    public setRadialGradient(start: Point, startRadius: number, end: Point | null, endRadius: number | null, stops: readonly (readonly [number, string])[]) {
        if (end == null) end = start
        if (endRadius == null) {
            endRadius = startRadius
            startRadius = 0
        }

        let gradient = this.ctx.createRadialGradient(start.x, start.y, startRadius, end.x, end.y, endRadius)
        stops.forEach(v => gradient.addColorStop(v[0], v[1]))
        this.setStyle(gradient)
        return this
    }

    /** Pushes the current rendering settings to a stack, can pop with `.restore` */
    public save() {
        this.ctx.save()
        return this
    }

    /** Pops the current rendering settings from a stack, previously saved with `.save` */
    public restore() {
        this.ctx.restore()
        return this
    }

    /** Sets the current path as a clip */
    public clip() {
        this.ctx.clip()
        return this
    }

    /** Adds a rect to the current path */
    public rect(rect: Rect) {
        this.ctx.rect(...rect.spread())
        return this
    }

    /** Sets the line width */
    public setStrokeWidth(width: number) {
        this.ctx.lineWidth = width
        return this
    }

    /** Copies the selected object to the canvas */
    public blit(image: Drawer.ImageSource): Drawer
    public blit(image: Drawer.ImageSource, dest: Point): Drawer
    public blit(image: ImageData, dest?: Point): Drawer
    public blit(image: Drawer.ImageSource, dest: Rect): Drawer
    public blit(image: Drawer.ImageSource, dest: Rect, source: Rect): Drawer
    public blit(image: Drawer.ImageSource | ImageData, dest: Rect | Point | null = null, source: Rect | null = null) {
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

    /** Updates the canvas transform by a translation */
    public translate(offset: Point) {
        this.ctx.translate(offset.x, offset.y)
        return this
    }

    /** Updates the canvas transform by a rotation */
    public rotate(angle: number) {
        this.ctx.rotate(angle)
        return this
    }

    /** Updates the canvas transform by a scale */
    public scale(scale: number | Point) {
        if (typeof scale == "number") {
            this.ctx.scale(scale, scale)
        } else {
            this.ctx.scale(scale.x, scale.y)
        }
        return this
    }

    /** Updates the canvas transform by the matrix */
    public transform(matrix: Matrix) {
        this.ctx.transform(
            matrix.m11, matrix.m12,
            matrix.m21, matrix.m22,
            matrix.m31, matrix.m32
        )
        return this
    }

    /** Sets the canvas transform to the matrix */
    public overrideTransform(matrix: Matrix) {
        this.ctx.setTransform(
            matrix.m11, matrix.m12,
            matrix.m21, matrix.m22,
            matrix.m31, matrix.m32
        )
        return this
    }

    /** Sets the line dash, see [ctx.setLineDash()](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash) for more information */
    public setLineDash(dash: number[] | null) {
        this.ctx.setLineDash(dash ?? [])
        return this
    }

    /** Sets the line dash offset, see [ctx.lineDashOffset](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/lineDashOffset) for more information */
    public setLineDashOffset(offset: number) {
        this.ctx.lineDashOffset = offset
        return this
    }

    /** Sets the line cap, see [ctx.lineCap](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/lineCap) for more information */
    public setLineCap(type: CanvasLineCap) {
        this.ctx.lineCap = type
        return this
    }

    /** Sets the line join, see [ctx.lineJoin](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/lineJoin) for more information */
    public setLineJoin(type: CanvasLineJoin) {
        this.ctx.lineJoin = type
        return this
    }

    /** Sets the global composite operation, see [ctx.globalCompositeOperation](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation) for more information */
    public setGlobalCompositeOperation(operation: GlobalCompositeOperation | null) {
        this.ctx.globalCompositeOperation = operation ?? "source-over"
        return this
    }

    /** Returns the image data of the canvas. If source rect is not provided, uses the whole canvas */
    public getImageData(source: Rect = this.size) {
        return this.ctx.getImageData(source.x, source.y, source.width, source.height)
    }

    /** Makes a new `ImageData` object with the size of the canvas */
    public makeEmptyImageData() {
        return new ImageData(this.size.width, this.size.height)
    }

    /** Enables or disables image smoothing, see [ctx.imageSmoothingEnabled](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled) for more information */
    public setImageSmoothing(value: boolean) {
        this.ctx.imageSmoothingEnabled = value
        return this
    }

    /** Applies the function with `this` and the provided arguments  */
    public use<T extends (ctx: Drawer, ...args: any) => void>(thunk: T, ...args: Parameters<T> extends [any, ...infer U] ? U : never) {
        thunk(this, ...args)
        return this
    }

    /** Creates a `CanvasPattern` using the content of this canvas */
    public asPattern(repetition: "repeat" | "repeat-x" | "repeat-y" | "no-repeat" = "repeat") {
        return this.ctx.createPattern(this.ctx.canvas, repetition)!
    }

    public static CONTEXT_FACTORY = () => document.createElement("canvas").getContext("2d")!
}

export namespace Drawer {
    export type Style = CanvasRenderingContext2D["fillStyle"] | Color
    export type ImageSource = CanvasImageSource | Drawer

    export interface TextOptions {
        /** Font family to use, if not specified, attempts to read the CSS font style from the canvas element */
        font?: string
        /** Font size to use, if not specified, attempts to read the CSS font style from the canvas element */
        size?: string | number
        /** Horizontal text alignment, relative to the specified position */
        align?: CanvasTextAlign
        /** Vertical text alignment, relative to the specified position */
        baseline?: CanvasTextBaseline
        /** If `true`, the text is stroked, before being filled. If a function is provided, it will be called before the text is filled with computed text metrics. */
        outline?: boolean | ((options: TextOutlineOptions) => void)
        /** Modifier to a apply to the text. */
        modifier?: "bold" | "italic" | "italic bold"
    }

    export interface TextOutlineOptions {
        drawer: Drawer
        origin: Point
        metrics: TextMetrics
        size: number
        align: CanvasTextAlign
        baseline: CanvasTextBaseline
    }

    export type TestPatternType = "uv" | "missing-texture"

    /** Creates a new `Drawer` containing a pattern. */
    export function makeTestPattern(type: TestPatternType, target: Drawer | Point, colorA: Color | null = null, colorB: Color | null = null): Drawer {
        if (target instanceof Point) target = new Drawer().setSize(target)

        if (type == "missing-texture") {
            colorA ??= Color.magenta
            colorB ??= Color.black

            const center = target.size.center()

            target
                .setStyle(colorB).fillRect()
                .setStyle(colorA)
                .fillRect(new Rect(Point.zero, center).floor())
                .fillRect(new Rect(center, center).floor())
        } else if (type == "uv") {
            colorA ??= Color.red
            colorB ??= Color.green

            target
                .setStyle(Color.black)
                .fillRect()
                .setGlobalCompositeOperation("lighten")
                .setLinearGradient(Point.zero, new Point(target.size.width, 0), [[0, "#000000"], [1, colorA.toHex()]])
                .fillRect()
                .setLinearGradient(Point.zero, new Point(0, target.size.height), [[0, "#000000"], [1, colorB.toHex()]])
                .fillRect()
        }

        return target
    }

    /** Utility class that allows you to easily transform the canvas coordinate system using a virtual camera. */
    export class Camera {
        /** The negative of the position of the camera @default Point.zero */
        public offset: Point
        /** The scale/zoom of the camera @default 1 */
        public scale: number
        /** If the view should be centered before being offset @default false */
        public shouldCenterView: boolean

        /** Matrix to transform from world space to screen space */
        public worldToScreen = Matrix.identity
        /** Matrix to transform from screen space to world space */
        public screenToWorld = Matrix.identity

        /** Updates the transformation matrices based on the size of the provided object */
        public updateViewport(size: Rect): void
        public updateViewport(drawer: Drawer): void
        public updateViewport(size: Rect | Drawer): void
        public updateViewport(size: Rect | Drawer) {
            if (size instanceof Drawer) size = size.size
            const pos = this.shouldCenterView ? this.offset.add(size.center()) : this.offset

            this.worldToScreen = Matrix.identity
                .translate(pos)
                .scale(this.scale)

            this.screenToWorld = Matrix.identity
                .scale(1 / this.scale)
                .translate(pos.mul(-1))
        }

        /**
         * Sets drawer transformation based on camera data, don't forget 
         * to reset the transform using `Drawer.restore()`.
         **/
        public pushTransform(drawer: Drawer) {
            drawer.save()
            drawer.transform(this.worldToScreen)
        }

        /**
         * Overrides drawer transformation based on camera data.
         **/
        public overrideTransform(drawer: Drawer) {
            drawer.save()
            drawer.overrideTransform(this.worldToScreen)
        }

        /** Updates the offset of this camera */
        public translate(offset: Point) {
            this.offset = this.offset.add(offset)
        }

        /** Zooms in such a way the movement will be centered on a point,
         * for example a mouse position. If this function is not desired,
         * simply change the scale property. */
        public zoomViewport(newScale: number, center: Point, viewport: Rect | Drawer) {
            const centerWorld = this.screenToWorld.transform(center)
            this.scale = newScale
            this.updateViewport(viewport)
            const newCenter = this.worldToScreen.transform(centerWorld)
            const correction = center.add(newCenter.mul(-1))
            this.offset = this.offset.add(correction)
        }

        constructor(
            { pos = Point.zero, scale = 1, shouldCenterView = false } = {}
        ) {
            this.offset = pos
            this.scale = scale
            this.shouldCenterView = shouldCenterView
        }

        public static readonly ZOOM_LEVELS = [1 / 50, 1 / 20, 1 / 10, 1 / 5, 1 / 2, 1, 2, 5, 10, 20, 50]
    }
}

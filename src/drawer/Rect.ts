import { Point } from "./Point"

export interface RectAlignOptions {
    width?: number
    height?: number
    left?: number
    right?: number
    top?: number
    bottom?: number
    size?: number
    padding?: number
}

export class Rect {
    size() {
        return new Point(this.width, this.height)
    }

    pos() {
        return new Point(this.x, this.y)
    }

    makePixelPerfect(): Rect {
        return new Rect(Math.floor(this.x) + 0.5, Math.floor(this.y) + 0.5, Math.floor(this.width), Math.floor(this.height))
    }

    floor(): Rect {
        return new Rect(Math.floor(this.x), Math.floor(this.y), Math.floor(this.width), Math.floor(this.height))
    }

    with(axis: "x" | "y" | "width" | "height", value: number) {
        return new Rect({ ...this, [axis]: value })
    }

    public readonly x: number
    public readonly y: number

    constructor(x: number | { x: number, y: number } | { x: number, y: number, width: number, height: number } = 0, y: number | { x: number, y: number } = 0, public readonly width = 0, public readonly height = 0) {
        if (typeof x === "object") {
            this.x = x.x
            this.y = x.y
            if ("width" in x) {
                this.width = x.width
                this.height = x.height
            } else {
                if (typeof y === "object") {
                    this.width = y.x
                    this.height = y.y
                } else {
                    this.width = y
                    this.height = width
                }
            }
        } else {
            this.x = x
            if (typeof y === "number") {
                this.y = y
            } else {
                throw new TypeError("y can only be an object if x is point")
            }
        }
    }

    spread(): [number, number, number, number] {
        return [this.x, this.y, this.width, this.height]
    }

    /** Returns a new rect with the same size, but starting at the origin */
    origin() {
        return new Rect(0, 0, this.width, this.height)
    }

    mul(amount: number) {
        return new Rect(this.x, this.y, this.width * amount, this.height * amount)
    }

    /** Gets the ending point */
    end() {
        return new Point(this.x + this.width, this.y + this.height)
    }

    translate(offset: { x: number, y: number } | number, offsetY = 0) {
        if (typeof offset === "object") {
            return new Rect(this.x + offset.x, this.y + offset.y, this.width, this.height)
        } else {
            return new Rect(this.x + offset, this.y + offsetY, this.width, this.height)
        }
    }

    expand(offset: { x: number, y: number } | number, offsetY = 0) {
        if (typeof offset === "object") {
            return new Rect(this.x, this.y, this.width + offset.x, this.height + offset.y)
        } else {
            return new Rect(this.x, this.y, this.width + offset, this.height + offsetY)
        }
    }

    copy() {
        return new Rect(this.x, this.y, this.width, this.height)
    }

    containsPoint(point: Point) {
        return point.x >= this.x && point.x < this.x + this.width && point.y >= this.y && point.y < this.y + this.height
    }

    center() {
        return this.pos().add(this.size().mul(0.5))
    }

    /** Test if other rect is inside this rect */
    containsRect(other: Rect) {
        let thisEnd = this.end()
        let otherEnd = other.end()

        return otherEnd.x >= this.x && otherEnd.y >= this.y && other.x <= thisEnd.x && other.y <= thisEnd.y
    }

    equals(other: { x: number, y: number, width: number, height: number }) {
        return this.x == other.x && this.y == other.y && this.width == other.width && this.height == other.height
    }

    sizeEquals(other: { width: number, height: number }) {
        return this.width == other.width && this.height == other.height
    }

    awayVector(point: Point) {
        let x = 0
        let y = 0

        const start = this.pos()
        const end = this.end()

        if (point.x < start.x) x = -1
        if (point.x > end.x) x = 1
        if (point.y < start.y) y = -1
        if (point.y > end.y) y = 1

        return new Point(x, y)
    }

    area() {
        return this.width * this.height
    }

    clampPoint(point: Point) {
        return new Point(
            Math.max(this.x, Math.min(this.x + this.width, point.x)),
            Math.max(this.y, Math.min(this.y + this.height, point.y))
        )
    }

    scale(rect: Rect) {
        return new Rect(this.x, this.y, this.width * rect.width, this.height * rect.height)
    }

    antiScale(rect: Rect) {
        return new Rect(this.x, this.y, this.width / rect.width, this.height / rect.height)
    }

    ceilSize() {
        return new Rect(this.x, this.y, Math.ceil(this.width), Math.ceil(this.height))
    }

    getFracPoint(point: Point): Point
    getFracPoint(x: number, y: number): Point
    getFracPoint(pointOrX: number | Point, y?: number) {
        const point = new Point(pointOrX, y)
        return this.pos().add(this.size().scale(point))
    }

    align(options: RectAlignOptions) {
        let x = 0
        let width = 0
        let y = 0
        let height = 0

        if (options.size != null) options.width = options.height = options.size
        if (options.padding != null) options.top = options.left = options.right = options.bottom = options.padding

        if (options.width != null) {
            width = options.width

            if (options.left != null) {
                x = options.left
            } else if (options.right != null) {
                x = this.width - options.right - options.width
            } else {
                x = (this.width - width) / 2
            }
        } else {
            if (options.left != null && options.right != null) {
                x = options.left
                width = this.width - x - options.right
            } else if (options.left != null) {
                x = options.left
                width = this.width - x
            } else if (options.right != null) {
                width = this.width - options.right
                x = 0
            }
        }

        if (options.height != null) {
            height = options.height

            if (options.top != null) {
                y = options.top
            } else if (options.bottom != null) {
                y = this.height - options.bottom - options.height
            } else {
                y = (this.height - height) / 2
            }
        } else {
            if (options.top != null && options.bottom != null) {
                y = options.top
                height = this.height - y - options.bottom
            } else if (options.top != null) {
                y = options.top
                height = this.height - y
            } else if (options.bottom != null) {
                height = this.height - options.bottom
                y = 0
            }
        }

        return new Rect(x, y, width, height)
    }

    aspectRatio(ratio: number, center = false) {
        if (ratio > 1) {
            const width = this.height / ratio
            if (width > this.width) {
                const widthRatio = this.width / width
                const height = this.height * widthRatio
                return new Rect(0, 0, width * widthRatio, height)
            }
            return new Rect(0, 0, width, this.height)
        } else {
            const height = this.width / ratio
            if (height > this.height) {
                const widthRatio = this.height / height
                const width = this.width * widthRatio
                return new Rect(0, 0, width, height * widthRatio)
            }
            return new Rect(0, 0, this.width, height)
        }
    }

    min() {
        return new Point(
            Math.min(this.x, this.x + this.width),
            Math.min(this.y, this.y + this.height)
        )
    }

    max() {
        return new Point(
            Math.max(this.x, this.x + this.width),
            Math.max(this.y, this.y + this.height)
        )
    }

    static extends(center: Point, size: Point) {
        return new Rect(center.add(size.mul(-0.5)), size)
    }

    static fromDOMRect(input: { top: number, left: number, width: number, height: number }) {
        return new Rect(input.left, input.top, input.width, input.height)
    }

    static union(targets: (Rect | Point)[]) {
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        for (const target of targets) {
            let min
            let max

            if ("min" in target) {
                min = target.min()
                max = target.max()
            } else {
                min = target
                max = target
            }

            if (minX > min.x) minX = min.x
            if (minY > min.y) minY = min.y
            if (maxX < max.x) maxX = max.x
            if (maxY < max.y) maxY = max.y
        }

        return new Rect(minX, minY, maxX - minX, maxY - minY)
    }

    public static one = new Rect(0, 0, 1, 1)
    public static zero = new Rect(0, 0, 0, 0)
}

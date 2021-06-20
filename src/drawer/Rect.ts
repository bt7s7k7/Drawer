import { Point } from "./Point"

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

    public readonly x: number
    public readonly y: number

    constructor(x: number | { x: number, y: number } | { x: number, y: number, width: number, height: number } = 0, y: number | { x: number, y: number } = 0, public readonly width = 0, public readonly height = 0) {
        if (typeof x === "object") {
            this.x = x.x
            this.y = x.y
            if ('width' in x) {
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

    translate(offset: { x: number, y: number } | number, offsetY: number = 0) {
        if (typeof offset === "object") {
            return new Rect(this.x + offset.x, this.y + offset.y, this.width, this.height)
        } else {
            return new Rect(this.x + offset, this.y + offsetY, this.width, this.height)
        }
    }

    expand(offset: { x: number, y: number } | number, offsetY: number = 0) {
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

    equals(other: Rect) {
        return this.x == other.x && this.y == other.y && this.width == other.width && this.height == other.height
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

    static extends(center: Point, size: Point) {
        return new Rect(center.add(size.mul(-0.5)), size)
    }
}
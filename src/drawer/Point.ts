export class Point {
    floor() {
        return new Point(Math.floor(this.x), Math.floor(this.y))
    }

    normalize() {
        if (this.x == 0 && this.y == 0) return Point.zero
        return this.mul(1 / Math.hypot(this.x, this.y))
    }

    toAngle() {
        return Math.atan2(this.x, this.y)
    }

    scale(other: { x: number, y: number } | number, otherY = 0) {
        if (typeof other === "object")
            return new Point(this.x * other.x, this.y * other.y)
        else
            return new Point(this.x * other, this.y * otherY)
    }

    antiScale(other: { x: number, y: number } | number, otherY = 0) {
        if (typeof other === "object")
            return new Point(this.x / other.x, this.y / other.y)
        else
            return new Point(this.x / other, this.y / otherY)
    }

    invert() {
        return new Point(1 / this.x, 1 / this.y)
    }

    public readonly x: number
    constructor(x: number | { x: number, y: number } = 0, public readonly y = 0) {
        if (typeof x === "object") {
            this.x = x.x
            this.y = x.y
        } else this.x = x
    }

    static fromAngle(angle: number) {
        return new Point(Math.sin(angle), Math.cos(angle))
    }

    spread(): [number, number] {
        return [this.x, this.y]
    }

    mul(amount: number) {
        return new Point(this.x * amount, this.y * amount)
    }

    add(other: { x: number, y: number } | number, otherY = 0) {
        if (typeof other === "object")
            return new Point(this.x + other.x, this.y + other.y)
        else
            return new Point(this.x + other, this.y + otherY)
    }

    makeKey() {
        return `${this.x}:${this.y}`
    }

    dist(other: { x: number, y: number }) {
        return Math.hypot(this.x - other.x, this.y - other.y)
    }

    isZero() {
        return this.x === 0 && this.y === 0
    }

    size() {
        return Math.hypot(this.x, this.y)
    }

    sizeSqr() {
        return this.x ** 2 + this.y ** 2
    }

    clampSize(maxSize: number) {
        let size = Math.hypot(this.x, this.y)
        if (size > maxSize) {
            return this.normalize().mul(maxSize)
        } else return this
    }

    area() {
        return this.x * this.y
    }

    equals(other: { x: number, y: number }) {
        return this.x == other.x && this.y == other.y
    }

    static dot(a: Point, b: Point) {
        return a.x * b.x + a.y * b.y
    }

    static project(start: Point, direction: Point, target: Point) {
        const targetStart = target.add(start.mul(-1))
        const dot = this.dot(direction, targetStart)

        return {
            length: dot,
            point: () => start.add(direction.mul(dot))
        }
    }

    static cardinalDirection(start: Point, end: Point) {
        const diff = end.add(start.mul(-1))

        const xAbs = Math.abs(diff.x)
        const yAbs = Math.abs(diff.y)

        if (xAbs > yAbs) {
            return new Point(diff.x, 0)
        } else {
            return new Point(0, diff.y)
        }
    }

    lerp(target: Point, frac: number) {
        return this.add(target.add(this.mul(-1)).mul(frac))
    }

    static min(a: Point, b: Point) {
        return new Point(Math.min(a.x, b.x), Math.min(a.y, b.y),)
    }

    static max(a: Point, b: Point) {
        return new Point(Math.max(a.x, b.x), Math.max(a.y, b.y),)
    }

    /** [1, 1] */
    static readonly one = new Point(1, 1)
    /** [0, 0] */
    static readonly zero = new Point()
    /** [0, -1] */
    static readonly up = new Point(0, -1)
    /** [0, 1] */
    static readonly down = new Point(0, 1)
    /** [-1, 0] */
    static readonly left = new Point(-1, 0)
    /** [1, 0] */
    static readonly right = new Point(1, 0)
    static readonly directions = [Point.up, Point.right, Point.down, Point.left]
}
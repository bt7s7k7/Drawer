export class Point {
    floor() {
        return new Point(Math.floor(this.x), Math.floor(this.y))
    }

    makePixelPerfect() {
        return new Point(Math.floor(this.x) + 0.5, Math.floor(this.y) + 0.5)
    }

    ceil() {
        return new Point(Math.ceil(this.x), Math.ceil(this.y))
    }

    normalize() {
        if (this.x == 0 && this.y == 0) return Point.zero
        return this.mul(1 / Math.hypot(this.x, this.y))
    }

    tangent() {
        return new Point(this.y, -this.x)
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

    pow(amount: number) {
        return new Point(this.x ** amount, this.y ** amount)
    }

    add(other: { x: number, y: number }): Point
    add(x: number, y: number): Point
    add(other: { x: number, y: number } | number, otherY = 0) {
        if (typeof other === "object")
            return new Point(this.x + other.x, this.y + other.y)
        else
            return new Point(this.x + other, this.y + otherY)
    }

    sub(other: { x: number, y: number }): Point
    sub(x: number, y: number): Point
    sub(other: { x: number, y: number } | number, otherY = 0) {
        if (typeof other === "object")
            return new Point(this.x - other.x, this.y - other.y)
        else
            return new Point(this.x - other, this.y - otherY)
    }

    makeKey() {
        return `${this.x}:${this.y}`
    }

    hash() {
        const t = this.x * 12.9898 + this.y * 78.233
        const y = Math.sin(t) * 43758.5453
        return y - Math.floor(y)
    }

    dist(other: { x: number, y: number }) {
        return Math.hypot(this.x - other.x, this.y - other.y)
    }

    isZero() {
        return this.x === 0 && this.y === 0
    }

    isNaN() {
        return isNaN(this.x) || isNaN(this.y)
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

    with(axis: "x" | "y", value: number) {
        return new Point({ ...this, [axis]: value })
    }

    static dot(a: Point, b: Point) {
        return a.x * b.x + a.y * b.y
    }

    static project(start: Point, direction: Point, target: Point) {
        const targetStart = target.add(start.mul(-1))
        const dot = this.dot(direction, targetStart)

        return {
            length: dot,
            point() { return start.add(direction.mul(this.length)) },
            pointClamped(maxLength: number) { return start.add(direction.mul(this.length < 0 ? 0 : this.length > maxLength ? maxLength : this.length)) }
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

    static dist(a: Point, b: Point) {
        return Math.hypot(a.x - b.x, a.y - b.y)
    }

    static distSqr(a: Point, b: Point) {
        return (a.x - b.x) ** 2 + (a.y - b.y) ** 2
    }

    static calculateObjectFit(target: Point, container: Point, type: "contain" | "cover" | "perfect") {
        const widthRatio = target.x / container.x
        const heightRatio = target.y / container.y

        if (type == "contain") {
            return Math.min(1 / widthRatio, 1 / heightRatio)
        } else if (type == "cover") {
            return Math.max(1 / widthRatio, 1 / heightRatio)
        } else {
            if (widthRatio > 1 || heightRatio > 1) {
                return Math.min(1 / widthRatio, 1 / heightRatio)
            } else {
                return Math.min(1 / widthRatio, 1 / heightRatio)
            }
        }
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
    /** [NaN, NaN] */
    static readonly NaN = new Point(NaN, NaN)
    static readonly directions = [Point.up, Point.right, Point.down, Point.left]
}

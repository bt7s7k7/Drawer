export class Point {
    floor() {
        return new Point(Math.floor(this.x), Math.floor(this.y))
    }

    normalize() {
        return this.mul(1 / Math.hypot(this.x, this.y))
    }

    toAngle() {
        return Math.atan2(this.x, this.y)
    }

    scale(other: { x: number, y: number } | number, otherY: number = 0) {
        if (typeof other === "object")
            return new Point(this.x * other.x, this.y * other.y)
        else
            return new Point(this.x * other, this.y * otherY)
    }

    invert() {
        return new Point(1 / this.x, 1 / this.y)
    }

    public readonly x: number;
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

    add(other: { x: number, y: number } | number, otherY: number = 0) {
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
        var size = Math.hypot(this.x, this.y)
        if (size > maxSize) {
            return this.normalize().mul(maxSize)
        } else return this
    }

    area() {
        return this.x * this.y
    }

    static dot(a: Point, b: Point) {
        return a.x * b.x + a.y * b.y
    }
}
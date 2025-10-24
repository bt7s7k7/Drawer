/** Represents a 2D vector or point. */
export class Point {
    /** Returns a point with all components floored */
    public floor() {
        return new Point(Math.floor(this.x), Math.floor(this.y))
    }

    /** Returns a point with all components rounded */
    public round() {
        return new Point(Math.round(this.x), Math.round(this.y))
    }

    /** Returns a point that allows for drawing lines with even widths without antialiasing */
    public makePixelPerfect() {
        return new Point(Math.floor(this.x) + 0.5, Math.floor(this.y) + 0.5)
    }

    /** Returns a point with all components ceiled */
    public ceil() {
        return new Point(Math.ceil(this.x), Math.ceil(this.y))
    }

    /** Returns a point with all components having an absolute value */
    public abs() {
        return new Point(Math.abs(this.x), Math.abs(this.y))
    }

    /** Returns a normalized vector */
    public normalize() {
        if (this.x == 0 && this.y == 0) return Point.zero
        return this.mul(1 / Math.hypot(this.x, this.y))
    }

    /** Returns a vector orthogonal to this one */
    public tangent() {
        return new Point(this.y, -this.x)
    }

    /** Returns the angle of this vector */
    public toAngle() {
        return Math.atan2(this.y, this.x)
    }

    /** Scales this vector by another vector, by element-wise multiplication */
    public scale(other: { x: number, y: number } | number, otherY = 0) {
        if (typeof other === "object")
            return new Point(this.x * other.x, this.y * other.y)
        else
            return new Point(this.x * other, this.y * otherY)
    }

    /** Inverse scales this vector by another vector, by element-wise division */
    public antiScale(other: { x: number, y: number } | number, otherY = 0) {
        if (typeof other === "object")
            return new Point(this.x / other.x, this.y / other.y)
        else
            return new Point(this.x / other, this.y / otherY)
    }

    /** Returns a new vector with all components being inverted */
    public invert() {
        return new Point(1 / this.x, 1 / this.y)
    }

    readonly x: number
    constructor(x: number | { x: number, y: number } = 0, readonly y = 0) {
        if (typeof x === "object") {
            this.x = x.x
            this.y = x.y
        } else this.x = x
    }

    /** Creates a unit vector using an angle (in radians) */
    public static fromAngle(angle: number) {
        return new Point(Math.cos(angle), Math.sin(angle))
    }

    /** Returns an array of form `[x, y]` */
    public spread(): [number, number] {
        return [this.x, this.y]
    }

    /** Multiplies this vector by a scalar */
    public mul(scalar: number) {
        return new Point(this.x * scalar, this.y * scalar)
    }

    /** Returns a new vector, where each component is put to the power */
    public pow(power: number) {
        return new Point(this.x ** power, this.y ** power)
    }

    /** Adds two vectors and returns a result */
    public add(other: { x: number, y: number }): Point
    add(x: number, y: number): Point
    add(other: { x: number, y: number } | number, otherY = 0) {
        if (typeof other === "object")
            return new Point(this.x + other.x, this.y + other.y)
        else
            return new Point(this.x + other, this.y + otherY)
    }

    /** Subtracts two vectors and returns a result */
    public sub(other: { x: number, y: number }): Point
    sub(x: number, y: number): Point
    sub(other: { x: number, y: number } | number, otherY = 0) {
        if (typeof other === "object")
            return new Point(this.x - other.x, this.y - other.y)
        else
            return new Point(this.x - other, this.y - otherY)
    }

    /** Creates a string that uniquely identifies this point for use as a key in a `Map` or a record. */
    public makeKey() {
        return `${this.x}:${this.y}`
    }

    /** Returns a hash code of this point. The result is in range from 0 to 1 and can be used as a pseudorandom number. */
    public hash() {
        const t = this.x * 12.9898 + this.y * 78.233
        const y = Math.sin(t) * 43758.5453
        return y - Math.floor(y)
    }

    /** Returns the euclidean distance to another point */
    public dist(other: { x: number, y: number }) {
        return Math.hypot(this.x - other.x, this.y - other.y)
    }

    /** Check is this vector is zero */
    public isZero() {
        return this.x === 0 && this.y === 0
    }

    /** Check at least one component is `NaN` */
    public isNaN() {
        return isNaN(this.x) || isNaN(this.y)
    }

    /** Returns the magnitude of this vector */
    public size() {
        return Math.hypot(this.x, this.y)
    }

    /** Returns the squared magnitude of this vector */
    public sizeSqr() {
        return this.x ** 2 + this.y ** 2
    }

    /** If the magnitude of this vector is larger than `maxSize` returns a new vector of size `maxSize`, otherwise returns this point. */
    public clampSize(maxSize: number) {
        let size = Math.hypot(this.x, this.y)
        if (size > maxSize) {
            return this.normalize().mul(maxSize)
        } else return this
    }

    /** Returns the product of the `x` and `y` components */
    public area() {
        return this.x * this.y
    }

    /** Check if this vector has identical components to the other */
    public equals(other: { x: number, y: number }) {
        return this.x == other.x && this.y == other.y
    }

    /** Returns a new point with one component being replaced */
    public with(axis: "x" | "y", value: number) {
        return new Point({ ...this, [axis]: value })
    }

    *[Symbol.iterator]() {
        yield this.x
        yield this.y
    }

    /** Returns a dot product */
    public static dot(a: Point, b: Point) {
        return a.x * b.x + a.y * b.y
    }

    /** Projects the `target` point on a line defined by `start` and `direction`. */
    public static project(start: Point, direction: Point, target: Point) {
        const targetStart = target.add(start.mul(-1))
        const dot = this.dot(direction, targetStart)

        return {
            /** Distance from the start of the line to the projected point */
            length: dot,
            /** Position of the projected point */
            point() { return start.add(direction.mul(this.length)) },
            /** Position of the projected point, clamped to a line segment starting at `start` and of length `maxLength` */
            pointClamped(maxLength: number) { return start.add(direction.mul(this.length < 0 ? 0 : this.length > maxLength ? maxLength : this.length)) }
        }
    }

    /** Calculates the direction from `start` to `end` and snaps it to one of the four cardinal directions. */
    public static cardinalDirection(start: Point, end: Point) {
        const diff = end.add(start.mul(-1))

        const xAbs = Math.abs(diff.x)
        const yAbs = Math.abs(diff.y)

        if (xAbs > yAbs) {
            return new Point(diff.x, 0)
        } else {
            return new Point(0, diff.y)
        }
    }

    /** Interpolates between vectors */
    public lerp(target: Point, frac: number) {
        return this.add(target.add(this.mul(-1)).mul(frac))
    }

    /** Returns a new point, where each component is the smallest one between `a` and `b` */
    public static min(a: Point, b: Point) {
        return new Point(Math.min(a.x, b.x), Math.min(a.y, b.y))
    }

    /** Returns a new point, where each component is the largest one between `a` and `b` */
    public static max(a: Point, b: Point) {
        return new Point(Math.max(a.x, b.x), Math.max(a.y, b.y))
    }

    /** Returns the euclidean distance between two points */
    public static dist(a: Point, b: Point) {
        return Math.hypot(a.x - b.x, a.y - b.y)
    }

    /** Returns the squared euclidean distance between two points */
    public static distSqr(a: Point, b: Point) {
        return (a.x - b.x) ** 2 + (a.y - b.y) ** 2
    }

    /** Calculates a new size of an object of size `target` required for it to fit in an container */
    public static calculateObjectFit(target: Point, container: Point, type: "contain" | "cover" | "perfect") {
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

    /**
     * Returns an array specifying the scalars to multiply dir$ and add to pos$ to get the intersection point. Scalars are infinite if lines are parallel.
     * @example
     * const [t1, t2] = Point.getLineIntersectionScalars(pos1, dir1, pos2, dir2)
     * const didIntersect = t1 != Infinity
     * const intersection = pos1.add(dir1.mul(t1))
     * // or
     * const intersection = pos2.add(dir2.mul(t2))
    */
    static getLineIntersectionScalars(pos1: Point, dir1: Point, pos2: Point, dir2: Point): [t1: number, t2: number] {
        const denom = dir2.y * dir1.x - dir2.x * dir1.y
        if (denom == 0) return [Infinity, Infinity]

        const t1 = (dir2.x * (pos1.y - pos2.y) - dir2.y * (pos1.x - pos2.x)) / denom
        const t2 = (dir1.x * (pos1.y - pos2.y) - dir1.y * (pos1.x - pos2.x)) / denom

        return [t1, t2]
    }

    /** Returns a point at which two lines intersect. If there is no intersection, the components of the returned point will be `Infinity`. */
    public static getLineIntersection(pos1: Point, dir1: Point, pos2: Point, dir2: Point) {
        const t1 = this.getLineIntersectionScalars(pos1, dir1, pos2, dir2)[0]
        return pos1.add(dir1.mul(t1))
    }

    /** [1, 1] */
    public static readonly one = new Point(1, 1)
    /** [0, 0] */
    public static readonly zero = new Point()
    /** [0, -1] */
    public static readonly up = new Point(0, -1)
    /** [0, 1] */
    public static readonly down = new Point(0, 1)
    /** [-1, 0] */
    public static readonly left = new Point(-1, 0)
    /** [1, 0] */
    public static readonly right = new Point(1, 0)
    /** [NaN, NaN] */
    public static readonly NaN = new Point(NaN, NaN)
    /** Array of the four cardinal directions. */
    public static readonly directions = [Point.up, Point.right, Point.down, Point.left] as const
}

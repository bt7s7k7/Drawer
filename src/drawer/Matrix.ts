import { Point } from "./Point"
import { Rect } from "./Rect"

export class Matrix {
    public translate(x: number, y: number): Matrix
    public translate(offset: { x: number, y: number }): Matrix
    public translate() {
        const x = arguments.length == 2 ? arguments[0] : arguments[0].x
        const y = arguments.length == 2 ? arguments[1] : arguments[0].y

        return new Matrix(
            this.m11, this.m21, this.m31 + x,
            this.m12, this.m22, this.m32 + y,
            this.m13, this.m23, this.m33
        )
    }

    public rotate(angle: number) {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)

        return new Matrix(
            cos * this.m11 + sin * this.m12,
            cos * this.m21 + sin * this.m22,
            cos * this.m31 + sin * this.m32,

            -sin * this.m11 + cos * this.m12,
            -sin * this.m21 + cos * this.m22,
            -sin * this.m31 + cos * this.m32,

            this.m13, this.m23, this.m33
        )
    }

    public transpose() {
        return new Matrix(
            this.m11, this.m12, this.m13,
            this.m21, this.m22, this.m23,
            this.m31, this.m32, this.m33
        )
    }

    public scale(scale: number): Matrix
    public scale(scale: Point): Matrix
    public scale(x: number, y: number): Matrix
    public scale() {
        let x: number
        let y: number

        if (arguments.length == 1) {
            if (typeof arguments[0] == "number") {
                x = y = arguments[0]
            } else {
                x = arguments[0].x
                y = arguments[0].y
            }
        } else {
            x = arguments[0]
            y = arguments[1]
        }

        return new Matrix(
            this.m11 * x, this.m21 * x, this.m31 * x,
            this.m12 * y, this.m22 * y, this.m32 * y,
            this.m13, this.m23, this.m33
        )
    }

    public mul(value: Matrix) {
        return new Matrix(
            this.m11 * value.m11 + this.m21 * value.m12 + this.m31 * value.m13,
            this.m11 * value.m21 + this.m21 * value.m22 + this.m31 * value.m23,
            this.m11 * value.m31 + this.m21 * value.m32 + this.m31 * value.m33,

            this.m12 * value.m11 + this.m22 * value.m12 + this.m32 * value.m13,
            this.m12 * value.m21 + this.m22 * value.m22 + this.m32 * value.m23,
            this.m12 * value.m31 + this.m22 * value.m32 + this.m32 * value.m33,

            this.m13 * value.m11 + this.m23 * value.m12 + this.m33 * value.m13,
            this.m13 * value.m21 + this.m23 * value.m22 + this.m33 * value.m23,
            this.m13 * value.m31 + this.m23 * value.m32 + this.m33 * value.m33,
        )
    }

    public transform(point: Point) {
        const v11 = point.x * this.m11
        const v12 = point.x * this.m12
        const v13 = point.x * this.m13

        const v21 = point.y * this.m21
        const v22 = point.y * this.m22
        const v23 = point.y * this.m23

        const v31 = this.m31
        const v32 = this.m32
        const v33 = this.m33

        const w = (v13 + v23 + v33)

        const x = (v11 + v21 + v31) / w
        const y = (v12 + v22 + v32) / w

        return new Point(x, y)
    }

    public transformVector(point: Point) {
        const v11 = point.x * this.m11
        const v12 = point.x * this.m12
        const v13 = point.x * this.m13

        const v21 = point.y * this.m21
        const v22 = point.y * this.m22
        const v23 = point.y * this.m23

        const v31 = 0
        const v32 = 0
        const v33 = 1

        const w = (v13 + v23 + v33)

        const x = (v11 + v21 + v31) / w
        const y = (v12 + v22 + v32) / w

        return new Point(x, y)
    }

    public transformRect(rect: Rect) {
        const start = this.transform(rect.pos())
        const end = this.transform(rect.end())

        return new Rect(start, end.add(start.mul(-1)))
    }

    public transformWithContext(point: Point, context: Rect) {
        return this.transform(point.antiScale(context.size())).scale(context.size())
    }

    public isIdentity() {
        if (this == Matrix.identity) return true

        return this.m11 == 1
            && this.m21 == 0
            && this.m31 == 0
            && this.m12 == 0
            && this.m22 == 1
            && this.m32 == 0
            && this.m13 == 0
            && this.m23 == 0
            && this.m33 == 1
    }

    public get(x: number, y: number) {
        if (x == 0 && y == 0) return this.m11
        if (x == 0 && y == 1) return this.m12
        if (x == 0 && y == 2) return this.m13
        if (x == 1 && y == 0) return this.m21
        if (x == 1 && y == 1) return this.m22
        if (x == 1 && y == 2) return this.m23
        if (x == 2 && y == 0) return this.m31
        if (x == 2 && y == 1) return this.m32
        if (x == 2 && y == 2) return this.m33
        else throw new RangeError("Matrix access out of range")
    }

    public end() {
        return this.transform(Point.zero)
    }

    public toCSS() {
        return `matrix(${this.m11}, ${this.m21}, ${this.m12}, ${this.m22}, ${this.m31}, ${this.m32})`
    }

    constructor(
        public readonly m11: number = 1,
        public readonly m21: number = 0,
        public readonly m31: number = 0,
        public readonly m12: number = 0,
        public readonly m22: number = 1,
        public readonly m32: number = 0,
        public readonly m13: number = 0,
        public readonly m23: number = 0,
        public readonly m33: number = 1
    ) { }

    public static readonly identity = new Matrix()

    public static fromDOMMatrix(source: Record<
        "a" | "b" | "c" |
        "d" | "e" | "f",
        number
    >) {
        return new Matrix(
            source.a, source.c, source.e,
            source.b, source.d, source.f,
            0, 0, 1
        )
    }
}

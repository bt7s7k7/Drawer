import { Point } from "./Point"

/** Constraints for alignment */
export interface RectAlignOptions {
    /** Width of the resulting rectangle. */
    width?: number
    /** Height of the resulting rectangle. */
    height?: number
    /** Distance from the left side of the container. */
    left?: number
    /** Distance from the right side of the container. */
    right?: number
    /** Distance from the top side of the container. */
    top?: number
    /** Distance from the bottom side of the container. */
    bottom?: number
    /** The width and height of the resulting rectangle. */
    size?: number
    /** Minimum padding from the sides of the container */
    padding?: number
}

export class Rect {
    /** Returns a vector of the size of this rect */
    public size() {
        return new Point(this.width, this.height)
    }

    /** Returns the positions of this rect */
    public pos() {
        return new Point(this.x, this.y)
    }

    /** Returns a new rect that allows for stroking rectangle with lines of an odd line width */
    public makePixelPerfect(): Rect {
        return new Rect(Math.floor(this.x) + 0.5, Math.floor(this.y) + 0.5, Math.floor(this.width), Math.floor(this.height))
    }

    /** Returns a new rectangle where all components are floored. */
    public floor(): Rect {
        return new Rect(Math.floor(this.x), Math.floor(this.y), Math.floor(this.width), Math.floor(this.height))
    }

    /** Returns a new rectangle where one component is replaced */
    public with(axis: "x" | "y" | "width" | "height", value: number) {
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

    /** Returns an array of format `[x, y, width, height]` */
    public spread(): [number, number, number, number] {
        return [this.x, this.y, this.width, this.height]
    }

    /** Returns a new rect with the same size, but starting at the origin */
    public origin() {
        return new Rect(0, 0, this.width, this.height)
    }

    /** Multiplies the size of this rect by a scalar */
    public mul(amount: number) {
        return new Rect(this.x, this.y, this.width * amount, this.height * amount)
    }

    /** Multiplies all components of this rect by a scalar */
    public mulAll(amount: number) {
        return new Rect(this.x * amount, this.y * amount, this.width * amount, this.height * amount)
    }

    /** Gets the ending point */
    public end() {
        return new Point(this.x + this.width, this.y + this.height)
    }

    /** Returns a new rect translated by the offset */
    public translate(offset: { x: number, y: number } | number, offsetY = 0) {
        if (typeof offset === "object") {
            return new Rect(this.x + offset.x, this.y + offset.y, this.width, this.height)
        } else {
            return new Rect(this.x + offset, this.y + offsetY, this.width, this.height)
        }
    }

    /** Returns a new rect with its size changed by the offset */
    public expand(offset: { x: number, y: number } | number, offsetY = 0) {
        if (typeof offset === "object") {
            return new Rect(this.x, this.y, this.width + offset.x, this.height + offset.y)
        } else {
            return new Rect(this.x, this.y, this.width + offset, this.height + offsetY)
        }
    }

    /** Returns a new rect with the same components */
    public copy() {
        return new Rect(this.x, this.y, this.width, this.height)
    }

    /** Checks if a point is inside this rect */
    public containsPoint(point: Point) {
        return point.x >= this.x && point.x < this.x + this.width && point.y >= this.y && point.y < this.y + this.height
    }

    /** Returns point at the center of this rect */
    public center() {
        return this.pos().add(this.size().mul(0.5))
    }

    /** Test if other rect is inside this rect */
    public containsRect(other: Rect) {
        let thisEnd = this.end()
        let otherEnd = other.end()

        return otherEnd.x >= this.x && otherEnd.y >= this.y && other.x <= thisEnd.x && other.y <= thisEnd.y
    }

    /** Checks if this rect has all components equal to another */
    public equals(other: { x: number, y: number, width: number, height: number }) {
        return this.x == other.x && this.y == other.y && this.width == other.width && this.height == other.height
    }


    /** Checks if this rect has size equal to another */
    public sizeEquals(other: { width: number, height: number }) {
        return this.width == other.width && this.height == other.height
    }

    /** @deprecated */
    public awayVector(point: Point) {
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

    /** Returns the area of this rect */
    public area() {
        return this.width * this.height
    }

    /** Returns a new new point that has its components clamped to be inside this rect */
    public clampPoint(point: Point) {
        return new Point(
            Math.max(this.x, Math.min(this.x + this.width, point.x)),
            Math.max(this.y, Math.min(this.y + this.height, point.y))
        )
    }

    /** Considering a line segment starting at `[0,0]` and extending by `vector`, get the end
    public  * point of this segment, if the line segment is constrained in such a way, that it cannot cross
     * the boundary of this rect. */
    clampVector(vector: Point) {
        let x2 = this.width * 0.5
        let y2 = this.height * 0.5

        let size = vector.size()
        const direction = vector.mul(1 / size)

        let right
        if (direction.x > 0) {
            right = new Point(x2, 0)
        } else {
            right = new Point(-x2, 0)
        }

        let down
        if (direction.y > 0) {
            down = new Point(0, y2)
        } else {
            down = new Point(0, -y2)
        }

        const [t1] = Point.getLineIntersectionScalars(Point.zero, direction, right, Point.down)
        const [t2] = Point.getLineIntersectionScalars(Point.zero, direction, down, Point.right)

        return direction.mul(Math.min(size, t1, t2))
    }

    /** Scales the size of this rect by a vector */
    public scale(rect: Rect) {
        return new Rect(this.x, this.y, this.width * rect.width, this.height * rect.height)
    }

    /** Inverse scales the size of this rect by a vector by element-wise division */
    public antiScale(rect: Rect) {
        return new Rect(this.x, this.y, this.width / rect.width, this.height / rect.height)
    }

    /** Returns a new rect where the size is ceiled */
    public ceilSize() {
        return new Rect(this.x, this.y, Math.ceil(this.width), Math.ceil(this.height))
    }

    /** Returns a point where its components are normalized relative to the position and size of this rect */
    public getFracPoint(point: Point): Point
    getFracPoint(x: number, y: number): Point
    getFracPoint(pointOrX: number | Point, y?: number) {
        const point = new Point(pointOrX, y)
        return this.pos().add(this.size().scale(point))
    }

    /** Returns a new rect that is positioned inside this rect according to the specified
    public  * constraints. The rect will be of the maximum possible size, while still satisfying all
     * provided constraints.  */
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

    /** Returns a new rect that has the matches an aspect ratio by shrinking this rect */
    public aspectRatio(ratio: number, center = false) {
        if (ratio > 1) {
            const width = this.height / ratio
            if (width > this.width) {
                const widthRatio = this.width / width
                const height = this.height * widthRatio
                return new Rect(0, 0, width * widthRatio, height)
            }
            return new Rect(0, 0, width, this.height)
        } else {
            const height = this.width * ratio
            if (height > this.height) {
                const widthRatio = this.height / height
                const width = this.width * widthRatio
                return new Rect(0, 0, width, height * widthRatio)
            }
            return new Rect(0, 0, this.width, height)
        }
    }

    /** Returns the point inside this rect with the lowest possible components */
    public min() {
        return new Point(
            Math.min(this.x, this.x + this.width),
            Math.min(this.y, this.y + this.height)
        )
    }

    /** Returns the point inside this rect with the largest possible components */
    public max() {
        return new Point(
            Math.max(this.x, this.x + this.width),
            Math.max(this.y, this.y + this.height)
        )
    }

    /** Returns a new rect that is aligned to an integer grid. */
    public snapToGrid() {
        const start = this.pos().floor()
        const end = this.end().ceil()
        return new Rect(start, end.sub(start))
    }

    /** Creates a new rect with the provided `center` and `size` */
    public static extends(center: Point, size: Point) {
        return new Rect(center.add(size.mul(-0.5)), size)
    }

    /** Creates a rect from a `DOMRect` */
    public static fromDOMRect(input: { top: number, left: number, width: number, height: number }) {
        return new Rect(input.left, input.top, input.width, input.height)
    }

    /** Creates a new rect at origin with matching the size of the provided object */
    public static fromSize(input: { width: number, height: number }) {
        return new Rect(0, 0, input.width, input.height)
    }

    /** Returns a new rect that fits all provided rects and points. */
    public static union(targets: (Rect | Point)[]) {
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

    /** Position: `[0, 0]`, Size: `[1, 1]` */
    public static one = new Rect(0, 0, 1, 1)
    /** Position: `[0, 0]`, Size: `[0, 0]` */
    public static zero = new Rect(0, 0, 0, 0)
}

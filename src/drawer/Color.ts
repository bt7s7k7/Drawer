export class Color {
    /** Creates a CSS color value in the `rgba(r,b,g,a)` format */
    public toStyle() {
        return `rgba(${Math.floor(Math.max(Math.min(this.r, 1), 0) * 255)
            }, ${Math.floor(Math.max(Math.min(this.g, 1), 0) * 255)
            }, ${Math.floor(Math.max(Math.min(this.b, 1), 0) * 255)
            }, ${Math.max(Math.min(this.a, 1), 0)
            })`
    }

    public lerp(other: Color, t: number) {
        return new Color(
            this.r + (other.r - this.r) * t,
            this.g + (other.g - this.g) * t,
            this.b + (other.b - this.b) * t,
            this.a + (other.a - this.a) * t
        )
    }

    public mul(value: number) {
        return new Color(
            this.r * value,
            this.g * value,
            this.b * value,
            this.a,
        )
    }

    public opacity(opacity: number) {
        return new Color(this.r, this.g, this.b, opacity)
    }

    public toGreyscale() {
        return (this.r + this.g + this.b) / 3
    }

    /** Creates a CSS color value in the `#xxxxxx` format (alpha value is ignored, use `toStyle()`) */
    public toHex() {
        return "#"
            + Math.min(255, Math.floor(this.r * 255)).toString(16).padStart(2, "0")
            + Math.min(255, Math.floor(this.g * 255)).toString(16).padStart(2, "0")
            + Math.min(255, Math.floor(this.b * 255)).toString(16).padStart(2, "0")
    }

    public toHSL() {
        const { r, g, b } = this

        const min = Math.min(r, g, b)
        const max = Math.max(r, g, b)
        const delta = max - min

        let h = 0

        if (delta == 0) h = 0
        else if (max == r) h = ((g - b) / delta) % 6
        else if (max == g) h = (b - r) / delta + 2
        else h = (r - g) / delta + 4

        h = h / 6
        if (h < 0) h += 1

        const l = (max + min) / 2
        const s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

        return { h, s, l }
    }

    public readonly r: number
    public readonly g: number
    public readonly b: number
    public readonly a: number

    constructor()
    constructor(r: number, b: number, g: number, a?: number)
    constructor(source: { r: number, b: number, g: number, a?: number })
    constructor(
        r?: number | { r: number, b: number, g: number, a?: number },
        g?: number, b?: number, a?: number
    ) {
        if (typeof r == "object") {
            this.r = r.r
            this.g = r.g
            this.b = r.b
            this.a = r.a ?? 1
        } else {
            this.r = r ?? 0
            this.g = g ?? 0
            this.b = b ?? 0
            this.a = a ?? 1
        }
    }

    public static white = new Color(1, 1, 1)
    public static black = new Color(0, 0, 0)
    public static red = new Color(1, 0, 0)
    public static green = new Color(0, 1, 0)
    public static blue = new Color(0, 0, 1)
    public static yellow = new Color(1, 1, 0)
    public static cyan = new Color(0, 1, 1)
    public static magenta = new Color(1, 0, 1)
    public static orange = new Color(1, 0.25, 0)
    public static transparent = new Color(0, 0, 0, 0)

    public static fromCSS(source: string) {
        if (source.startsWith("rgb")) {
            const [r, g, b] = source.slice(4, -1).split(",").map(v => +v)
            return new Color(r / 255, g / 255, b / 255)
        }

        if (source.startsWith("rgba")) {
            const [r, g, b, a] = source.slice(4, -1).split(",").map(v => +v)
            return new Color(r / 255, g / 255, b / 255, a / 255)
        }

        if (source.startsWith("#")) {
            return Color.fromHex(source)
        }

        if (source.startsWith("hsl")) {
            const [h, s, l] = source.slice(4, -1).split(",").map(v => +v)
            return new Color(h / 255, s / 255, l / 255)
        }

        throw new SyntaxError(`Unsupported color string "${source}"`)
    }

    public static fromHex(source: string) {
        let offset = 0
        if (source[0] == "#") offset += 1

        const r = parseInt(source.substr(offset + 0, 2), 16) / 255
        const g = parseInt(source.substr(offset + 2, 2), 16) / 255
        const b = parseInt(source.substr(offset + 4, 2), 16) / 255

        return new Color(r, g, b)
    }

    public static fromHSL(h: number, s: number, l: number) {
        let r, g, b

        if (s == 0) {
            r = g = b = l
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1
                if (t > 1) t -= 1
                if (t < 1 / 6) return p + (q - p) * 6 * t
                if (t < 1 / 2) return q
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
                return p
            }

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s
            const p = 2 * l - q
            r = hue2rgb(p, q, h + 1 / 3)
            g = hue2rgb(p, q, h)
            b = hue2rgb(p, q, h - 1 / 3)
        }

        return new Color(r, g, b)
    }
}


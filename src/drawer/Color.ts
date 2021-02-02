export class Color {

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

    public opacity(opacity: number) {
        return new Color(this.r, this.g, this.b, opacity)
    }

    constructor(
        public readonly r = 0,
        public readonly g = 0,
        public readonly b = 0,
        public readonly a = 1
    ) { }

    public static white = new Color(1, 1, 1)
    public static black = new Color(0, 0, 0)
    public static red = new Color(1, 0, 0)
    public static green = new Color(0, 1, 0)
    public static blue = new Color(0, 0, 1)
    public static yellow = new Color(1, 1, 0)
    public static cyan = new Color(0, 1, 1)
    public static magenta = new Color(1, 0, 1)
}


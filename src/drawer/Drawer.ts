import { Point } from "./Point"
import { Rect } from "./Rect"

type DrawerStyle = CanvasRenderingContext2D["fillStyle"]

export class Drawer {
    public size = new Rect()

    constructor(public ctx: CanvasRenderingContext2D = document.createElement("canvas").getContext("2d")!) {
        this.resize()
    }

    setStyle(color: DrawerStyle) {
        this.ctx.fillStyle = color
        this.ctx.strokeStyle = color
        return this
    }

    fillRect(rect: Rect) {
        this.ctx.fillRect(...rect.spread())
        return this
    }

    strokeRect(rect: Rect) {
        this.ctx.strokeRect(...rect.spread())
        return this
    }

    fillText(text: string, pos: Point, size: number, font: string) {
        var sizeText = size + "px"
        var fontStyle = `${sizeText} ${font}`
        this.ctx.font = fontStyle

        if (this.ctx.font !== fontStyle) {
            throw new Error(`Invalid font for drawer, size = ${size}, font = ${font} (ctx returned ${this.ctx.font})`)
        }

        var lines = text.split("\n")
        lines.forEach((v, i) => {
            var linePos = pos.add(0, size * i)

            this.ctx.fillText(v, ...linePos.spread())
        })

        return this
    }

    resize() {
        var canvas = this.ctx.canvas
        this.size = new Rect(canvas.getBoundingClientRect()).origin()
        canvas.width = this.size.width
        canvas.height = this.size.height
        return this
    }

    beginPath() {
        this.ctx.beginPath()
        return this
    }

    arc(pos: Point, radius: number, startAngle = 0, endAngle = Math.PI * 2, anticlockwise = false) {
        this.ctx.arc(pos.x, pos.y, radius, startAngle, endAngle, anticlockwise)
        return this
    }

    moveTo(pos: Point) {
        this.ctx.moveTo(pos.x, pos.y)
        return this
    }

    lineTo(pos: Point) {
        this.ctx.lineTo(pos.x, pos.y)
        return this
    }

    stroke() {
        this.ctx.stroke()
        return this
    }

    fill() {
        this.ctx.fill()
        return this
    }

    setLinearGradient(start: Point, end: Point, stops: [number, string][]) {
        let gradient = this.ctx.createLinearGradient(start.x, start.y, end.x, end.y)
        stops.forEach(v => gradient.addColorStop(v[0], v[1]))
        this.setStyle(gradient)
        return this
    }

    save() {
        this.ctx.save()
        return this
    }

    restore() {
        this.ctx.restore()
        return this
    }

    clip() {
        this.ctx.clip()
        return this
    }

    rect(rect: Rect) {
        this.ctx.rect(...rect.spread())
        return this
    }

    setStrokeWidth(width: number) {
        this.ctx.lineWidth = width
        return this
    }
}
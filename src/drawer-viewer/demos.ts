export const demos: Record<string, string> = {
    "Spiral": `const pos = ctx.size.end().mul(0.5)
const width = 10
const count = Math.ceil(ctx.size.width / width / 192 * 100)

for (let i of range(count)) {
  	i = count - i
  	const angle = -Date.now() / 500 + (i / 3)
	const mul = width * 2
	ctx
	  	.beginPath()
  		.arc(pos.add(new Point(Math.cos(angle) * mul,Math.sin(angle) * mul)), i * width)
  		.setStyle("white").fill()
  		.setStyle("black").stroke()
}`,
    "Avoidance": `ctx.setStyle("#000000")

const cellSize = 25

for (const x of range(ctx.size.width / cellSize)) {
        for (const y of range(ctx.size.height / cellSize)) {
        let pos = new Point(x*cellSize + cellSize / 2,y*cellSize + cellSize / 2)
        const mouseDiff = pos.add(mousePos.value.mul(-1))
        
        pos = pos.add(mouseDiff.normalize().mul(Math.sqrt(mouseDiff.size()) * 10))
          
        ctx
            .beginPath()
            .arc(pos, cellSize / 3)
            .stroke()
    }
}`
}
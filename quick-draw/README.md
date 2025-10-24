<h1 align=center>Quick Draw</h1>

Dead simple abstraction over the 2D canvas API. Provides a fluent API for ease of expression and various objects for 2D vector math. Visit the [playground](https://bt7s7k7.github.io/Drawer/) to try it out.

```ts
const drawer = new Drawer(canvasRenderingContext)

drawer
    .setSize(new Point(512, 256))
    .setStyle(Color.white)
    .fillRect()
    .setStrokeWidth(50)
    .setStyle(Color.red)
    .beginPath()
    .move(Point.zero)
    .lineTo(drawer.size.end())
    .stroke()
```

## Features

  - **Fluent API** ⇒ Complex drawing tasks without boiler-plate code
  - **Immutable objects** ⇒ Allows for simple one-liners to represent mathematical expressions and prevents problems with shared references
  - **Mathematical abstraction** ⇒ Classes provide easy to use implementations of common operations with 2D vectors, rectangles and coordinate systems

## Mathematics

  - **`Point`** ⇒ Representation of a 2D vector. Allows for addition, scaling, normalization, dot products, projection...
  - **`Rect`** ⇒ Representation of a 2D bounding box
  - **`Color`** ⇒ Representation of a color. Allows for mixing, setting opacity and converting to/from HSL, hex and CSS representation
  - **`Matrix`** ⇒ Describes transformations between coordinate systems. Includes operations for transformations of 2D homogenous coordinates, like translation, scaling and rotation, and methods for transforming vectors and points



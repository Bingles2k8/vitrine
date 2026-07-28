/**
 * How many objects `shapeAt` in core.ts knows how to draw. The scenes pick one
 * at random per page load, so this has to stay in step with the shader.
 */
export const SHAPE_COUNT = 4

/** Names in shapeAt order, for captions and alt text. */
export const SHAPE_NAMES = [
  'Rangefinder camera',
  'Vase',
  'Record',
  'Teacup and saucer',
] as const

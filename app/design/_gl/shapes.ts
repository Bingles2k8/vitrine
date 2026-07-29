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

/**
 * Plausible catalogue fields for each modelled shape, so the concepts that show
 * a record on screen have something to show. These describe the demo objects in
 * the shader, not anybody's real collection.
 */
export const SHAPE_META = [
  { object: 'Rangefinder camera', maker: 'Unattributed', period: 'c. 1954', material: 'Chrome, leatherette', dims: '138 × 78 × 55 mm', condition: 'Fair — light meter inoperative' },
  { object: 'Baluster vase', maker: 'Unattributed', period: 'c. 1910', material: 'Glazed stoneware', dims: '240 × 165 mm dia.', condition: 'Good — hairline to foot rim' },
  { object: 'Gramophone record', maker: 'Unattributed', period: 'c. 1962', material: 'Vinyl, paper label', dims: '302 mm dia. × 2 mm', condition: 'Good — surface marks, plays through' },
  { object: 'Teacup and saucer', maker: 'Unattributed', period: 'c. 1935', material: 'Bone china', dims: '96 × 128 mm; saucer 148 mm', condition: 'Good — gilt rubbed to handle' },
] as const

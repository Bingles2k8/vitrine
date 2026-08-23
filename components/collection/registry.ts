import type { GridVariant } from '@/lib/templates'
import type { GridProps } from './types'
import {
  CatalogueList, EditorialGrid, MosaicGrid, PlateGrid,
  SalonGrid, SpotlightGrid, StackGrid, UniformGrid,
} from './grids'
import {
  FlipRack, FoilFan, NorthlightCase, VersoTray, ViewfinderStage,
} from './object-led'

/**
 * The one place a grid variant is bound to a component.
 *
 * This map used to exist twice — in CollectionSearch and again in SetItems —
 * with a third partial copy in lib/collectionGroups/presentation.ts. A variant
 * added to one and missed in another fell back to UniformGrid silently, and
 * only on set pages, which reads as a design decision rather than a bug.
 * Because the record is exhaustive over GridVariant, the compiler now refuses
 * a new variant that has not been registered here.
 */
export const GRIDS: Record<GridVariant, (p: GridProps) => React.ReactElement | null> = {
  uniform: UniformGrid,
  plate: PlateGrid,
  catalogue: CatalogueList,
  spotlight: SpotlightGrid,
  mosaic: MosaicGrid,
  salon: SalonGrid,
  editorial: EditorialGrid,
  stack: StackGrid,

  flip: FlipRack,
  foil: FoilFan,
  northlight: NorthlightCase,
  verso: VersoTray,
  viewfinder: ViewfinderStage,
}

/**
 * Variants that hold one object at a time and select in place.
 *
 * They do their own framing from each picture's aspect and matte, so the
 * page must not wrap them in the card chrome the eight grid variants expect,
 * and the grid controls do not apply.
 */
export const OBJECT_LED: ReadonlySet<GridVariant> = new Set<GridVariant>([
  'flip', 'foil', 'northlight', 'verso', 'viewfinder',
])

export function isObjectLed(v: GridVariant | null | undefined): boolean {
  return !!v && OBJECT_LED.has(v)
}

export function gridFor(v: GridVariant | null | undefined) {
  return (v && GRIDS[v]) || UniformGrid
}

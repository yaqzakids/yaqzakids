import { BRUSH_SIZES, type BrushSize } from '@/lib/colouring/illustrations'
import {
  drawShape,
  getShapeBounds,
  type DrawableShapeTool,
  type Point,
} from '@/lib/drawing/shapeTools'

export type { DrawableShapeTool }

export interface ShapeObject {
  id: string
  tool: DrawableShapeTool
  from: Point
  to: Point
  color: string
  brushSize: BrushSize
  rotation: number
}

export interface DrawingScene {
  shapes: ShapeObject[]
  freehand: ImageData | null
}

export function createShapeObject(
  tool: DrawableShapeTool,
  from: Point,
  to: Point,
  color: string,
  brushSize: BrushSize
): ShapeObject {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tool,
    from,
    to,
    color,
    brushSize,
    rotation: 0,
  }
}

export function shapeCenter(shape: ShapeObject): Point {
  const b = getShapeBounds(shape.tool, shape.from, shape.to)
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 }
}

function rotatePoint(point: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = point.x - center.x
  const dy = point.y - center.y
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

function unrotatePoint(point: Point, center: Point, angle: number): Point {
  return rotatePoint(point, center, -angle)
}

export function drawShapeObject(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  preview = false
) {
  const center = shapeCenter(shape)
  ctx.save()
  ctx.translate(center.x, center.y)
  ctx.rotate(shape.rotation)
  ctx.translate(-center.x, -center.y)
  drawShape(ctx, shape.tool, shape.from, shape.to, shape.color, shape.brushSize, preview)
  ctx.restore()
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freehandCanvas: HTMLCanvasElement | null,
  shapes: ShapeObject[],
  options?: {
    preview?: ShapeObject | null
    selectedId?: string | null
  }
) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  if (freehandCanvas) {
    ctx.drawImage(freehandCanvas, 0, 0)
  }

  for (const shape of shapes) {
    drawShapeObject(ctx, shape)
  }

  if (options?.preview) {
    drawShapeObject(ctx, options.preview, true)
  }

  if (options?.selectedId) {
    const selected = shapes.find((s) => s.id === options.selectedId)
    if (selected) {
      drawSelectionHandles(ctx, selected)
    }
  }
}

export function drawSelectionHandles(ctx: CanvasRenderingContext2D, shape: ShapeObject) {
  const center = shapeCenter(shape)
  const bounds = getShapeBounds(shape.tool, shape.from, shape.to)
  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.w, y: bounds.y },
    { x: bounds.x + bounds.w, y: bounds.y + bounds.h },
    { x: bounds.x, y: bounds.y + bounds.h },
  ].map((p) => rotatePoint(p, center, shape.rotation))

  ctx.save()
  ctx.strokeStyle = '#2AAFA0'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(corners[0].x, corners[0].y)
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.setLineDash([])

  const handle = rotationHandlePoint(shape)
  ctx.fillStyle = '#2AAFA0'
  ctx.beginPath()
  ctx.arc(handle.x, handle.y, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(center.x, center.y)
  ctx.lineTo(handle.x, handle.y)
  ctx.stroke()

  for (const { point } of resizeHandlePositions(shape)) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(point.x - 5, point.y - 5, 10, 10)
    ctx.strokeStyle = '#2AAFA0'
    ctx.lineWidth = 2
    ctx.strokeRect(point.x - 5, point.y - 5, 10, 10)
  }

  ctx.restore()
}

export function rotationHandlePoint(shape: ShapeObject): Point {
  const center = shapeCenter(shape)
  const bounds = getShapeBounds(shape.tool, shape.from, shape.to)
  const localHandle = { x: center.x, y: bounds.y - 28 }
  return rotatePoint(localHandle, center, shape.rotation)
}

export function worldToShapeLocal(point: Point, shape: ShapeObject): Point {
  return unrotatePoint(point, shapeCenter(shape), shape.rotation)
}

export function hitTestRotationHandle(point: Point, shape: ShapeObject): boolean {
  const handle = rotationHandlePoint(shape)
  return Math.hypot(point.x - handle.x, point.y - handle.y) <= 14
}

export function hitTestShape(point: Point, shape: ShapeObject): boolean {
  const center = shapeCenter(shape)
  const local = unrotatePoint(point, center, shape.rotation)
  const bounds = getShapeBounds(shape.tool, shape.from, shape.to)
  const pad = BRUSH_SIZES[shape.brushSize] + 8

  if (shape.tool === 'line') {
    const dx = shape.to.x - shape.from.x
    const dy = shape.to.y - shape.from.y
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) {
      return Math.hypot(local.x - shape.from.x, local.y - shape.from.y) <= pad
    }
    const t = Math.max(
      0,
      Math.min(1, ((local.x - shape.from.x) * dx + (local.y - shape.from.y) * dy) / lenSq)
    )
    const px = shape.from.x + t * dx
    const py = shape.from.y + t * dy
    return Math.hypot(local.x - px, local.y - py) <= pad
  }

  return (
    local.x >= bounds.x - pad &&
    local.x <= bounds.x + bounds.w + pad &&
    local.y >= bounds.y - pad &&
    local.y <= bounds.y + bounds.h + pad
  )
}

export function findShapeAtPoint(point: Point, shapes: ShapeObject[]): ShapeObject | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (hitTestShape(point, shapes[i])) return shapes[i]
  }
  return null
}

export function moveShape(shape: ShapeObject, dx: number, dy: number): ShapeObject {
  return {
    ...shape,
    from: { x: shape.from.x + dx, y: shape.from.y + dy },
    to: { x: shape.to.x + dx, y: shape.to.y + dy },
  }
}

export function rotateShape(shape: ShapeObject, angle: number): ShapeObject {
  return { ...shape, rotation: angle }
}

export type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw' | 'from' | 'to'

const MIN_SHAPE_SIZE = 4
const HANDLE_RADIUS = 10

function fixedCornerForHandle(
  bounds: { x: number; y: number; w: number; h: number },
  handle: ResizeHandle
): Point {
  switch (handle) {
    case 'nw':
      return { x: bounds.x + bounds.w, y: bounds.y + bounds.h }
    case 'ne':
      return { x: bounds.x, y: bounds.y + bounds.h }
    case 'se':
      return { x: bounds.x, y: bounds.y }
    case 'sw':
      return { x: bounds.x + bounds.w, y: bounds.y }
    default:
      return { x: bounds.x, y: bounds.y }
  }
}

function constrainSquareCorner(fixed: Point, dragged: Point): Point {
  const dx = dragged.x - fixed.x
  const dy = dragged.y - fixed.y
  const size = Math.max(Math.abs(dx), Math.abs(dy), MIN_SHAPE_SIZE)
  return {
    x: fixed.x + Math.sign(dx || 1) * size,
    y: fixed.y + Math.sign(dy || 1) * size,
  }
}

export function resizeHandlePositions(
  shape: ShapeObject
): { handle: ResizeHandle; point: Point }[] {
  const center = shapeCenter(shape)

  if (shape.tool === 'line') {
    return [
      { handle: 'from', point: rotatePoint(shape.from, center, shape.rotation) },
      { handle: 'to', point: rotatePoint(shape.to, center, shape.rotation) },
    ]
  }

  const bounds = getShapeBounds(shape.tool, shape.from, shape.to)
  return (
    [
      { handle: 'nw' as const, point: { x: bounds.x, y: bounds.y } },
      { handle: 'ne' as const, point: { x: bounds.x + bounds.w, y: bounds.y } },
      { handle: 'se' as const, point: { x: bounds.x + bounds.w, y: bounds.y + bounds.h } },
      { handle: 'sw' as const, point: { x: bounds.x, y: bounds.y + bounds.h } },
    ] as const
  ).map(({ handle, point }) => ({
    handle,
    point: rotatePoint(point, center, shape.rotation),
  }))
}

export function hitTestResizeHandle(point: Point, shape: ShapeObject): ResizeHandle | null {
  for (const { handle, point: handlePoint } of resizeHandlePositions(shape)) {
    if (Math.hypot(point.x - handlePoint.x, point.y - handlePoint.y) <= HANDLE_RADIUS) {
      return handle
    }
  }
  return null
}

export function resizeShape(
  shape: ShapeObject,
  handle: ResizeHandle,
  localPoint: Point
): ShapeObject {
  if (shape.tool === 'line') {
    if (handle === 'from') return { ...shape, from: { ...localPoint } }
    if (handle === 'to') return { ...shape, to: { ...localPoint } }
    return shape
  }

  const bounds = getShapeBounds(shape.tool, shape.from, shape.to)
  const fixed = fixedCornerForHandle(bounds, handle)
  const square = shape.tool === 'square' || shape.tool === 'circle'
  const dragged = square ? constrainSquareCorner(fixed, localPoint) : localPoint

  const nextBounds = getShapeBounds(shape.tool, fixed, dragged)
  if (nextBounds.w < MIN_SHAPE_SIZE || nextBounds.h < MIN_SHAPE_SIZE) {
    return shape
  }

  return { ...shape, from: { ...fixed }, to: { ...dragged } }
}

export function resizeHandleCursor(handle: ResizeHandle, rotation: number): string {
  if (handle === 'from' || handle === 'to') return 'crosshair'

  const baseAngles: Record<Exclude<ResizeHandle, 'from' | 'to'>, number> = {
    nw: -135,
    ne: -45,
    se: 45,
    sw: 135,
  }
  const angle = ((baseAngles[handle] + (rotation * 180) / Math.PI + 180) % 180) - 90
  if (angle >= -22.5 && angle < 22.5) return 'ew-resize'
  if (angle >= 22.5 && angle < 67.5) return 'nesw-resize'
  if (angle >= 67.5 && angle < 112.5) return 'ns-resize'
  if (angle >= 112.5 && angle < 157.5) return 'nwse-resize'
  return 'ew-resize'
}

export function cloneScene(shapes: ShapeObject[], freehand: ImageData | null): DrawingScene {
  return {
    shapes: shapes.map((s) => ({ ...s, from: { ...s.from }, to: { ...s.to } })),
    freehand: freehand ? new ImageData(new Uint8ClampedArray(freehand.data), freehand.width, freehand.height) : null,
  }
}

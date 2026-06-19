import { BRUSH_SIZES, type BrushSize } from '@/lib/colouring/illustrations'

export interface Point {
  x: number
  y: number
}

export const SHAPE_TOOLS = [
  { id: 'select', label: 'Select', emoji: '👆' },
  { id: 'rectangle', label: 'Rectangle', emoji: '▭' },
  { id: 'square', label: 'Square', emoji: '⬜' },
  { id: 'circle', label: 'Circle', emoji: '⭕' },
  { id: 'ellipse', label: 'Oval', emoji: '⬭' },
  { id: 'line', label: 'Line', emoji: '／' },
  { id: 'triangle', label: 'Triangle', emoji: '△' },
  { id: 'semi-circle', label: 'Dome', emoji: '⌒' },
  { id: 'pencil', label: 'Pencil', emoji: '✏️' },
  { id: 'eraser', label: 'Eraser', emoji: '🧽' },
] as const

export type ShapeTool = (typeof SHAPE_TOOLS)[number]['id']

export type DrawableShapeTool = Exclude<ShapeTool, 'pencil' | 'eraser' | 'select'>

export function isShapeDragTool(tool: ShapeTool): tool is DrawableShapeTool {
  return tool !== 'pencil' && tool !== 'eraser' && tool !== 'select'
}

export function shapeCursor(tool: ShapeTool): string {
  if (tool === 'select') return 'default'
  if (tool === 'eraser') return 'grab'
  return 'crosshair'
}

export function normalizeBounds(from: Point, to: Point, square = false) {
  let w = to.x - from.x
  let h = to.y - from.y
  if (square) {
    const size = Math.max(Math.abs(w), Math.abs(h))
    w = Math.sign(w || 1) * size
    h = Math.sign(h || 1) * size
  }
  const x = w < 0 ? from.x + w : from.x
  const y = h < 0 ? from.y + h : from.y
  return { x, y, w: Math.abs(w), h: Math.abs(h) }
}

export function getShapeBounds(
  tool: ShapeTool,
  from: Point,
  to: Point
): { x: number; y: number; w: number; h: number } {
  if (tool === 'line') {
    const x = Math.min(from.x, to.x)
    const y = Math.min(from.y, to.y)
    return { x, y, w: Math.abs(to.x - from.x), h: Math.abs(to.y - from.y) }
  }
  if (tool === 'square' || tool === 'circle') {
    return normalizeBounds(from, to, true)
  }
  return normalizeBounds(from, to)
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  tool: ShapeTool,
  from: Point,
  to: Point,
  color: string,
  brushSize: BrushSize,
  preview = false
) {
  if (tool === 'select' || tool === 'pencil' || tool === 'eraser') return

  const lineWidth = BRUSH_SIZES[brushSize]
  const strokeColor = color

  ctx.save()
  ctx.strokeStyle = strokeColor
  ctx.fillStyle = strokeColor
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (preview) {
    ctx.setLineDash([6, 4])
    ctx.globalAlpha = 0.75
  }

  switch (tool) {
    case 'line': {
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
      break
    }
    case 'rectangle': {
      const { x, y, w, h } = normalizeBounds(from, to)
      ctx.strokeRect(x, y, w, h)
      break
    }
    case 'square': {
      const { x, y, w, h } = normalizeBounds(from, to, true)
      ctx.strokeRect(x, y, w, h)
      break
    }
    case 'circle': {
      const { x, y, w, h } = normalizeBounds(from, to, true)
      const r = Math.min(w, h) / 2
      ctx.beginPath()
      ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'ellipse': {
      const { x, y, w, h } = normalizeBounds(from, to)
      ctx.beginPath()
      ctx.ellipse(x + w / 2, y + h / 2, Math.max(w / 2, 1), Math.max(h / 2, 1), 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'triangle': {
      const { x, y, w, h } = normalizeBounds(from, to)
      ctx.beginPath()
      ctx.moveTo(x + w / 2, y)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x, y + h)
      ctx.closePath()
      ctx.stroke()
      break
    }
    case 'semi-circle': {
      const { x, y, w, h } = normalizeBounds(from, to)
      ctx.beginPath()
      ctx.arc(x + w / 2, y + h, w / 2, Math.PI, 0)
      ctx.stroke()
      break
    }
    default:
      break
  }

  ctx.restore()
}

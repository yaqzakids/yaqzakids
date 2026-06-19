import { BRUSH_SIZES, type BrushSize, type ColouringTool } from '@/lib/colouring/illustrations'
import { isOutlinePixel } from '@/lib/colouring/floodFill'

export interface DrawPoint {
  x: number
  y: number
}

const TOOL_SIZE_MULTIPLIER: Record<Exclude<ColouringTool, 'fill'>, number> = {
  pencil: 1,
  brush: 1.9,
  marker: 2.4,
  crayon: 1.5,
  spray: 2.8,
  eraser: 2.2,
}

export function toolUsesBrushSize(tool: ColouringTool): boolean {
  return tool !== 'fill'
}

export function toolRadius(tool: ColouringTool, brushSize: BrushSize): number {
  if (tool === 'fill') return 0
  return (BRUSH_SIZES[brushSize] * TOOL_SIZE_MULTIPLIER[tool]) / 2
}

function blocked(
  x: number,
  y: number,
  outlineData: Uint8ClampedArray | undefined,
  width: number,
  height: number
): boolean {
  if (!outlineData) return false
  const cx = Math.floor(x)
  const cy = Math.floor(y)
  if (cx < 0 || cx >= width || cy < 0 || cy >= height) return true
  return isOutlinePixel(outlineData, cx, cy, width)
}

function stampCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha = 1
) {
  const prev = ctx.globalAlpha
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = prev
}

export function applyDrawTool(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tool: Exclude<ColouringTool, 'fill'>,
  color: string,
  brushSize: BrushSize,
  outlineData?: Uint8ClampedArray
) {
  const { width, height } = ctx.canvas
  if (blocked(x, y, outlineData, width, height)) return

  const radius = toolRadius(tool, brushSize)
  const drawColor = tool === 'eraser' ? '#FFFFFF' : color

  switch (tool) {
    case 'pencil':
      stampCircle(ctx, x, y, radius, drawColor)
      break
    case 'brush':
      stampCircle(ctx, x, y, radius, drawColor)
      break
    case 'marker':
      stampCircle(ctx, x, y, radius, drawColor, 0.42)
      break
    case 'crayon':
      for (let i = 0; i < 5; i++) {
        const ox = (Math.random() - 0.5) * radius * 0.9
        const oy = (Math.random() - 0.5) * radius * 0.9
        stampCircle(ctx, x + ox, y + oy, radius * 0.35, drawColor, 0.55)
      }
      break
    case 'spray':
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = Math.random() * radius
        const sx = x + Math.cos(angle) * dist
        const sy = y + Math.sin(angle) * dist
        if (!blocked(sx, sy, outlineData, width, height)) {
          stampCircle(ctx, sx, sy, Math.max(1, radius * 0.12), drawColor, 0.35)
        }
      }
      break
    case 'eraser':
      stampCircle(ctx, x, y, radius, drawColor)
      break
  }
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  from: DrawPoint,
  to: DrawPoint,
  tool: Exclude<ColouringTool, 'fill'>,
  color: string,
  brushSize: BrushSize,
  outlineData?: Uint8ClampedArray
) {
  if (tool === 'brush' || tool === 'eraser') {
    const radius = toolRadius(tool, brushSize)
    const drawColor = tool === 'eraser' ? '#FFFFFF' : color
    ctx.strokeStyle = drawColor
    ctx.lineWidth = radius * 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    return
  }

  const dist = Math.hypot(to.x - from.x, to.y - from.y)
  const step = tool === 'spray' ? 6 : tool === 'crayon' ? 3 : 2
  const steps = Math.max(1, Math.ceil(dist / step))

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    applyDrawTool(
      ctx,
      from.x + (to.x - from.x) * t,
      from.y + (to.y - from.y) * t,
      tool,
      color,
      brushSize,
      outlineData
    )
  }
}

export function canvasCursor(tool: ColouringTool): string {
  switch (tool) {
    case 'fill':
      return 'cell'
    case 'eraser':
      return 'grab'
    case 'spray':
      return 'crosshair'
    default:
      return 'crosshair'
  }
}

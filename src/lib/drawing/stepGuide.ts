import type { StepGridLayout } from '@/lib/drawing/references'

export function stepCropRect(
  img: HTMLImageElement,
  stepIndex: number,
  grid: StepGridLayout
): { sx: number; sy: number; sw: number; sh: number } {
  const col = stepIndex % grid.cols
  const row = Math.floor(stepIndex / grid.cols)

  if (grid.columnBounds && grid.rowBounds) {
    const x0 = grid.columnBounds[col] ?? 0
    const x1 = grid.columnBounds[col + 1] ?? 1
    const y0 = grid.rowBounds[row] ?? 0
    const y1 = grid.rowBounds[row + 1] ?? 1
    return {
      sx: x0 * img.width,
      sy: y0 * img.height,
      sw: (x1 - x0) * img.width,
      sh: (y1 - y0) * img.height,
    }
  }

  const cellW = grid.width / grid.cols
  const cellH = grid.height / grid.rows
  const inset = grid.cellInset ?? 0

  return {
    sx: (grid.originX + col * cellW + cellW * inset) * img.width,
    sy: (grid.originY + row * cellH + cellH * inset) * img.height,
    sw: cellW * (1 - inset * 2) * img.width,
    sh: cellH * (1 - inset * 2) * img.height,
  }
}

export function renderStepPreview(
  img: HTMLImageElement,
  stepIndex: number,
  grid: StepGridLayout,
  maxSize = 560
): string {
  const { sx, sy, sw, sh } = stepCropRect(img, stepIndex, grid)
  const canvas = document.createElement('canvas')
  const aspect = sw / sh
  if (aspect >= 1) {
    canvas.width = maxSize
    canvas.height = Math.round(maxSize / aspect)
  } else {
    canvas.height = maxSize
    canvas.width = Math.round(maxSize * aspect)
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

export function drawStepGuideOnCanvas(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  stepIndex: number,
  grid: StepGridLayout,
  opacity: number
) {
  const { width, height } = ctx.canvas
  const { sx, sy, sw, sh } = stepCropRect(img, stepIndex, grid)
  const scale = Math.min(width / sw, height / sh) * 0.92
  const dw = sw * scale
  const dh = sh * scale
  const dx = (width - dw) / 2
  const dy = (height - dh) / 2

  const prev = ctx.globalAlpha
  ctx.globalAlpha = opacity
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
  ctx.globalAlpha = prev
}

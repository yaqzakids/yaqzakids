export type Rgb = readonly [number, number, number, number]

export function getPixelColor(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number
): Rgb {
  const i = (y * width + x) * 4
  return [data[i], data[i + 1], data[i + 2], data[i + 3]]
}

export function setPixelColor(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  rgb: [number, number, number],
  width: number
) {
  const i = (y * width + x) * 4
  data[i] = rgb[0]
  data[i + 1] = rgb[1]
  data[i + 2] = rgb[2]
  data[i + 3] = 255
}

export function colorsMatch(a: Rgb, b: readonly number[], tolerance = 32): boolean {
  return (
    Math.abs(a[0] - b[0]) <= tolerance &&
    Math.abs(a[1] - b[1]) <= tolerance &&
    Math.abs(a[2] - b[2]) <= tolerance
  )
}

export function hexToRGB(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ]
}

export function isOutlinePixel(data: Uint8ClampedArray, x: number, y: number, width: number): boolean {
  const [r, g, b, a] = getPixelColor(data, x, y, width)
  if (a < 128) return false
  return r + g + b < 120
}

export function floodFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillColor: string,
  outlineData?: Uint8ClampedArray
) {
  const { width, height } = ctx.canvas
  if (x < 0 || x >= width || y < 0 || y >= height) return

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const targetColor = getPixelColor(data, x, y, width)
  const fillRGB = hexToRGB(fillColor)

  if (outlineData && isOutlinePixel(outlineData, x, y, width)) return
  if (colorsMatch(targetColor, [...fillRGB, 255])) return

  const stack: [number, number][] = [[x, y]]
  const visited = new Uint8Array(width * height)

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!
    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue

    const visitIndex = cy * width + cx
    if (visited[visitIndex]) continue
    visited[visitIndex] = 1

    if (outlineData && isOutlinePixel(outlineData, cx, cy, width)) continue

    const currentColor = getPixelColor(data, cx, cy, width)
    if (!colorsMatch(currentColor, targetColor)) continue

    setPixelColor(data, cx, cy, fillRGB, width)
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
  }

  ctx.putImageData(imageData, 0, 0)
}

export function loadColouringImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load illustration: ${src}`))
    img.src = src
  })
}

/** @deprecated Use loadColouringImage */
export const loadSvgImage = loadColouringImage

export function fitImageRect(
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number = canvasWidth
): { x: number; y: number; width: number; height: number } {
  const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height)
  const width = img.width * scale
  const height = img.height * scale
  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
  }
}

/** Convert a line-art image into black outlines on a transparent canvas. */
export function rasterizeColouringOutline(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number = canvasWidth
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  const rect = fitImageRect(img, canvasWidth, canvasHeight)
  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height)

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const lum = (r + g + b) / 3

    if (lum > 210) {
      data[i + 3] = 0
    } else if (lum < 90) {
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 255
    } else {
      const alpha = Math.round(255 * (1 - (lum - 90) / 120))
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = Math.min(255, Math.max(0, alpha))
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

export function compositeCanvases(
  displayCtx: CanvasRenderingContext2D,
  fillCanvas: HTMLCanvasElement,
  outlineCanvas: HTMLCanvasElement
) {
  const { width, height } = displayCtx.canvas
  displayCtx.fillStyle = '#FFFFFF'
  displayCtx.fillRect(0, 0, width, height)
  displayCtx.drawImage(fillCanvas, 0, 0)
  displayCtx.drawImage(outlineCanvas, 0, 0)
}

export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

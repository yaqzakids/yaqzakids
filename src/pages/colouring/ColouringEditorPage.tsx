import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import PageSeo from '@/components/seo/PageSeo'
import { useSelectedChild } from '@/context/SelectedChildContext'
import {
  applyDrawTool,
  canvasCursor,
  drawStroke,
  toolUsesBrushSize,
} from '@/lib/colouring/drawingTools'
import {
  BRUSH_SIZES,
  COLOUR_PALETTE,
  COLOUR_PALETTE_GROUPS,
  COLOURING_TOOLS,
  illustrationById,
  type BrushSize,
  type ColouringTool,
} from '@/lib/colouring/illustrations'
import {
  compositeCanvases,
  floodFill,
  loadColouringImage,
  rasterizeColouringOutline,
} from '@/lib/colouring/floodFill'
import { downloadColouringPdf } from '@/lib/colouring/pdfExport'

function clientPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

function computeCanvasDimensions(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const scale = Math.min(maxWidth / img.width, maxHeight / img.height)
  return {
    width: Math.max(320, Math.floor(img.width * scale)),
    height: Math.max(320, Math.floor(img.height * scale)),
  }
}

export default function ColouringEditorPage() {
  const { illustrationId } = useParams<{ illustrationId: string }>()
  const illustration = illustrationId ? illustrationById(illustrationId) : undefined
  const { selectedChild } = useSelectedChild()

  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const fillCanvasRef = useRef<HTMLCanvasElement>(null)
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null)
  const outlineDataRef = useRef<Uint8ClampedArray | null>(null)
  const undoStackRef = useRef<ImageData[]>([])
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const canvasSizeRef = useRef({ width: 800, height: 600 })

  const [selectedColor, setSelectedColor] = useState<string>(COLOUR_PALETTE[0])
  const [tool, setTool] = useState<ColouringTool>('fill')
  const [brushSize, setBrushSize] = useState<BrushSize>('medium')
  const [loading, setLoading] = useState(true)
  const [undoCount, setUndoCount] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  const composite = useCallback(() => {
    const display = displayCanvasRef.current
    const fill = fillCanvasRef.current
    const outline = outlineCanvasRef.current
    if (!display || !fill || !outline) return
    const ctx = display.getContext('2d')
    if (!ctx) return
    compositeCanvases(ctx, fill, outline)
  }, [])

  const pushUndo = useCallback(() => {
    const fill = fillCanvasRef.current
    if (!fill) return
    const ctx = fill.getContext('2d')
    if (!ctx) return
    const { width, height } = canvasSizeRef.current
    undoStackRef.current.push(ctx.getImageData(0, 0, width, height))
    if (undoStackRef.current.length > 40) undoStackRef.current.shift()
    setUndoCount(undoStackRef.current.length)
  }, [])

  const resetFillCanvas = useCallback(() => {
    const fill = fillCanvasRef.current
    if (!fill) return
    const ctx = fill.getContext('2d')
    if (!ctx) return
    const { width, height } = canvasSizeRef.current
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
    undoStackRef.current = []
    setUndoCount(0)
    composite()
  }, [composite])

  const setupCanvases = useCallback(
    (width: number, height: number, img: HTMLImageElement) => {
      const fill = fillCanvasRef.current
      const outline = outlineCanvasRef.current
      const display = displayCanvasRef.current
      if (!fill || !outline || !display) return

      canvasSizeRef.current = { width, height }
      setCanvasSize({ width, height })

      for (const canvas of [fill, outline, display]) {
        canvas.width = width
        canvas.height = height
      }

      const fillCtx = fill.getContext('2d')
      const outlineCtx = outline.getContext('2d')
      if (!fillCtx || !outlineCtx) return

      fillCtx.fillStyle = '#FFFFFF'
      fillCtx.fillRect(0, 0, width, height)
      rasterizeColouringOutline(outlineCtx, img, width, height)
      outlineDataRef.current = outlineCtx.getImageData(0, 0, width, height).data
      undoStackRef.current = []
      setUndoCount(0)
      composite()
    },
    [composite]
  )

  useEffect(() => {
    if (!illustration) return

    let cancelled = false

    async function init() {
      setLoading(true)
      try {
        const img = await loadColouringImage(illustration!.imagePath)
        if (cancelled) return

        const wrap = canvasWrapRef.current
        const maxWidth = wrap?.clientWidth ?? 900
        const maxHeight = Math.max(480, window.innerHeight - 220)
        const dims = computeCanvasDimensions(img, maxWidth, maxHeight)
        setupCanvases(dims.width, dims.height, img)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [illustration, setupCanvases])

  useEffect(() => {
    if (!illustration) return

    const onResize = () => {
      const wrap = canvasWrapRef.current
      if (!wrap || loading) return
      void loadColouringImage(illustration.imagePath).then((img) => {
        const maxWidth = wrap.clientWidth
        const maxHeight = Math.max(480, window.innerHeight - 220)
        const dims = computeCanvasDimensions(img, maxWidth, maxHeight)
        if (
          dims.width !== canvasSizeRef.current.width ||
          dims.height !== canvasSizeRef.current.height
        ) {
          setupCanvases(dims.width, dims.height, img)
        }
      })
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [illustration, loading, setupCanvases])

  const handleUndo = () => {
    const fill = fillCanvasRef.current
    if (!fill || undoStackRef.current.length === 0) return
    const ctx = fill.getContext('2d')
    if (!ctx) return
    const previous = undoStackRef.current.pop()
    if (previous) ctx.putImageData(previous, 0, 0)
    setUndoCount(undoStackRef.current.length)
    composite()
  }

  const applyFill = (x: number, y: number) => {
    const fill = fillCanvasRef.current
    if (!fill) return
    const ctx = fill.getContext('2d')
    if (!ctx) return
    pushUndo()
    floodFill(ctx, Math.floor(x), Math.floor(y), selectedColor, outlineDataRef.current ?? undefined)
    composite()
  }

  const applyDraw = (x: number, y: number, from?: { x: number; y: number }) => {
    if (tool === 'fill') return
    const fill = fillCanvasRef.current
    if (!fill) return
    const ctx = fill.getContext('2d')
    if (!ctx) return

    const outlineData = outlineDataRef.current ?? undefined
    if (from) {
      drawStroke(ctx, from, { x, y }, tool, selectedColor, brushSize, outlineData)
    } else {
      applyDrawTool(ctx, x, y, tool, selectedColor, brushSize, outlineData)
    }
    composite()
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (loading) return
    const canvas = displayCanvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    const point = clientPoint(canvas, e.clientX, e.clientY)

    if (tool === 'fill') {
      applyFill(point.x, point.y)
      return
    }

    isDrawingRef.current = true
    pushUndo()
    lastPointRef.current = point
    applyDraw(point.x, point.y)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || tool === 'fill') return
    const canvas = displayCanvasRef.current
    if (!canvas) return
    const point = clientPoint(canvas, e.clientX, e.clientY)
    const last = lastPointRef.current
    if (last) {
      applyDraw(point.x, point.y, last)
    } else {
      applyDraw(point.x, point.y)
    }
    lastPointRef.current = point
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false
    lastPointRef.current = null
    displayCanvasRef.current?.releasePointerCapture(e.pointerId)
  }

  const handleDownloadPdf = async () => {
    const canvas = displayCanvasRef.current
    if (!canvas || !illustration) return
    setExporting(true)
    try {
      await downloadColouringPdf({
        canvas,
        title: illustration.title,
        childName: selectedChild?.name,
      })
    } finally {
      setExporting(false)
    }
  }

  if (!illustration) {
    return <Navigate to="/colouring" replace />
  }

  return (
    <PublicLayout bg="bg-[#EEF4FF]">
      <PageSeo title={`Colouring — ${illustration.title}`} path={`/colouring/${illustration.id}`} />

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .colouring-print-area,
          .colouring-print-area * { visibility: visible !important; }
          .colouring-print-area {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: white !important;
          }
          .colouring-print-area canvas {
            width: 100vw !important;
            height: auto !important;
            max-height: 100vh !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 md:py-6 min-h-[calc(100vh-4rem)] flex flex-col">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
          <Link
            to="/colouring"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#1B2F5E] text-[#1B2F5E] text-sm font-extrabold hover:bg-[#1B2F5E] hover:text-white transition-colors"
          >
            ← Back to Gallery
          </Link>
          <h1 className="font-display text-lg md:text-xl font-bold text-[#1B2F5E] text-center flex-1">
            {illustration.title}
          </h1>
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={exporting || loading}
              className="px-4 py-2 bg-[#F5A623] text-white rounded-full text-sm font-extrabold hover:opacity-90 disabled:opacity-50"
            >
              {exporting ? 'Saving…' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 border-2 border-[#1B2F5E] text-[#1B2F5E] rounded-full text-sm font-extrabold hover:bg-[#1B2F5E] hover:text-white transition-colors"
            >
              Print
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
          <aside className="no-print xl:w-44 shrink-0 bg-white rounded-2xl border border-[#E5E7EB] p-3 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] mb-2">Tools</p>
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-1.5 mb-3">
              {COLOURING_TOOLS.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTool(id)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border-2 transition-colors ${
                    tool === id
                      ? 'border-[#F5A623] bg-[#FFF8EB] text-[#1B2F5E]'
                      : 'border-[#E5E7EB] text-[#1B2F5E] hover:border-[#F5A623]'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>

            {toolUsesBrushSize(tool) && (
              <div className="mb-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] mb-1.5">Size</p>
                <div className="grid grid-cols-2 xl:grid-cols-1 gap-1">
                  {(Object.keys(BRUSH_SIZES) as BrushSize[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setBrushSize(size)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border-2 capitalize ${
                        brushSize === size
                          ? 'border-[#F5A623] bg-[#FFF8EB]'
                          : 'border-[#E5E7EB] hover:border-[#F5A623]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoCount === 0}
                className="w-full py-2 rounded-lg border-2 border-[#E5E7EB] text-xs font-bold text-[#1B2F5E] hover:border-[#2AAFA0] disabled:opacity-40"
              >
                ↩️ Undo
              </button>
              <button
                type="button"
                onClick={resetFillCanvas}
                className="w-full py-2 rounded-lg border-2 border-[#E5E7EB] text-xs font-bold text-[#1B2F5E] hover:border-[#E85D4A]"
              >
                🗑️ Clear
              </button>
            </div>
          </aside>

          <div
            ref={canvasWrapRef}
            className="flex-1 flex items-center justify-center min-h-[50vh] xl:min-h-0 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden relative"
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 text-sm font-bold text-[#1B2F5E]">
                Loading illustration…
              </div>
            )}
            <canvas
              ref={displayCanvasRef}
              className="max-w-full max-h-[calc(100vh-10rem)] w-auto h-auto touch-none colouring-print-area"
              style={{
                cursor: canvasCursor(tool),
                aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            <canvas ref={fillCanvasRef} className="hidden" aria-hidden />
            <canvas ref={outlineCanvasRef} className="hidden" aria-hidden />
          </div>

          <aside className="no-print w-full xl:w-56 shrink-0 bg-white rounded-2xl border border-[#E5E7EB] p-3 shadow-sm flex flex-col max-h-[calc(100vh-8rem)]">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">Colours</p>
              <span
                className="ml-auto w-5 h-5 rounded border border-[#D1D5DB] shrink-0"
                style={{ backgroundColor: tool === 'eraser' ? '#FFFFFF' : selectedColor }}
                title="Selected colour"
              />
            </div>

            <div className="overflow-y-auto pr-1 space-y-2 min-h-0">
              {COLOUR_PALETTE_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#9CA3AF] mb-1 leading-tight sticky top-0 bg-white py-0.5">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-9 gap-0.5">
                    {group.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Select ${group.label} ${color}`}
                        onClick={() => setSelectedColor(color)}
                        className="w-[18px] h-[18px] rounded border transition-transform hover:scale-110 shrink-0"
                        style={{
                          backgroundColor: color,
                          borderColor:
                            selectedColor === color ? '#F5A623' : color === '#FFFFFF' ? '#D1D5DB' : color,
                          boxShadow: selectedColor === color ? '0 0 0 1px #F5A623' : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  )
}

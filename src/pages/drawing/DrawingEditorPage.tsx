import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import PageSeo from '@/components/seo/PageSeo'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { applyDrawTool, drawStroke } from '@/lib/colouring/drawingTools'
import {
  BRUSH_SIZES,
  COLOUR_PALETTE,
  COLOUR_PALETTE_GROUPS,
  type BrushSize,
  type ColouringTool,
} from '@/lib/colouring/illustrations'
import { loadColouringImage } from '@/lib/colouring/floodFill'
import {
  cloneScene,
  createShapeObject,
  findShapeAtPoint,
  hitTestRotationHandle,
  hitTestResizeHandle,
  moveShape,
  renderScene,
  resizeHandleCursor,
  resizeShape,
  rotateShape,
  shapeCenter,
  worldToShapeLocal,
  type DrawingScene,
  type ResizeHandle,
  type ShapeObject,
} from '@/lib/drawing/canvasObjects'
import { downloadDrawingPdf } from '@/lib/drawing/pdfExport'
import { SHAPE_TOOLS, tutorialById, type ShapeTool } from '@/lib/drawing/references'
import { isShapeDragTool, shapeCursor } from '@/lib/drawing/shapeTools'

const CANVAS_SIZE = 720

function clientPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

export default function DrawingEditorPage() {
  const { referenceId } = useParams<{ referenceId: string }>()
  const tutorial = referenceId ? tutorialById(referenceId) : undefined
  const { selectedChild } = useSelectedChild()

  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const freehandCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const undoStackRef = useRef<DrawingScene[]>([])
  const isDrawingRef = useRef(false)
  const isShapeDraggingRef = useRef(false)
  const isMovingRef = useRef(false)
  const isRotatingRef = useRef(false)
  const isResizingRef = useRef(false)
  const resizeHandleRef = useRef<ResizeHandle | null>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const rotateStartRef = useRef<number>(0)
  const transformUndoPushedRef = useRef(false)

  const [shapes, setShapes] = useState<ShapeObject[]>([])
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [previewShape, setPreviewShape] = useState<ShapeObject | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>(COLOUR_PALETTE[4])
  const [tool, setTool] = useState<ShapeTool>('rectangle')
  const [brushSize, setBrushSize] = useState<BrushSize>('medium')
  const [loading, setLoading] = useState(true)
  const [undoCount, setUndoCount] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [hoverCursor, setHoverCursor] = useState<string | null>(null)

  const getFreehandCanvas = useCallback(() => {
    if (!freehandCanvasRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_SIZE
      canvas.height = CANVAS_SIZE
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      }
      freehandCanvasRef.current = canvas
    }
    return freehandCanvasRef.current
  }, [])

  const getFreehandImage = useCallback(() => {
    const canvas = getFreehandCanvas()
    const ctx = canvas.getContext('2d')
    return ctx ? ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE) : null
  }, [getFreehandCanvas])

  const redraw = useCallback(
    (nextShapes: ShapeObject[], preview: ShapeObject | null, selectedId: string | null) => {
      const display = displayCanvasRef.current
      if (!display) return
      const ctx = display.getContext('2d')
      if (!ctx) return
      renderScene(ctx, CANVAS_SIZE, CANVAS_SIZE, getFreehandCanvas(), nextShapes, {
        preview,
        selectedId,
      })
    },
    [getFreehandCanvas]
  )

  const pushUndo = useCallback(() => {
    undoStackRef.current.push(cloneScene(shapes, getFreehandImage()))
    if (undoStackRef.current.length > 40) undoStackRef.current.shift()
    setUndoCount(undoStackRef.current.length)
  }, [shapes, getFreehandImage])

  const resetCanvas = useCallback(() => {
    const freehand = getFreehandCanvas()
    const ctx = freehand.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    }
    setShapes([])
    setSelectedShapeId(null)
    setPreviewShape(null)
    undoStackRef.current = []
    setUndoCount(0)
    redraw([], null, null)
  }, [getFreehandCanvas, redraw])

  useEffect(() => {
    if (!tutorial) return

    let cancelled = false

    async function init() {
      setLoading(true)
      try {
        await loadColouringImage(tutorial!.guideImagePath)
        if (cancelled) return

        const display = displayCanvasRef.current
        if (display) {
          display.width = CANVAS_SIZE
          display.height = CANVAS_SIZE
        }
        getFreehandCanvas()
        resetCanvas()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [tutorial, getFreehandCanvas, resetCanvas])

  useEffect(() => {
    if (!loading) {
      redraw(shapes, previewShape, selectedShapeId)
    }
  }, [shapes, previewShape, selectedShapeId, loading, redraw])

  const handleUndo = () => {
    const previous = undoStackRef.current.pop()
    if (!previous) return

    const freehand = getFreehandCanvas()
    const ctx = freehand.getContext('2d')
    if (ctx) {
      if (previous.freehand) {
        ctx.putImageData(previous.freehand, 0, 0)
      } else {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      }
    }

    setShapes(previous.shapes)
    setSelectedShapeId(null)
    setPreviewShape(null)
    setUndoCount(undoStackRef.current.length)
    redraw(previous.shapes, null, null)
  }

  const deleteSelectedShape = useCallback(() => {
    if (!selectedShapeId) return
    pushUndo()
    setShapes((prev) => prev.filter((s) => s.id !== selectedShapeId))
    setSelectedShapeId(null)
    setPreviewShape(null)
  }, [selectedShapeId, pushUndo])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!selectedShapeId) return
      e.preventDefault()
      deleteSelectedShape()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedShapeId, deleteSelectedShape])

  const applyFreeDraw = (x: number, y: number, from?: { x: number; y: number }) => {
    const freehand = getFreehandCanvas()
    const ctx = freehand.getContext('2d')
    if (!ctx) return

    const drawTool = tool as Exclude<ColouringTool, 'fill'>
    if (from) {
      drawStroke(ctx, from, { x, y }, drawTool, selectedColor, brushSize)
    } else {
      applyDrawTool(ctx, x, y, drawTool, selectedColor, brushSize)
    }
    redraw(shapes, previewShape, selectedShapeId)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (loading) return
    const canvas = displayCanvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    const point = clientPoint(canvas, e.clientX, e.clientY)

    if (tool === 'select') {
      const selected = selectedShapeId
        ? shapes.find((s) => s.id === selectedShapeId)
        : null

      if (selected && hitTestRotationHandle(point, selected)) {
        isRotatingRef.current = true
        transformUndoPushedRef.current = false
        dragStartRef.current = point
        const center = shapeCenter(selected)
        rotateStartRef.current = Math.atan2(point.y - center.y, point.x - center.x) - selected.rotation
        return
      }

      if (selected) {
        const resizeHandle = hitTestResizeHandle(point, selected)
        if (resizeHandle) {
          isResizingRef.current = true
          resizeHandleRef.current = resizeHandle
          transformUndoPushedRef.current = false
          dragStartRef.current = point
          return
        }
      }

      const hit = findShapeAtPoint(point, shapes)
      if (hit) {
        setSelectedShapeId(hit.id)
        isMovingRef.current = true
        transformUndoPushedRef.current = false
        dragStartRef.current = point
        return
      }

      setSelectedShapeId(null)
      return
    }

    if (isShapeDragTool(tool)) {
      isShapeDraggingRef.current = true
      pushUndo()
      shapeStartRef.current = point
      setPreviewShape(
        createShapeObject(tool, point, point, selectedColor, brushSize)
      )
      setSelectedShapeId(null)
      return
    }

    isDrawingRef.current = true
    pushUndo()
    lastPointRef.current = point
    applyFreeDraw(point.x, point.y)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current
    if (!canvas) return
    const point = clientPoint(canvas, e.clientX, e.clientY)

    if (isRotatingRef.current && selectedShapeId) {
      if (!transformUndoPushedRef.current) {
        pushUndo()
        transformUndoPushedRef.current = true
      }
      const selected = shapes.find((s) => s.id === selectedShapeId)
      if (!selected) return
      const center = shapeCenter(selected)
      const angle = Math.atan2(point.y - center.y, point.x - center.x) - rotateStartRef.current
      const next = shapes.map((s) => (s.id === selectedShapeId ? rotateShape(s, angle) : s))
      setShapes(next)
      return
    }

    if (isResizingRef.current && selectedShapeId && resizeHandleRef.current) {
      if (!transformUndoPushedRef.current) {
        pushUndo()
        transformUndoPushedRef.current = true
      }
      const selected = shapes.find((s) => s.id === selectedShapeId)
      if (!selected) return
      const local = worldToShapeLocal(point, selected)
      setShapes((prev) =>
        prev.map((s) =>
          s.id === selectedShapeId
            ? resizeShape(s, resizeHandleRef.current!, local)
            : s
        )
      )
      return
    }

    if (isMovingRef.current && selectedShapeId && dragStartRef.current) {
      if (!transformUndoPushedRef.current) {
        pushUndo()
        transformUndoPushedRef.current = true
      }
      const dx = point.x - dragStartRef.current.x
      const dy = point.y - dragStartRef.current.y
      dragStartRef.current = point
      setShapes((prev) =>
        prev.map((s) => (s.id === selectedShapeId ? moveShape(s, dx, dy) : s))
      )
      return
    }

    if (isShapeDraggingRef.current && shapeStartRef.current) {
      const start = shapeStartRef.current
      setPreviewShape(createShapeObject(tool as ShapeObject['tool'], start, point, selectedColor, brushSize))
      return
    }

    if (!isDrawingRef.current && tool === 'select') {
      const selected = selectedShapeId ? shapes.find((s) => s.id === selectedShapeId) : null
      if (selected) {
        if (hitTestRotationHandle(point, selected)) {
          setHoverCursor('grab')
          return
        }
        const resizeHandle = hitTestResizeHandle(point, selected)
        if (resizeHandle) {
          setHoverCursor(resizeHandleCursor(resizeHandle, selected.rotation))
          return
        }
      }
      setHoverCursor(null)
    }

    if (!isDrawingRef.current) return
    const last = lastPointRef.current
    if (last) {
      applyFreeDraw(point.x, point.y, last)
    } else {
      applyFreeDraw(point.x, point.y)
    }
    lastPointRef.current = point
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current
    if (canvas) {
      const point = clientPoint(canvas, e.clientX, e.clientY)

      if (isShapeDraggingRef.current && shapeStartRef.current) {
        const start = shapeStartRef.current
        const minSize = 4
        if (Math.hypot(point.x - start.x, point.y - start.y) >= minSize) {
          const newShape = createShapeObject(
            tool as ShapeObject['tool'],
            start,
            point,
            selectedColor,
            brushSize
          )
          setShapes((prev) => [...prev, newShape])
          setSelectedShapeId(newShape.id)
        }
        setPreviewShape(null)
        shapeStartRef.current = null
      }
    }

    isDrawingRef.current = false
    isShapeDraggingRef.current = false
    isMovingRef.current = false
    isRotatingRef.current = false
    isResizingRef.current = false
    resizeHandleRef.current = null
    lastPointRef.current = null
    dragStartRef.current = null
    setHoverCursor(null)
    displayCanvasRef.current?.releasePointerCapture(e.pointerId)
  }

  const handleDownloadPdf = async () => {
    const canvas = displayCanvasRef.current
    if (!canvas || !tutorial) return
    setExporting(true)
    try {
      await downloadDrawingPdf({
        canvas,
        title: tutorial.title,
        childName: selectedChild?.name,
      })
    } finally {
      setExporting(false)
    }
  }

  if (!tutorial) {
    return <Navigate to="/drawing" replace />
  }

  return (
    <PublicLayout bg="bg-[#EEF4FF]">
      <PageSeo title={`Drawing — ${tutorial.title}`} path={`/drawing/${tutorial.id}`} />

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .drawing-print-area,
          .drawing-print-area * { visibility: visible !important; }
          .drawing-print-area {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: white !important;
          }
          .drawing-print-area canvas {
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
            to="/drawing"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#1B2F5E] text-[#1B2F5E] text-sm font-extrabold hover:bg-[#1B2F5E] hover:text-white transition-colors"
          >
            ← Back to Gallery
          </Link>
          <h1 className="font-display text-lg md:text-xl font-bold text-[#1B2F5E] text-center flex-1">
            {tutorial.title}
          </h1>
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={exporting || loading}
              className="px-4 py-2 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold hover:opacity-90 disabled:opacity-50"
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

        <p className="no-print mb-2 text-center text-sm md:text-base font-semibold text-[#1B2F5E]/75">
          {tutorial.subtitle}
        </p>
        <p className="no-print mb-4 text-center text-xs font-semibold text-[#2AAFA0]">
          Tip: Select 👆 a shape or line, then press Delete or tap Remove — only that item goes away; Clear canvas wipes everything
        </p>

        <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
          <aside className="no-print xl:w-44 shrink-0 bg-white rounded-2xl border border-[#E5E7EB] p-3 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] mb-2">Shapes</p>
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-1.5 mb-3">
              {SHAPE_TOOLS.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTool(id)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border-2 transition-colors ${
                    tool === id
                      ? 'border-[#2AAFA0] bg-[#E8F8F6] text-[#1B2F5E]'
                      : 'border-[#E5E7EB] text-[#1B2F5E] hover:border-[#2AAFA0]'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>

            <div className="mb-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] mb-1.5">Line size</p>
              <div className="grid grid-cols-2 xl:grid-cols-1 gap-1">
                {(Object.keys(BRUSH_SIZES) as BrushSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBrushSize(size)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold border-2 capitalize ${
                      brushSize === size
                        ? 'border-[#2AAFA0] bg-[#E8F8F6]'
                        : 'border-[#E5E7EB] hover:border-[#2AAFA0]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

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
                onClick={deleteSelectedShape}
                disabled={!selectedShapeId}
                title="Remove the selected shape or line (Delete / Backspace)"
                className="w-full py-2 rounded-lg border-2 border-[#E5E7EB] text-xs font-bold text-[#1B2F5E] hover:border-[#E85D4A] disabled:opacity-40"
              >
                🗑️ Remove selected
              </button>
              <button
                type="button"
                onClick={resetCanvas}
                title="Erase the whole canvas — all shapes and pencil strokes"
                className="w-full py-2 rounded-lg border-2 border-[#E5E7EB] text-xs font-bold text-[#1B2F5E] hover:border-[#E85D4A]"
              >
                🧹 Clear canvas
              </button>
            </div>
          </aside>

          <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-[50vh] xl:min-h-0">
            <div className="lg:w-[42%] flex flex-col bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden min-h-[320px] lg:min-h-[520px] max-h-[calc(100vh-10rem)]">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] px-3 py-2 border-b border-[#EEF4FF] shrink-0">
                Drawing guide — follow all the steps
              </p>
              <div className="flex-1 overflow-y-auto p-3 bg-[#F7FAFF] min-h-0">
                <img
                  src={tutorial.guideImagePath}
                  alt={tutorial.title}
                  className="w-full h-auto block rounded-lg border border-[#E5E7EB] bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="lg:flex-1 relative flex flex-col bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#EEF4FF] shrink-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">
                  Your canvas — draw here
                </p>
                {selectedShapeId && (
                  <button
                    type="button"
                    onClick={deleteSelectedShape}
                    className="no-print ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#E85D4A] text-[10px] font-extrabold text-[#E85D4A] hover:bg-[#E85D4A] hover:text-white transition-colors"
                    title="Remove only the selected shape or line (Delete / Backspace)"
                  >
                    🗑️ Remove selected
                  </button>
                )}
              </div>
              <div className="flex-1 flex items-center justify-center p-2 relative min-h-[360px] lg:min-h-[560px]">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20 text-sm font-bold text-[#1B2F5E]">
                    Loading…
                  </div>
                )}
                <canvas
                  ref={displayCanvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  tabIndex={0}
                  aria-label="Drawing canvas. Select a shape or line and press Delete to remove it."
                  className="relative z-10 w-full h-full max-w-full touch-none drawing-print-area bg-white border border-[#EEF4FF] rounded-lg shadow-inner outline-none focus-visible:ring-2 focus-visible:ring-[#2AAFA0]"
                  style={{
                    cursor: hoverCursor ?? shapeCursor(tool),
                    maxHeight: `min(${CANVAS_SIZE}px, 72vh)`,
                    aspectRatio: '1 / 1',
                  }}
                  onPointerDown={(e) => {
                    e.currentTarget.focus()
                    handlePointerDown(e)
                  }}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                />
              </div>
            </div>
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
                            selectedColor === color ? '#2AAFA0' : color === '#FFFFFF' ? '#D1D5DB' : color,
                          boxShadow: selectedColor === color ? '0 0 0 1px #2AAFA0' : undefined,
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

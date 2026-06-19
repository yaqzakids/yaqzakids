import { useEffect, useState } from 'react'
import { loadColouringImage } from '@/lib/colouring/floodFill'
import type { StepGridLayout } from '@/lib/drawing/references'
import { renderStepPreview } from '@/lib/drawing/stepGuide'

interface DrawingStepPreviewProps {
  guideImagePath: string
  stepIndex: number
  stepGrid: StepGridLayout
  alt: string
}

export default function DrawingStepPreview({
  guideImagePath,
  stepIndex,
  stepGrid,
  alt,
}: DrawingStepPreviewProps) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void loadColouringImage(guideImagePath).then((img) => {
      if (cancelled) return
      setSrc(renderStepPreview(img, stepIndex, stepGrid, 640))
    })

    return () => {
      cancelled = true
    }
  }, [guideImagePath, stepIndex, stepGrid])

  if (!src) {
    return (
      <div className="w-full h-full min-h-[240px] flex items-center justify-center bg-[#F7FAFF] rounded-xl border border-[#E5E7EB]">
        <p className="text-sm font-bold text-[#1B2F5E]">Loading step…</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[240px] flex items-center justify-center p-2">
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl border border-[#E5E7EB] bg-white shadow-sm"
      />
    </div>
  )
}

import { downloadColouringPdf } from '@/lib/colouring/pdfExport'

export async function downloadDrawingPdf(options: {
  canvas: HTMLCanvasElement
  title: string
  childName?: string | null
}) {
  await downloadColouringPdf({
    ...options,
    bylineVerb: 'Drawn',
    filePrefix: 'YaqzaKids-Drawing',
  })
}

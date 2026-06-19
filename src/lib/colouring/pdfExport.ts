import { jsPDF } from 'jspdf'
import { YAQZA_LOGO_URL } from '@/lib/colouring/illustrations'
import { loadImage } from '@/lib/colouring/floodFill'

export async function downloadColouringPdf(options: {
  canvas: HTMLCanvasElement
  title: string
  childName?: string | null
  bylineVerb?: 'Coloured' | 'Drawn'
  filePrefix?: string
}) {
  const { canvas, title, childName, bylineVerb = 'Coloured', filePrefix = 'YaqzaKids-Colouring' } = options
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  let y = 18

  try {
    const logo = await loadImage(YAQZA_LOGO_URL)
    const logoWidth = 40
    const logoHeight = (logo.height / logo.width) * logoWidth
    pdf.addImage(logo, 'PNG', (pageWidth - logoWidth) / 2, y, logoWidth, logoHeight)
    y += logoHeight + 6
  } catch {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.setTextColor(27, 47, 94)
    pdf.text('YaqzaKids', pageWidth / 2, y, { align: 'center' })
    y += 10
  }

  if (childName?.trim()) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(12)
    pdf.setTextColor(107, 114, 128)
    pdf.text(`${bylineVerb} by ${childName.trim()}`, pageWidth / 2, y, { align: 'center' })
    y += 8
  }

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(27, 47, 94)
  pdf.text(title, pageWidth / 2, y, { align: 'center' })
  y += 10

  const imgData = canvas.toDataURL('image/png')
  const maxWidth = pageWidth - 30
  const maxHeight = pageHeight - y - 25
  const aspect = canvas.width / canvas.height
  let imgWidth = maxWidth
  let imgHeight = imgWidth / aspect
  if (imgHeight > maxHeight) {
    imgHeight = maxHeight
    imgWidth = imgHeight * aspect
  }

  pdf.addImage(
    imgData,
    'PNG',
    (pageWidth - imgWidth) / 2,
    y,
    imgWidth,
    imgHeight
  )

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(107, 114, 128)
  pdf.text(
    'YaqzaKids.com — Rooted in Faith. Awake to the World.',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  const safeName = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
  pdf.save(`${filePrefix}-${safeName}.pdf`)
}

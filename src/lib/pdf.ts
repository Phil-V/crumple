/** PDF generation */
import { jsPDF } from 'jspdf'
import { ImageBlob } from '@/models/ImageData'

export interface PdfOptions {
  title: string | null
  resizeMode: 'matchWidth' | 'matchHeight'
}

const MAX_SIZE = 297 // millimeters

/** Calculate the scaled image dimensions based on the resize mode */
function calculatePageSize(
  imWidth: number,
  imHeight: number,
  resizeMode: PdfOptions['resizeMode'],
): [width: number, height: number] {
  const ratio = imHeight / imWidth

  switch (resizeMode) {
    case 'matchWidth':
      return [MAX_SIZE, ratio * MAX_SIZE]
    case 'matchHeight':
      return [MAX_SIZE / ratio, MAX_SIZE]
  }
}

/** Convert image blob to array buffer for jsPDF */
async function imageToArrayBuffer(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

/** Generate a PDF from a collection of image data */
async function generatePDF(images: ImageBlob[], options: PdfOptions): Promise<void> {
  const doc = new jsPDF({ unit: 'mm' })
  doc.deletePage(1) // delete the default blank page

  if (options.title) {
    doc.setProperties({ title: options.title })
  }

  for (const image of images) {
    const [width, height] = calculatePageSize(image.width, image.height, options.resizeMode)
    const isPortrait = height > width

    // jsPDF will flip dimensions automatically according to orientation
    // We prevent this by explicitly setting the orientation
    doc.addPage([width, height], isPortrait ? 'p' : 'l')

    const imageData = await imageToArrayBuffer(image.blob)
    doc.addImage(imageData, 'JPEG', 0, 0, width, height, '', 'NONE')
  }

  doc.save('images.pdf')
}

export default generatePDF

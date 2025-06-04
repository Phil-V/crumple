/** PDF generation */
import { jsPDF } from 'jspdf'
import { ImageBlob } from '@/models/ImageData'

/** Generate a PDF from a collection of image data */
async function generatePDF(images: ImageBlob[]) {
  // Use millimeters for units
  const WIDTH = 297
  const doc = new jsPDF({ unit: 'mm' })
  doc.deletePage(1) // delete the default blank page

  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    const ratio = image.height / image.width
    // jsPDF will flip the dimensions automatically according to the orientation
    // and we don't want that
    // https://github.com/parallax/jsPDF/blob/57cbe9499dc9922c1a8dbdd225f9c45364653324/src/jspdf.js#L2741
    doc.addPage([WIDTH, ratio * WIDTH], ratio > 1 ? 'p' : 'l')
    const data = await image.blob.arrayBuffer()
    doc.addImage(new Uint8Array(data), 'JPEG', 0, 0, WIDTH, ratio * WIDTH, '', 'NONE')
  }
  doc.save('images.pdf')
}

export default generatePDF

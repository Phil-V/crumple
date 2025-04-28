import { objectCounter } from '@/lib/utils'

/** ImageData model
 * Represents an in-memory image
 */
class ImageData {
  id: number
  constructor(
    public blob: ImageBlob,
    public dataUrl: string,
    public bitmap: ImageBitmap,
    public size: number,
  ) {
    this.id = objectCounter()
  }
  static async fromFile(file: File) {
    // TODO: remember to add connect-src data: to Content-Security-Policy
    // or refactor with another approach
    const dataUrl = URL.createObjectURL(file)
    const buffer = await file.arrayBuffer()
    const blob = new Blob([new Uint8Array(buffer)], { type: file.type })
    const bitmap = await createImageBitmap(blob)
    const sizedBlob = new ImageBlob(blob, bitmap.width, bitmap.height)
    return new ImageData(sizedBlob, dataUrl, bitmap, file.size)
  }
  get width() {
    return this.blob.width
  }
  get height() {
    return this.blob.height
  }
}

class ImageBlob {
  constructor(
    public blob: Blob,
    public width: number,
    public height: number,
  ) {}
  get size() {
    return this.blob.size
  }
}

export { ImageData, ImageBlob }

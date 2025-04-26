import objectCounter from '@/utils/objectCounter'

/** ImageData model
 * Represents an in-memory image
 */
class ImageData {
  public id: number
  public width: number | null = null
  public height: number | null = null
  public ready: Promise<void>
  public objectURL: string | null = null
  constructor(public data: Blob) {
    this.id = objectCounter()
    // TODO: remember to add connect-src data: to Content-Security-Policy
    // or refactor with another approach
    this.objectURL = URL.createObjectURL(data)
    this.ready = new Promise(async (resolve) => {
      /** Create an image bitmap to calculate the image dimensions */
      const bitmap = await createImageBitmap(data)
      this.width = bitmap.width
      this.height = bitmap.height
      bitmap.close()
      resolve()
    })
  }
  get fileSize(): number {
    return this.data.size
  }
}

export default ImageData

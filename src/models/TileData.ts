import objectCounter from '@/utils/objectCounter'

/** TileData model
 * Represents an in-memory image tile
 */
class TileData {
  public id: number
  public imgWidth: number | null = null
  public imgHeight: number | null = null
  public ready: Promise<void>
  constructor(public data: string) {
    this.id = objectCounter()
    this.ready = new Promise((resolve) => {
      const img = new Image()
      img.src = data
      img.onload = () => {
        this.imgWidth = img.width
        this.imgHeight = img.height
        resolve()
      }
    })
  }
  get fileSize(): number {
    // Calculate the file size in bytes
    // Ignore MIME type and padding
    // data:image/jpeg;base64,...==
    const length = this.data.length - (this.data.indexOf(',') + 1)
    let bytes = (length / 4) * 3
    if (this.data.slice(-2) === '==') bytes -= 2
    else if (this.data.slice(-1) === '=') bytes -= 1
    return bytes
  }
}

export default TileData

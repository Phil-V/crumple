import objectCounter from '@/utils/objectCounter'

/** TileData model
 * Represents an in-memory image tile
 */
class TileData {
  public id: number
  public imgWidth: number | null = null
  public imgHeight: number | null = null
  public ready: Promise<void>
  public objectURL: string | null = null
  constructor(public data: Blob) {
    this.id = objectCounter()
    console.log(data.size)
    this.objectURL = URL.createObjectURL(data)
    this.ready = new Promise(async (resolve) => {
      const bitmap = await createImageBitmap(data)
      this.imgWidth = bitmap.width
      this.imgHeight = bitmap.height
      bitmap.close()
      resolve()
    })
  }
  get fileSize(): number {
    return this.data.size
  }
}

export default TileData

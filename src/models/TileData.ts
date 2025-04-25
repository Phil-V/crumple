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
}

export default TileData

/** Image compression utility */
import ImageData from '@/models/ImageData'
import Compressor from 'compressorjs'

class ImageCollectionCompressor {
  compressors: ImageCompressor[] = []
  constructor(
    public sourceImages: ImageData[],
    public targetSize: number,
  ) {}
  async compress(): Promise<ImageData[]> {
    // calculate the byte budget per image
    let budget = this.targetSize / this.sourceImages.length

    this.sourceImages.forEach((image) => {
      this.compressors.push(new ImageCompressor(image, budget))
    })
    // TODO: start by converting PNG images to JPEG
    // calculate the extra space from images already under budget
    const extraBudget = this.compressors
      .filter((c) => c.status === CompressionStatus.NoCompressionNeeded)
      .reduce((acc, c) => acc + budget - c.sourceSize, 0)

    const pendingCompressors = this.compressors
      .filter((c) => c.status === CompressionStatus.Pending)
      .sort((a, b) => b.sourceSize - a.sourceSize) // desc

    budget = extraBudget / pendingCompressors.length + budget

    // start the compression process
    for (const compressor of pendingCompressors) {
      await compressor.compress(budget)
    }

    const compressedImages = this.compressors.map((c) => new ImageData(c.compressedData!))
    await Promise.all(compressedImages.map((image) => image.ready))
    return compressedImages
  }
}

enum CompressionStatus {
  Pending = 'pending',
  NoCompressionNeeded = 'no compression needed',
  Completed = 'completed',
  Failed = 'failed',
  InProgress = 'in progress',
}

class ImageCompressor {
  sourceSize: number
  status: CompressionStatus
  compressedData: Blob | null = null
  constructor(
    public sourceImage: ImageData,
    public targetSize: number,
  ) {
    this.sourceSize = this.sourceImage.fileSize
    if (this.sourceSize > this.targetSize) {
      this.status = CompressionStatus.Pending
    } else {
      this.status = CompressionStatus.NoCompressionNeeded
    }
  }

  async compress(newTarget: number | null): Promise<void> {
    const target = newTarget ?? this.targetSize
    this.status = CompressionStatus.InProgress
    let size = this.sourceSize
    let blob: Blob | null = null
    // while (size > target) {
    blob = await this.compressImage(size)
    size = blob!.size
    // }
    this.compressedData = blob
    this.status = CompressionStatus.Completed
  }

  async compressImage(size: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      new Compressor(this.sourceImage.data, {
        quality: 0.6,

        success(result) {
          console.log('success', result)
          resolve(result)
        },
        error(err) {
          console.log(err.message)
          reject(err)
        },
      })
    })
  }
}

export default ImageCollectionCompressor

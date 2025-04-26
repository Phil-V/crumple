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

    console.log('extra budget', extraBudget)

    const pendingCompressors = this.compressors
      .filter((c) => c.status === CompressionStatus.Pending)
      .sort((a, b) => b.sourceSize - a.sourceSize) // desc

    budget = extraBudget / pendingCompressors.length + budget

    // start the compression process
    for (const compressor of pendingCompressors) {
      await compressor.compress(budget)
    }

    const compressedImages = this.compressors.map((c) =>
      c.compressedData ? new ImageData(c.compressedData) : c.sourceImage,
    )
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

type CompressorOptions = {
  quality: number
  width: number // for scaling purposes
}

class ImageCompressor {
  sourceSize: number
  status: CompressionStatus
  compressedData: Blob | null = null
  defaultQuality: number = 0.9
  iterations: number = 0
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
    let options: CompressorOptions = {
      quality: this.defaultQuality,
      width: this.sourceImage.width!,
    }
    while (size > target) {
      if (this.iterations > 0) {
        options = this.guessOptions(
          size,
          target,
          this.sourceImage.width!,
          this.sourceImage.height!,
          options,
        )
      }
      blob = await this.compressImage(options)
      size = blob!.size
      this.iterations++
      console.log(this.iterations)
    }
    this.compressedData = blob
    this.status = CompressionStatus.Completed
  }

  guessOptions(
    size: number,
    target: number,
    width: number,
    height: number,
    previousOptions: CompressorOptions,
  ): CompressorOptions {
    const newQuality = Math.max(0.1, Math.min(1, previousOptions.quality - 0.1))
    const newWidth = Math.round(width * 0.9)
    return {
      quality: newQuality,
      width: newWidth,
    }
  }

  async compressImage(options: CompressorOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      new Compressor(this.sourceImage.data, {
        ...options,

        success(result) {
          console.log('success', result, options)
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

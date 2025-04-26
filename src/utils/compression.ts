/** Image compression utility */
import ImageData from '@/models/ImageData'
import Compressor from 'compressorjs'

/** Image collection compressor
 *  Compresses an array of images to a target size in bytes.
 */
class ImageCollectionCompressor {
  compressors: ImageCompressor[] = []
  constructor(
    public sourceImages: ImageData[],
    public targetSize: number,
  ) {}
  async compress(): Promise<ImageData[]> {
    // calculate the target in bytes per image
    // TODO: remove a bit of space to allow for PDF metadata
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

/** Options expected by compressorjs */
type CompressorOptions = {
  quality: number
  width: number // for scaling purposes
  // compressorjs automatically adjusts the height
}

/**
 * Image compressor class
 * Configure and keep track of the compression process status
 */
class ImageCompressor {
  sourceSize: number
  status: CompressionStatus
  compressedData: Blob | null = null
  // 0.90 doesn't seem to work with compressorjs, need to investigate further
  defaultQuality: number = 0.89
  minQuality: number = 0.78
  iterations: number = 0
  maxIterations: number = 10
  tolerance: number = 0.85
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

  /** Compress an image to a target size using compressorjs
   * Attempt to degrade quality first, then scale the image down
   * iterate using binary search to find the optimal size.
   */
  async compress(newTarget: number | null): Promise<void> {
    const target = newTarget ?? this.targetSize
    const qualityStep = 0.05
    this.status = CompressionStatus.InProgress
    let size = this.sourceSize
    let blob: Blob | null = null
    let options: CompressorOptions = {
      quality: this.defaultQuality,
      // compressorjs: changing the quality doesn't
      // seem to do anything if we don't also change the image size
      width: this.floorToMacroblock(this.sourceImage.width! - 1),
    }
    // try to iteratively drop the image quality
    while (size > target && options.quality >= this.minQuality) {
      blob = await this.compressImage(options)
      size = blob!.size
      console.log('compressed', size, options)
      this.iterations++
      options = {
        ...options,
        quality: options.quality - qualityStep,
      }
    }

    // if that didn't work, iteratively scale down the image
    if (size > target) {
      let currentScale = 0.5
      let minScale = 0.0
      let maxScale = 1.0
      for (let i = 0; i < this.maxIterations; i++) {
        let newWidth = this.floorToMacroblock(this.sourceImage.width! * currentScale)
        options = {
          quality: this.minQuality,
          width: newWidth,
        }
        const blobCandidate = await this.compressImage(options)
        size = blobCandidate!.size
        console.log('compressed', size, options)
        if (size <= target) {
          blob = blobCandidate
          if (size >= target * this.tolerance) {
            // good enough
            break
          }
          minScale = currentScale
        }
        if (size > target) {
          maxScale = currentScale
        }
        currentScale = (minScale + maxScale) * 0.5
        this.iterations++
      }
    }

    this.compressedData = blob
    this.status = CompressionStatus.Completed
    console.log('completed', this)
  }

  /** Round a number down to the nearest multiple of 16
   *  Might be an unnecessary optimization, needs some testing
   */
  floorToMacroblock(value: number): number {
    return Math.floor(value / 16) * 16
  }

  /** Perform the actual compression using compressorjs */
  async compressImage(options: CompressorOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      new Compressor(this.sourceImage.data, {
        ...options,

        success(result) {
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

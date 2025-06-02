/** Image compression library */
import { ImageData, ImageBlob } from '@/models/ImageData'
import { objectCounter, TypedWorker } from '@/lib/utils'
import type { WorkerRequest, WorkerResponse } from './worker-types'
import ResizeWorker from './worker-resize?worker'

/** Image collection compressor
 *  Compresses an array of images to a target size in bytes.
 */
class ImageCollectionCompressor {
  compressors: ImageCompressor[] = []
  constructor(
    public sourceImages: ImageData[],
    public targetSize: number,
  ) {}
  async compress(): Promise<ImageBlob[]> {
    // calculate the target in bytes per image
    let budget = this.targetSize / this.sourceImages.length

    this.sourceImages.forEach((image) => {
      this.compressors.push(new ImageCompressor(image, budget))
    })
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

    const blobs = this.compressors.map((c) => {
      return c.compressedBlob ?? c.sourceImage.blob
    })
    return blobs
  }
}

/**
 * Image compressor class and related interfaces
 * Configure and keep track of the compression process status
 */
// main class settings
interface ImageCompressorSettings {
  defaultQuality: number
  minQuality: number
  maxSearchIterations: number
  searchTolerance: number
}
// options for the compressImage method
interface CompressorOptions {
  quality: number
  width: number
  height: number
}
class ImageCompressor {
  id: number
  sourceSize: number
  status: CompressionStatus
  compressedBlob: ImageBlob | null = null
  iterations: number = 0
  readonly settings: Required<ImageCompressorSettings>
  private static readonly defaultSettings: ImageCompressorSettings = {
    defaultQuality: 0.89, // default jpeg compression quality
    minQuality: 0.78, // TODO: teak this to a sensible default
    maxSearchIterations: 10, // max iterations for binary search
    searchTolerance: 0.85, // tolerance for binary search
  }
  constructor(
    public sourceImage: ImageData,
    public targetSize: number,
    userSettings: Partial<ImageCompressorSettings> = {},
  ) {
    this.id = objectCounter()
    this.settings = {
      ...ImageCompressor.defaultSettings,
      ...userSettings,
    }
    this.sourceSize = this.sourceImage.size
    if (this.sourceSize > this.targetSize) {
      this.status = CompressionStatus.Pending
    } else {
      this.status = CompressionStatus.NoCompressionNeeded
    }
  }

  /** Compress an image to a target size
   * Attempt to degrade quality first, then scale the image down
   * iterate using binary search to find the optimal size.
   */
  async compress(newTarget: number | null): Promise<void> {
    const target = newTarget ?? this.targetSize
    const qualityStep = 0.05
    this.status = CompressionStatus.InProgress
    let size = this.sourceSize
    let blob: ImageBlob | null = null
    let options: CompressorOptions = {
      quality: this.settings.defaultQuality,
      width: this.sourceImage.width,
      height: this.sourceImage.height,
    }
    // try to iteratively drop the image quality
    while (size > target && options.quality >= this.settings.minQuality) {
      blob = await this.compressImage(this.sourceImage.bitmap, options)
      size = blob!.size
      console.log('compressed', size, options)
      this.iterations++
      options = {
        ...options,
        quality: options.quality - qualityStep,
      }
    }

    // if that didn't drop the size sufficiently, iteratively scale down the image
    // using binary search to find a suitable scale factor
    if (size > target) {
      let currentScale = 0.5
      let minScale = 0.0
      let maxScale = 1.0
      for (let i = 0; i < this.settings.maxSearchIterations; i++) {
        let newWidth = Math.floor(this.sourceImage.width * currentScale)
        let newHeight = Math.floor(this.sourceImage.height * currentScale)
        options = {
          quality: this.settings.minQuality,
          width: newWidth,
          height: newHeight,
        }
        const blobCandidate = await this.compressImage(this.sourceImage.bitmap, options)
        size = blobCandidate.size
        console.log('compressed', size, options)
        if (size <= target) {
          blob = blobCandidate
          if (size >= target * this.settings.searchTolerance) {
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

    this.compressedBlob = blob
    this.status = CompressionStatus.Completed
    console.log('completed')
  }

  /** Resize and compress using a service worker and OffscreenCanvas */
  async compressImage(image: ImageBitmap, options: CompressorOptions): Promise<ImageBlob> {
    const worker = new TypedWorker<WorkerRequest, WorkerResponse>(new ResizeWorker())
    const response = await worker.requestResponse({
      payload: { image, options },
    })
    worker.terminate()
    if (response.type === 'resize') {
      return new ImageBlob(response.payload.blob, options.width, options.height)
    } else {
      throw new Error(response.error)
    }
  }
}

enum CompressionStatus {
  Pending = 'pending',
  NoCompressionNeeded = 'no-compression-needed',
  Completed = 'completed',
  Failed = 'failed',
  InProgress = 'in-progress',
}

export default ImageCollectionCompressor
export type { CompressorOptions }

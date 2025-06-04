/** Worker dedicated to image resizing */
import type { CompressorOptions } from '@/lib/compression'
import type { WorkerResponse, WorkerRequest } from './worker-types'

/** Main worker entrypoint */
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data.payload
  const blob = await compressImage(req.image, req.options)
  const message: WorkerResponse = {
    type: 'resize',
    payload: { blob },
  }
  // Send result back to the main thread
  self.postMessage(message)
}

const SCALE_THRESHOLD = 0.9 // threshold for triggering iterative scaling

/** Resize and compress images using an OffscreenCanvas */
async function compressImage(image: ImageBitmap, options: CompressorOptions): Promise<Blob> {
  // TODO: max size is 4096 on iOS
  const resultCanvas = new OffscreenCanvas(options.width, options.height)
  const resultCtx = resultCanvas.getContext('2d')!
  // when scaling down dramatically, draw the image multiple times and scale down by increments
  // slower but produces better image quality
  if (options.width < image.width * SCALE_THRESHOLD) {
    const resizeCanvas = new OffscreenCanvas(image.width, image.height)
    const resizeCtx = resizeCanvas.getContext('2d')!
    resizeCtx.drawImage(image, 0, 0, image.width, image.height)
    let width = image.width
    let height = image.height
    const iterations = 8 // amount of intermediate scale down steps
    const stepX = Math.floor((width - options.width) / iterations)
    const stepY = Math.floor((height - options.height) / iterations)
    for (let i = 0; i < iterations; i++) {
      resizeCtx.drawImage(resizeCanvas, 0, 0, width, height, 0, 0, width - stepX, height - stepY)
      console.log('intermediate resizing', width, height)
      width -= stepX
      height -= stepY
    }
    resultCtx.drawImage(resizeCanvas, 0, 0, width, height, 0, 0, options.width, options.height)
  } else {
    resultCtx.drawImage(image, 0, 0, options.width, options.height)
  }
  return await resultCanvas.convertToBlob({ type: 'image/jpeg', quality: options.quality })
}

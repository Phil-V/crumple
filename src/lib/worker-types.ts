/** Define shared types for the web worker and the compression lib */

import type { CompressorOptions } from './compression'

export interface ResizeWorkerRequest {
  image: ImageBitmap
  options: CompressorOptions
}

export interface ResizeWorkerResult {
  blob: Blob
}

export type WorkerRequest = { payload: ResizeWorkerRequest }

export type WorkerResponse =
  | { type: 'resize'; payload: ResizeWorkerResult }
  | { type: 'error'; error: string }

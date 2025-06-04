/** Misc. utility functions */

/** Generate IDs sequentially */
const objectCounter = (function () {
  function* counter(): Generator<number> {
    let count: number = 0
    while (true) {
      yield count
      count++
    }
  }
  const ids = counter()
  return (): number => ids.next().value
})()

/** Typed wrapper for web workers */
class TypedWorker<TRequest, TResponse extends { type: string }> {
  private worker: Worker

  constructor(worker: Worker) {
    this.worker = worker
  }

  postMessage(message: TRequest) {
    this.worker.postMessage(message)
  }

  onMessage(handler: (msg: TResponse) => void) {
    this.worker.onmessage = (e: MessageEvent<TResponse>) => {
      handler(e.data)
    }
  }

  onError(handler: (error: ErrorEvent) => void) {
    this.worker.onerror = handler
  }

  terminate() {
    this.worker.terminate()
  }

  requestResponse(message: TRequest): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      this.onMessage((res) => resolve(res))
      this.onError((err) => reject(err))
      this.postMessage(message)
    })
  }
}

export { objectCounter, TypedWorker }

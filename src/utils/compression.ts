/** Image compression utility */
import Compressor from 'compressorjs'

async function compressImagetoSize(
  data: Blob,
  width: number,
  height: number,
  targetSize: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    new Compressor(data, {
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

export default compressImagetoSize

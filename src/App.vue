<script setup lang="ts">
import { ref, computed } from 'vue'
import { jsPDF } from 'jspdf'
import Images from './components/Images.vue'
import ImageData from './models/ImageData'
import FileSize from './components/FileSize.vue'
import ImageCollectionCompressor from '@/utils/compression'

const images = ref<ImageData[]>([])
const maxFileSize = ref(10)

const totalSize = computed(() => images.value.reduce((acc, image) => acc + image.fileSize, 0))

/** Generate a PDF from a collection of image data */
async function generatePDF(images: ImageData[]) {
  // Use millimeters for units
  const WIDTH = 297
  const doc = new jsPDF({ unit: 'mm' })
  doc.deletePage(1) // delete the default blank page

  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    const ratio = image.height! / image.width!
    // jsPDF will flip the dimensions automatically according to the orientation
    // and we don't want that
    // https://github.com/parallax/jsPDF/blob/57cbe9499dc9922c1a8dbdd225f9c45364653324/src/jspdf.js#L2741
    doc.addPage([WIDTH, ratio * WIDTH], ratio > 1 ? 'p' : 'l')
    const data = await image.data.arrayBuffer()
    doc.addImage(new Uint8Array(data), 'JPEG', 0, 0, WIDTH, ratio * WIDTH, '', 'NONE')
  }
  doc.save('images.pdf')
}

async function compressImages(): Promise<ImageData[]> {
  const maxSize = maxFileSize.value * 1024 * 1024
  console.log('maxSize', maxSize, 'total', totalSize.value)
  if (maxSize >= totalSize.value) {
    return images.value // we're good, nothing to compress
  }
  return await new ImageCollectionCompressor(images.value, maxSize).compress()
}

async function compress() {
  console.log('compress started!...')
  const compressed = await compressImages()
  console.log(compressed)
  console.log('generating pdf...')
  generatePDF(compressed)
}
</script>

<template>
  <header></header>

  <main>
    <Images v-model="images" />
    <p class="total-size" v-show="totalSize > 0">
      Total Size:
      <FileSize :bytes="totalSize" />
    </p>
    <input type="number" min="1" max="100" step="1" v-model="maxFileSize" /> (max size in MB)
    <button @click="compress">Compress!</button>
  </main>
</template>

<style scoped></style>

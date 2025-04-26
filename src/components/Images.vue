<script setup lang="ts">
/** Images component
 * Manage a collection of uploaded images
 */

import { ref, computed } from 'vue'
import { jsPDF } from 'jspdf'
import ImageData from '@/models/ImageData'
import FileDropper from './FileDropper.vue'
import ImageTile from './ImageTile.vue'
import FileSize from './FileSize.vue'
import compressImagetoSize from '@/utils/compression'

const images = ref<ImageData[]>([])
const totalSize = computed(() => images.value.reduce((acc, image) => acc + image.fileSize, 0))

/** Store submitted files in-memory */
async function filesHandler(...files: File[]) {
  const data = await Promise.all(
    files
      .filter((file) => file.type.startsWith('image/'))
      .map(async function (file) {
        const buffer = await file.arrayBuffer()
        return new Blob([new Uint8Array(buffer)], { type: file.type })
      }),
  )
  images.value.push(...data.map((d) => new ImageData(d)))
  Promise.all(images.value.map((t) => t.ready)).then(() => {
    // images ready
    console.log(images.value)
  })
}

/** Generate a PDF from the image data */
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

const maxFileSize = ref(10)

async function compressImages(): Promise<ImageData[]> {
  const maxSize = maxFileSize.value * 1024 * 1024
  console.log('maxSize', maxSize, 'total', totalSize.value)
  if (maxSize > totalSize.value) return images.value // we're good, nothing to compress
  let budget = maxSize / images.value.length
  console.log('budget', budget)
  // TODO: start by converting PNG images to JPEG
  const underBudget: ImageData[] = images.value.filter((image) => image.fileSize <= budget)
  const overBudget = images.value
    .filter((image) => image.fileSize > budget)
    .sort((a, b) => b.fileSize - a.fileSize) // desc
  // add the extra space from images under budget
  const extraSpace = underBudget.reduce((acc, image) => acc + budget - image.fileSize, 0)
  console.log('extraSpace', extraSpace)
  budget = extraSpace / overBudget.length + budget
  console.log('budget', budget)
  const compressedTiles = await Promise.all(
    overBudget.map(async (image) => {
      const compressedData = await compressImagetoSize(
        image.data,
        image.width!,
        image.height!,
        budget,
      )
      const newTile = new ImageData(compressedData)
      await newTile.ready
      return newTile
    }),
  )
  return [...underBudget, ...compressedTiles]
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
  <p>Drag, paste or select images to add to the document.</p>
  <file-dropper @change="filesHandler" accept="image/"></file-dropper>
  <div class="images">
    <ImageTile v-for="image in images" :key="image.id" :image="image" />
  </div>
  <p class="total-size" v-show="totalSize > 0">
    Total Size:
    <FileSize :bytes="totalSize" />
  </p>
  <input type="number" min="1" max="100" step="1" v-model="maxFileSize" /> (max size in MB)
  <button @click="compress">Compress!</button>
</template>

<style scoped>
.images {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>

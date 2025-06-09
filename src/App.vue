<script setup lang="ts">
/** App root component */

import { ref, computed } from 'vue'
import { ImageData, ImageBlob } from '@/models/ImageData'
import ImageCollectionCompressor from '@/lib/compression'
import generatePDF from '@/lib/pdf'
import type { PdfOptions } from '@/lib/pdf'
import Images from '@/components/Images.vue'
import FileSize from '@/components/FileSize.vue'
import Compressors from '@/components/Compressors.vue'
import PdfOptionsForm from '@/components/PdfOptionsForm.vue'

// Reactive properties
const images = ref<ImageData[]>([])
const maxFileSize = ref(10)
const compressors = ref<ImageCollectionCompressor | null>(null)
const pdfOptions = ref<PdfOptions>({ title: null, resizeMode: 'matchWidth' })

// Computed properties
const totalSize = computed(() => images.value.reduce((acc, image) => acc + image.size, 0))

/** Compress images to meet the compression target */
async function compressImages(): Promise<ImageBlob[]> {
  const maxSize = maxFileSize.value * 1024 * 1024
  if (maxSize >= totalSize.value) {
    return images.value.map((image) => image.blob) // we're good, nothing to compress
  }
  compressors.value = new ImageCollectionCompressor(images.value, maxSize)
  return await compressors.value.compress()
}

/** Run the main compression and PDF generation process */
async function makePdf() {
  console.log('compress started!...')
  const compressed = await compressImages()
  console.log('generating pdf...')
  generatePDF(compressed, pdfOptions.value)
}
</script>

<template>
  <header><h1>Make a PDF out of images</h1></header>
  <main>
    <p>Drag, paste or select images to add to the document.</p>
    <Images v-model="images" />
    <p class="total-size" v-show="totalSize > 0">
      Total Size:
      <FileSize :bytes="totalSize" />
    </p>
    <div v-show="images.length > 0">
      <div>
        <label for="maxsize">Desired file size:</label>
        <input id="maxsize" type="number" min="1" max="100" step="1" v-model="maxFileSize" /> MB
      </div>
      <section>
        <h3>Advanced options</h3>
        <PdfOptionsForm v-model="pdfOptions" />
      </section>
      <button @click="makePdf">Compress!</button>
    </div>
    <Compressors v-if="compressors" :compressors="compressors" />
  </main>
</template>

<style scoped></style>

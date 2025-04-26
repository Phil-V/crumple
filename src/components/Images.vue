<script setup lang="ts">
/** Images component
 * Manage a collection of uploaded images
 */

import ImageData from '@/models/ImageData'
import FileDropper from './FileDropper.vue'
import ImageTile from './ImageTile.vue'

const images = defineModel<ImageData[]>({ required: true })

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
  const newImages: ImageData[] = []
  newImages.push(...data.map((d) => new ImageData(d)))
  Promise.all(newImages.map((t) => t.ready)).then(() => {
    // images ready
    images.value.push(...newImages)
  })
}
</script>

<template>
  <p>Drag, paste or select images to add to the document.</p>
  <file-dropper @change="filesHandler" accept="image/"></file-dropper>
  <div class="images">
    <ImageTile v-for="image in images" :key="image.id" :image="image" />
  </div>
</template>

<style scoped>
.images {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>

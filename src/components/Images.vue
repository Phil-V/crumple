<script setup lang="ts">
/** Images component
 * Manage a collection of uploaded images
 */
import { ref } from 'vue'
import { useSortable } from '@/composables/useSortable'

import { ImageData } from '@/models/ImageData'
import FileDropper from './FileDropper.vue'
import ImageTile from './ImageTile.vue'

const images = defineModel<ImageData[]>({ required: true })
const imagesRef = ref<HTMLElement | null>(null)

/** Setup Sortable.js and handle image reordering */
useSortable(imagesRef, images)

/** Store submitted files in-memory */
async function handleFiles(...files: File[]) {
  const newImages: ImageData[] = await Promise.all(
    files
      .filter((file) => file.type.startsWith('image/'))
      .map(async function (file) {
        return await ImageData.fromFile(file)
      }),
  )
  images.value.push(...newImages)
}

/** Handle user-triggered image deletion */
function handleDelete(image: ImageData) {
  images.value.splice(
    images.value.findIndex((im) => {
      return im.id === image.id
    }),
    1,
  )
}
</script>

<template>
  <file-dropper @change="handleFiles" accept="image/"></file-dropper>
  <div class="images" ref="imagesRef">
    <ImageTile v-for="image in images" :key="image.id" :image="image" @delete="handleDelete" />
  </div>
</template>

<style scoped>
.images {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>

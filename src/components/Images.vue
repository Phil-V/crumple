<script setup lang="ts">
/** Images component
 * Manage a collection of uploaded images
 */
import { onMounted, onUnmounted } from 'vue'
import Sortable, { type SortableEvent } from 'sortablejs'

import { ImageData } from '@/models/ImageData'
import FileDropper from './FileDropper.vue'
import ImageTile from './ImageTile.vue'

const images = defineModel<ImageData[]>({ required: true })

/** Store submitted files in-memory */
async function filesHandler(...files: File[]) {
  const newImages: ImageData[] = await Promise.all(
    files
      .filter((file) => file.type.startsWith('image/'))
      .map(async function (file) {
        return await ImageData.fromFile(file)
      }),
  )
  images.value.push(...newImages)
}

onMounted(() => {
  Sortable.create(document.getElementById('images')!, {
    onUpdate: (event: SortableEvent) => {
      console.log('shifting element', event.oldIndex, 'to', event.newIndex)
      images.value.splice(event.newIndex!, 0, images.value.splice(event.oldIndex!, 1)[0])
    },
  })
})

onUnmounted(() => {
  // TODO
})
</script>

<template>
  <p>Drag, paste or select images to add to the document.</p>
  <file-dropper @change="filesHandler" accept="image/"></file-dropper>
  <div class="images" id="images">
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

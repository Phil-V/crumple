<script setup lang="ts">
/** Tile component
 * Render an in-memory image to a tile
 */

import { ImageData } from '@/models/ImageData'
import FileSize from './FileSize.vue'

defineProps({
  image: {
    type: ImageData,
    required: true,
  },
})
</script>

<template>
  <div
    class="image"
    :style="{
      backgroundImage: 'url(' + image.dataUrl + ')',
    }"
  >
    {{ image.id }} <FileSize :bytes="image.size" />
  </div>
</template>

<style scoped>
.image {
  border: 1px solid #000;
  background-size: cover;
  background-position: center;
  background-clip: content-box;
  width: 125px;
  height: 125px;
}
</style>

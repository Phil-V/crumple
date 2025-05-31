<script setup lang="ts">
/** Tile component
 * Render an in-memory image to a tile
 */

import { ImageData } from '@/models/ImageData'

defineProps({
  image: {
    type: ImageData,
    required: true,
  },
})

defineEmits<{
  delete: [image: ImageData]
}>()
</script>

<template>
  <div
    class="image"
    :style="{
      backgroundImage: 'url(' + image.dataUrl + ')',
    }"
  >
    <div class="delete" @click="$emit('delete', image)">x</div>
  </div>
</template>

<style scoped>
.image {
  border: 1px solid #000;
  background-size: cover;
  background-position: center;
  background-clip: content-box;
  width: 100px;
  height: 100px;
  position: relative;
}
.delete {
  position: absolute;
  top: 0;
  right: 0;
  cursor: pointer;
  display: none;
}
.image:hover .delete {
  display: block;
}
</style>

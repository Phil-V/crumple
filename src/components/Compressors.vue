<script setup lang="ts">
/** Compressors Component
 * Visualizes the compression process.
 */

import ImageCollectionCompressor from '@/lib/compression'
defineProps({
  compressors: {
    type: ImageCollectionCompressor,
    required: true,
  },
})
</script>

<template>
  <div>
    <div
      class="compressor"
      v-for="compressor in compressors.compressors"
      :key="compressor.id"
      :class="compressor.status"
    ></div>
  </div>
</template>

<style scoped>
.compressor {
  width: 12px;
  height: 12px;
  background-color: darkgrey;
  display: inline-block;
  margin: 2px;

  &.in-progress {
    background-color: royalblue;
  }

  &.completed,
  &.no-compression-needed {
    background-color: lightgreen;
  }
}
</style>

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
    Compressors:
    <div v-for="compressor in compressors.compressors" :key="compressor.id">
      {{ compressor.id }} {{ compressor.status }} {{ compressor.iterations }}
    </div>
  </div>
</template>

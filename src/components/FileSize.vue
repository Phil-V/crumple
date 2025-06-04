<script setup lang="ts">
/** FileSize component
 * Display the size of a file in a human-readable format.
 */
import { computed } from 'vue'

const props = defineProps({
  bytes: {
    type: Number,
    required: true,
  },
})

function formatFileSize(bytes: number, decimalPoint = 1) {
  if (bytes <= 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  const calculatedSize = parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(decimalPoint))
  return `${calculatedSize} ${sizes[unitIndex]}`
}

/** Set up computed property */
const formattedFileSize = computed(() => formatFileSize(props.bytes))
</script>

<template>
  <span>{{ formattedFileSize }}</span>
</template>

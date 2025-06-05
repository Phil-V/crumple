<script setup lang="ts">
/** PDF options form component */

import type { PdfOptions } from '@/lib/pdf'
const model = defineModel<PdfOptions>({ required: true })
</script>

<template>
  <label for="title">Document title (optional):</label>
  <input id="title" type="text" v-model="model.title" />
</template>

<script setup lang="ts">
/** PDF options form component */

import type { PdfOptions } from '@/lib/pdf'
const model = defineModel<PdfOptions>({ required: true })
</script>

<template>
  <form>
    <label for="title">Document title (optional):</label>
    <input id="title" type="text" v-model="model.title" />
    <fieldset>
      <legend>Normalize sizes:</legend>
      <div>
        <input
          type="radio"
          id="matchWidth"
          name="resizeMode"
          value="matchWidth"
          v-model="model.resizeMode"
        />
        <label for="matchWidth">Width</label>

        <input
          type="radio"
          id="matchHeight"
          name="resizeMode"
          value="matchHeight"
          v-model="model.resizeMode"
        />
        <label for="matchHeight">Height</label>
      </div>
      <div>
        <button type="submit">Submit</button>
      </div>
    </fieldset>
  </form>
</template>

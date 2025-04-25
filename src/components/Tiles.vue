<script setup lang="ts">
/** Tiles component
 * Manage a collection of uploaded images
 */

import { ref } from 'vue'
import TileData from '@/models/TileData'
import FileDropper from './FileDropper.vue'
import Tile from './Tile.vue'

const tiles = ref<TileData[]>([])

/** Use the FileReader api to turn files into base64 encoded strings */
function dataify(file: File): Promise<FileReader['result']> {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => {
      resolve(r.result)
    }
    r.readAsDataURL(file)
  })
}

/** Store submitted files in-memory */
async function filesHandler(...files: File[]) {
  const data = await Promise.all(
    files
      .filter((file) => file.type.startsWith('image/'))
      .map(async function (file) {
        return await dataify(file)
      }),
  )
  tiles.value.push(
    ...data.filter((s): s is string => typeof s === 'string').map((d) => new TileData(d)),
  )
  Promise.all(tiles.value.map((t) => t.ready)).then(() => {
    // tiles ready
  })
}
</script>

<template>
  <p>Drag, paste or select images to add to the document.</p>
  <file-dropper @change="filesHandler" accept="image/"></file-dropper>
  <div class="tiles">
    <Tile v-for="tile in tiles" :key="tile.id" :tile="tile" />
  </div>
</template>

<style scoped>
.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>

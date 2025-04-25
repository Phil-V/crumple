<script setup lang="ts">
/** Tiles component
 * Manage a collection of uploaded images
 */

import { ref, computed } from 'vue'
import { jsPDF } from 'jspdf'
import TileData from '@/models/TileData'
import FileDropper from './FileDropper.vue'
import Tile from './Tile.vue'
import FileSize from './FileSize.vue'

const tiles = ref<TileData[]>([])
const totalSize = computed(() => tiles.value.reduce((acc, tile) => acc + tile.fileSize, 0))

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
    console.log(tiles.value)
  })
}

/** Generate a PDF from the image data */
function generatePDF() {
  // Use millimeters for units
  const WIDTH = 297
  const doc = new jsPDF({ unit: 'mm' })
  doc.deletePage(1) // delete the default blank page
  tiles.value.map((tile) => {
    let imgRatio = tile.imgHeight! / tile.imgWidth!
    // jsPDF will flip the dimensions automatically according to the orientation
    // and we don't want that
    // https://github.com/parallax/jsPDF/blob/57cbe9499dc9922c1a8dbdd225f9c45364653324/src/jspdf.js#L2741
    doc.addPage([WIDTH, imgRatio * WIDTH], imgRatio > 1 ? 'p' : 'l')
    doc.addImage(tile.data, 'JPEG', 0, 0, WIDTH, imgRatio * WIDTH, '', 'NONE')
  })
  doc.save('images.pdf')
}
</script>

<template>
  <p>Drag, paste or select images to add to the document.</p>
  <file-dropper @change="filesHandler" accept="image/"></file-dropper>
  <div class="tiles">
    <Tile v-for="tile in tiles" :key="tile.id" :tile="tile" />
  </div>
  <p class="total-size" v-show="totalSize > 0">
    Total Size:
    <FileSize :bytes="totalSize" />
  </p>
  <button @click="generatePDF">Generate PDF!</button>
</template>

<style scoped>
.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>

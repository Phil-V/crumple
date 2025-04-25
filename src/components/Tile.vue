<script setup lang="ts">
/** Tile component
 * Render an in-memory image to a tile
 */

import TileData from '@/models/TileData'

defineProps({
  tile: {
    type: TileData,
    required: true,
  },
})
</script>

<template>
  <div
    class="tile"
    :style="{
      backgroundImage: 'url(' + tile.data + ')',
    }"
  >
    {{ tile.id }}
  </div>
</template>

<style scoped>
.tile {
  border: 1px solid #000;
  background-size: cover;
  background-position: center;
  background-clip: content-box;
  width: 125px;
  height: 125px;
}
</style>

<script setup lang="ts">
/** File Dropper Component
 *  Handles files dropped or pasted onto the page, as well as
 *  those selected with the file picker.
 */
import { ref, onMounted, onUnmounted } from 'vue'

import { ref, defineProps, defineEmits, onMounted, onUnmounted } from 'vue'
const props = defineProps({
  accept: { type: String, default: '' },
})
const emit = defineEmits<{
  change: File[]
}>()
const dropzone = ref<HTMLInputElement>()
const dragging = ref<boolean>()

/** Handle files added to the input[type=file] element */
function filesHandler(event: Event) {
  event.stopPropagation()
  if (dropzone.value) {
    const files = dropzone.value.files ?? []
    emit('change', ...files)
    dropzone.value.value = '' // reset the form
  }
}

/** set a flag if files are being dragged over the document */
function watchForFiles(event: DragEvent) {
  dragging.value = event.dataTransfer?.types?.includes('Files') ?? false
}

/** unset the flag when the files are dragged out of the document */
function watchForDocumentExit(event: DragEvent) {
  if (event.target && event.x === 0 && event.y === 0) {
    dragging.value = false
  }
}

function handleDragEnd() {
  dragging.value = false
}

/** watch for files pasted onto the page
 *
 * Note: Firefox will only paste one file
 * https://bugzilla.mozilla.org/show_bug.cgi?id=864052
 */
function handlePaste(event: ClipboardEvent) {
  const files = event.clipboardData?.files ?? []
  emit('change', ...files)
}

onMounted(() => {
  document.addEventListener('dragover', watchForFiles)
  document.addEventListener('dragleave', watchForDocumentExit)
  document.addEventListener('dragend', handleDragEnd)
  document.addEventListener('drop', handleDragEnd)
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  document.removeEventListener('dragover', watchForFiles)
  document.removeEventListener('dragleave', watchForDocumentExit)
  document.removeEventListener('dragend', handleDragEnd)
  document.removeEventListener('drop', handleDragEnd)
  document.removeEventListener('paste', handlePaste)
})
</script>

<template>
  <main>
    <input
      :class="{ modal: dragging }"
      ref="dropzone"
      id="dropzone"
      type="file"
      multiple
      :accept="props.accept"
      @change="filesHandler"
    />
    <label for="dropzone" :class="{ modal: dragging }"><span>Drop files here!</span></label>
  </main>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}
input.modal {
  opacity: 0;
  z-index: 3;
}
label.modal {
  border: 5px dashed rgba(0, 0, 0, 0.7);
  background-color: rgba(0, 0, 0, 0.7);
  background-clip: padding-box;
  display: grid;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: large;
  z-index: 2;
}
label span {
  visibility: hidden;
}
label.modal span {
  visibility: visible;
}
</style>

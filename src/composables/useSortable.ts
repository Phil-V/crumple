/** Sortable.js Vue wrapper  */
import { onMounted, onUnmounted, type Ref } from 'vue'
import Sortable, { type SortableEvent } from 'sortablejs'

export function useSortable<T>(
  elementRef: Ref<HTMLElement | null>,
  items: Ref<T[]>,
  options: Sortable.Options = {},
) {
  let sortableInstance: Sortable | null = null

  onMounted(() => {
    if (!elementRef.value) return

    sortableInstance = Sortable.create(elementRef.value, {
      ...options,
      onUpdate: (event: SortableEvent) => {
        const { oldIndex, newIndex } = event

        if (oldIndex !== undefined && newIndex !== undefined) {
          const [movedItem] = items.value.splice(oldIndex, 1)
          items.value.splice(newIndex, 0, movedItem)
        }
      },
    })
  })

  onUnmounted(() => {
    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
    }
  })
}

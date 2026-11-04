<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Exercise } from '~/composables/useWorkoutStorage'

const props = defineProps<{
  modelValue: string
  options: Exercise[]
  label: string
  placeholder?: string
  emptyText?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const listId = `exercise-combobox-${Math.random().toString(36).slice(2, 10)}`
const nameFor = (id: string) => props.options.find((option) => option.id === id)?.name || ''
const query = ref(nameFor(props.modelValue))
const open = ref(false)
const activeIndex = ref(0)

watch(() => props.modelValue, (id) => { query.value = nameFor(id) })

const filtered = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term || term === nameFor(props.modelValue).toLowerCase()) return props.options
  return props.options.filter((option) =>
    option.name.toLowerCase().includes(term)
    || option.aliases?.some((alias) => alias.toLowerCase().includes(term))
    || option.tags.some((tag) => tag.toLowerCase().includes(term))
  )
})

const openList = () => {
  open.value = true
  activeIndex.value = Math.max(0, filtered.value.findIndex((option) => option.id === props.modelValue))
}
const close = () => {
  open.value = false
  query.value = nameFor(props.modelValue)
}
const select = (option: Exercise | undefined) => {
  if (!option) return
  emit('update:modelValue', option.id)
  query.value = option.name
  open.value = false
}
const onInput = () => {
  open.value = true
  activeIndex.value = 0
}
const move = (direction: 1 | -1) => {
  if (!open.value) return openList()
  const count = filtered.value.length
  if (count) activeIndex.value = (activeIndex.value + direction + count) % count
}
</script>

<template>
  <div class="combobox">
    <input
      v-model="query"
      type="text"
      role="combobox"
      autocomplete="off"
      :aria-label="label"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && filtered[activeIndex] ? `${listId}-${filtered[activeIndex]!.id}` : undefined"
      :placeholder="placeholder"
      @focus="openList(); ($event.target as HTMLInputElement).select()"
      @input="onInput"
      @blur="close"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="open && select(filtered[activeIndex])"
      @keydown.esc="close"
    />
    <ul v-if="open" :id="listId" role="listbox" class="combobox-list">
      <li
        v-for="(option, index) in filtered"
        :id="`${listId}-${option.id}`"
        :key="option.id"
        role="option"
        :aria-selected="option.id === modelValue"
        :class="{ active: index === activeIndex, selected: option.id === modelValue }"
        @mousedown.prevent="select(option)"
        @mouseenter="activeIndex = index"
      >{{ option.name }}</li>
      <li v-if="!filtered.length" class="empty">{{ emptyText || '—' }}</li>
    </ul>
  </div>
</template>

<style scoped>
.combobox { position: relative; flex: 1; min-width: 12rem; }
.combobox input { width: 100%; box-sizing: border-box; padding: .55rem .65rem; border: 1px solid #dfe7f5; border-radius: 9px; background: white; font: inherit; font-weight: 600; }
.combobox-list { position: absolute; z-index: 5; top: calc(100% + .25rem); left: 0; right: 0; max-height: 16rem; overflow-y: auto; margin: 0; padding: .25rem; list-style: none; border: 1px solid #dfe7f5; border-radius: 9px; background: white; box-shadow: 0 12px 30px rgba(15, 23, 42, .12); }
.combobox-list li { padding: .45rem .6rem; border-radius: 6px; cursor: pointer; color: #334155; }
.combobox-list li.active { background: #eef2ff; color: #312e81; }
.combobox-list li.selected { font-weight: 700; }
.combobox-list li.empty { cursor: default; color: #94a3b8; }
</style>

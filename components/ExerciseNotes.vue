<script setup lang="ts">
defineProps<{
  modelValue: string
  label: string
  readonly?: boolean
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <details v-if="!readonly || modelValue" class="exercise-notes" :open="Boolean(modelValue.trim())">
    <summary>{{ label }}</summary>
    <label v-if="!readonly">
      <span class="sr-only">{{ label }}</span>
      <textarea :value="modelValue" rows="3" @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)" />
    </label>
    <p v-else>{{ modelValue }}</p>
  </details>
</template>

<style scoped>
.exercise-notes { margin-top: .75rem; color: #475569; }
summary { cursor: pointer; font-weight: 600; }
textarea { display: block; box-sizing: border-box; width: 100%; margin-top: .5rem; padding: .55rem .65rem; border: 1px solid #dfe7f5; border-radius: 9px; background: white; resize: vertical; font: inherit; }
p { margin: .5rem 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
</style>

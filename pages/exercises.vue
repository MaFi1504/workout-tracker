<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { EXERCISE_TAGS } from '~/composables/useWorkoutStorage'
import type { Exercise } from '~/composables/useWorkoutStorage'
import type { ExerciseMeasurementUnit } from '~/data/exerciseCatalog'

const { settings, seedExercises, customExercises, addExercise, updateExercise, setExerciseMeasurementUnit } = useWorkoutStorage()

const search = ref('')
const selectedExerciseId = ref('')
const editingExerciseId = ref<string | null>(null)
const form = reactive({
  name: '',
  tags: ['General'] as string[],
  description: '',
  defaultWeightUnit: 'kg' as 'kg' | 'lb',
  measurementUnit: 'reps' as ExerciseMeasurementUnit
})

const translations = {
  en: {
    appName: 'Workout Tracker',
    overview: 'Overview',
    exercises: 'Exercises',
    logbook: 'Logbook',
    tools: 'Tools',
    language: 'DE',
    title: 'Exercise library',
    intro: 'Browse the catalog, read how each movement is performed, or create your own exercise.',
    search: 'Search exercises',
    allTags: 'All tags',
    custom: 'Custom',
    catalog: 'Catalog',
    addExercise: 'Add exercise',
    editExercise: 'Edit exercise',
    exerciseName: 'Exercise name',
    tags: 'Tags',
    description: 'How to perform it',
    unit: 'Default weight unit',
    measurementUnit: 'Measurement unit',
    reps: 'Reps',
    seconds: 'Time (seconds)',
    save: 'Save exercise',
    cancel: 'Cancel',
    selectExercise: 'Select an exercise to read its description.',
    baseExercise: 'Catalog exercise',
    customExercise: 'Custom exercise',
    duplicate: 'An exercise with this name already exists.',
    required: 'Enter a name and description to continue.'
  },
  de: {
    appName: 'Workout Tracker',
    overview: 'Übersicht',
    exercises: 'Übungen',
    logbook: 'Protokoll',
    tools: 'Werkzeuge',
    language: 'EN',
    title: 'Übungsbibliothek',
    intro: 'Durchsuche den Katalog, lies die Ausführung oder erstelle eine eigene Übung.',
    search: 'Übungen suchen',
    allTags: 'Alle Tags',
    custom: 'Eigene',
    catalog: 'Katalog',
    addExercise: 'Übung hinzufügen',
    editExercise: 'Übung bearbeiten',
    exerciseName: 'Übungsname',
    tags: 'Tags',
    description: 'Ausführung',
    unit: 'Standard-Gewichtseinheit',
    measurementUnit: 'Maßeinheit',
    reps: 'Wiederholungen',
    seconds: 'Zeit (Sekunden)',
    save: 'Übung speichern',
    cancel: 'Abbrechen',
    selectExercise: 'Wähle eine Übung, um ihre Beschreibung zu lesen.',
    baseExercise: 'Katalogübung',
    customExercise: 'Eigene Übung',
    duplicate: 'Eine Übung mit diesem Namen existiert bereits.',
    required: 'Gib einen Namen und eine Beschreibung ein.'
  }
} as const

const t = computed(() => translations[settings.value.language])
const allExercises = computed(() => [...seedExercises.value, ...customExercises.value])
const tagFilter = ref<'all' | string>('all')
const filteredExercises = computed(() => {
  const term = search.value.trim().toLowerCase()

  return allExercises.value.filter((exercise) => {
    const matchesTag = tagFilter.value === 'all' || exercise.tags.includes(tagFilter.value)
    const matchesSearch = !term || exercise.name.toLowerCase().includes(term) || exercise.tags.some((tag) => tag.toLowerCase().includes(term))
    return matchesTag && matchesSearch
  })
})
const selectedExercise = computed(() => allExercises.value.find((exercise) => exercise.id === selectedExerciseId.value))
const isEditing = computed(() => editingExerciseId.value !== null)

const selectExercise = (exercise: Exercise) => {
  selectedExerciseId.value = exercise.id
  editingExerciseId.value = null
}

const startAdd = () => {
  editingExerciseId.value = null
  selectedExerciseId.value = ''
  form.name = ''
  form.tags = ['General']
  form.description = ''
  form.defaultWeightUnit = 'kg'
  form.measurementUnit = 'reps'
}

const startEdit = (exercise: Exercise) => {
  if (!exercise.isCustom) {
    return
  }

  editingExerciseId.value = exercise.id
  selectedExerciseId.value = exercise.id
  form.name = exercise.name
  form.tags = [...exercise.tags]
  form.description = exercise.description
  form.defaultWeightUnit = exercise.defaultWeightUnit
  form.measurementUnit = exercise.measurementUnit || 'reps'
}

const cancelEdit = () => {
  editingExerciseId.value = null
  form.name = ''
  form.tags = ['General']
  form.description = ''
  form.defaultWeightUnit = 'kg'
  form.measurementUnit = 'reps'
}

const saveExercise = () => {
  if (!form.name.trim() || !form.description.trim()) {
    return
  }

  const savedExercise = editingExerciseId.value
    ? updateExercise(editingExerciseId.value, form)
    : addExercise(form)

  if (!savedExercise) {
    return
  }

  selectedExerciseId.value = savedExercise.id
  cancelEdit()
}

</script>

<template>
  <div class="exercises-page">
    <AppHeader active-page="exercises" />

    <main class="content">
      <div class="page-intro">
        <h2>{{ t.title }}</h2>
        <p>{{ t.intro }}</p>
      </div>

      <section class="exercise-layout">
        <div class="panel catalog-panel">
          <div class="panel-header">
            <h2>{{ t.catalog }}</h2>
            <button type="button" class="primary-button" @click="startAdd">{{ t.addExercise }}</button>
          </div>

          <input v-model="search" type="search" :placeholder="t.search" class="search-input" />

          <div class="category-filter" role="group" :aria-label="t.tags">
            <button
              type="button"
              class="category-pill"
              :class="{ selected: tagFilter === 'all' }"
              @click="tagFilter = 'all'"
            >
              {{ t.allTags }}
            </button>
            <button
              v-for="tag in EXERCISE_TAGS"
              :key="tag"
              type="button"
              class="category-pill"
              :class="{ selected: tagFilter === tag }"
              @click="tagFilter = tag"
            >
              {{ tag }}
            </button>
          </div>

          <div class="exercise-list">
            <button
              v-for="exercise in filteredExercises"
              :key="exercise.id"
              type="button"
              class="exercise-card"
              :class="{ selected: exercise.id === selectedExerciseId }"
              @click="selectExercise(exercise)"
            >
              <span>
                <strong>{{ exercise.name }}</strong>
                <small>{{ exercise.tags.join(' · ') }}</small>
              </span>
              <small v-if="exercise.isCustom" class="custom-label">{{ t.custom }}</small>
            </button>
          </div>
        </div>

        <div class="detail-column">
          <section class="panel description-panel">
            <div v-if="selectedExercise" class="description-content">
              <div class="panel-header">
                <div>
                  <span class="exercise-type">{{ selectedExercise.isCustom ? t.customExercise : t.baseExercise }}</span>
                  <h2>{{ selectedExercise.name }}</h2>
                </div>
                <button v-if="selectedExercise.isCustom" type="button" class="secondary-button" @click="startEdit(selectedExercise)">
                  {{ t.editExercise }}
                </button>
              </div>
              <span class="category-label">{{ selectedExercise.tags.join(' · ') }}</span>
              <label class="measurement-setting">
                {{ t.measurementUnit }}
                <select
                  :value="selectedExercise.measurementUnit || 'reps'"
                  @change="setExerciseMeasurementUnit(selectedExercise.id, ($event.target as HTMLSelectElement).value as ExerciseMeasurementUnit)"
                >
                  <option value="reps">{{ t.reps }}</option>
                  <option value="seconds">{{ t.seconds }}</option>
                </select>
              </label>
              <a v-if="selectedExercise.videoUrl" class="video-link" :href="selectedExercise.videoUrl" target="_blank" rel="noreferrer">
                Watch source video
              </a>
              <p class="exercise-description">{{ selectedExercise.description }}</p>
            </div>
            <p v-else class="empty-state">{{ t.selectExercise }}</p>
          </section>

          <section class="panel editor-panel">
            <div class="panel-header">
              <h2>{{ isEditing ? t.editExercise : t.addExercise }}</h2>
              <button v-if="isEditing" type="button" class="text-button" @click="cancelEdit">{{ t.cancel }}</button>
            </div>

            <form class="exercise-form" @submit.prevent="saveExercise">
              <label>
                {{ t.exerciseName }}
                <input v-model="form.name" type="text" required />
              </label>
              <label>
                {{ t.tags }}
                <div class="tag-options">
                  <label v-for="tag in EXERCISE_TAGS" :key="tag" class="tag-option">
                    <input v-model="form.tags" type="checkbox" :value="tag" />
                    {{ tag }}
                  </label>
                </div>
              </label>
              <label>
                {{ t.description }}
                <textarea v-model="form.description" rows="5" required />
              </label>
              <label>
                {{ t.unit }}
                <select v-model="form.defaultWeightUnit">
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </label>
              <label>
                {{ t.measurementUnit }}
                <select v-model="form.measurementUnit">
                  <option value="reps">{{ t.reps }}</option>
                  <option value="seconds">{{ t.seconds }}</option>
                </select>
              </label>
              <button type="submit" class="primary-button">{{ t.save }}</button>
            </form>
          </section>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.exercises-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #edf4ff 0%, #f8fafc 100%);
}

h2,
p {
  margin: 0;
}

.content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
}

.page-intro {
  margin-bottom: 1.5rem;
}

.page-intro h2 {
  font-size: 1.8rem;
}

.page-intro p {
  margin-top: 0.4rem;
  color: #475569;
}

.exercise-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 1.5rem;
}

.panel {
  padding: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 35px rgba(15, 23, 42, 0.06);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input,
.exercise-form input,
.exercise-form textarea,
.exercise-form select {
  width: 100%;
  box-sizing: border-box;
  padding: 0.8rem 0.9rem;
  border: 1px solid #dfe7f5;
  border-radius: 12px;
  background: white;
}

.category-filter {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  padding: 0.9rem 0;
}

.category-pill {
  flex: 0 0 auto;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
}

.category-pill.selected {
  background: #e0e7ff;
  color: #312e81;
  font-weight: 700;
}

.exercise-list {
  display: grid;
  gap: 0.65rem;
  max-height: 34rem;
  overflow-y: auto;
  padding: 0.25rem;
}

.exercise-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  background: #f8fafc;
  color: #101828;
  text-align: left;
}

.exercise-card:hover,
.exercise-card.selected {
  background: #e0e7ff;
  outline: 2px solid rgba(79, 70, 229, 0.3);
  outline-offset: 2px;
}

.exercise-card span {
  display: grid;
  gap: 0.25rem;
}

.exercise-card small,
.exercise-type,
.category-label {
  color: #64748b;
  font-size: 0.8rem;
}

.custom-label,
.exercise-type {
  color: #4f46e5;
  font-weight: 700;
}

.detail-column {
  display: grid;
  align-content: start;
  gap: 1.5rem;
}

.description-panel {
  min-height: 12rem;
}

.description-content h2 {
  margin-top: 0.3rem;
}

.category-label {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  background: #f1f5f9;
}

.exercise-description {
  color: #334155;
  line-height: 1.65;
}

.video-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #4f46e5;
  font-weight: 700;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-option {
  display: flex !important;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.4rem !important;
  padding: 0.45rem 0.65rem;
  border: 1px solid #dfe7f5;
  border-radius: 999px;
  background: #f8fafc;
  font-size: 0.8rem !important;
  font-weight: 500 !important;
}

.exercise-form {
  display: grid;
  gap: 0.9rem;
}

.exercise-form label,
.measurement-setting {
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
}

.measurement-setting {
  margin-bottom: 1rem;
}

.empty-state {
  color: #64748b;
}

@media (max-width: 820px) {
  .exercise-layout {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>

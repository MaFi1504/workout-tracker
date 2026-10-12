<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { parseWorkoutNotes } from '~/utils/workoutImport'

const { settings, customExercises, workouts, seedExercises, addExercise, addWorkout } = useWorkoutStorage()

const converter = reactive({
  value: 5,
  unit: 'kg' as 'kg' | 'lb'
})

const kgPerLb = 0.45359237
const convertedWeight = computed(() => converter.unit === 'kg'
  ? { value: converter.value / kgPerLb, unit: 'lb' }
  : { value: converter.value * kgPerLb, unit: 'kg' })

const importText = reactive({
  title: 'Imported workout',
  date: new Date().toISOString().slice(0, 10),
  notes: ''
})
const importSource = ref('')
const importPreview = computed(() => parseWorkoutNotes(importSource.value))
const availableExercises = computed(() => [...seedExercises.value, ...customExercises.value])

const normalizeExerciseName = (value: string) => value
  .toLowerCase()
  .replace(/\bpushups\b/g, 'push up')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .split(' ')
  .map((word) => word.endsWith('s') ? word.slice(0, -1) : word)
  .join(' ')

const importWorkout = () => {
  if (!importText.title.trim() || !importText.date || !importPreview.value.length) {
    return
  }

  const importedExercises = importPreview.value.flatMap((item, exerciseIndex) => {
    let exercise = availableExercises.value.find(
      (candidate) => normalizeExerciseName(candidate.name) === normalizeExerciseName(item.name)
    )

    if (!exercise) {
      exercise = addExercise({
        name: item.name,
        category: 'General',
        description: 'Imported exercise. Add detailed instructions in the Exercises page.',
        defaultWeightUnit: 'kg'
      }) || undefined
    }

    if (!exercise) {
      return []
    }

    return [{
      id: `import-${Date.now()}-${exerciseIndex}`,
      exerciseId: exercise.id,
      order: exerciseIndex,
      side: 'synchronized' as const,
      rounds: item.rounds.map((round, roundIndex) => ({
        id: `import-${Date.now()}-${exerciseIndex}-${roundIndex}`,
        round: roundIndex + 1,
        weightKg: round.weightKg,
        reps: round.reps,
        side: 'both' as const
      }))
    }]
  })

  if (!importedExercises.length) {
    return
  }

  addWorkout({
    title: importText.title.trim(),
    date: importText.date,
    notes: importText.notes,
    exercises: importedExercises
  })

  importSource.value = ''
  importText.notes = ''
}

const exportWorkoutData = () => {
  const exportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    workouts: workouts.value,
    customExercises: customExercises.value
  }
  const data = JSON.stringify(exportPayload, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)

  link.href = url
  link.download = `workout-tracker-${date}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const translations = {
  en: {
    appName: 'Workout Tracker',
    overview: 'Overview',
    exercises: 'Exercises',
    logbook: 'Logbook',
    tools: 'Tools',
    language: 'DE',
    title: 'Training tools',
    intro: 'Small utilities for planning and measuring your workouts.',
    converter: 'Weight converter',
    converterDescription: 'Convert between kilograms and pounds while keeping kilograms as the app\'s canonical unit.',
    value: 'Value',
    convertTo: 'Convert to',
    result: 'Result',
    importWorkout: 'Import workout',
    importDescription: 'Paste notes such as “Lat Raises” followed by “5kg 10 reps”. Each measurement line becomes a round.',
    workoutTitle: 'Workout title',
    workoutDate: 'Workout date',
    importedNotes: 'Notes',
    sourceNotes: 'Exercise notes',
    preview: 'Preview',
    noImportPreview: 'Paste notes to preview the exercises and rounds.',
    saveImport: 'Save imported workout',
    exportData: 'Export workout data',
    exportDescription: 'Download your workouts and custom exercise catalog as a JSON file.',
    downloadJson: 'Download JSON',
    comingSoon: 'More tools can be added here as the training workflow grows.'
  },
  de: {
    appName: 'Workout Tracker',
    overview: 'Übersicht',
    exercises: 'Übungen',
    logbook: 'Protokoll',
    tools: 'Werkzeuge',
    language: 'EN',
    title: 'Trainingswerkzeuge',
    intro: 'Kleine Hilfsmittel zum Planen und Messen deines Trainings.',
    converter: 'Gewichtsumrechner',
    converterDescription: 'Zwischen Kilogramm und Pfund umrechnen, wobei Kilogramm die interne Einheit bleibt.',
    value: 'Wert',
    convertTo: 'Umrechnen in',
    result: 'Ergebnis',
    importWorkout: 'Training importieren',
    importDescription: 'Füge Notizen ein, zum Beispiel „Lat Raises“ und danach „5kg 10 reps“. Jede Messzeile wird zu einer Runde.',
    workoutTitle: 'Name des Trainings',
    workoutDate: 'Trainingsdatum',
    importedNotes: 'Notizen',
    sourceNotes: 'Übungsnotizen',
    preview: 'Vorschau',
    noImportPreview: 'Füge Notizen ein, um Übungen und Runden zu sehen.',
    saveImport: 'Importiertes Training speichern',
    exportData: 'Trainingsdaten exportieren',
    exportDescription: 'Lade deine Trainings und eigene Übungen als JSON-Datei herunter.',
    downloadJson: 'JSON herunterladen',
    comingSoon: 'Weitere Werkzeuge können hier später ergänzt werden.'
  }
} as const

const t = computed(() => translations[settings.value.language])

</script>

<template>
  <div class="tools-page">
    <AppHeader active-page="tools" />

    <main class="tools-content">
      <div class="tools-title">
        <h2>{{ t.title }}</h2>
        <p class="intro">{{ t.intro }}</p>
      </div>
      <section class="tool-grid" aria-label="Training tools">
        <article class="tool-card import-card">
          <div class="tool-card-heading">
            <span class="tool-icon" aria-hidden="true">↓</span>
            <div>
              <h2>{{ t.importWorkout }}</h2>
              <p>{{ t.importDescription }}</p>
            </div>
          </div>

          <div class="import-form">
            <label>
              {{ t.workoutTitle }}
              <input v-model="importText.title" type="text" />
            </label>
            <label>
              {{ t.workoutDate }}
              <input v-model="importText.date" type="date" lang="de-DE" />
            </label>
            <label>
              {{ t.sourceNotes }}
              <textarea v-model="importSource" rows="8" placeholder="Lat Raises&#10;5kg 10 reps&#10;8kg 7 reps&#10;8kg 8 reps&#10;&#10;OverheadTrice Extensions&#10;5kg 6 reps pro&#10;5kg 6 reps pro" />
            </label>
          </div>

          <div class="import-preview">
            <strong>{{ t.preview }}</strong>
            <div v-if="importPreview.length" class="preview-list">
              <div v-for="exercise in importPreview" :key="exercise.name" class="preview-exercise">
                <span>{{ exercise.name }}</span>
                <small>{{ exercise.rounds.map((round) => `${round.weightKg} kg x ${round.reps}`).join(' · ') }}</small>
              </div>
            </div>
            <p v-else>{{ t.noImportPreview }}</p>
          </div>

          <label>
            {{ t.importedNotes }}
            <textarea v-model="importText.notes" rows="2" />
          </label>

          <button type="button" class="primary-button" :disabled="!importPreview.length" @click="importWorkout">
            {{ t.saveImport }}
          </button>
        </article>

        <article class="tool-card">
          <div class="tool-card-heading">
            <span class="tool-icon" aria-hidden="true">kg</span>
            <div>
              <h2>{{ t.converter }}</h2>
              <p>{{ t.converterDescription }}</p>
            </div>
          </div>

          <div class="converter-form">
            <label>
              {{ t.value }}
              <input v-model.number="converter.value" type="number" min="0" step="0.1" />
            </label>
            <label>
              {{ t.convertTo }}
              <select v-model="converter.unit">
                <option value="kg">kg → lb</option>
                <option value="lb">lb → kg</option>
              </select>
            </label>
          </div>

          <output class="conversion-result">
            <span>{{ t.result }}</span>
            <strong>{{ converter.value || 0 }} {{ converter.unit }} = {{ convertedWeight.value.toFixed(2) }} {{ convertedWeight.unit }}</strong>
          </output>
        </article>

        <article class="tool-card">
          <div class="tool-card-heading">
            <span class="tool-icon" aria-hidden="true">↑</span>
            <div>
              <h2>{{ t.exportData }}</h2>
              <p>{{ t.exportDescription }}</p>
            </div>
          </div>
          <button type="button" class="primary-button" @click="exportWorkoutData">
            {{ t.downloadJson }}
          </button>
        </article>

        <article class="tool-card tool-card-placeholder">
          <span class="tool-icon" aria-hidden="true">+</span>
          <p>{{ t.comingSoon }}</p>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.tools-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #edf4ff 0%, #f8fafc 100%);
}

h2,
p {
  margin: 0;
}
.tools-title {
  margin-bottom: 1.5rem;
}

.tools-title h2 {
  font-size: 1.75rem;
}

.tools-title .intro {
  margin-top: 0.35rem;
}

.tools-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.tool-card {
  display: grid;
  gap: 1.25rem;
  padding: 1.35rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 35px rgba(15, 23, 42, 0.06);
}

.tool-card-heading {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.tool-card h2 {
  font-size: 1.25rem;
}

.tool-card p {
  margin-top: 0.35rem;
  color: #64748b;
  line-height: 1.5;
}

.tool-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  border-radius: 12px;
  background: #e0e7ff;
  color: #3730a3;
  font-weight: 800;
}

.converter-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.import-form {
  display: grid;
  gap: 0.75rem;
}

.import-form label,
.import-card > label {
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
}

.import-form textarea,
.import-card > label textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.8rem 0.9rem;
  border: 1px solid #dfe7f5;
  border-radius: 12px;
  background: white;
  color: #101828;
  font: inherit;
  resize: vertical;
}

.import-preview {
  display: grid;
  gap: 0.6rem;
  padding: 0.9rem;
  border-left: 3px solid #4f46e5;
  background: #eef2ff;
  color: #312e81;
}

.import-preview p {
  color: #64748b;
}

.preview-list {
  display: grid;
  gap: 0.45rem;
}

.preview-exercise {
  display: grid;
  gap: 0.15rem;
}

.preview-exercise small {
  color: #475569;
}

label {
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
}

input,
select {
  width: 100%;
  box-sizing: border-box;
  padding: 0.8rem 0.9rem;
  border: 1px solid #dfe7f5;
  border-radius: 12px;
  background: white;
  color: #101828;
  font: inherit;
}

.conversion-result {
  display: grid;
  gap: 0.25rem;
  padding: 0.9rem;
  border-left: 3px solid #4f46e5;
  background: #eef2ff;
  color: #312e81;
}

.conversion-result span {
  font-size: 0.8rem;
  text-transform: uppercase;
}

.tool-card-placeholder {
  align-content: center;
  min-height: 10rem;
}

@media (max-width: 640px) {
  .tools-content {
    padding: 1.25rem 1rem 2rem;
  }

  .converter-form {
    grid-template-columns: 1fr;
  }

  .tool-card {
    padding: 1rem;
  }
}
</style>

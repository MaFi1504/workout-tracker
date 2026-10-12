<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

const { settings, customExercises, workouts, seedExercises, addExercise, addWorkout, setLanguage } = useWorkoutStorage()

const search = ref('')
const selectedExerciseId = ref('')
const newExercise = reactive({
  name: '',
  category: 'General',
  description: '',
  defaultWeightUnit: 'kg' as 'kg' | 'lb'
})

const form = reactive({
  exerciseId: '',
  date: new Date().toISOString().slice(0, 10),
  sets: 3,
  reps: 10,
  weight: 20,
  notes: ''
})

const translations = {
  en: {
    appName: 'Workout Progress',
    overview: 'Overview',
    exercises: 'Exercises',
    logbook: 'Logbook',
    language: 'DE',
    searchPlaceholder: 'Search exercises',
    addExercise: 'Add custom exercise',
    exerciseName: 'Exercise name',
    category: 'Category',
    description: 'Description',
    unit: 'Weight unit',
    totalExercises: 'Exercises',
    totalWorkouts: 'Workouts',
    activeGoal: 'Focus',
    recentSessions: 'Recent sessions',
    noWorkouts: 'No workouts logged yet.',
    logWorkout: 'Log workout',
    chooseExercise: 'Choose an exercise',
    date: 'Date',
    sets: 'Sets',
    reps: 'Reps',
    weight: 'Weight',
    notes: 'Notes',
    save: 'Save workout',
    englishLabel: 'English'
  },
  de: {
    appName: 'Workout Fortschritt',
    overview: 'Übersicht',
    exercises: 'Übungen',
    logbook: 'Protokoll',
    language: 'EN',
    searchPlaceholder: 'Übungen suchen',
    addExercise: 'Eigene Übung hinzufügen',
    exerciseName: 'Übungsname',
    category: 'Kategorie',
    description: 'Beschreibung',
    unit: 'Gewichtseinheit',
    totalExercises: 'Übungen',
    totalWorkouts: 'Trainingseinheiten',
    activeGoal: 'Fokus',
    recentSessions: 'Letzte Einheiten',
    noWorkouts: 'Noch keine Trainingseinheiten gespeichert.',
    logWorkout: 'Training loggen',
    chooseExercise: 'Übung wählen',
    date: 'Datum',
    sets: 'Sätze',
    reps: 'Wiederholungen',
    weight: 'Gewicht',
    notes: 'Notizen',
    save: 'Training speichern',
    englishLabel: 'Deutsch'
  }
} as const

const t = computed(() => translations[settings.value.language])
const availableExercises = computed(() => [...seedExercises.value, ...customExercises.value])

const filteredExercises = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) {
    return availableExercises.value
  }

  return availableExercises.value.filter((exercise) =>
    exercise.name.toLowerCase().includes(term) || exercise.category.toLowerCase().includes(term)
  )
})

const totalVolume = computed(() =>
  workouts.value.reduce((sum, workout) => sum + workout.sets * workout.reps * workout.weight, 0)
)

onMounted(async () => {
  if (!seedExercises.value.length) {
    const response = await fetch('/api/exercises')
    const payload = await response.json()
    seedExercises.value = payload
  }

  if (!selectedExerciseId.value && availableExercises.value.length) {
    selectedExerciseId.value = availableExercises.value[0].id
    form.exerciseId = availableExercises.value[0].id
  }
})

const toggleLanguage = () => {
  setLanguage(settings.value.language === 'en' ? 'de' : 'en')
}

const handleAddExercise = () => {
  const exercise = addExercise({
    name: newExercise.name,
    category: newExercise.category,
    description: newExercise.description,
    defaultWeightUnit: newExercise.defaultWeightUnit
  })

  if (!exercise) {
    return
  }

  selectedExerciseId.value = exercise.id
  form.exerciseId = exercise.id
  newExercise.name = ''
  newExercise.category = 'General'
  newExercise.description = ''
  newExercise.defaultWeightUnit = 'kg'
}

const handleAddWorkout = () => {
  const exercise = availableExercises.value.find((item) => item.id === form.exerciseId)

  if (!exercise || !form.date) {
    return
  }

  addWorkout({
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    date: form.date,
    sets: Number(form.sets) || 0,
    reps: Number(form.reps) || 0,
    weight: Number(form.weight) || 0,
    notes: form.notes
  })

  form.notes = ''
  form.sets = 3
  form.reps = 10
  form.weight = exercise.defaultWeightUnit === 'lb' ? 25 : 20
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Local-first training</p>
        <h1>{{ t.appName }}</h1>
      </div>

      <nav class="main-nav" aria-label="Main navigation">
        <button type="button" class="nav-pill active">{{ t.overview }}</button>
        <button type="button" class="nav-pill">{{ t.exercises }}</button>
        <button type="button" class="nav-pill">{{ t.logbook }}</button>
      </nav>

      <button type="button" class="language-toggle" @click="toggleLanguage">
        {{ t.language }}
      </button>
    </header>

    <main class="content">
      <section class="overview-grid">
        <article class="metric-card">
          <span>{{ t.totalExercises }}</span>
          <strong>{{ availableExercises.length }}</strong>
        </article>
        <article class="metric-card">
          <span>{{ t.totalWorkouts }}</span>
          <strong>{{ workouts.length }}</strong>
        </article>
        <article class="metric-card">
          <span>{{ t.activeGoal }}</span>
          <strong>Consistency</strong>
        </article>
        <article class="metric-card accent">
          <span>Volume</span>
          <strong>{{ totalVolume }} kg</strong>
        </article>
      </section>

      <section class="two-column-layout">
        <div class="panel">
          <div class="panel-header">
            <h2>{{ t.exercises }}</h2>
          </div>

          <input
            v-model="search"
            type="search"
            :placeholder="t.searchPlaceholder"
            class="search-input"
          />

          <div class="exercise-list">
            <button
              v-for="exercise in filteredExercises"
              :key="exercise.id"
              type="button"
              class="exercise-card"
              :class="{ selected: exercise.id === form.exerciseId }"
              @click="form.exerciseId = exercise.id"
            >
              <span class="exercise-name">{{ exercise.name }}</span>
              <span class="exercise-meta">{{ exercise.category }}</span>
            </button>
          </div>

          <form class="inline-form" @submit.prevent="handleAddExercise">
            <h3>{{ t.addExercise }}</h3>

            <label>
              {{ t.exerciseName }}
              <input v-model="newExercise.name" type="text" />
            </label>

            <label>
              {{ t.category }}
              <input v-model="newExercise.category" type="text" />
            </label>

            <label>
              {{ t.unit }}
              <select v-model="newExercise.defaultWeightUnit">
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </label>

            <label>
              {{ t.description }}
              <textarea v-model="newExercise.description" rows="3" />
            </label>

            <button type="submit" class="primary-button">{{ t.addExercise }}</button>
          </form>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h2>{{ t.logWorkout }}</h2>
          </div>

          <form class="inline-form" @submit.prevent="handleAddWorkout">
            <label>
              {{ t.chooseExercise }}
              <select v-model="form.exerciseId">
                <option value="" disabled>{{ t.chooseExercise }}</option>
                <option v-for="exercise in availableExercises" :key="exercise.id" :value="exercise.id">
                  {{ exercise.name }}
                </option>
              </select>
            </label>

            <label>
              {{ t.date }}
              <input v-model="form.date" type="date" />
            </label>

            <div class="input-row">
              <label>
                {{ t.sets }}
                <input v-model.number="form.sets" type="number" min="1" />
              </label>

              <label>
                {{ t.reps }}
                <input v-model.number="form.reps" type="number" min="1" />
              </label>
            </div>

            <label>
              {{ t.weight }} ({{ newExercise.defaultWeightUnit || 'kg' }})
              <input v-model.number="form.weight" type="number" min="0" step="0.5" />
            </label>

            <label>
              {{ t.notes }}
              <textarea v-model="form.notes" rows="3" />
            </label>

            <button type="submit" class="primary-button">{{ t.save }}</button>
          </form>
        </div>
      </section>

      <section class="panel recent-panel">
        <div class="panel-header">
          <h2>{{ t.recentSessions }}</h2>
        </div>

        <div v-if="workouts.length" class="workout-list">
          <article v-for="workout in workouts.slice(0, 5)" :key="workout.id" class="workout-item">
            <div>
              <strong>{{ workout.exerciseName }}</strong>
              <span>{{ workout.date }}</span>
            </div>
            <div>
              <span>{{ workout.sets }} sets</span>
              <span>{{ workout.reps }} reps</span>
              <span>{{ workout.weight }} kg</span>
            </div>
          </article>
        </div>

        <p v-else class="empty-state">{{ t.noWorkouts }}</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background: #f4f6fb;
  color: #101828;
  font-family: Inter, 'Segoe UI', sans-serif;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, #edf4ff 0%, #f8fafc 100%);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem 2rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.eyebrow {
  margin: 0 0 0.25rem;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: #4f46e5;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  font-size: clamp(2rem, 2vw + 1rem, 2.5rem);
}

.main-nav {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.nav-pill,
.language-toggle,
.primary-button,
.exercise-card {
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.nav-pill {
  padding: 0.65rem 1rem;
  background: #eef2ff;
  color: #312e81;
}

.language-toggle,
.primary-button {
  padding: 0.7rem 1.1rem;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card,
.panel {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 24px;
  box-shadow: 0 16px 35px rgba(15, 23, 42, 0.06);
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.25rem 1.4rem;
}

.metric-card strong {
  font-size: 2rem;
}

.metric-card.accent {
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
}

.two-column-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.panel {
  padding: 1.25rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.search-input,
.inline-form input,
.inline-form textarea,
.inline-form select {
  width: 100%;
  box-sizing: border-box;
  padding: 0.8rem 0.9rem;
  border: 1px solid #dfe7f5;
  border-radius: 12px;
  background: white;
}

.exercise-list {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.exercise-card {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0.8rem 1rem;
  background: #f8fafc;
  text-align: left;
}

.exercise-card.selected {
  background: #e0e7ff;
  outline: 2px solid rgba(79, 70, 229, 0.35);
}

.exercise-name {
  font-weight: 600;
}

.exercise-meta {
  color: #475569;
}

.inline-form {
  display: grid;
  gap: 0.9rem;
  margin-top: 1rem;
}

.input-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.recent-panel {
  margin-top: 1.5rem;
}

.workout-list {
  display: grid;
  gap: 0.85rem;
}

.workout-item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-radius: 16px;
  background: #f8fafc;
}

.workout-item > div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.empty-state {
  color: #475569;
  padding: 1rem 0 0;
}

@media (max-width: 760px) {
  .topbar,
  .two-column-layout {
    grid-template-columns: 1fr;
    display: grid;
  }

  .topbar {
    padding: 1rem;
  }

  .main-nav {
    justify-content: flex-start;
  }

  .workout-item {
    flex-direction: column;
  }
}
</style>

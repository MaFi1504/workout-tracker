<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Workout, WorkoutExercise } from '~/composables/useWorkoutStorage'

const { settings, customExercises, workouts, seedExercises, addExercise, addWorkout, setLanguage } = useWorkoutStorage()

const search = ref('')
const selectedExerciseId = ref('front-raise')
const draftExercises = ref<WorkoutExercise[]>([])
const newExercise = reactive({
  name: '',
  category: 'General',
  description: '',
  defaultWeightUnit: 'kg' as 'kg' | 'lb'
})

const form = reactive({
  date: new Date().toISOString().slice(0, 10),
  title: 'Lower Body workout',
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
    addToWorkout: 'Add to workout',
    exerciseName: 'Exercise name',
    category: 'Category',
    description: 'Description',
    unit: 'Weight unit',
    totalExercises: 'Exercises',
    totalWorkouts: 'Workouts',
    workoutTitle: 'Workout title',
    activeWorkout: 'Active workout',
    activeGoal: 'Focus',
    recentSessions: 'Recent sessions',
    loadWorkout: 'Load as new workout',
    noWorkouts: 'No workouts logged yet.',
    logWorkout: 'Log workout',
    chooseExercise: 'Choose an exercise',
    rounds: 'Rounds',
    round: 'Round',
    side: 'Mode',
    synchronized: 'Synchronized',
    single: 'Single-sided',
    previousPerformance: 'Last performance',
    noPreviousPerformance: 'No previous performance',
    moveUp: 'Move exercise up',
    moveDown: 'Move exercise down',
    addRound: 'Add round',
    remove: 'Remove',
    noExercises: 'Add exercises from the catalog to start this workout.',
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
    addToWorkout: 'Zum Training hinzufügen',
    exerciseName: 'Übungsname',
    category: 'Kategorie',
    description: 'Beschreibung',
    unit: 'Gewichtseinheit',
    totalExercises: 'Übungen',
    totalWorkouts: 'Trainingseinheiten',
    workoutTitle: 'Name des Trainings',
    activeWorkout: 'Aktives Training',
    activeGoal: 'Fokus',
    recentSessions: 'Letzte Einheiten',
    loadWorkout: 'Als neues Training laden',
    noWorkouts: 'Noch keine Trainingseinheiten gespeichert.',
    logWorkout: 'Training loggen',
    chooseExercise: 'Übung wählen',
    rounds: 'Runden',
    round: 'Runde',
    side: 'Modus',
    synchronized: 'Synchron',
    single: 'Einseitig',
    previousPerformance: 'Letzte Leistung',
    noPreviousPerformance: 'Keine vorherige Leistung',
    moveUp: 'Übung nach oben',
    moveDown: 'Übung nach unten',
    addRound: 'Runde hinzufügen',
    remove: 'Entfernen',
    noExercises: 'Füge Übungen aus dem Katalog hinzu, um das Training zu starten.',
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
  workouts.value.reduce(
    (workoutTotal, workout) => workoutTotal + workout.exercises.reduce(
      (exerciseTotal, exercise) => exerciseTotal + exercise.rounds.reduce(
        (roundTotal, round) => roundTotal + round.weightKg * round.reps,
        0
      ),
      0
    ),
    0
  )
)

const exerciseName = (exerciseId: string) =>
  availableExercises.value.find((exercise) => exercise.id === exerciseId)?.name || exerciseId

const roundSummary = (exercise: WorkoutExercise) =>
  exercise.rounds.map((round) => `${round.weightKg} kg x ${round.reps}`).join(' · ')

const today = () => new Date().toISOString().slice(0, 10)

const germanDateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

const germanDateTimeFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})

const parseStoredDate = (value: string) => new Date(
  value.includes('T') ? value : `${value}T00:00:00`
)

const formatGermanDate = (value: string) => germanDateFormatter.format(parseStoredDate(value))
const formatGermanDateTime = (value: string) => germanDateTimeFormatter.format(parseStoredDate(value))

const latestWorkoutExercise = (exerciseId: string) => workouts.value
  .flatMap((workout) => workout.exercises
    .filter((exercise) => exercise.exerciseId === exerciseId)
    .map((exercise) => ({ workout, exercise })))
  .sort((left, right) => right.workout.date.localeCompare(left.workout.date))[0]?.exercise

const cloneRounds = (exerciseId: string, rounds: WorkoutExercise['rounds'], stamp = Date.now()) =>
  rounds.map((round, roundIndex) => ({
    ...round,
    id: `draft-${exerciseId}-round-${stamp}-${roundIndex}`,
    round: roundIndex + 1
  }))

const cloneWorkoutExercises = (workout: Workout) => workout.exercises
  .slice()
  .sort((left, right) => left.order - right.order)
  .map((exercise, exerciseIndex) => ({
    id: `draft-${exercise.exerciseId}-${Date.now()}-${exerciseIndex}`,
    exerciseId: exercise.exerciseId,
    order: exerciseIndex,
    side: exercise.side,
    rounds: cloneRounds(exercise.exerciseId, exercise.rounds, `${Date.now()}-${exerciseIndex}`)
  }))

const loadWorkout = (workout: Workout) => {
  draftExercises.value = cloneWorkoutExercises(workout)
  form.title = workout.title
  form.date = today()
  form.notes = workout.notes
  selectedExerciseId.value = draftExercises.value[0]?.exerciseId || selectedExerciseId.value
}

const previousPerformance = (exerciseId: string) => {
  const match = workouts.value
    .flatMap((workout) => workout.exercises
      .filter((exercise) => exercise.exerciseId === exerciseId)
      .map((exercise) => ({ workout, exercise })))
    .sort((left, right) => right.workout.date.localeCompare(left.workout.date))[0]

  if (!match) {
    return null
  }

  return {
    date: formatGermanDateTime(match.workout.createdAt || match.workout.date),
    title: match.workout.title,
    summary: roundSummary(match.exercise)
  }
}

const createRounds = (exerciseId: string, weightKg: number) =>
  Array.from({ length: 3 }, (_, index) => ({
    id: `${exerciseId}-round-${Date.now()}-${index}`,
    round: index + 1,
    weightKg,
    reps: 10,
    side: 'both' as const
  }))

const addSelectedExercise = () => {
  const exercise = availableExercises.value.find((item) => item.id === selectedExerciseId.value)

  if (!exercise || draftExercises.value.some((item) => item.exerciseId === exercise.id)) {
    return
  }

  const previousExercise = latestWorkoutExercise(exercise.id)

  draftExercises.value.push({
    id: `draft-${exercise.id}-${Date.now()}`,
    exerciseId: exercise.id,
    order: draftExercises.value.length,
    side: previousExercise?.side || 'synchronized',
    rounds: previousExercise
      ? cloneRounds(exercise.id, previousExercise.rounds)
      : createRounds(exercise.id, exercise.defaultWeightUnit === 'lb' ? 25 : 20)
  })
}

const removeDraftExercise = (draftId: string) => {
  draftExercises.value = draftExercises.value
    .filter((exercise) => exercise.id !== draftId)
    .map((exercise, index) => ({ ...exercise, order: index }))
}

const moveDraftExercise = (draftId: string, direction: -1 | 1) => {
  const currentIndex = draftExercises.value.findIndex((exercise) => exercise.id === draftId)
  const nextIndex = currentIndex + direction

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= draftExercises.value.length) {
    return
  }

  const movedExercise = draftExercises.value[currentIndex]!
  const reordered = draftExercises.value.filter((exercise) => exercise.id !== draftId)
  reordered.splice(nextIndex, 0, movedExercise)
  draftExercises.value = reordered.map((exercise, index) => ({ ...exercise, order: index }))
}

const addRound = (exercise: WorkoutExercise) => {
  const previousRound = exercise.rounds[exercise.rounds.length - 1]

  exercise.rounds.push({
    id: `${exercise.id}-round-${Date.now()}`,
    round: exercise.rounds.length + 1,
    weightKg: previousRound?.weightKg || 0,
    reps: previousRound?.reps || 10,
    side: exercise.side === 'single' ? undefined : 'both'
  })
}

const removeRound = (exercise: WorkoutExercise, roundId: string) => {
  if (exercise.rounds.length === 1) {
    return
  }

  exercise.rounds = exercise.rounds
    .filter((round) => round.id !== roundId)
    .map((round, index) => ({ ...round, round: index + 1 }))
}

onMounted(async () => {
  if (!seedExercises.value.length) {
    const response = await fetch('/api/exercises')
    const payload = await response.json()
    seedExercises.value = payload
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
  newExercise.name = ''
  newExercise.category = 'General'
  newExercise.description = ''
  newExercise.defaultWeightUnit = 'kg'
}

const handleAddWorkout = () => {
  if (!form.date || !form.title.trim() || !draftExercises.value.length) {
    return
  }

  addWorkout({
    date: form.date,
    title: form.title.trim(),
    exercises: draftExercises.value.map((exercise, index) => ({
      ...exercise,
      order: index,
      rounds: exercise.rounds.map((round) => ({
        ...round,
        weightKg: Number(round.weightKg) || 0,
        reps: Number(round.reps) || 0
      }))
    })),
    notes: form.notes
  })

  draftExercises.value = []
  form.title = 'Lower Body workout'
  form.notes = ''
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
              :class="{ selected: exercise.id === selectedExerciseId }"
              @click="selectedExerciseId = exercise.id"
            >
              <span class="exercise-name">{{ exercise.name }}</span>
              <span class="exercise-meta">{{ exercise.category }}</span>
            </button>
          </div>

          <button type="button" class="primary-button" @click="addSelectedExercise">
            {{ t.addToWorkout }}
          </button>

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
            <h2>{{ t.activeWorkout }}</h2>
          </div>

          <form class="inline-form" @submit.prevent="handleAddWorkout">
            <label>
              {{ t.workoutTitle }}
              <input v-model="form.title" type="text" />
            </label>

            <label>
              {{ t.date }}
              <input v-model="form.date" type="date" lang="de-DE" />
              <span class="date-preview">{{ formatGermanDate(form.date) }}</span>
            </label>

            <div v-if="draftExercises.length" class="draft-exercise-list">
              <article v-for="exercise in draftExercises" :key="exercise.id" class="draft-exercise">
                <div class="draft-exercise-header">
                  <div class="draft-exercise-title">
                    <strong>{{ exerciseName(exercise.exerciseId) }}</strong>
                    <span>{{ t.rounds }}: {{ exercise.rounds.length }}</span>
                  </div>
                  <div class="draft-exercise-actions">
                    <button
                      type="button"
                      class="icon-button"
                      :disabled="exercise.order === 0"
                      :aria-label="t.moveUp"
                      :title="t.moveUp"
                      @click="moveDraftExercise(exercise.id, -1)"
                    >
                      <span aria-hidden="true">↑</span>
                    </button>
                    <button
                      type="button"
                      class="icon-button"
                      :disabled="exercise.order === draftExercises.length - 1"
                      :aria-label="t.moveDown"
                      :title="t.moveDown"
                      @click="moveDraftExercise(exercise.id, 1)"
                    >
                      <span aria-hidden="true">↓</span>
                    </button>
                    <button
                      type="button"
                      class="icon-button remove-button"
                      :aria-label="t.remove"
                      :title="t.remove"
                      @click="removeDraftExercise(exercise.id)"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                </div>

                <label>
                  {{ t.side }}
                  <select v-model="exercise.side">
                    <option value="synchronized">{{ t.synchronized }}</option>
                    <option value="single">{{ t.single }}</option>
                  </select>
                </label>

                <p v-if="previousPerformance(exercise.exerciseId)" class="previous-performance">
                  {{ t.previousPerformance }}:
                  {{ previousPerformance(exercise.exerciseId)?.date }} ·
                  {{ previousPerformance(exercise.exerciseId)?.summary }}
                </p>
                <p v-else class="previous-performance muted">{{ t.noPreviousPerformance }}</p>

                <div class="round-list">
                  <div v-for="round in exercise.rounds" :key="round.id" class="round-row">
                    <span>{{ t.round }} {{ round.round }}</span>
                    <label>
                      {{ t.weight }}
                      <input v-model.number="round.weightKg" type="number" min="0" step="0.5" />
                    </label>
                    <label>
                      {{ t.reps }}
                      <input v-model.number="round.reps" type="number" min="0" />
                    </label>
                    <button
                      type="button"
                      class="icon-button"
                      :aria-label="`${t.remove} ${t.round} ${round.round}`"
                      @click="removeRound(exercise, round.id)"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <button type="button" class="secondary-button" @click="addRound(exercise)">
                  {{ t.addRound }}
                </button>
              </article>
            </div>

            <p v-else class="empty-state">{{ t.noExercises }}</p>

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
          <article
            v-for="workout in workouts.slice(0, 5)"
            :key="workout.id"
            class="workout-item"
            role="button"
            tabindex="0"
            @click="loadWorkout(workout)"
            @keydown.enter="loadWorkout(workout)"
            @keydown.space.prevent="loadWorkout(workout)"
          >
            <div>
              <strong>{{ workout.title }}</strong>
              <span>{{ formatGermanDateTime(workout.createdAt || workout.date) }} · {{ workout.exercises.length }} {{ t.exercises }}</span>
            </div>
            <div class="workout-exercises">
              <span v-for="exercise in workout.exercises" :key="exercise.id">
                {{ exerciseName(exercise.exerciseId) }}: {{ roundSummary(exercise) }}
              </span>
            </div>
            <span class="workout-load-label">{{ t.loadWorkout }}</span>
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

.draft-exercise-list {
  display: grid;
  gap: 1rem;
}

.draft-exercise {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid #dfe7f5;
  border-radius: 16px;
  background: #f8fafc;
}

.draft-exercise-header,
.round-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.draft-exercise-header {
  justify-content: space-between;
}

.draft-exercise-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.draft-exercise-title,
.round-row label {
  display: grid;
  gap: 0.25rem;
}

.draft-exercise-header span {
  color: #475569;
  font-size: 0.85rem;
}

.round-list {
  display: grid;
  gap: 0.6rem;
}

.round-row {
  align-items: end;
}

.round-row > span {
  min-width: 4.5rem;
  padding-bottom: 0.8rem;
  color: #475569;
  font-size: 0.85rem;
}

.secondary-button,
.icon-button {
  border: 0;
  cursor: pointer;
}

.secondary-button {
  justify-self: start;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  background: #e0e7ff;
  color: #312e81;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border-radius: 10px;
  background: #e2e8f0;
  color: #334155;
}

.remove-button {
  background: #fee2e2;
  color: #b91c1c;
}

.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.previous-performance {
  margin: 0;
  padding: 0.7rem 0.8rem;
  border-left: 3px solid #4f46e5;
  background: #eef2ff;
  color: #312e81;
  font-size: 0.85rem;
}

.previous-performance.muted {
  border-left-color: #cbd5e1;
  background: #f1f5f9;
  color: #64748b;
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

.date-preview {
  color: #475569;
  font-size: 0.85rem;
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
  border: 1px solid transparent;
  border-radius: 16px;
  background: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.workout-item:hover,
.workout-item:focus-visible {
  border-color: #a5b4fc;
  background: #eef2ff;
  outline: none;
}

.workout-item > div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.workout-exercises {
  min-width: min(100%, 34rem);
}

.workout-load-label {
  align-self: center;
  color: #4f46e5;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
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

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { RoundEntry, Workout, WorkoutExercise } from '~/composables/useWorkoutStorage'

const { settings, customExercises, workouts, seedExercises, addWorkout } = useWorkoutStorage()

const search = ref('')
const selectedExerciseId = ref('front-raise')
const draftExercises = ref<WorkoutExercise[]>([])
const form = reactive({
  date: new Date().toISOString().slice(0, 10),
  title: 'Lower Body workout',
  notes: ''
})

const commonWeightsKg = [1, 3, 5, 8, 10] as const
const weightDialogOpen = ref(false)
const weightDialogRound = ref<RoundEntry | null>(null)
const weightDialogValue = ref(0)

const translations = {
  en: {
    appName: 'Workout Tracker',
    overview: 'Overview',
    exercises: 'Exercises',
    logbook: 'Logbook',
    tools: 'Tools',
    language: 'DE',
    searchPlaceholder: 'Search exercises',
    addToWorkout: 'Add to workout',
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
    quickWeights: 'Quick weights',
    weightDialog: 'Select weight',
    currentWeight: 'Current weight',
    apply: 'Apply weight',
    cancel: 'Cancel',
    increaseRep: 'Count one rep',
    decreaseRep: 'Remove one rep',
    save: 'Save workout',
    englishLabel: 'English'
  },
  de: {
    appName: 'Workout Tracker',
    overview: 'Übersicht',
    exercises: 'Übungen',
    logbook: 'Protokoll',
    tools: 'Werkzeuge',
    language: 'EN',
    searchPlaceholder: 'Übungen suchen',
    addToWorkout: 'Zum Training hinzufügen',
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
    quickWeights: 'Schnellgewichte',
    weightDialog: 'Gewicht auswählen',
    currentWeight: 'Aktuelles Gewicht',
    apply: 'Gewicht übernehmen',
    cancel: 'Abbrechen',
    increaseRep: 'Eine Wiederholung zählen',
    decreaseRep: 'Eine Wiederholung entfernen',
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

const openWeightDialog = (round: RoundEntry) => {
  weightDialogRound.value = round
  weightDialogValue.value = round.weightKg
  weightDialogOpen.value = true
}

const closeWeightDialog = () => {
  weightDialogOpen.value = false
  weightDialogRound.value = null
}

const applyWeightDialog = () => {
  if (weightDialogRound.value) {
    weightDialogRound.value.weightKg = Math.max(0, Number(weightDialogValue.value) || 0)
  }

  closeWeightDialog()
}

const incrementReps = (round: RoundEntry) => {
  round.reps = Math.max(0, Number(round.reps) || 0) + 1
}

const decrementReps = (round: RoundEntry) => {
  round.reps = Math.max(0, (Number(round.reps) || 0) - 1)
}

const normalizeReps = (round: RoundEntry) => {
  round.reps = Math.max(0, Number.parseInt(String(round.reps), 10) || 0)
}

const handleSideChange = (exercise: WorkoutExercise) => {
  exercise.rounds = exercise.rounds.map((round) => ({
    ...round,
    side: exercise.side === 'single' ? (round.side === 'both' ? 'left' : round.side) : 'both'
  }))
}

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
      : createRounds(exercise.id, 10)
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
    <AppHeader active-page="overview" />

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
                      <svg class="close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                </div>

                <label>
                  {{ t.side }}
                  <select v-model="exercise.side" @change="handleSideChange(exercise)">
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
                    <div class="round-info">
                      <span class="round-label">{{ t.round }} {{ round.round }}</span>
                      <label>
                        {{ t.weight }} (kg)
                        <input
                          :value="`${round.weightKg} kg`"
                          type="text"
                          readonly
                          class="weight-trigger"
                          :aria-label="t.weightDialog"
                          @click="openWeightDialog(round)"
                          @keydown.enter="openWeightDialog(round)"
                        />
                      </label>
                    </div>
                    <div class="round-measurement reps-measurement">
                      <span class="measurement-label">{{ t.reps }}</span>
                      <div class="rep-controls">
                        <button
                          type="button"
                          class="icon-button counter-button"
                          :aria-label="t.decreaseRep"
                          :title="t.decreaseRep"
                          @click="decrementReps(round)"
                        >
                          −
                        </button>
                        <input
                          v-model.number="round.reps"
                          type="text"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          class="rep-count-input"
                          :aria-label="t.reps"
                          @change="normalizeReps(round)"
                        />
                        <button
                          type="button"
                          class="icon-button counter-button"
                          :aria-label="t.increaseRep"
                          :title="t.increaseRep"
                          @click="incrementReps(round)"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="icon-button remove-button"
                      :aria-label="`${t.remove} ${t.round} ${round.round}`"
                      @click="removeRound(exercise, round.id)"
                    >
                      <svg class="close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
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

      <div
        v-if="weightDialogOpen"
        class="weight-dialog-backdrop"
        role="presentation"
        @click.self="closeWeightDialog"
      >
        <section class="weight-dialog" role="dialog" aria-modal="true" :aria-label="t.weightDialog">
          <div class="panel-header">
            <h2>{{ t.weightDialog }}</h2>
            <button type="button" class="icon-button" :aria-label="t.cancel" :title="t.cancel" @click="closeWeightDialog">
              <svg class="close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <label>
            {{ t.currentWeight }} (kg)
            <input v-model.number="weightDialogValue" type="number" min="0" step="0.5" autofocus />
          </label>

          <div class="dialog-presets" :aria-label="t.quickWeights">
            <button
              v-for="weight in commonWeightsKg"
              :key="weight"
              type="button"
              class="weight-preset"
              :class="{ selected: weightDialogValue === weight }"
              @click="weightDialogValue = weight"
            >
              {{ weight }} kg
            </button>
          </div>

          <div class="dialog-actions">
            <button type="button" class="secondary-button" @click="closeWeightDialog">{{ t.cancel }}</button>
            <button type="button" class="primary-button" @click="applyWeightDialog">{{ t.apply }}</button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, #edf4ff 0%, #f8fafc 100%);
}

h2,
h3,
p {
  margin: 0;
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
  max-height: 20rem;
  overflow-y: auto;
  margin-top: 1rem;
  padding: 0.25rem;
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
  display: grid;
  grid-template-columns: minmax(5.5rem, 0.7fr) minmax(0, 2fr) auto;
  align-items: end;
  gap: 0.75rem;
}

.round-info {
  display: grid;
  align-self: start;
  gap: 0.35rem;
  min-width: 0;
}

.round-label {
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
}

.round-measurement {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.reps-measurement {
  min-width: 0;
}

.measurement-label {
  color: #475569;
  font-size: 0.85rem;
}

.rep-controls {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.weight-trigger {
  cursor: pointer;
  background: #eef2ff;
  color: #312e81;
  font-weight: 600;
}

.weight-preset {
  min-width: 2.1rem;
  min-height: 2rem;
  padding: 0.25rem 0.45rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: white;
  color: #334155;
  cursor: pointer;
}

.weight-preset.selected {
  border-color: #4f46e5;
  background: #e0e7ff;
  color: #312e81;
  font-weight: 600;
}

.round-row .rep-count-input {
  width: 3.5rem;
  min-width: 3.5rem;
  flex: 0 0 3.5rem;
  padding: 0.55rem 0.35rem;
  border: 1px solid #a5b4fc;
  border-radius: 10px;
  background: #eef2ff;
  color: #312e81;
  font-weight: 700;
  text-align: center;
}

.counter-button {
  width: 3.25rem;
  min-width: 3.25rem;
  height: 2.75rem;
  padding: 0;
  font-size: 1.25rem;
}

.rep-count-input:focus {
  outline: 2px solid rgba(79, 70, 229, 0.35);
  outline-offset: 1px;
}

.draft-exercise > .secondary-button {
  justify-self: start;
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
  outline-offset: 2px;
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

.weight-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
}

.weight-dialog {
  display: grid;
  gap: 1rem;
  width: min(100%, 28rem);
  padding: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  background: white;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.25);
}

.dialog-presets {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
}

.dialog-presets .weight-preset {
  min-height: 2.75rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.empty-state {
  color: #475569;
  padding: 1rem 0 0;
}

@media (max-width: 760px) {
  .two-column-layout {
    grid-template-columns: 1fr;
    display: grid;
  }

  .workout-item {
    flex-direction: column;
  }
}
</style>

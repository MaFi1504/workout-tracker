<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { combineDateAndTime, localDateIso, localTimeIso, nextRoundSide, updateRoundWeight, workoutVolume } from '~/domain/workout-domain'
import type { RoundEntry, Workout, WorkoutExercise } from '~/composables/useWorkoutStorage'
import { matchesExerciseSearch } from '~/utils/exerciseMatching'

const { settings, customExercises, workouts, seedExercises, replaceSeedExercises, addWorkout, addExercise, isTimedExercise, measurementLabel, activeWorkout, resetActiveWorkout, setFocus } = useWorkoutStorage()
const route = useRoute()
const router = useRouter()

const search = ref('')
const selectedExerciseId = ref('front-raise')
const draftExercises = computed<WorkoutExercise[]>({
  get: () => activeWorkout.value.exercises,
  set: (exercises) => { activeWorkout.value.exercises = exercises }
})
const activeInfoExerciseId = ref<string | null>(null)
const hoveredInfoExerciseId = ref<string | null>(null)
const collapsedDraftExerciseIds = ref(new Set<string>())
const completedDraftExerciseIds = ref(new Set<string>())
const form = computed(() => activeWorkout.value)
const durationSeconds = computed(() => {
  const minutes = form.value.durationMinutes
  const seconds = form.value.durationSeconds
  return minutes === null && seconds === null
    ? undefined
    : Math.max(0, Math.floor(Number(minutes) || 0)) * 60 + Math.min(59, Math.max(0, Math.floor(Number(seconds) || 0)))
})

const commonWeightsKg = [1, 3, 5, 8, 10] as const
const weightDialogOpen = ref(false)
const weightDialogRound = ref<RoundEntry | null>(null)
const weightDialogValue = ref(0)
const weightDialogCount = ref<1 | 2>(1)

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
    createAndAdd: 'Create and add',
    totalExercises: 'Exercises',
    totalWorkouts: 'Workouts',
    workoutTitle: 'Workout title',
    activeWorkout: 'Active workout',
    activeGoal: 'Focus',
    recentSessions: 'Recent sessions',
    loadWorkout: 'Load as new workout',
    viewWorkout: 'View details',
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
    collapseExercise: 'Collapse exercise',
    expandExercise: 'Expand exercise',
    finishExercise: 'Finish exercise',
    markExerciseUnfinished: 'Mark exercise unfinished',
    finished: 'Finished',
    addRound: 'Add round',
    remove: 'Remove',
    noExercises: 'Add exercises from the catalog to start this workout.',
    date: 'Date',
    duration: 'Duration',
    minutes: 'min',
    seconds: 'sec',
    sets: 'Sets',
    reps: 'Reps',
    weight: 'Weight',
    notes: 'Notes',
    quickWeights: 'Quick weights',
    bodyweight: 'Bodyweight',
    weightDialog: 'Select weight',
    currentWeight: 'Current weight',
    apply: 'Apply weight',
    cancel: 'Cancel',
    increaseRep: 'Count one rep',
    decreaseRep: 'Remove one rep',
    increaseSecond: 'Add one second',
    decreaseSecond: 'Remove one second',
    roundSynchronized: 'Synchronized round',
    roundSingle: 'Single-sided round',
    sideBoth: 'Both sides',
    sideLeft: 'Left side',
    sideRight: 'Right side',
    sideAlternating: 'Alternating sides',
    repsPerSide: 'Reps per side',
    exerciseInfo: 'Exercise description',
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
    createAndAdd: 'Erstellen und hinzufügen',
    totalExercises: 'Übungen',
    totalWorkouts: 'Trainingseinheiten',
    workoutTitle: 'Name des Trainings',
    activeWorkout: 'Aktives Training',
    activeGoal: 'Fokus',
    recentSessions: 'Letzte Einheiten',
    loadWorkout: 'Als neues Training laden',
    viewWorkout: 'Details ansehen',
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
    collapseExercise: 'Übung einklappen',
    expandExercise: 'Übung ausklappen',
    finishExercise: 'Übung abschließen',
    markExerciseUnfinished: 'Übung als nicht abgeschlossen markieren',
    finished: 'Abgeschlossen',
    addRound: 'Runde hinzufügen',
    remove: 'Entfernen',
    noExercises: 'Füge Übungen aus dem Katalog hinzu, um das Training zu starten.',
    date: 'Datum',
    duration: 'Dauer',
    minutes: 'Min.',
    seconds: 'Sek.',
    sets: 'Sätze',
    reps: 'Wiederholungen',
    weight: 'Gewicht',
    notes: 'Notizen',
    quickWeights: 'Schnellgewichte',
    bodyweight: 'Körpergewicht',
    weightDialog: 'Gewicht auswählen',
    currentWeight: 'Aktuelles Gewicht',
    apply: 'Gewicht übernehmen',
    cancel: 'Abbrechen',
    increaseRep: 'Eine Wiederholung zählen',
    decreaseRep: 'Eine Wiederholung entfernen',
    increaseSecond: 'Eine Sekunde hinzufügen',
    decreaseSecond: 'Eine Sekunde entfernen',
    roundSynchronized: 'Synchrone Runde',
    roundSingle: 'Einseitige Runde',
    sideBoth: 'Beide Seiten',
    sideLeft: 'Linke Seite',
    sideRight: 'Rechte Seite',
    sideAlternating: 'Abwechselnde Seiten',
    repsPerSide: 'Wiederholungen pro Seite',
    exerciseInfo: 'Übungsbeschreibung',
    save: 'Training speichern',
    englishLabel: 'Deutsch'
  }
} as const

const t = computed(() => translations[settings.value.language])
const focus = computed({
  get: () => settings.value.focus,
  set: setFocus
})
const availableExercises = computed(() => [...seedExercises.value, ...customExercises.value])

const filteredExercises = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) {
    return availableExercises.value
  }

  return availableExercises.value.filter((exercise) => matchesExerciseSearch(exercise, term))
})

const totalVolume = computed(() =>
  workouts.value.reduce((total, workout) => total + workoutVolume(workout, availableExercises.value), 0)
)

const exerciseName = (exerciseId: string) =>
  availableExercises.value.find((exercise) => exercise.id === exerciseId)?.name || exerciseId

const roundSummary = (exercise: WorkoutExercise) =>
  exercise.rounds.map((round) => {
    const measurement = round.side === 'alternating' && !isTimedExercise(exercise.exerciseId)
      ? t.value.repsPerSide
      : measurementLabel(exercise.exerciseId)
    const alternating = round.side === 'alternating' ? ` (${t.value.sideAlternating})` : ''
    return `${round.weightCount === 2 ? '2×' : ''}${round.weightKg} kg x ${round.reps} ${measurement}${alternating}`
  }).join(' · ')

const roundWeightLabel = (round: RoundEntry) =>
  `${round.weightCount === 2 ? '2×' : ''}${round.weightKg} kg`

const today = () => localDateIso()

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
  weightDialogCount.value = round.weightCount || 1
  weightDialogOpen.value = true
}

const closeWeightDialog = () => {
  weightDialogOpen.value = false
  weightDialogRound.value = null
}

const applyWeightDialog = () => {
  const round = weightDialogRound.value
  if (round) {
    const exercise = draftExercises.value.find((item) => item.rounds.includes(round))
    const roundIndex = exercise?.rounds.indexOf(round) ?? -1
    const weightKg = Math.max(0, Number(weightDialogValue.value) || 0)

    if (exercise && roundIndex >= 0) {
      const updatedRounds = updateRoundWeight(exercise.rounds, roundIndex, weightKg, weightDialogCount.value)
      exercise.rounds = updatedRounds
      exercise.rounds[roundIndex]!.weightCount = weightDialogCount.value
    } else {
      round.weightKg = weightKg
      round.weightCount = weightDialogCount.value
    }
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

const toggleRoundMode = (exercise: WorkoutExercise, round: RoundEntry) => {
  round.side = nextRoundSide(round.side)
  exercise.side = exercise.rounds.every((item) => (item.side || 'both') === 'both') ? 'synchronized' : 'single'
}

const exerciseDescription = (exerciseId: string) =>
  availableExercises.value.find((exercise) => exercise.id === exerciseId)?.description || ''

const showExerciseInfo = (exerciseId: string) =>
  activeInfoExerciseId.value === exerciseId || hoveredInfoExerciseId.value === exerciseId

const sideLabel = (round: RoundEntry) => {
  const side = round.side || 'both'
  return side === 'both'
    ? t.value.sideBoth
    : side === 'left'
      ? t.value.sideLeft
      : side === 'right'
        ? t.value.sideRight
        : t.value.sideAlternating
}

const roundMeasurementLabel = (exerciseId: string, round: RoundEntry) =>
  round.side === 'alternating' && !isTimedExercise(exerciseId)
    ? t.value.repsPerSide
    : measurementLabel(exerciseId)

const latestWorkoutExercise = (exerciseId: string) => workouts.value
  .flatMap((workout) => workout.exercises
    .filter((exercise) => exercise.exerciseId === exerciseId)
    .map((exercise) => ({ workout, exercise })))
  .sort((left, right) => right.workout.date.localeCompare(left.workout.date))[0]?.exercise

const cloneRounds = (exerciseId: string, rounds: WorkoutExercise['rounds'], stamp: string | number = Date.now()) =>
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
    notes: exercise.notes,
    rounds: cloneRounds(exercise.exerciseId, exercise.rounds, `${Date.now()}-${exerciseIndex}`)
  }))

const loadWorkout = (workout: Workout) => {
  draftExercises.value = cloneWorkoutExercises(workout)
  collapsedDraftExerciseIds.value = new Set()
  completedDraftExerciseIds.value = new Set()
  form.value.title = workout.title
  form.value.date = today()
  form.value.durationMinutes = null
  form.value.durationSeconds = null
  form.value.notes = workout.notes
  selectedExerciseId.value = draftExercises.value[0]?.exerciseId || selectedExerciseId.value
}

const openWorkout = (workout: Workout) => navigateTo(`/workouts/${workout.id}?from=overview`)

watch(() => route.query.loadWorkout, (id) => {
  if (typeof id !== 'string') return
  const workout = workouts.value.find((item) => item.id === id)
  if (workout) loadWorkout(workout)
  const { loadWorkout: _loadWorkout, ...query } = route.query
  void router.replace({ path: route.path, query })
}, { immediate: true })

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
    weightCount: 1 as const,
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
    notes: '',
    rounds: previousExercise
      ? cloneRounds(exercise.id, previousExercise.rounds)
      : createRounds(exercise.id, 10)
  })

  selectedExerciseId.value = ''
  search.value = ''
}

const removeDraftExercise = (draftId: string) => {
  draftExercises.value = draftExercises.value
    .filter((exercise) => exercise.id !== draftId)
    .map((exercise, index) => ({ ...exercise, order: index }))
  collapsedDraftExerciseIds.value.delete(draftId)
  completedDraftExerciseIds.value.delete(draftId)
}

const isDraftExerciseCollapsed = (draftId: string) => collapsedDraftExerciseIds.value.has(draftId)
const isDraftExerciseCompleted = (draftId: string) => completedDraftExerciseIds.value.has(draftId)

const toggleDraftExerciseCollapsed = (draftId: string) => {
  if (isDraftExerciseCollapsed(draftId)) {
    collapsedDraftExerciseIds.value.delete(draftId)
  } else {
    collapsedDraftExerciseIds.value.add(draftId)
  }
}

const toggleDraftExerciseCompleted = (draftId: string) => {
  if (isDraftExerciseCompleted(draftId)) {
    completedDraftExerciseIds.value.delete(draftId)
  } else {
    completedDraftExerciseIds.value.add(draftId)
    collapsedDraftExerciseIds.value.add(draftId)
  }
}

const createAndAddExercise = () => {
  const name = search.value.trim()
  if (!name) return
  const exercise = addExercise({ name, tags: ['General'], description: '', defaultWeightUnit: 'kg' })
  if (!exercise) return
  selectedExerciseId.value = exercise.id
  addSelectedExercise()
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
    weightCount: previousRound?.weightCount || 1,
    reps: previousRound?.reps || 10,
    side: previousRound?.side ?? (exercise.side === 'single' ? undefined : 'both')
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
    replaceSeedExercises(payload)
  }

})

const handleAddWorkout = () => {
  if (!form.value.date || !form.value.title.trim() || !draftExercises.value.length) {
    return
  }

  addWorkout({
    date: form.value.date,
    createdAt: combineDateAndTime(form.value.date, localTimeIso()),
    ...(durationSeconds.value === undefined ? {} : { durationSeconds: durationSeconds.value }),
    title: form.value.title.trim(),
    exercises: draftExercises.value.map((exercise, index) => ({
      ...exercise,
      order: index,
      rounds: exercise.rounds.map((round) => ({
        ...round,
        weightKg: Number(round.weightKg) || 0,
        reps: Number(round.reps) || 0
      }))
    })),
    notes: form.value.notes
  })

  collapsedDraftExerciseIds.value = new Set()
  completedDraftExerciseIds.value = new Set()
  resetActiveWorkout()
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
        <article class="metric-card active-goal">
          <span>{{ t.activeGoal }}</span>
          <input v-model="focus" class="focus-input" type="text" :aria-label="t.activeGoal" />
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
              v-if="search.trim()"
              type="button"
              class="primary-button"
              @click="createAndAddExercise"
            >{{ t.createAndAdd }} “{{ search.trim() }}”</button>
            <button
              v-for="exercise in filteredExercises"
              :key="exercise.id"
              type="button"
              class="exercise-card"
              :class="{ selected: exercise.id === selectedExerciseId }"
              @click="selectedExerciseId = exercise.id"
            >
              <span class="exercise-name">{{ exercise.name }}</span>
              <span class="exercise-meta">{{ exercise.tags.join(' · ') }}</span>
            </button>
          </div>

          <button v-if="!search.trim() || filteredExercises.length" type="button" class="primary-button" @click="addSelectedExercise">
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

            <div class="date-duration-row">
              <label>
                {{ t.date }}
                <input v-model="form.date" type="date" lang="de-DE" />
                <span class="date-preview">{{ formatGermanDate(form.date) }}</span>
              </label>
              <label>
                {{ t.duration }}
                <span class="duration-inputs">
                  <span><input v-model.number="form.durationMinutes" type="number" min="0" step="1" :aria-label="t.minutes" /><small>{{ t.minutes }}</small></span>
                  <span><input v-model.number="form.durationSeconds" type="number" min="0" max="59" step="1" :aria-label="t.seconds" /><small>{{ t.seconds }}</small></span>
                </span>
              </label>
            </div>

            <div v-if="draftExercises.length" class="draft-exercise-list">
              <article
                v-for="exercise in draftExercises"
                :key="exercise.id"
                class="draft-exercise"
                :class="{ collapsed: isDraftExerciseCollapsed(exercise.id), completed: isDraftExerciseCompleted(exercise.id) }"
              >
                <div class="draft-exercise-header">
                  <div class="draft-exercise-title">
                    <div class="exercise-name-with-info">
                      <strong>{{ exerciseName(exercise.exerciseId) }}</strong>
                      <span
                        class="exercise-info-wrap"
                        @mouseenter="hoveredInfoExerciseId = exercise.exerciseId"
                        @mouseleave="hoveredInfoExerciseId = null"
                      >
                        <button
                          type="button"
                          class="exercise-info-button"
                          :aria-label="t.exerciseInfo"
                          :aria-expanded="showExerciseInfo(exercise.exerciseId)"
                          :aria-describedby="showExerciseInfo(exercise.exerciseId) ? `exercise-description-${exercise.id}` : undefined"
                          @click.stop="activeInfoExerciseId = activeInfoExerciseId === exercise.exerciseId ? null : exercise.exerciseId"
                          @focus="hoveredInfoExerciseId = exercise.exerciseId"
                          @blur="hoveredInfoExerciseId = null"
                        >i</button>
                        <span
                          v-if="showExerciseInfo(exercise.exerciseId)"
                          :id="`exercise-description-${exercise.id}`"
                          class="exercise-info-tooltip"
                          role="tooltip"
                        >{{ exerciseDescription(exercise.exerciseId) }}</span>
                      </span>
                    </div>
                    <span>{{ t.rounds }}: {{ exercise.rounds.length }}</span>
                    <span v-if="isDraftExerciseCompleted(exercise.id)" class="exercise-completed-label">{{ t.finished }}</span>
                  </div>
                  <div class="draft-exercise-actions">
                    <button
                      type="button"
                      class="icon-button"
                      :aria-label="isDraftExerciseCollapsed(exercise.id) ? t.expandExercise : t.collapseExercise"
                      :title="isDraftExerciseCollapsed(exercise.id) ? t.expandExercise : t.collapseExercise"
                      :aria-expanded="!isDraftExerciseCollapsed(exercise.id)"
                      @click="toggleDraftExerciseCollapsed(exercise.id)"
                    >
                      <svg class="exercise-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path :d="isDraftExerciseCollapsed(exercise.id) ? 'm6 9 6 6 6-6' : 'm6 15 6-6 6 6'" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="icon-button"
                      :disabled="exercise.order === 0"
                      :aria-label="t.moveUp"
                      :title="t.moveUp"
                      @click="moveDraftExercise(exercise.id, -1)"
                    >
                      <svg class="exercise-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M12 19V5m-6 6 6-6 6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="icon-button"
                      :disabled="exercise.order === draftExercises.length - 1"
                      :aria-label="t.moveDown"
                      :title="t.moveDown"
                      @click="moveDraftExercise(exercise.id, 1)"
                    >
                      <svg class="exercise-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M12 5v14m-6-6 6 6 6-6" />
                      </svg>
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

                <template v-if="!isDraftExerciseCollapsed(exercise.id)">
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
                            :value="roundWeightLabel(round)"
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
                        <span class="measurement-label">{{ roundMeasurementLabel(exercise.exerciseId, round) }}</span>
                        <div class="rep-controls">
                          <button
                            type="button"
                            class="icon-button counter-button"
                            :aria-label="isTimedExercise(exercise.exerciseId) ? t.decreaseSecond : t.decreaseRep"
                            :title="isTimedExercise(exercise.exerciseId) ? t.decreaseSecond : t.decreaseRep"
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
                            :aria-label="roundMeasurementLabel(exercise.exerciseId, round)"
                            @change="normalizeReps(round)"
                          />
                          <button
                            type="button"
                            class="icon-button counter-button"
                            :aria-label="isTimedExercise(exercise.exerciseId) ? t.increaseSecond : t.increaseRep"
                            :title="isTimedExercise(exercise.exerciseId) ? t.increaseSecond : t.increaseRep"
                            @click="incrementReps(round)"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            class="icon-button mode-toggle"
                            :class="[`side-${round.side || 'both'}`, { synchronized: (round.side || 'both') === 'both' }]"
                            :aria-label="sideLabel(round)"
                            :title="sideLabel(round)"
                            @click="toggleRoundMode(exercise, round)"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                              <g v-if="(round.side || 'both') === 'left'">
                                <circle cx="8" cy="6" r="2" />
                                <path d="M8 9v6M5 12h6M8 15l-2 5M8 15l2 5" />
                              </g>
                              <g v-else-if="round.side === 'right'">
                                <circle cx="16" cy="6" r="2" />
                                <path d="M16 9v6M13 12h6M16 15l-2 5M16 15l2 5" />
                              </g>
                              <g v-else-if="round.side === 'alternating'">
                                <circle cx="12" cy="5" r="2" />
                                <path d="M12 8v7m-3-4h6m-3 4-2 5m2-5 2 5M3 8h5m-2-2 2 2-2 2M21 16h-5m2-2-2 2 2 2" />
                              </g>
                              <g v-else>
                                <circle cx="8" cy="6" r="2" />
                                <path d="M8 9v6M5 12h6M8 15l-2 5M8 15l2 5" />
                                <circle cx="16" cy="6" r="2" />
                                <path d="M16 9v6M13 12h6M16 15l-2 5M16 15l2 5" />
                              </g>
                            </svg>
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

                  <div class="draft-exercise-round-actions">
                    <button type="button" class="secondary-button" @click="addRound(exercise)">
                      {{ t.addRound }}
                    </button>
                    <button
                      type="button"
                      class="secondary-button exercise-completion-button"
                      :class="{ 'exercise-completion-button-done': isDraftExerciseCompleted(exercise.id) }"
                      @click="toggleDraftExerciseCompleted(exercise.id)"
                    >
                      {{ isDraftExerciseCompleted(exercise.id) ? t.markExerciseUnfinished : t.finishExercise }}
                    </button>
                  </div>
                  <ExerciseNotes v-model="exercise.notes" :label="t.notes" />
                </template>
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
            <div class="workout-actions">
              <button type="button" class="text-button" @click="openWorkout(workout)">{{ t.viewWorkout }}</button>
              <button type="button" class="workout-load-label" @click="loadWorkout(workout)">{{ t.loadWorkout }}</button>
            </div>
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
              type="button"
              class="weight-preset bodyweight-preset"
              :class="{ selected: weightDialogValue === 0 && weightDialogCount === 1 }"
              @click="weightDialogValue = 0; weightDialogCount = 1"
            >
              <span>{{ t.bodyweight }}</span>
              <span>0 kg</span>
            </button>
            <button
              v-for="weight in commonWeightsKg"
              :key="weight"
              type="button"
              class="weight-preset"
              :class="{ selected: weightDialogValue === weight && weightDialogCount === 1 }"
              @click="weightDialogValue = weight; weightDialogCount = 1"
            >
              {{ weight }} kg
            </button>
            <button
              v-for="weight in commonWeightsKg"
              :key="`paired-${weight}`"
              type="button"
              class="weight-preset"
              :class="{ selected: weightDialogValue === weight && weightDialogCount === 2 }"
              @click="weightDialogValue = weight; weightDialogCount = 2"
            >
              2×{{ weight }}kg
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
  min-width: 0;
  padding: 1.25rem 1.4rem;
}

.metric-card strong {
  font-size: 2rem;
}

.metric-card.active-goal strong {
  font-size: clamp(1.25rem, 4vw, 2rem);
  overflow-wrap: anywhere;
}

.focus-input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font-size: clamp(1.25rem, 4vw, 2rem);
  font-weight: 700;
}

.focus-input:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 3px;
  border-radius: 4px;
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

.draft-exercise.completed {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.draft-exercise.collapsed {
  gap: 0;
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

.exercise-action-icon {
  width: 1.15rem;
  height: 1.15rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.draft-exercise-title,
.round-row label {
  display: grid;
  gap: 0.25rem;
}

.exercise-completed-label {
  justify-self: start;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534 !important;
  font-size: 0.75rem !important;
  font-weight: 600;
}

.draft-exercise-round-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.exercise-completion-button-done {
  background: #dcfce7;
  color: #166534;
}

.exercise-name-with-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.exercise-info-wrap {
  position: relative;
  display: inline-flex;
}

.exercise-info-button {
  display: inline-grid;
  width: 1.15rem;
  height: 1.15rem;
  place-items: center;
  padding: 0;
  border: 1px solid #94a3b8;
  border-radius: 50%;
  background: #fff;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  cursor: help;
}

.exercise-info-button:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.exercise-info-tooltip {
  position: absolute;
  z-index: 5;
  bottom: calc(100% + 0.5rem);
  left: 0;
  width: min(18rem, calc(100vw - 4rem));
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  background: #1e293b;
  color: #fff !important;
  font-size: 0.8rem !important;
  font-weight: 400;
  line-height: 1.45;
  box-shadow: 0 6px 18px rgb(15 23 42 / 20%);
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

.bodyweight-preset {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  justify-content: space-between;
  padding-inline: 0.75rem;
  font-weight: 600;
}

.bodyweight-preset span:last-child {
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
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

.mode-toggle {
  width: 2.75rem;
  min-width: 2.75rem;
  height: 2.75rem;
  padding: 0.45rem;
  color: #475569;
}

.mode-toggle.synchronized {
  border-color: #4f46e5;
  background: #e0e7ff;
  color: #312e81;
}

.mode-toggle.side-alternating {
  border-color: #7c3aed;
  background: #f3e8ff;
  color: #6b21a8;
}

.mode-toggle svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.75;
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

.date-duration-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.duration-inputs,
.duration-inputs > span {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.duration-inputs > span {
  min-width: 0;
}

.duration-inputs input {
  width: 5rem;
  min-width: 0;
}

.duration-inputs small {
  color: #64748b;
  font-weight: 400;
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
  text-align: left;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.workout-item:hover {
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
  padding: 0;
  border: 0;
  background: transparent;
  color: #4f46e5;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.workout-actions {
  flex-direction: row !important;
  align-items: center;
  gap: 0.75rem !important;
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
  grid-template-columns: repeat(auto-fit, minmax(4.5rem, 1fr));
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
    display: flex;
    flex-direction: column;
  }

  .two-column-layout > .panel:nth-child(2) {
    order: -1;
  }

  .workout-item {
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .content {
    padding: 1.25rem 0.85rem 2rem;
  }

  .panel {
    padding: 1rem;
  }

  .date-duration-row {
    grid-template-columns: 1fr;
  }

  .round-row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.45rem;
  }

  .round-row .reps-measurement {
    grid-column: 1 / -1;
  }

  .round-row > .remove-button {
    grid-column: 2;
    grid-row: 1;
  }

  .counter-button {
    width: 2.5rem;
    min-width: 2.5rem;
  }

  .round-row .rep-count-input {
    width: 3.25rem;
    min-width: 3.25rem;
    flex-basis: 3.25rem;
  }
}
</style>

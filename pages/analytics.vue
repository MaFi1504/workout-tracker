<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Exercise, Workout } from '~/composables/useWorkoutStorage'

const { settings, seedExercises, customExercises, workouts } = useWorkoutStorage()

const selectedExerciseId = ref('front-raise')
const rangeMode = ref<'all' | 'week' | 'month' | 'custom'>('all')
const fromDate = ref('')
const toDate = ref('')

const translations = {
  en: {
    title: 'Progress analytics',
    intro: 'Compare your recent work with previous sessions and choose your next challenge.',
    exercise: 'Exercise',
    range: 'Time range',
    allTime: 'All time',
    lastWeek: 'Last 7 days',
    lastMonth: 'Last 30 days',
    customRange: 'Custom range',
    from: 'From',
    to: 'To',
    latest: 'Latest',
    previous: 'Previous',
    bestWeight: 'Best weight',
    bestReps: 'Best reps',
    weightTrend: 'Weight per round',
    repsTrend: 'Reps per round',
    volumeTrend: 'Volume per round',
    noData: 'No recorded rounds match this filter yet.',
    kg: 'kg',
    reps: 'reps',
    volume: 'kg volume'
  },
  de: {
    title: 'Fortschrittsanalyse',
    intro: 'Vergleiche deine aktuellen Leistungen und plane die nächste Herausforderung.',
    exercise: 'Übung',
    range: 'Zeitraum',
    allTime: 'Gesamte Zeit',
    lastWeek: 'Letzte 7 Tage',
    lastMonth: 'Letzte 30 Tage',
    customRange: 'Eigener Zeitraum',
    from: 'Von',
    to: 'Bis',
    latest: 'Letzte Leistung',
    previous: 'Vorherige',
    bestWeight: 'Bestes Gewicht',
    bestReps: 'Beste Wiederholungen',
    weightTrend: 'Gewicht pro Runde',
    repsTrend: 'Wiederholungen pro Runde',
    volumeTrend: 'Volumen pro Runde',
    noData: 'Für diesen Filter gibt es noch keine aufgezeichneten Runden.',
    kg: 'kg',
    reps: 'Wdh.',
    volume: 'kg Volumen'
  }
} as const

const t = computed(() => translations[settings.value.language])
const allExercises = computed(() => [...seedExercises.value, ...customExercises.value])
const selectedExercise = computed<Exercise | undefined>(() => allExercises.value.find((exercise) => exercise.id === selectedExerciseId.value))

const formatDate = (value: string) => new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).format(new Date(`${value}T00:00:00`))

const formatDateTime = (value: string) => new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}).format(new Date(value.includes('T') ? value : `${value}T00:00:00`))

const rangeStart = computed(() => {
  if (rangeMode.value === 'custom') {
    return fromDate.value
  }

  if (rangeMode.value === 'week') {
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  }

  if (rangeMode.value === 'month') {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  }

  return ''
})

const rangeEnd = computed(() => rangeMode.value === 'custom' ? toDate.value : '')

interface HistoryPoint {
  workout: Workout
  date: string
  round: number
  weightKg: number
  reps: number
  volume: number
}

const history = computed<HistoryPoint[]>(() => workouts.value
  .flatMap((workout) => workout.exercises
    .filter((exercise) => exercise.exerciseId === selectedExerciseId.value)
    .flatMap((exercise) => exercise.rounds.map((round) => ({
      workout,
      date: workout.date,
      round: round.round,
      weightKg: round.weightKg,
      reps: round.reps,
      volume: round.weightKg * round.reps
    }))))
  .filter((point) => (!rangeStart.value || point.date >= rangeStart.value) && (!rangeEnd.value || point.date <= rangeEnd.value))
  .sort((left, right) => left.date.localeCompare(right.date) || left.round - right.round))

const latest = computed(() => history.value.at(-1))
const previous = computed(() => history.value.at(-2))
const bestWeight = computed(() => history.value.reduce((best, point) => Math.max(best, point.weightKg), 0))
const bestReps = computed(() => history.value.reduce((best, point) => Math.max(best, point.reps), 0))
const maxWeight = computed(() => Math.max(...history.value.map((point) => point.weightKg), 1))
const maxReps = computed(() => Math.max(...history.value.map((point) => point.reps), 1))
const maxVolume = computed(() => Math.max(...history.value.map((point) => point.volume), 1))

const barHeight = (value: number, max: number) => `${Math.max(6, (value / max) * 100)}%`
</script>

<template>
  <div class="analytics-page">
    <AppHeader active-page="analytics" />

    <main class="analytics-content">
      <div class="page-intro">
        <h2>{{ t.title }}</h2>
        <p>{{ t.intro }}</p>
      </div>

      <section class="analytics-filters panel">
        <label>
          {{ t.exercise }}
          <select v-model="selectedExerciseId">
            <option v-for="exercise in allExercises" :key="exercise.id" :value="exercise.id">
              {{ exercise.name }}
            </option>
          </select>
        </label>
        <label>
          {{ t.range }}
          <select v-model="rangeMode">
            <option value="all">{{ t.allTime }}</option>
            <option value="week">{{ t.lastWeek }}</option>
            <option value="month">{{ t.lastMonth }}</option>
            <option value="custom">{{ t.customRange }}</option>
          </select>
        </label>
        <label v-if="rangeMode === 'custom'">
          {{ t.from }}
          <input v-model="fromDate" type="date" lang="de-DE" />
        </label>
        <label v-if="rangeMode === 'custom'">
          {{ t.to }}
          <input v-model="toDate" type="date" lang="de-DE" />
        </label>
      </section>

      <p v-if="selectedExercise" class="selected-exercise-description">
        <strong>{{ selectedExercise.name }}</strong> · {{ selectedExercise.description }}
      </p>

      <section v-if="history.length" class="summary-grid">
        <article class="summary-card">
          <span>{{ t.latest }}</span>
          <strong>{{ latest?.weightKg }} {{ t.kg }} · {{ latest?.reps }} {{ t.reps }}</strong>
          <small>{{ latest ? formatDateTime(latest.workout.createdAt || latest.date) : '' }}</small>
        </article>
        <article class="summary-card">
          <span>{{ t.previous }}</span>
          <strong>{{ previous?.weightKg || 0 }} {{ t.kg }} · {{ previous?.reps || 0 }} {{ t.reps }}</strong>
          <small>{{ previous ? formatDateTime(previous.workout.createdAt || previous.date) : '-' }}</small>
        </article>
        <article class="summary-card">
          <span>{{ t.bestWeight }}</span>
          <strong>{{ bestWeight }} {{ t.kg }}</strong>
        </article>
        <article class="summary-card">
          <span>{{ t.bestReps }}</span>
          <strong>{{ bestReps }} {{ t.reps }}</strong>
        </article>
      </section>

      <section v-if="history.length" class="charts-grid">
        <article class="chart-panel panel">
          <h3>{{ t.weightTrend }}</h3>
          <div class="bar-chart" aria-label="Weight trend chart">
            <div v-for="point in history" :key="`${point.workout.id}-${point.round}-weight`" class="bar-column">
              <strong class="bar-value">{{ point.weightKg }}</strong>
              <div class="bar-track"><span class="bar weight-bar" :style="{ height: barHeight(point.weightKg, maxWeight) }" /></div>
              <small>{{ formatDate(point.date) }}</small>
            </div>
          </div>
        </article>
        <article class="chart-panel panel">
          <h3>{{ t.repsTrend }}</h3>
          <div class="bar-chart" aria-label="Reps trend chart">
            <div v-for="point in history" :key="`${point.workout.id}-${point.round}-reps`" class="bar-column">
              <strong class="bar-value">{{ point.reps }}</strong>
              <div class="bar-track"><span class="bar reps-bar" :style="{ height: barHeight(point.reps, maxReps) }" /></div>
              <small>{{ formatDate(point.date) }}</small>
            </div>
          </div>
        </article>
        <article class="chart-panel panel chart-wide">
          <h3>{{ t.volumeTrend }}</h3>
          <div class="bar-chart" aria-label="Volume trend chart">
            <div v-for="point in history" :key="`${point.workout.id}-${point.round}-volume`" class="bar-column">
              <strong class="bar-value">{{ point.volume }}</strong>
              <div class="bar-track"><span class="bar volume-bar" :style="{ height: barHeight(point.volume, maxVolume) }" /></div>
              <small>{{ formatDate(point.date) }}</small>
            </div>
          </div>
        </article>
      </section>

      <section v-else class="empty-analytics panel">
        <h3>{{ selectedExercise?.name || t.exercise }}</h3>
        <p>{{ t.noData }}</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.analytics-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #edf4ff 0%, #f8fafc 100%);
}

.analytics-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
}

.page-intro {
  margin-bottom: 1.5rem;
}

.page-intro h2 {
  margin: 0;
  font-size: 1.8rem;
}

.page-intro p,
.selected-exercise-description,
.empty-analytics p {
  margin: 0.4rem 0 0;
  color: #475569;
}

.panel {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-panel);
}

.analytics-filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
  padding: 1.1rem;
}

.analytics-filters label {
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
}

.analytics-filters input,
.analytics-filters select {
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: white;
}

.selected-exercise-description {
  line-height: 1.5;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.summary-card {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-panel);
}

.summary-card span,
.summary-card small {
  color: #64748b;
}

.summary-card strong {
  font-size: 1.15rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.chart-panel {
  min-width: 0;
  padding: 1.1rem;
}

.chart-panel h3 {
  margin: 0 0 1rem;
}

.chart-wide {
  grid-column: 1 / -1;
}

.bar-chart {
  display: flex;
  align-items: end;
  gap: 0.5rem;
  min-height: 14rem;
  overflow-x: auto;
  padding: 1rem 0 0.25rem;
}

.bar-column {
  display: grid;
  flex: 1 0 3.25rem;
  align-content: end;
  justify-items: center;
  gap: 0.35rem;
  min-height: 12rem;
}

.bar-value,
.bar-column small {
  font-size: 0.72rem;
  white-space: nowrap;
}

.bar-column small {
  color: #64748b;
}

.bar-track {
  display: flex;
  align-items: end;
  width: 1.8rem;
  height: 9rem;
  border-radius: 8px 8px 2px 2px;
  background: #eef2f7;
}

.bar {
  display: block;
  width: 100%;
  border-radius: 8px 8px 2px 2px;
}

.weight-bar {
  background: #4f46e5;
}

.reps-bar {
  background: #0f766e;
}

.volume-bar {
  background: #d97706;
}

.empty-analytics {
  margin-top: 1.5rem;
  padding: 2rem;
}

@media (max-width: 820px) {
  .analytics-filters,
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .analytics-filters,
  .summary-grid,
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-wide {
    grid-column: auto;
  }
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Exercise, Workout } from '~/composables/useWorkoutStorage'

const { settings, seedExercises, customExercises, workouts } = useWorkoutStorage()

const selectedExerciseId = ref<'all' | string>('all')
const rangeMode = ref<'all' | 'week' | 'month' | 'custom'>('all')
const fromDate = ref('')
const toDate = ref('')

const translations = {
  en: {
    title: 'Progress analytics',
    intro: 'Review every workout, explore your activity pattern, and compare exercise progress.',
    exercise: 'Exercise',
    allExercises: 'All exercises',
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
    volume: 'kg volume',
    workoutHistory: 'Workout history',
    workouts: 'workouts',
    activity: 'Workout activity',
    noWorkouts: 'No workouts match this time range.',
    selectRange: 'Drag across days to select a time range.'
  },
  de: {
    title: 'Fortschrittsanalyse',
    intro: 'Vergleiche deine aktuellen Leistungen und plane die nächste Herausforderung.',
    exercise: 'Übung',
    allExercises: 'Alle Übungen',
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
    volume: 'kg Volumen',
    workoutHistory: 'Trainingsverlauf',
    workouts: 'Trainingseinheiten',
    activity: 'Trainingsaktivität',
    noWorkouts: 'Keine Trainings in diesem Zeitraum.',
    selectRange: 'Ziehe über Tage, um einen Zeitraum auszuwählen.'
  }
} as const

const t = computed(() => translations[settings.value.language])
const allExercises = computed(() => [...seedExercises.value, ...customExercises.value])
const selectedExercise = computed<Exercise | undefined>(() => selectedExerciseId.value === 'all'
  ? undefined
  : allExercises.value.find((exercise) => exercise.id === selectedExerciseId.value))

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
    .filter((exercise) => selectedExerciseId.value === 'all' || exercise.exerciseId === selectedExerciseId.value)
    .flatMap((exercise) => exercise.rounds.map((round) => ({
      workout,
      date: workout.date,
      round: round.round,
      weightKg: round.weightKg,
      reps: round.reps,
      volume: round.weightKg * (round.weightCount || 1) * round.reps
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

const filteredWorkouts = computed(() => workouts.value
  .filter((workout) => (!rangeStart.value || workout.date >= rangeStart.value) && (!rangeEnd.value || workout.date <= rangeEnd.value))
  .sort((left, right) => right.date.localeCompare(left.date) || (right.createdAt || '').localeCompare(left.createdAt || '')))

const localDateValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const heatmapWeeks = computed(() => {
  const counts = new Map<string, number>()
  workouts.value.forEach((workout) => counts.set(workout.date, (counts.get(workout.date) || 0) + 1))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today)
  const dayOfWeek = end.getDay()
  end.setDate(end.getDate() + (6 - dayOfWeek))
  const start = new Date(end)
  start.setDate(start.getDate() - 364)
  start.setDate(start.getDate() - start.getDay())
  const weeks: Array<Array<{ date: string; count: number }>> = []

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 7)) {
    const week = []
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(cursor)
      date.setDate(cursor.getDate() + day)
      const iso = localDateValue(date)
      const count = counts.get(iso) || 0
      week.push({ date: iso, count, level: Math.min(count, 4), color: ['#eef2f7', '#bbf7d0', '#4ade80', '#16a34a', '#166534'][Math.min(count, 4)] })
    }
    weeks.push(week)
  }

  return weeks
})

const heatmapLabel = (cell: { date: string; count: number }) => `${formatDate(cell.date)}: ${cell.count} ${t.value.workouts}`
const selectedHeatmapDate = ref<string | null>(null)
const heatmapTooltipPosition = ref({ x: 0, y: 0 })
const heatmapDragStart = ref<string | null>(null)
const heatmapDragEnd = ref<string | null>(null)
const isDraggingHeatmap = ref(false)
const workoutsOnDate = (date: string) => workouts.value.filter((workout) => workout.date === date)
const selectedHeatmapWorkouts = computed(() =>
  selectedHeatmapDate.value ? workoutsOnDate(selectedHeatmapDate.value) : []
)
const monthLabel = (week: Array<{ date: string }>, weekIndex: number, weeks: Array<Array<{ date: string }>>) => {
  const currentMonth = week[0]?.date.slice(0, 7)
  const previousMonth = weeks[weekIndex - 1]?.[0]?.date.slice(0, 7)
  if (!currentMonth || currentMonth === previousMonth) return ''

  return new Intl.DateTimeFormat(settings.value.language === 'de' ? 'de-DE' : 'en-US', { month: 'short' })
    .format(new Date(`${currentMonth}-01T00:00:00`))
}

const closeHeatmapTooltip = (date: string) => {
  if (selectedHeatmapDate.value === date) selectedHeatmapDate.value = null
}

const isDateInHeatmapSelection = (date: string) => {
  if (!heatmapDragStart.value || !heatmapDragEnd.value) return false
  const start = heatmapDragStart.value < heatmapDragEnd.value ? heatmapDragStart.value : heatmapDragEnd.value
  const end = heatmapDragStart.value < heatmapDragEnd.value ? heatmapDragEnd.value : heatmapDragStart.value
  return date >= start && date <= end
}

const startHeatmapRange = (date: string, event: PointerEvent) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  isDraggingHeatmap.value = true
  heatmapDragStart.value = date
  heatmapDragEnd.value = date
  selectedHeatmapDate.value = null
}

const extendHeatmapRange = (date: string) => {
  if (isDraggingHeatmap.value) heatmapDragEnd.value = date
}

const finishHeatmapRange = () => {
  if (!isDraggingHeatmap.value || !heatmapDragStart.value || !heatmapDragEnd.value) return
  const start = heatmapDragStart.value < heatmapDragEnd.value ? heatmapDragStart.value : heatmapDragEnd.value
  const end = heatmapDragStart.value < heatmapDragEnd.value ? heatmapDragEnd.value : heatmapDragStart.value
  fromDate.value = start
  toDate.value = end
  rangeMode.value = 'custom'
  isDraggingHeatmap.value = false
}

const showHeatmapTooltip = (date: string, event: MouseEvent) => {
  if (!date) return
  selectedHeatmapDate.value = date
  heatmapTooltipPosition.value = { x: event.clientX, y: event.clientY }
}

const showHeatmapTooltipAtCell = (date: string, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  selectedHeatmapDate.value = date
  heatmapTooltipPosition.value = { x: rect.left + rect.width / 2, y: rect.top }
}
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
            <option value="all">{{ t.allExercises }}</option>
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

      <section class="panel heatmap-panel">
        <div class="section-heading">
          <div>
            <h3>{{ t.activity }}</h3>
            <p>{{ workouts.length }} {{ t.workouts }}</p>
            <small>{{ t.selectRange }}</small>
          </div>
          <div class="heatmap-legend" aria-label="Workout frequency">
            <span>Less</span><i class="heatmap-cell level-0" /><i class="heatmap-cell level-1" /><i class="heatmap-cell level-2" /><i class="heatmap-cell level-3" /><i class="heatmap-cell level-4" /><span>More</span>
          </div>
        </div>
        <ClientOnly>
          <div class="heatmap-scroll">
            <div class="heatmap-with-labels">
              <div class="weekday-labels" aria-hidden="true">
                <span />
                <span>Mon</span>
                <span />
                <span>Wed</span>
                <span />
                <span>Fri</span>
                <span />
              </div>
            <div class="heatmap">
              <div class="heatmap-week" v-for="(week, weekIndex) in heatmapWeeks" :key="weekIndex">
                <span class="heatmap-month-label">{{ monthLabel(week, weekIndex, heatmapWeeks) }}</span>
                <span
                  v-for="cell in week"
                  :key="`${cell.date}-${cell.count}`"
                  class="heatmap-cell-wrapper"
                  @mouseenter="showHeatmapTooltip(cell.date, $event)"
                  @mouseleave="closeHeatmapTooltip(cell.date)"
                  @pointerdown="startHeatmapRange(cell.date, $event)"
                  @pointerenter="extendHeatmapRange(cell.date)"
                  @pointerup="finishHeatmapRange"
                >
                  <button
                    type="button"
                    class="heatmap-cell"
                    :class="[`level-${cell.level}`, { 'range-selected': isDateInHeatmapSelection(cell.date) }]"
                    :style="{ backgroundColor: cell.color }"
                    :aria-label="heatmapLabel(cell)"
                    @focus="showHeatmapTooltipAtCell(cell.date, $event)"
                    @blur="closeHeatmapTooltip(cell.date)"
                    @click="selectedHeatmapDate === cell.date ? closeHeatmapTooltip(cell.date) : showHeatmapTooltipAtCell(cell.date, $event)"
                  />
                </span>
              </div>
            </div>
            </div>
          </div>
        </ClientOnly>
      </section>
      <Teleport to="body">
        <div
          v-if="selectedHeatmapDate"
          class="heatmap-tooltip heatmap-tooltip-overlay"
          :style="{
            left: `clamp(8rem, ${heatmapTooltipPosition.x}px, calc(100vw - 8rem))`,
            top: `clamp(8rem, ${heatmapTooltipPosition.y}px, calc(100vh - 2rem))`
          }"
          role="status"
        >
          <strong>{{ formatDate(selectedHeatmapDate) }}</strong>
          <span v-for="workout in selectedHeatmapWorkouts" :key="workout.id">{{ workout.title }}</span>
        </div>
      </Teleport>

      <section class="panel workout-history">
        <div class="section-heading">
          <h3>{{ t.workoutHistory }}</h3>
          <span>{{ filteredWorkouts.length }} {{ t.workouts }}</span>
        </div>
        <div v-if="filteredWorkouts.length" class="workout-history-list">
          <button
            v-for="workout in filteredWorkouts"
            :key="workout.id"
            type="button"
            class="workout-history-item"
            @click="navigateTo(`/workouts/${workout.id}`)"
          >
            <span>
              <strong>{{ workout.title }}</strong>
              <small>{{ formatDate(workout.date) }} · {{ workout.exercises.length }} {{ t.exercises }}</small>
            </span>
            <strong>{{ workout.exercises.reduce((total, exercise) => total + exercise.rounds.reduce((sum, round) => sum + round.weightKg * (round.weightCount || 1) * round.reps, 0), 0) }} {{ t.kg }}</strong>
          </button>
        </div>
        <p v-else class="empty-analytics">{{ t.noWorkouts }}</p>
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

.heatmap-panel,
.workout-history {
  margin-top: 1.5rem;
  padding: 1.1rem;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-heading h3,
.section-heading p {
  margin: 0;
}

.section-heading p,
.section-heading > span {
  color: #64748b;
}

.heatmap-scroll {
  overflow-x: auto;
  padding: 0 1rem 0.75rem 0.25rem;
  margin-right: -0.25rem;
  scrollbar-gutter: stable;
}

.heatmap {
  display: flex;
  gap: 0.25rem;
  min-width: max-content;
}

.heatmap-with-labels {
  display: flex;
  min-width: max-content;
}

.weekday-labels {
  display: grid;
  grid-template-rows: 1.1rem repeat(7, 0.72rem);
  gap: 0.25rem;
  width: 2.2rem;
  margin-right: 0.35rem;
  color: #64748b;
  font-size: 0.68rem;
  line-height: 0.72rem;
  text-align: right;
}

.heatmap-week {
  display: grid;
  gap: 0.25rem;
  grid-template-rows: 1.1rem repeat(7, 0.72rem);
  position: relative;
}

.heatmap-month-label {
  height: 1.1rem;
  color: #475569;
  font-size: 0.7rem;
  white-space: nowrap;
}

.heatmap-cell-wrapper {
  position: relative;
  display: block;
  width: 0.72rem;
  height: 0.72rem;
}

.heatmap-cell {
  display: block;
  width: 0.72rem;
  height: 0.72rem;
  padding: 0;
  border: 0;
  border-radius: 2px;
  cursor: pointer;
}

.heatmap-cell:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.heatmap-cell.range-selected {
  outline: 2px solid #f59e0b;
  outline-offset: 1px;
}

.heatmap-tooltip {
  display: grid;
  gap: 0.25rem;
  margin-top: 0.9rem;
  width: fit-content;
  max-width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid #334155;
  border-radius: 8px;
  background: #0f172a;
  color: white;
  font-size: 0.75rem;
  line-height: 1.25;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.25);
}

.heatmap-tooltip-overlay {
  position: fixed;
  z-index: 1000;
  margin-top: 0;
  transform: translate(-50%, calc(-100% - 0.75rem));
  pointer-events: none;
}

.heatmap-tooltip span {
  color: #cbd5e1;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
  font-size: 0.75rem;
}

.heatmap-legend .heatmap-cell {
  width: 0.65rem;
  height: 0.65rem;
}

.level-0 { background: #eef2f7; }
.level-1 { background: #bbf7d0; }
.level-2 { background: #4ade80; }
.level-3 { background: #16a34a; }
.level-4 { background: #166534; }

.workout-history-list {
  display: grid;
  gap: 0.55rem;
}

.workout-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #0f172a;
  text-align: left;
}

.workout-history-item:hover,
.workout-history-item:focus-visible {
  background: #e0e7ff;
  outline: 2px solid rgba(79, 70, 229, 0.25);
}

.workout-history-item span {
  display: grid;
  gap: 0.2rem;
}

.workout-history-item small {
  color: #64748b;
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

  .analytics-filters {
    padding-right: 1.5rem;
  }

  .chart-wide {
    grid-column: auto;
  }
}
</style>

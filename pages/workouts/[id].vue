<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { exerciseVolume, roundVolume, workoutVolume } from '~/domain/workout-domain'
import type { RoundEntry, Workout, WorkoutExercise } from '~/composables/useWorkoutStorage'

const route = useRoute()
const { settings, workouts, seedExercises, customExercises, updateWorkout } = useWorkoutStorage()
const workout = computed(() => workouts.value.find((item) => item.id === route.params.id))
const draft = ref<Workout | null>(null)
const editing = ref(false)

const translations = {
  en: { title: 'Workout details', back: 'Back to overview', edit: 'Edit workout', save: 'Save changes', cancel: 'Cancel', stats: 'Workout stats', volume: 'Volume', exercises: 'Exercises', rounds: 'Rounds', reps: 'Reps', weight: 'Weight (kg)', date: 'Date', workoutTitle: 'Workout title', notes: 'Notes', notFound: 'Workout not found.', saved: 'Changes saved.' },
  de: { title: 'Trainingsdetails', back: 'Zur Übersicht', edit: 'Training bearbeiten', save: 'Änderungen speichern', cancel: 'Abbrechen', stats: 'Trainingsstatistik', volume: 'Volumen', exercises: 'Übungen', rounds: 'Runden', reps: 'Wiederholungen', weight: 'Gewicht (kg)', date: 'Datum', workoutTitle: 'Name des Trainings', notes: 'Notizen', notFound: 'Training nicht gefunden.', saved: 'Änderungen gespeichert.' }
} as const
const t = computed(() => translations[settings.value.language])
const availableExercises = computed(() => [...seedExercises.value, ...customExercises.value])
const exerciseName = (id: string) => availableExercises.value.find((item) => item.id === id)?.name || id
const current = computed(() => draft.value || workout.value)
const totalRounds = computed(() => current.value?.exercises.reduce((total, exercise) => total + exercise.rounds.length, 0) || 0)
const totalReps = computed(() => current.value?.exercises.reduce((total, exercise) => total + exercise.rounds.reduce((sum, round) => sum + round.reps, 0), 0) || 0)
const startEdit = () => {
  if (!workout.value) return
  draft.value = {
    ...workout.value,
    exercises: workout.value.exercises.map((exercise) => ({
      ...exercise,
      rounds: exercise.rounds.map((round) => ({ ...round }))
    }))
  }
  editing.value = true
}
const cancelEdit = () => {
  draft.value = null
  editing.value = false
}
const save = () => {
  if (!draft.value || !draft.value.title.trim() || !draft.value.date) return
  updateWorkout(draft.value.id, {
    title: draft.value.title.trim(),
    date: draft.value.date,
    notes: draft.value.notes,
    exercises: draft.value.exercises
  })
  editing.value = false
  draft.value = null
}
const roundLabel = (round: RoundEntry) => `${round.weightKg} kg × ${round.reps}`
</script>

<template>
  <div class="workout-detail-page">
    <AppHeader active-page="overview" />
    <main class="content">
      <div v-if="current" class="detail-shell">
        <div class="page-header">
          <button type="button" class="secondary-button" @click="navigateTo('/')">← {{ t.back }}</button>
          <button v-if="!editing" type="button" class="primary-button" @click="startEdit">{{ t.edit }}</button>
          <div v-else class="header-actions">
            <button type="button" class="secondary-button" @click="cancelEdit">{{ t.cancel }}</button>
            <button type="button" class="primary-button" @click="save">{{ t.save }}</button>
          </div>
        </div>

        <section class="panel heading-panel">
          <template v-if="editing">
            <label>{{ t.workoutTitle }}<input v-model="draft!.title" type="text" /></label>
            <label>{{ t.date }}<input v-model="draft!.date" type="date" /></label>
          </template>
          <template v-else>
            <span class="eyebrow">{{ t.title }}</span>
            <h1>{{ current.title }}</h1>
            <p>{{ current.date }}</p>
          </template>
        </section>

        <section class="stats-grid" :aria-label="t.stats">
          <article class="stat-card"><span>{{ t.volume }}</span><strong>{{ workoutVolume(current) }} kg</strong></article>
          <article class="stat-card"><span>{{ t.exercises }}</span><strong>{{ current.exercises.length }}</strong></article>
          <article class="stat-card"><span>{{ t.rounds }}</span><strong>{{ totalRounds }}</strong></article>
          <article class="stat-card"><span>{{ t.reps }}</span><strong>{{ totalReps }}</strong></article>
        </section>

        <section class="panel">
          <h2>{{ t.exercises }}</h2>
          <div class="exercise-list">
            <article v-for="exercise in current.exercises" :key="exercise.id" class="exercise-card">
              <div class="exercise-header">
                <h3>{{ exerciseName(exercise.exerciseId) }}</h3>
                <strong>{{ exerciseVolume(exercise) }} kg</strong>
              </div>
              <div class="round-list">
                <div v-for="round in exercise.rounds" :key="round.id" class="round-row">
                  <span>{{ round.round }}.</span>
                  <template v-if="editing">
                    <input v-model.number="round.weightKg" type="number" min="0" step="0.5" :aria-label="t.weight" />
                    <span>kg ×</span>
                    <input v-model.number="round.reps" type="number" min="0" step="1" :aria-label="t.reps" />
                    <span>{{ t.reps }}</span>
                  </template>
                  <span v-else>{{ roundLabel(round) }}</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="panel notes-panel">
          <label>{{ t.notes }}<textarea v-if="editing" v-model="draft!.notes" rows="4" /><p v-else>{{ current.notes || '—' }}</p></label>
        </section>
      </div>
      <section v-else class="panel empty-state">{{ t.notFound }}</section>
    </main>
  </div>
</template>

<style scoped>
.workout-detail-page { min-height: 100vh; background: linear-gradient(180deg, #edf4ff 0%, #f8fafc 100%); }
.content { max-width: 1100px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
.detail-shell { display: grid; gap: 1.25rem; }
.page-header, .header-actions, .exercise-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.panel, .stat-card { padding: 1.25rem; border: 1px solid rgba(148,163,184,.2); border-radius: 20px; background: rgba(255,255,255,.92); box-shadow: 0 16px 35px rgba(15,23,42,.06); }
.heading-panel { display: grid; gap: .5rem; }
.heading-panel h1, .panel h2, .exercise-card h3 { margin: 0; }
.heading-panel p, .notes-panel p { margin: 0; color: #64748b; }
.eyebrow { color: #4f46e5; font-weight: 700; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.stat-card { display: grid; gap: .35rem; }
.stat-card span { color: #64748b; font-size: .85rem; }
.stat-card strong { font-size: 1.35rem; }
.exercise-list { display: grid; gap: .75rem; margin-top: 1rem; }
.exercise-card { padding: 1rem; border-radius: 14px; background: #f8fafc; }
.round-list { display: grid; gap: .45rem; margin-top: .75rem; }
.round-row { display: flex; align-items: center; gap: .5rem; color: #475569; }
.round-row input, .heading-panel input, .notes-panel textarea { padding: .55rem .65rem; border: 1px solid #dfe7f5; border-radius: 9px; background: white; }
.round-row input { width: 5rem; }
.heading-panel label, .notes-panel label { display: grid; gap: .35rem; color: #334155; font-weight: 600; }
.notes-panel textarea { resize: vertical; font: inherit; }
.empty-state { color: #64748b; }
@media (max-width: 700px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .page-header { align-items: flex-start; } }
</style>

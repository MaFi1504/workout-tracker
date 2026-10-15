<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  activePage: 'overview' | 'exercises' | 'analytics' | 'tools'
}>()

const { settings, setLanguage } = useWorkoutStorage()

const translations = {
  en: {
    appName: 'Workout Tracker',
    overview: 'Overview',
    exercises: 'Exercises',
    logbook: 'Logbook',
    tools: 'Tools'
  },
  de: {
    appName: 'Workout Tracker',
    overview: 'Übersicht',
    exercises: 'Übungen',
    logbook: 'Protokoll',
    tools: 'Werkzeuge'
  }
} as const

const t = computed(() => translations[settings.value.language])

const selectLanguage = (language: 'en' | 'de') => {
  setLanguage(language)
}
</script>

<template>
  <header class="app-header">
    <h1 class="app-title">{{ t.appName }}</h1>

    <div class="app-language-switcher" role="group" aria-label="Language">
      <button
        type="button"
        class="app-language-option"
        :class="{ active: settings.language === 'en' }"
        :aria-pressed="settings.language === 'en'"
        @click="selectLanguage('en')"
      >
        EN
      </button>
      <button
        type="button"
        class="app-language-option"
        :class="{ active: settings.language === 'de' }"
        :aria-pressed="settings.language === 'de'"
        @click="selectLanguage('de')"
      >
        DE
      </button>
    </div>

    <nav class="app-navigation" aria-label="Main navigation">
      <NuxtLink to="/" class="app-navigation-link" :class="{ active: props.activePage === 'overview' }">
        {{ t.overview }}
      </NuxtLink>
      <NuxtLink to="/exercises" class="app-navigation-link" :class="{ active: props.activePage === 'exercises' }">
        {{ t.exercises }}
      </NuxtLink>
      <NuxtLink to="/analytics" class="app-navigation-link" :class="{ active: props.activePage === 'analytics' }">
        {{ t.logbook }}
      </NuxtLink>
      <NuxtLink to="/tools" class="app-navigation-link" :class="{ active: props.activePage === 'tools' }">
        {{ t.tools }}
      </NuxtLink>
    </nav>
  </header>
</template>

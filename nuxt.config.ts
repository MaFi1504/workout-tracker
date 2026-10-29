// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
      ],
      meta: [
        { name: 'theme-color', content: '#4f46e5' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' }
      ]
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    devOptions: {
      enabled: true
    },
    includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
    manifest: {
      name: 'Workout Tracker',
      short_name: 'Workout Tracker',
      description: 'Record workouts, manage exercises, and track training volume.',
      theme_color: '#4f46e5',
      background_color: '#f8fafc',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      screenshots: [
        {
          src: '/pwa-mobile.png',
          sizes: '390x844',
          type: 'image/png',
          label: 'Workout Tracker on mobile'
        },
        {
          src: '/pwa-desktop.jpg',
          sizes: '1280x800',
          type: 'image/jpeg',
          form_factor: 'wide',
          label: 'Workout Tracker on desktop'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
    }
  },
  compatibilityDate: '2025-07-15',
  future: {
    compatibilityVersion: 4
  },
  devtools: { enabled: true }
})

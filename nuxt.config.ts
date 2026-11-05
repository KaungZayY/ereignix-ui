import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  devServer: { port: 4000 }, // the API runs on 3000
  modules: ['@nuxt/fonts'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  // The API does not enable CORS, so the browser talks to Nuxt and Nuxt proxies to the API.
  routeRules: {
    '/backend/**': { proxy: `${process.env.API_URL ?? 'http://localhost:3000'}/**` },
  },
})

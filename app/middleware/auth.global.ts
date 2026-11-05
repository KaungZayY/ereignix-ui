export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, load } = useAuth()
  if (!loggedIn.value) return to.path === '/login' ? undefined : navigateTo('/login')
  await load()
  if (!loggedIn.value) return navigateTo('/login')
  if (to.path === '/login') return navigateTo('/')
})

<script setup lang="ts">
const { signIn } = useAuth()
const mode = ref<'login' | 'register'>('login')
const form = reactive({ name: '', organizationName: '', email: '', password: '' })
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    const body = mode.value === 'login'
      ? { email: form.email, password: form.password }
      : { ...form }
    await signIn(mode.value, body)
    await navigateTo('/')
  } catch (e) {
    error.value = errMsg(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="mx-auto grid min-h-screen max-w-5xl items-center gap-12 px-5 py-12 md:grid-cols-2">
    <section>
      <h1 class="text-4xl font-semibold leading-tight tracking-tight">Send an event once. Reach every endpoint that cares.</h1>
      <p class="mt-4 max-w-md text-mute">Ereignix signs each delivery and retries failures, so your services stay in sync without custom queue code.</p>
    </section>

    <form class="panel space-y-4 p-6" @submit.prevent="submit">
      <h2 class="text-xl font-semibold">{{ mode === 'login' ? 'Log in' : 'Create your account' }}</h2>
      <template v-if="mode === 'register'">
        <div><label class="label" for="name">Your name</label><input id="name" v-model="form.name" class="input" required minlength="2" /></div>
        <div><label class="label" for="org">Organization name</label><input id="org" v-model="form.organizationName" class="input" required minlength="3" /></div>
      </template>
      <div><label class="label" for="email">Email</label><input id="email" v-model="form.email" type="email" class="input" required autocomplete="email" /></div>
      <div>
        <label class="label" for="pw">Password</label>
        <input id="pw" v-model="form.password" type="password" class="input" required minlength="8" maxlength="64" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" />
        <p v-if="mode === 'register'" class="mt-1 text-xs text-mute">8–64 characters with upper and lower case, a number and a symbol.</p>
      </div>
      <p v-if="error" class="text-sm text-bad" role="alert">{{ error }}</p>
      <button class="btn w-full" :disabled="busy">{{ mode === 'login' ? 'Log in' : 'Create account' }}</button>
      <button type="button" class="w-full text-sm text-mute underline" @click="mode = mode === 'login' ? 'register' : 'login'">
        {{ mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in' }}
      </button>
    </form>
  </main>
</template>

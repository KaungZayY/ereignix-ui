<script setup lang="ts">
const { api, session } = useAuth()
const orgId = computed(() => session.value!.organization.id)
const { data: projects, refresh } = await useAsyncData('projects', () =>
  api<Project[]>(`/organizations/${orgId.value}/projects`), { default: () => [] })

const form = reactive({ name: '', description: '' })
const error = ref('')

async function create() {
  error.value = ''
  try {
    const p = await api<Project>(`/organizations/${orgId.value}/projects`, {
      method: 'POST',
      body: { name: form.name, ...(form.description && { description: form.description }) },
    })
    await navigateTo(`/projects/${p.id}`)
  } catch (e) { error.value = errMsg(e) }
}

async function remove(p: Project) {
  if (!confirm(`Delete "${p.name}" and all its events, keys and endpoints?`)) return
  error.value = ''
  try { await api(`/organizations/${orgId.value}/projects/${p.id}`, { method: 'DELETE' }); await refresh() }
  catch (e) { error.value = errMsg(e) }
}
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-8 px-5 py-8">
    <h1 class="text-2xl font-semibold tracking-tight">Projects</h1>
    <p v-if="error" class="text-sm text-bad" role="alert">{{ error }}</p>

    <ul v-if="projects.length" class="panel divide-y divide-line">
      <li v-for="p in projects" :key="p.id" class="flex items-center justify-between gap-4 p-4">
        <NuxtLink :to="`/projects/${p.id}`" class="min-w-0 flex-1">
          <p class="font-medium">{{ p.name }}</p>
          <p v-if="p.description" class="truncate text-sm text-mute">{{ p.description }}</p>
        </NuxtLink>
        <button class="btn-ghost" @click="remove(p)">Delete</button>
      </li>
    </ul>
    <p v-else class="panel p-6 text-mute">No projects yet. Create one to get an API key and start sending events.</p>

    <form class="panel grid gap-4 p-5 sm:grid-cols-[1fr_2fr_auto] sm:items-end" @submit.prevent="create">
      <div><label class="label" for="pn">Project name</label><input id="pn" v-model="form.name" class="input" required minlength="2" maxlength="100" placeholder="Production" /></div>
      <div><label class="label" for="pd">Description (optional)</label><input id="pd" v-model="form.description" class="input" maxlength="1000" /></div>
      <button class="btn">Create project</button>
    </form>
  </main>
</template>

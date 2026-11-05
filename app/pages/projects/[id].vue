<script setup lang="ts">
const { api, session } = useAuth()
const route = useRoute()
const base = computed(() => `/organizations/${session.value!.organization.id}/projects/${route.params.id}`)

const { data: project } = await useAsyncData(`project-${route.params.id}`, () => api<Project>(base.value))
const { data: keys, refresh: refreshKeys } = await useAsyncData(`keys-${route.params.id}`, () => api<ApiKey[]>(`${base.value}/api-keys`), { default: () => [] })
const { data: endpoints, refresh: refreshEndpoints } = await useAsyncData(`hooks-${route.params.id}`, () => api<WebhookEndpoint[]>(`${base.value}/webhook-endpoints`), { default: () => [] })

const error = ref('')
async function guard(fn: () => Promise<void>) {
  error.value = ''
  try { await fn() } catch (e) { error.value = errMsg(e) }
}
const when = (d: string | null) => (d ? new Date(d).toLocaleString() : 'never')

// Secrets are shown once, right after creation.
const newSecret = ref<{ label: string; value: string } | null>(null)
const copy = (v: string) => navigator.clipboard.writeText(v)

// API keys
const keyName = ref('')
const sendKey = ref('')
const createKey = () => guard(async () => {
  const r = await api<{ secret: string }>(`${base.value}/api-keys`, { method: 'POST', body: { name: keyName.value } })
  newSecret.value = { label: 'API key', value: r.secret }
  sendKey.value = r.secret
  keyName.value = ''
  await refreshKeys()
})
const revokeKey = (k: ApiKey) => confirm(`Revoke "${k.name}"? Apps using it will stop working.`) &&
  guard(async () => { await api(`${base.value}/api-keys/${k.id}`, { method: 'DELETE' }); await refreshKeys() })

// Webhook endpoints
const hook = reactive({ name: '', url: '', eventNames: '' })
const createHook = () => guard(async () => {
  const r = await api<{ secret: string }>(`${base.value}/webhook-endpoints`, {
    method: 'POST',
    body: { name: hook.name, url: hook.url, eventNames: hook.eventNames.split(',').map(s => s.trim()).filter(Boolean) },
  })
  newSecret.value = { label: 'Signing secret', value: r.secret }
  Object.assign(hook, { name: '', url: '', eventNames: '' })
  await refreshEndpoints()
})
const deleteHook = (h: WebhookEndpoint) => confirm(`Delete "${h.name}"?`) &&
  guard(async () => { await api(`${base.value}/webhook-endpoints/${h.id}`, { method: 'DELETE' }); await refreshEndpoints() })

// Send-event console (authenticates with an API key, not the user session)
const evt = reactive({ name: 'order.created', payload: '{\n  "orderId": "order_123",\n  "amount": 99.99\n}', idempotencyKey: '' })
const result = ref('')
const sending = ref(false)
async function send() {
  result.value = ''
  let payload: unknown
  try { payload = JSON.parse(evt.payload) } catch { result.value = 'Payload is not valid JSON.'; return }
  sending.value = true
  try {
    const r = await $fetch.raw('/backend/v1/events', {
      method: 'POST',
      ignoreResponseError: true,
      headers: { 'x-api-key': sendKey.value },
      body: { name: evt.name, payload, ...(evt.idempotencyKey && { idempotencyKey: evt.idempotencyKey }) },
    })
    result.value = `${r.status}\n${JSON.stringify(r._data, null, 2)}`
  } finally { sending.value = false }
}
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-10 px-5 py-8">
    <div>
      <NuxtLink to="/" class="text-sm text-mute underline">All projects</NuxtLink>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight">{{ project?.name }}</h1>
      <p v-if="project?.description" class="text-mute">{{ project.description }}</p>
    </div>

    <p v-if="error" class="text-sm text-bad" role="alert">{{ error }}</p>

    <div v-if="newSecret" class="panel border-signal p-4" role="status">
      <p class="font-medium">Copy your {{ newSecret.label.toLowerCase() }} now. It won't be shown again.</p>
      <div class="mt-2 flex items-center gap-2">
        <code class="min-w-0 flex-1 break-all rounded bg-paper p-2 font-mono text-xs">{{ newSecret.value }}</code>
        <button class="btn-ghost" @click="copy(newSecret.value)">Copy</button>
        <button class="btn-ghost" @click="newSecret = null">Done</button>
      </div>
    </div>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Send a test event</h2>
      <form class="panel grid gap-4 p-5 md:grid-cols-2" @submit.prevent="send">
        <div class="space-y-4">
          <div><label class="label" for="ak">API key</label><input id="ak" v-model="sendKey" type="password" class="input font-mono" required placeholder="evg_live_..." autocomplete="off" /></div>
          <div><label class="label" for="en">Event name</label><input id="en" v-model="evt.name" class="input font-mono" required maxlength="100" /></div>
          <div><label class="label" for="ik">Idempotency key (optional)</label><input id="ik" v-model="evt.idempotencyKey" class="input font-mono" maxlength="255" /></div>
        </div>
        <div class="flex flex-col">
          <label class="label" for="pl">Payload (JSON object)</label>
          <textarea id="pl" v-model="evt.payload" rows="6" required class="input flex-1 font-mono" spellcheck="false" />
        </div>
        <div class="md:col-span-2">
          <button class="btn" :disabled="sending">Send event</button>
          <pre v-if="result" class="mt-4 overflow-x-auto rounded-md bg-ink p-4 font-mono text-xs text-paper">{{ result }}</pre>
        </div>
      </form>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Webhook endpoints</h2>
      <ul v-if="endpoints.length" class="panel divide-y divide-line">
        <li v-for="h in endpoints" :key="h.id" class="flex items-start justify-between gap-4 p-4">
          <div class="min-w-0">
            <p class="font-medium">{{ h.name }} <span v-if="!h.enabled" class="ml-1 text-sm text-bad">disabled</span></p>
            <p class="truncate font-mono text-xs text-mute">{{ h.url }}</p>
            <p class="mt-2 flex flex-wrap gap-1.5">
              <span v-for="n in h.eventNames" :key="n" class="rounded bg-paper px-2 py-0.5 font-mono text-xs">{{ n }}</span>
            </p>
          </div>
          <button class="btn-ghost" @click="deleteHook(h)">Delete</button>
        </li>
      </ul>
      <p v-else class="panel p-5 text-mute">No endpoints yet. Add an HTTPS URL and the event names it should receive.</p>
      <form class="panel grid gap-4 p-5 md:grid-cols-2" @submit.prevent="createHook">
        <div><label class="label" for="hn">Name</label><input id="hn" v-model="hook.name" class="input" required maxlength="100" placeholder="Order notifications" /></div>
        <div><label class="label" for="hu">HTTPS URL</label><input id="hu" v-model="hook.url" type="url" class="input font-mono" required placeholder="https://example.com/webhooks" /></div>
        <div class="md:col-span-2">
          <label class="label" for="he">Event names, separated by commas</label>
          <input id="he" v-model="hook.eventNames" class="input font-mono" required placeholder="order.created, order.cancelled" />
          <p class="mt-1 text-xs text-mute">Names must match exactly. Wildcards aren't supported.</p>
        </div>
        <div><button class="btn">Add endpoint</button></div>
      </form>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">API keys</h2>
      <ul v-if="keys.length" class="panel divide-y divide-line">
        <li v-for="k in keys" :key="k.id" class="flex items-center justify-between gap-4 p-4">
          <div class="min-w-0">
            <p class="font-medium">{{ k.name }} <span v-if="k.revokedAt" class="ml-1 text-sm text-bad">revoked</span></p>
            <p class="truncate font-mono text-xs text-mute">{{ k.keyId }}</p>
            <p class="text-xs text-mute">Created {{ when(k.createdAt) }}. Last used {{ when(k.lastUsedAt) }}.</p>
          </div>
          <button v-if="!k.revokedAt" class="btn-ghost" @click="revokeKey(k)">Revoke</button>
        </li>
      </ul>
      <p v-else class="panel p-5 text-mute">No API keys yet. Create one to send events from your app.</p>
      <form class="panel flex items-end gap-4 p-5" @submit.prevent="createKey">
        <div class="flex-1"><label class="label" for="kn">Key name</label><input id="kn" v-model="keyName" class="input" required minlength="2" maxlength="100" placeholder="Production integration" /></div>
        <button class="btn">Create API key</button>
      </form>
    </section>
  </main>
</template>

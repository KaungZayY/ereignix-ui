<script setup lang="ts">
const { session, logout } = useAuth()
</script>

<template>
  <div class="min-h-screen">
    <header v-if="session" class="border-b border-line bg-white">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <NuxtLink to="/" class="text-lg font-semibold tracking-tight">Ereignix</NuxtLink>
        <div class="flex items-center gap-4 text-sm">
          <span class="hidden font-medium sm:inline">{{ session.organization.name }}</span>
          <span class="hidden text-mute md:inline">{{ session.user.email }}</span>
          <button class="btn-ghost" @click="logout">Log out</button>
        </div>
      </div>
    </header>
    <NuxtPage />
  </div>
</template>

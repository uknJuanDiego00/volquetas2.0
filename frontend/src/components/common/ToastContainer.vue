<template>
  <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    <transition-group
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in store.toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all"
        :class="{
          'bg-emerald-900/90 text-white border-emerald-500/40': toast.type === 'success',
          'bg-rose-900/90 text-white border-rose-500/40': toast.type === 'error',
          'bg-amber-900/90 text-white border-amber-500/40': toast.type === 'warning',
          'bg-slate-900/90 text-white border-slate-700/60': toast.type === 'info'
        }"
      >
        <div class="shrink-0 mt-0.5">
          <span v-if="toast.type === 'success'" class="text-emerald-400 font-bold">✓</span>
          <span v-else-if="toast.type === 'error'" class="text-rose-400 font-bold">✕</span>
          <span v-else-if="toast.type === 'warning'" class="text-amber-400 font-bold">⚠</span>
          <span v-else class="text-sky-400 font-bold">ℹ</span>
        </div>
        <div class="flex-1 text-sm">
          <p class="font-bold tracking-tight">{{ toast.title }}</p>
          <p class="text-xs opacity-90 mt-0.5">{{ toast.message }}</p>
        </div>
        <button
          @click="store.removeToast(toast.id)"
          class="shrink-0 text-white/60 hover:text-white transition text-xs font-semibold px-1"
        >
          ✕
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/useAppStore';

const store = useAppStore();
</script>

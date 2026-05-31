<script setup lang="ts">
import { useCopyPrompt } from '../composables/useCopyPrompt.js'
import type { Preset } from '../types.js'

const props = defineProps<{ preset: Preset | undefined }>()
const { copied, copy } = useCopyPrompt()
</script>

<template>
  <button
    @click="copy(props.preset)"
    :disabled="!props.preset"
    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border disabled:opacity-30 disabled:cursor-not-allowed"
    :class="copied
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 scale-[0.97]'
      : 'bg-white/10 text-white border-white/10 hover:bg-white/15 hover:border-white/20 active:scale-95'"
  >
    <!-- 复制图标 -->
    <svg
      v-if="!copied"
      xmlns="http://www.w3.org/2000/svg"
      class="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>

    <!-- 勾图标 -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      class="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2.5"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>

    <span>{{ copied ? 'Copied!' : 'Copy Prompt' }}</span>
  </button>
</template>

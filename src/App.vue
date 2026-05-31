<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { allProjectsData, navTabs } from './mockData.js'
import type { Field, Section, Preset, GroupData } from './types.js'
import PromptGenerator from './components/PromptGenerator.vue'

// ─── 顶部 Tab 状态 ───────────────────────────────────
const activeTab = ref(navTabs[0]?.id ?? 'interior')

// ─── 当前项目的 GroupData ─────────────────────────────
const currentData = computed<GroupData>(() => {
  const project = allProjectsData[activeTab.value]
  return project?.data ?? { name: '', icon: '', sections: {}, presets: [] }
})

// ─── Preset ───────────────────────────────────────────
const presets = computed<Preset[]>(() => currentData.value.presets ?? [])
const activePresetKey = ref('')
const activePreset = computed<Preset | undefined>(() => {
  const found = presets.value.find(p => p.key === activePresetKey.value)
  return found ?? presets.value[0]
})

// tab 切换时重置 preset
watch(activeTab, () => {
  activePresetKey.value = presets.value[0]?.key ?? ''
})

// ─── Sections（preset 覆盖 > group 默认）─────────────
const activeSections = computed<Record<string, Section>>(() => {
  const preset = activePreset.value
  if (preset?.sections && Object.keys(preset.sections).length) {
    return preset.sections
  }
  return currentData.value.sections ?? {}
})

// ─── 表单数据 ─────────────────────────────────────────
const formData = reactive<Record<string, any>>({})

watch(activeSections, (sections) => {
  for (const key of Object.keys(formData)) delete formData[key]
  for (const section of Object.values(sections)) {
    for (const [key, field] of Object.entries(section.fields)) {
      formData[key] = Array.isArray(field.default) ? [...field.default] : field.default
    }
  }
}, { immediate: true })

// ─── 选项交互 ─────────────────────────────────────────
function isSelected(fieldKey: string, value: string): boolean {
  const val = formData[fieldKey]
  return Array.isArray(val) ? val.includes(value) : val === value
}

function selectOption(fieldKey: string, value: string, fieldType: string) {
  if (fieldType === 'multi-select') {
    const arr: string[] = formData[fieldKey] ?? []
    const idx = arr.indexOf(value)
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(value)
    formData[fieldKey] = [...arr]
  } else {
    formData[fieldKey] = value
  }
}

// ─── JSON 预览 ────────────────────────────────────────
const jsonPreview = computed(() => {
  const out: Record<string, Record<string, any>> = {}
  for (const [sk, section] of Object.entries(activeSections.value)) {
    out[sk] = {}
    for (const [fk, field] of Object.entries(section.fields)) {
      const val = formData[fk] ?? field.default
      if (Array.isArray(val) && val.length === 0) continue
      out[sk][fk] = val
    }
  }
  return JSON.stringify(out, null, 2)
})

// ─── 提示词生成器插入 ─────────────────────────────────
function handlePromptInsert(prompt: string) {
  // 尝试找到场景描述或自定义风格字段并填入
  const descKey = Object.keys(formData).find(k => k.includes('场景描述'))
  const styleKey = Object.keys(formData).find(k => k.includes('自定义风格'))
  if (descKey) {
    formData[descKey] = prompt
  } else if (styleKey) {
    formData[styleKey] = prompt
  }
}

// ─── 复制 ─────────────────────────────────────────────
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function copyJson() {
  try { await navigator.clipboard.writeText(jsonPreview.value) } catch {
    const ta = document.createElement('textarea')
    ta.value = jsonPreview.value
    ta.style.cssText = 'position:fixed;left:-9999px'
    document.body.appendChild(ta); ta.select(); document.execCommand('copy')
    document.body.removeChild(ta)
  }
  if (copyTimer) clearTimeout(copyTimer)
  copied.value = true
  copyTimer = setTimeout(() => { copied.value = false }, 1500)
}
</script>

<template>
  <div class="app-shell">

    <!-- ═══ 顶部分类导航 ═══ -->
    <nav class="top-nav">
      <button
        v-for="tab in navTabs"
        :key="tab.id"
        class="top-tab"
        :class="{ active: tab.id === activeTab }"
        @click="activeTab = tab.id"
      >
        <span class="top-tab-icon">{{ tab.icon }}</span>
        <span>{{ tab.name }}</span>
      </button>
    </nav>

    <!-- ═══ Header ═══ -->
    <header class="app-header">
      <span class="gradient-text header-logo">一术专用 Nanobanana / GPT-image2 AI 提示词生成器</span>
      <span class="header-tagline">{{ currentData.name }} · 适配 Nanobanana / GPT-image2</span>
    </header>

    <!-- ═══ AI 提示词生成器 ═══ -->
    <PromptGenerator @insert="handlePromptInsert" />

    <!-- ═══ Main ═══ -->
    <main class="app-main">

      <!-- ─── 左栏 ─── -->
      <div class="left-panel">

        <!-- Preset 药丸 -->
        <div class="preset-bar">
          <button
            v-for="p in presets" :key="p.key"
            class="preset-pill"
            :class="{ active: p.key === (activePreset?.key ?? '') }"
            @click="activePresetKey = p.key"
          >{{ p.name }}</button>
        </div>

        <!-- 瀑布流表单 -->
        <div class="masonry">
          <template v-for="(section, sectionKey) in activeSections" :key="sectionKey">
            <div class="section-heading">
              <span>{{ section.icon }}</span>
              <span>{{ section.title }}</span>
            </div>

            <div
              v-for="(field, fieldKey) in section.fields"
              :key="fieldKey"
              class="field-card"
            >
              <div class="field-label-row">
                <span class="field-label">{{ field.label }}</span>
                <span v-if="field.description" class="field-info" :title="field.description">ℹ</span>
              </div>
              <div v-if="field.description" class="field-desc">{{ field.description }}</div>
              <div v-if="field.options?.length" class="pill-wrap">
                <button
                  v-for="opt in field.options" :key="opt.value"
                  class="pill"
                  :class="{ active: isSelected(fieldKey as string, opt.value) }"
                  @click="selectOption(fieldKey as string, opt.value, field.type)"
                >{{ opt.label }}</button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- ─── 右栏 ─── -->
      <div class="right-panel">
        <div class="preview-title">JSON 提示词</div>
        <div class="preview-body"><pre>{{ jsonPreview }}</pre></div>
        <div class="preview-footer">
          <button class="copy-btn" :class="{ copied }" @click="copyJson">
            {{ copied ? '✅ 已复制' : '复制JSON' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ─── 壳 ───────────────────────────────────────────── */
.app-shell {
  display: flex; flex-direction: column;
  height: 100vh; width: 95%; margin: 0 auto;
  background: #09090b; color: #f4f4f5;
  overflow-y: auto; overflow-x: hidden;
}

/* ─── 顶部分类导航 ─────────────────────────────────── */
.top-nav {
  display: flex; gap: 6px; padding: 10px 32px;
  background: #0f0f11; border-bottom: 1px solid #27272a;
  flex-shrink: 0; overflow-x: auto;
}
.top-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 10px;
  border: 1px solid transparent;
  background: rgba(255,255,255,0.03);
  color: #a1a1aa; font-size: 0.85rem; font-weight: 500;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.top-tab:hover {
  background: rgba(255,255,255,0.06); color: #e4e4e7;
}
.top-tab.active {
  background: #3b82f6; color: #fff; border-color: #3b82f6;
  box-shadow: 0 0 12px rgba(59,130,246,0.3);
}
.top-tab-icon { font-size: 1rem; }

/* ─── Header ───────────────────────────────────────── */
.app-header {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 14px 32px; flex-shrink: 0;
  background: rgba(9,9,11,0.85); backdrop-filter: blur(12px);
  border-bottom: 1px solid #27272a;
}
.header-logo { font-size: 1.5rem; font-weight: 700; letter-spacing: 0.5px; }
.gradient-text {
  background: linear-gradient(90deg, #FFF16A, #FF4066);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.header-tagline { font-size: 0.8rem; color: #71717a; }

/* ─── Main ─────────────────────────────────────────── */
.app-main {
  display: flex; flex: 1; min-height: 0;
  padding: 20px 32px; gap: 32px;
}

/* ─── 左栏 ─────────────────────────────────────────── */
.left-panel { flex: 1; overflow-y: auto; min-height: 0; padding-right: 8px; }

/* ─── Preset 药丸 ──────────────────────────────────── */
.preset-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.preset-pill {
  padding: 7px 14px; border-radius: 999px;
  border: 1px solid #27272a; background: #18181b;
  color: #a1a1aa; font-size: 0.82rem; cursor: pointer;
  transition: 0.2s; white-space: nowrap;
}
.preset-pill.active {
  background: linear-gradient(90deg, #f472b6, #fb923c);
  border-color: transparent; color: #0c0c0e; font-weight: 600;
}

/* ─── 瀑布流 ───────────────────────────────────────── */
.masonry { columns: 4; column-gap: 14px; }

.section-heading {
  break-inside: avoid; column-span: all;
  font-size: 0.95rem; font-weight: 700;
  margin: 24px 0 12px 0;
  display: flex; align-items: center; gap: 8px;
  color: #e4e4e7; padding-bottom: 8px;
  border-bottom: 1px solid #27272a;
}
.section-heading:first-child { margin-top: 0; }

.field-card {
  break-inside: avoid; margin-bottom: 14px; padding: 14px;
  background: #18181b; border: 1px solid #27272a;
  border-radius: 12px; transition: border-color 0.2s;
}
.field-card:hover { border-color: #3f3f46; }

.field-label-row { display: flex; align-items: center; gap: 5px; margin-bottom: 6px; }
.field-label { font-size: 0.82rem; font-weight: 700; color: #e4e4e7; }
.field-info {
  display: inline-flex; align-items: center; justify-content: center;
  width: 15px; height: 15px; border-radius: 50%;
  background: rgba(255,255,255,0.06); color: #71717a;
  font-size: 9px; cursor: help; flex-shrink: 0;
}
.field-desc {
  font-size: 0.72rem; color: #60a5fa;
  background: rgba(59,130,246,0.08);
  padding: 5px 10px; border-radius: 6px;
  margin-bottom: 10px; line-height: 1.5;
}
.pill-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
.pill {
  padding: 5px 12px; border-radius: 999px;
  border: 1px solid #3f3f46; background: rgba(255,255,255,0.03);
  color: #a1a1aa; font-size: 0.75rem; cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
}
.pill:hover { background: rgba(255,255,255,0.06); border-color: #52525b; color: #e4e4e7; }
.pill.active {
  background: rgba(168,85,247,0.18); border-color: #a855f7;
  color: #d8b4fe; font-weight: 600;
  box-shadow: 0 0 10px rgba(168,85,247,0.25);
}

/* ─── 右栏 ─────────────────────────────────────────── */
.right-panel {
  width: 340px; flex-shrink: 0;
  display: flex; flex-direction: column;
  background: #18181b; border-radius: 16px; border: 1px solid #27272a;
}
.preview-title {
  font-size: 0.95rem; text-align: center; font-weight: 700;
  color: #a1a1aa; letter-spacing: 1px;
  padding: 14px 20px; border-bottom: 1px solid #27272a;
}
.preview-body { flex: 1; padding: 16px; overflow-y: auto; background: #0c0c0e; min-height: 0; }
.preview-body pre {
  margin: 0; font-family: "Menlo", "Consolas", monospace;
  font-size: 0.7rem; color: #a6accd; line-height: 1.6;
  white-space: pre-wrap; word-break: break-all;
}
.preview-footer {
  padding: 12px 20px; border-top: 1px solid #27272a;
  display: flex; justify-content: center;
}
.copy-btn {
  background: rgba(255,255,255,0.05); color: #f4f4f5;
  border: 1px solid #27272a; padding: 7px 18px;
  border-radius: 8px; cursor: pointer; font-size: 0.78rem; transition: 0.2s;
}
.copy-btn:hover { background: rgba(255,255,255,0.1); }
.copy-btn.copied {
  background: rgba(16,185,129,0.15); color: #10b981;
  border-color: rgba(16,185,129,0.3);
}

/* ─── 响应式 ───────────────────────────────────────── */
@media (max-width: 1500px) { .masonry { columns: 3; } }
@media (max-width: 1100px) { .masonry { columns: 2; } }
@media (max-width: 900px) {
  .app-main { flex-direction: column; padding: 12px 14px; gap: 14px; overflow-y: auto; }
  .left-panel { overflow: visible; }
  .right-panel { width: 100%; flex: 0 0 auto; }
  .masonry { columns: 1; }
  .top-nav { padding: 8px 14px; }
  .top-tab { padding: 7px 12px; font-size: 0.8rem; }
}
</style>

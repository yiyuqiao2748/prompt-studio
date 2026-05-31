<script setup lang="ts">
import { ref, computed } from 'vue'

// ─── 展开/收起 ────────────────────────────────────────
const isOpen = ref(true)

// ─── 用户输入 ─────────────────────────────────────────
const userDesc = ref('')

// ─── 快捷选项 ─────────────────────────────────────────
const styleOptions = [
  { value: 'photorealistic', label: '📷 写实摄影' },
  { value: 'cinematic', label: '🎬 电影感' },
  { value: 'concept art', label: '🎨 概念艺术' },
  { value: '3d render', label: '🧊 3D渲染' },
  { value: 'watercolor', label: '🖌 水彩画' },
  { value: 'oil painting', label: '🖼 油画' },
  { value: 'anime', label: '✨ 动漫风' },
  { value: 'minimalist', label: '◻ 极简风' },
]
const selectedStyle = ref('photorealistic')

const moodOptions = [
  { value: 'warm and inviting', label: '☀ 温馨' },
  { value: 'dramatic', label: '⚡ 戏剧性' },
  { value: 'serene', label: '🌊 宁静' },
  { value: 'mysterious', label: '🌙 神秘' },
  { value: 'vibrant', label: '🌈 活力' },
  { value: 'moody', label: '🌧 忧郁' },
]
const selectedMood = ref('warm and inviting')

const lightingOptions = [
  { value: 'natural daylight', label: '☀ 自然光' },
  { value: 'golden hour', label: '🌅 黄金时段' },
  { value: 'studio lighting', label: '💡 影棚光' },
  { value: 'dramatic side lighting', label: '🔦 侧光' },
  { value: 'soft diffused light', label: '☁ 柔光' },
  { value: 'neon glow', label: '💜 霓虹光' },
]
const selectedLighting = ref('natural daylight')

const cameraOptions = [
  { value: 'wide angle 24mm', label: '24mm 广角' },
  { value: 'standard 50mm', label: '50mm 标准' },
  { value: 'portrait 85mm', label: '85mm 人像' },
  { value: 'telephoto 135mm', label: '135mm 长焦' },
  { value: 'aerial drone shot', label: '🚁 航拍' },
  { value: 'close-up macro', label: '🔍 微距' },
]
const selectedCamera = ref('standard 50mm')

const qualityOptions = [
  { value: '8K', label: '8K' },
  { value: '4K', label: '4K' },
  { value: 'HDR', label: 'HDR' },
  { value: 'ultra detailed', label: '超细节' },
]
const selectedQuality = ref<string[]>(['8K', 'ultra detailed'])

function toggleQuality(val: string) {
  const idx = selectedQuality.value.indexOf(val)
  if (idx >= 0) selectedQuality.value.splice(idx, 1)
  else selectedQuality.value.push(val)
}

// ─── 生成提示词 ───────────────────────────────────────
const generatedPrompt = computed(() => {
  if (!userDesc.value.trim()) return ''

  const parts: string[] = []

  // 主描述
  parts.push(userDesc.value.trim())

  // 风格
  if (selectedStyle.value) {
    parts.push(`in ${selectedStyle.value} style`)
  }

  // 光照
  if (selectedLighting.value) {
    parts.push(`lit by ${selectedLighting.value}`)
  }

  // 氛围
  if (selectedMood.value) {
    parts.push(`${selectedMood.value} atmosphere`)
  }

  // 相机
  if (selectedCamera.value) {
    parts.push(`shot with ${selectedCamera.value} lens`)
  }

  // 画质
  if (selectedQuality.value.length) {
    parts.push(selectedQuality.value.join(', '))
  }

  return parts.join(', ')
})

// ─── 复制 ─────────────────────────────────────────────
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function copyPrompt() {
  if (!generatedPrompt.value) return
  try {
    await navigator.clipboard.writeText(generatedPrompt.value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = generatedPrompt.value
    ta.style.cssText = 'position:fixed;left:-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  if (copyTimer) clearTimeout(copyTimer)
  copied.value = true
  copyTimer = setTimeout(() => { copied.value = false }, 1500)
}

// ─── 插入到 JSON 预览 ─────────────────────────────────
const emit = defineEmits<{ (e: 'insert', prompt: string): void }>()

function insertToPrompt() {
  if (generatedPrompt.value) {
    emit('insert', generatedPrompt.value)
  }
}
</script>

<template>
  <div class="prompt-gen-wrapper">
    <!-- 折叠头 -->
    <button class="prompt-gen-header" @click="isOpen = !isOpen">
      <div class="prompt-gen-title">
        <span class="prompt-gen-icon">🤖</span>
        <span class="prompt-gen-label">Nanobanana / GPT-image2 专用提示词生成器</span>
        <span class="prompt-gen-badge">AI Prompt</span>
      </div>
      <span class="prompt-gen-chevron" :class="{ open: isOpen }">▸</span>
    </button>

    <!-- 展开内容 -->
    <Transition name="slide">
      <div v-show="isOpen" class="prompt-gen-body">
        <!-- 输入区 -->
        <div class="pg-input-row">
          <textarea
            v-model="userDesc"
            class="pg-textarea"
            placeholder="描述你想要的画面，例如：一间现代简约风格的客厅，大落地窗外是城市夜景，暖色灯光氛围..."
            rows="3"
          />
        </div>

        <!-- 快捷选项网格 -->
        <div class="pg-options-grid">
          <!-- 风格 -->
          <div class="pg-opt-group">
            <div class="pg-opt-label">🎨 画面风格</div>
            <div class="pg-pills">
              <button
                v-for="opt in styleOptions" :key="opt.value"
                class="pg-pill"
                :class="{ active: selectedStyle === opt.value }"
                @click="selectedStyle = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- 光照 -->
          <div class="pg-opt-group">
            <div class="pg-opt-label">💡 光照条件</div>
            <div class="pg-pills">
              <button
                v-for="opt in lightingOptions" :key="opt.value"
                class="pg-pill"
                :class="{ active: selectedLighting === opt.value }"
                @click="selectedLighting = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- 氛围 -->
          <div class="pg-opt-group">
            <div class="pg-opt-label">🌈 画面氛围</div>
            <div class="pg-pills">
              <button
                v-for="opt in moodOptions" :key="opt.value"
                class="pg-pill"
                :class="{ active: selectedMood === opt.value }"
                @click="selectedMood = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- 镜头 -->
          <div class="pg-opt-group">
            <div class="pg-opt-label">📷 镜头焦段</div>
            <div class="pg-pills">
              <button
                v-for="opt in cameraOptions" :key="opt.value"
                class="pg-pill"
                :class="{ active: selectedCamera === opt.value }"
                @click="selectedCamera = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- 画质 -->
          <div class="pg-opt-group">
            <div class="pg-opt-label">✨ 画质增强</div>
            <div class="pg-pills">
              <button
                v-for="opt in qualityOptions" :key="opt.value"
                class="pg-pill"
                :class="{ active: selectedQuality.includes(opt.value) }"
                @click="toggleQuality(opt.value)"
              >{{ opt.label }}</button>
            </div>
          </div>
        </div>

        <!-- 生成结果 -->
        <div v-if="generatedPrompt" class="pg-result">
          <div class="pg-result-header">
            <span class="pg-result-label">📝 生成的提示词</span>
            <div class="pg-result-actions">
              <button class="pg-action-btn" @click="copyPrompt">
                {{ copied ? '✅ 已复制' : '📋 复制' }}
              </button>
              <button class="pg-action-btn primary" @click="insertToPrompt">
                ⬇ 插入到配置
              </button>
            </div>
          </div>
          <div class="pg-result-text">{{ generatedPrompt }}</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ─── 包裹 ──────────────────────────────────────────── */
.prompt-gen-wrapper {
  margin: 16px 32px 0;
  background: linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.08));
  border: 1px solid rgba(168,85,247,0.25);
  border-radius: 16px;
  overflow: hidden;
}

/* ─── 头部 ──────────────────────────────────────────── */
.prompt-gen-header {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 14px 20px;
  background: transparent; border: none; cursor: pointer;
  color: #f4f4f5; transition: background 0.2s;
}
.prompt-gen-header:hover { background: rgba(255,255,255,0.04); }

.prompt-gen-title { display: flex; align-items: center; gap: 10px; }
.prompt-gen-icon { font-size: 1.3rem; }
.prompt-gen-label { font-size: 0.95rem; font-weight: 700; color: #e4e4e7; }
.prompt-gen-badge {
  padding: 2px 10px; border-radius: 999px; font-size: 0.65rem; font-weight: 700;
  background: linear-gradient(90deg, #a855f7, #3b82f6);
  color: #fff; letter-spacing: 0.5px;
}
.prompt-gen-chevron {
  font-size: 1rem; color: #71717a; transition: transform 0.3s;
}
.prompt-gen-chevron.open { transform: rotate(90deg); }

/* ─── 内容体 ────────────────────────────────────────── */
.prompt-gen-body { padding: 0 20px 20px; }

/* ─── 输入区 ────────────────────────────────────────── */
.pg-input-row { margin-bottom: 16px; }
.pg-textarea {
  width: 100%; resize: vertical;
  background: rgba(0,0,0,0.3); border: 1px solid #3f3f46;
  border-radius: 12px; padding: 14px 16px;
  color: #f4f4f5; font-size: 0.88rem; line-height: 1.6;
  font-family: inherit; transition: border-color 0.2s;
  box-sizing: border-box;
}
.pg-textarea::placeholder { color: #52525b; }
.pg-textarea:focus { outline: none; border-color: #a855f7; }

/* ─── 选项网格 ──────────────────────────────────────── */
.pg-options-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 14px; margin-bottom: 16px;
}

.pg-opt-group { }
.pg-opt-label {
  font-size: 0.75rem; font-weight: 600; color: #a1a1aa;
  margin-bottom: 8px; letter-spacing: 0.3px;
}
.pg-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.pg-pill {
  padding: 5px 12px; border-radius: 999px;
  border: 1px solid #3f3f46; background: rgba(255,255,255,0.03);
  color: #a1a1aa; font-size: 0.72rem; cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
}
.pg-pill:hover { background: rgba(255,255,255,0.06); border-color: #52525b; color: #e4e4e7; }
.pg-pill.active {
  background: rgba(168,85,247,0.18); border-color: #a855f7;
  color: #d8b4fe; font-weight: 600;
  box-shadow: 0 0 10px rgba(168,85,247,0.25);
}

/* ─── 生成结果 ──────────────────────────────────────── */
.pg-result {
  background: rgba(0,0,0,0.35); border: 1px solid #3f3f46;
  border-radius: 12px; overflow: hidden;
}
.pg-result-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; border-bottom: 1px solid #27272a;
  background: rgba(255,255,255,0.02);
}
.pg-result-label { font-size: 0.78rem; font-weight: 600; color: #a1a1aa; }
.pg-result-actions { display: flex; gap: 8px; }
.pg-action-btn {
  padding: 5px 14px; border-radius: 8px;
  border: 1px solid #3f3f46; background: rgba(255,255,255,0.05);
  color: #e4e4e7; font-size: 0.72rem; cursor: pointer;
  transition: all 0.2s;
}
.pg-action-btn:hover { background: rgba(255,255,255,0.1); }
.pg-action-btn.primary {
  background: linear-gradient(90deg, #a855f7, #3b82f6);
  border-color: transparent; color: #fff; font-weight: 600;
}
.pg-action-btn.primary:hover { opacity: 0.9; }

.pg-result-text {
  padding: 16px; font-size: 0.82rem; line-height: 1.7;
  color: #d4d4d8; font-family: "Menlo", "Consolas", monospace;
  white-space: pre-wrap; word-break: break-word;
}

/* ─── 过渡动画 ──────────────────────────────────────── */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
  max-height: 800px;
  overflow: hidden;
}
.slide-enter-from, .slide-leave-to {
  max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0;
}

/* ─── 响应式 ────────────────────────────────────────── */
@media (max-width: 900px) {
  .prompt-gen-wrapper { margin: 12px 14px 0; }
  .pg-options-grid { grid-template-columns: 1fr; }
}
</style>

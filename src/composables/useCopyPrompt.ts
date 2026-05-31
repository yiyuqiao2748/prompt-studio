import { ref } from 'vue'
import type { Preset } from '../types.js'

/**
 * 将 Preset 所有字段拼接为可直接使用的提示词文本
 */
function buildPromptText(preset: Preset): string {
  const blocks: string[] = []

  for (const [sectionKey, section] of Object.entries(preset.sections)) {
    const lines: string[] = []

    for (const [fieldKey, field] of Object.entries(section.fields)) {
      const label = field.label ?? fieldKey
      let value: string

      if (field.type === 'multi-select') {
        value = (field.default as string[]).join('、')
      } else if (field.type === 'switch') {
        value = field.default ? '是' : '否'
      } else {
        value = String(field.default ?? '')
      }

      if (value) {
        lines.push(`${label}：${value}`)
      }
    }

    if (lines.length) {
      blocks.push(`【${section.title ?? sectionKey}】\n${lines.join('\n')}`)
    }
  }

  return blocks.join('\n\n')
}

/**
 * 复制提示词组合式 API
 */
export function useCopyPrompt() {
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  async function copy(preset: Preset | undefined) {
    if (!preset) return

    const text = buildPromptText(preset)

    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;left:-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }

    // 反馈
    if (timer) clearTimeout(timer)
    copied.value = true
    timer = setTimeout(() => { copied.value = false }, 1500)
  }

  return { copied, copy }
}

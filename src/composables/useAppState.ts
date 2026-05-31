import { reactive, readonly, watch } from 'vue'
import type { AppState } from '../types.js'

// ─── 默认值 ────────────────────────────────────────────
const DEFAULTS: AppState = {
  project: 'xiangjiao',
  group: 'interior',
  preset: 'default',
}

// ─── 从 URL 读取 ──────────────────────────────────────
function readFromUrl(): AppState {
  const p = new URLSearchParams(window.location.search)
  return {
    project: p.get('project') ?? DEFAULTS.project,
    group:   p.get('group')   ?? DEFAULTS.group,
    preset:  p.get('preset')  ?? DEFAULTS.preset,
  }
}

// ─── 写入 URL（replaceState）──────────────────────────
function writeToUrl(s: AppState) {
  const p = new URLSearchParams({ project: s.project, group: s.group, preset: s.preset })
  history.replaceState(null, '', `${location.pathname}?${p}`)
}

// ─── 响应式状态 ────────────────────────────────────────
const _state = reactive<AppState>(readFromUrl())

// 首次同步 URL
writeToUrl(_state)

// 监听 popstate（浏览器前进/后退）
window.addEventListener('popstate', () => {
  const url = readFromUrl()
  _state.project = url.project
  _state.group   = url.group
  _state.preset  = url.preset
})

// 状态变化时同步 URL
watch(
  () => ({ ..._state }),
  (s) => writeToUrl(s),
  { deep: true },
)

// ─── 公开 API ──────────────────────────────────────────

/** 只读全局状态 */
export const appState = readonly(_state)

/** 切换组（preset 重置为 default） */
export function changeGroup(group: string) {
  if (group === _state.group) return
  _state.group = group
  _state.preset = 'default'
}

/** 切换预设 */
export function changePreset(preset: string) {
  if (preset === _state.preset) return
  _state.preset = preset
}

/** 切换项目（group/preset 重置） */
export function changeProject(project: string, defaultGroup = 'interior') {
  if (project === _state.project) return
  _state.project = project
  _state.group = defaultGroup
  _state.preset = 'default'
}

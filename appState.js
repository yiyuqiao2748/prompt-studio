/**
 * appState.js — URL 参数驱动的全局状态管理
 *
 * URL 格式: ?project=xiangjiao&group=室内设计&preset=default
 *
 * 用法:
 *   import { state, changeGroup, changePreset, changeProject, onStateChange } from './appState.js'
 *
 *   // 读取当前状态
 *   console.log(state.project, state.group, state.preset)
 *
 *   // 监听变化
 *   const unsub = onStateChange((newState, oldState, changedKey) => { ... })
 *
 *   // 更新（自动同步 URL，不刷新页面）
 *   changeGroup('建筑设计')
 *   changePreset('luxury')
 *   changeProject('xiangjiao')
 */

// ─── 默认值 ────────────────────────────────────────────
const DEFAULTS = {
  project: 'xiangjiao',
  group: '室内设计',
  preset: 'default',
};

// ─── 内部状态（响应式 Proxy 包装）──────────────────────
const _raw = { ...DEFAULTS };
const _listeners = new Set();

/**
 * 只读响应式状态对象（Proxy）
 * 外部可直接读取 state.project / state.group / state.preset
 * 不可直接赋值，必须通过 changeXxx() 方法修改
 */
export const state = new Proxy(_raw, {
  set() {
    console.warn('[appState] 请使用 changeGroup/changePreset/changeProject 修改状态，不要直接赋值');
    return false;
  },
});

// ─── URL 同步 ──────────────────────────────────────────

/** 从 URL 参数解析状态，合并默认值 */
function readFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    project: params.get('project') || DEFAULTS.project,
    group:   params.get('group')   || DEFAULTS.group,
    preset:  params.get('preset')  || DEFAULTS.preset,
  };
}

/** 将当前状态写入 URL（replaceState，不产生历史记录） */
function writeToUrl() {
  const params = new URLSearchParams();
  params.set('project', _raw.project);
  params.set('group', _raw.group);
  params.set('preset', _raw.preset);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', newUrl);
}

/** pushState 版本 —— 产生浏览器历史记录（用于需要后退的场景） */
function pushToUrl() {
  const params = new URLSearchParams();
  params.set('project', _raw.project);
  params.set('group', _raw.group);
  params.set('preset', _raw.preset);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState(null, '', newUrl);
}

// ─── 通知监听器 ────────────────────────────────────────

function notify(changedKey, usePush = false) {
  const snapshot = { ..._raw };

  // 同步 URL
  if (usePush) {
    pushToUrl();
  } else {
    writeToUrl();
  }

  // 通知所有监听器
  for (const fn of _listeners) {
    try {
      fn(snapshot, changedKey);
    } catch (e) {
      console.error('[appState] listener error:', e);
    }
  }
}

// ─── 公开修改方法 ──────────────────────────────────────

/**
 * 切换项目（同时重置 group 和 preset 为该项目的默认值）
 * @param {string} project
 * @param {string} [defaultGroup]
 * @param {string} [defaultPreset]
 */
export function changeProject(project, defaultGroup, defaultPreset) {
  if (project === _raw.project) return;
  _raw.project = project;
  _raw.group = defaultGroup || DEFAULTS.group;
  _raw.preset = defaultPreset || DEFAULTS.preset;
  notify('project', true);
}

/**
 * 切换分组（重置 preset 为该组的默认值）
 * @param {string} group
 * @param {string} [defaultPreset='default']
 */
export function changeGroup(group, defaultPreset = 'default') {
  if (group === _raw.group) return;
  _raw.group = group;
  _raw.preset = defaultPreset;
  notify('group', true);
}

/**
 * 切换预设
 * @param {string} preset
 */
export function changePreset(preset) {
  if (preset === _raw.preset) return;
  _raw.preset = preset;
  notify('preset');
}

/**
 * 批量更新（单次通知）
 * @param {Partial<{project: string, group: string, preset: string}>} patch
 */
export function patchState(patch) {
  let changed = false;
  for (const key of ['project', 'group', 'preset']) {
    if (patch[key] !== undefined && patch[key] !== _raw[key]) {
      _raw[key] = patch[key];
      changed = true;
    }
  }
  if (changed) notify('batch');
}

// ─── 监听器 ────────────────────────────────────────────

/**
 * 注册状态变化监听器
 * @param {(state: object, changedKey: string) => void} fn
 * @returns {() => void} 取消监听函数
 */
export function onStateChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ─── 浏览器前进/后退 ──────────────────────────────────

window.addEventListener('popstate', () => {
  const urlState = readFromUrl();
  let changed = false;
  for (const key of ['project', 'group', 'preset']) {
    if (urlState[key] !== _raw[key]) {
      _raw[key] = urlState[key];
      changed = true;
    }
  }
  if (changed) notify('popstate');
});

// ─── 初始化：从 URL 读取 ──────────────────────────────

(function init() {
  const urlState = readFromUrl();
  Object.assign(_raw, urlState);
  // 首次加载不产生历史记录，只 replaceState 确保 URL 干净
  writeToUrl();
  console.log('[appState] initialized:', { ..._raw });
})();

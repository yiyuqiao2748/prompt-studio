/**
 * configLoader.js — 配置加载器
 *
 * 根据 appState 的 project/group/preset 从 configData 中解析出当前表单 schema
 *
 * 用法:
 *   import { getCurrentSchema, getCurrentPreset, getPresetsForGroup, getGroups } from './configLoader.js'
 *
 *   const schema = getCurrentSchema()   // 当前预设的 sections
 *   const preset = getCurrentPreset()   // 当前预设对象 { key, name, sections }
 *   const presets = getPresetsForGroup() // 当前组的所有预设
 *   const groups = getGroups()          // 所有组的 key 列表
 */

import { state } from './appState.js';

// ─── configData 注册表 ────────────────────────────────
// 项目名 → 配置数据（后续可从远程加载）
const configRegistry = {};

/**
 * 注册项目配置
 * @param {string} projectName
 * @param {object} configData
 */
export function registerConfig(projectName, configData) {
  configRegistry[projectName] = configData;
}

/**
 * 获取当前项目的完整配置
 * @returns {object|null}
 */
export function getProjectConfig() {
  return configRegistry[state.project] || null;
}

/**
 * 获取当前组的所有预设列表
 * @returns {Array<{key: string, name: string, sections?: object}>}
 */
export function getPresetsForGroup() {
  const config = getProjectConfig();
  if (!config) return [];
  const group = config[state.group];
  return group?.presets || [];
}

/**
 * 获取当前预设对象
 * @returns {{key: string, name: string, sections?: object}|null}
 */
export function getCurrentPreset() {
  const presets = getPresetsForGroup();
  return presets.find(p => p.key === state.preset) || presets[0] || null;
}

/**
 * 获取当前预设的 sections（表单 schema）
 * @returns {object} sections 对象，key 是 sectionKey，value 是 { icon, title, fields }
 */
export function getCurrentSchema() {
  const preset = getCurrentPreset();
  if (preset?.sections && Object.keys(preset.sections).length) {
    return preset.sections;
  }
  // fallback 到 group 的默认 sections
  const config = getProjectConfig();
  const group = config?.[state.group];
  return group?.sections || {};
}

/**
 * 获取当前项目的所有组 key 列表
 * @returns {string[]}
 */
export function getGroups() {
  const config = getProjectConfig();
  if (!config) return [];
  return Object.keys(config);
}

/**
 * 获取组的元信息（icon, name, hasWeather）
 * @param {string} groupKey
 * @returns {{icon: string, name: string, hasWeather?: boolean}|null}
 */
export function getGroupMeta(groupKey) {
  const config = getProjectConfig();
  if (!config) return null;
  const group = config[groupKey || state.group];
  if (!group) return null;
  return {
    icon: group.icon || '',
    name: group.name || groupKey,
    hasWeather: !!group.hasWeather,
  };
}

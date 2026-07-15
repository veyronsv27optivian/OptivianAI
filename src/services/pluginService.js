/** Plugin Ecosystem Service — Phase 9E Item 125 */

const STORAGE_KEY = 'optivian_plugins';

function devGet() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function devSet(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const BUILT_IN_PLUGINS = [
  { id: 'plugin-email', name: 'Email Integration', description: 'Send and receive emails through the platform', version: '1.0.0', author: 'OptivianAI', enabled: true, builtIn: true, icon: 'mail' },
  { id: 'plugin-calendar', name: 'Calendar Sync', description: 'Sync tasks and events with external calendars', version: '1.0.0', author: 'OptivianAI', enabled: true, builtIn: true, icon: 'calendar' },
  { id: 'plugin-slack', name: 'Slack Integration', description: 'Connect with Slack channels and send notifications', version: '1.0.0', author: 'OptivianAI', enabled: false, builtIn: true, icon: 'message-square' },
  { id: 'plugin-google', name: 'Google Workspace', description: 'Integrate with Google Drive, Docs, and Sheets', version: '1.0.0', author: 'OptivianAI', enabled: false, builtIn: true, icon: 'globe' },
  { id: 'plugin-webhooks', name: 'Webhook Notifications', description: 'Send webhook events to external services', version: '1.0.0', author: 'OptivianAI', enabled: false, builtIn: true, icon: 'webhook' },
  { id: 'plugin-export', name: 'Advanced Data Export', description: 'Export data to CSV, Excel, PDF, and JSON formats', version: '1.0.0', author: 'OptivianAI', enabled: true, builtIn: true, icon: 'download' },
];

export function getInstalledPlugins() {
  const stored = devGet();
  const installedIds = new Set(stored.map(s => s.id));
  return [
    ...BUILT_IN_PLUGINS.filter(p => p.builtIn),
    ...stored.filter(s => !installedIds.has(s.id) && s.installed),
  ];
}

export function getAvailablePlugins() {
  return getInstalledPlugins();
}

export function togglePlugin(pluginId, enabled) {
  const plugins = devGet();
  const existing = plugins.find(p => p.id === pluginId);
  if (existing) {
    existing.enabled = enabled;
  } else {
    const builtIn = BUILT_IN_PLUGINS.find(p => p.id === pluginId);
    if (builtIn) {
      builtIn.enabled = enabled;
    }
    plugins.push({ id: pluginId, enabled, installed: true, installedAt: new Date().toISOString() });
  }
  devSet(plugins);
}

export function isPluginEnabled(pluginId) {
  const builtIn = BUILT_IN_PLUGINS.find(p => p.id === pluginId);
  if (builtIn) return builtIn.enabled;
  const stored = devGet();
  return stored.find(p => p.id === pluginId)?.enabled || false;
}

export function getPluginConfig(pluginId) {
  try {
    return JSON.parse(localStorage.getItem(`optivian_plugin_config_${pluginId}`) || '{}');
  } catch { return {}; }
}

export function savePluginConfig(pluginId, config) {
  localStorage.setItem(`optivian_plugin_config_${pluginId}`, JSON.stringify(config));
}

export { BUILT_IN_PLUGINS };

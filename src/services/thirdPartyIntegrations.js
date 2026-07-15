/** Third-Party Integrations Service — Phase 9E Item 126 */

const STORAGE_KEY = 'optivian_integrations';

function devGet() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function devSet(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const INTEGRATION_DEFS = [
  {
    id: 'slack', name: 'Slack', description: 'Send notifications and receive commands from Slack',
    category: 'Communication', icon: 'message-square', color: '#4A154B',
    docs: 'https://api.slack.com/apps', config: { webhookUrl: '', channel: '#general', notifyOn: ['task_assigned', 'mention', 'announcement'] },
  },
  {
    id: 'google_drive', name: 'Google Drive', description: 'Access and sync files from Google Drive',
    category: 'Productivity', icon: 'folder', color: '#4285F4',
    docs: 'https://developers.google.com/drive', config: { folderId: '', autoSync: false },
  },
  {
    id: 'google_calendar', name: 'Google Calendar', description: 'Sync tasks and events with Google Calendar',
    category: 'Productivity', icon: 'calendar', color: '#34A853',
    docs: 'https://developers.google.com/calendar', config: { calendarId: 'primary', syncDirection: 'both' },
  },
  {
    id: 'microsoft_teams', name: 'Microsoft Teams', description: 'Post updates and alerts to Teams channels',
    category: 'Communication', icon: 'message-square', color: '#6264A7',
    docs: 'https://learn.microsoft.com/en-us/microsoftteams/platform/', config: { webhookUrl: '', channel: 'General' },
  },
  {
    id: 'salesforce', name: 'Salesforce', description: 'Sync contacts, leads, and opportunities',
    category: 'CRM', icon: 'target', color: '#00A1E0',
    docs: 'https://developer.salesforce.com/docs', config: { instanceUrl: '', apiVersion: 'v58.0' },
  },
  {
    id: 'zapier', name: 'Zapier', description: 'Connect with 5000+ apps via Zapier webhooks',
    category: 'Automation', icon: 'zap', color: '#FF4A00',
    docs: 'https://developer.zapier.com/', config: { webhookUrl: '', triggerEvents: ['task_created', 'task_completed'] },
  },
];

export function getIntegrationDefs() {
  return INTEGRATION_DEFS;
}

export function getConnectedIntegrations() {
  return devGet().filter(i => i.connected);
}

export function getIntegrationStatus(integrationId) {
  return devGet().find(i => i.id === integrationId) || { id: integrationId, connected: false };
}

export async function connectIntegration(integrationId, config) {
  const integrations = devGet();
  const existing = integrations.findIndex(i => i.id === integrationId);
  const entry = { id: integrationId, connected: true, config, connectedAt: new Date().toISOString() };
  if (existing >= 0) integrations[existing] = entry;
  else integrations.push(entry);
  devSet(integrations);
  return entry;
}

export async function disconnectIntegration(integrationId) {
  const integrations = devGet().filter(i => i.id !== integrationId);
  devSet(integrations);
}

export async function updateIntegrationConfig(integrationId, config) {
  const integrations = devGet();
  const existing = integrations.find(i => i.id === integrationId);
  if (existing) {
    existing.config = config;
    devSet(integrations);
    return existing;
  }
  return connectIntegration(integrationId, config);
}

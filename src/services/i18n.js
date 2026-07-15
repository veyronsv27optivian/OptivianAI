/**
 * i18n Internationalization Scaffolding — Phase 7 Item 73
 *
 * Minimal i18n system. No external library — uses a simple t() function
 * with JSON translation files. Swap to react-i18next when needed.
 */

const STORAGE_KEY = 'optivian_language';

const translations = {
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      noData: 'No data available',
      retry: 'Retry',
      comingSoon: 'Coming Soon',
    },
    nav: {
      dashboard: 'Dashboard',
      users: 'Users',
      tasks: 'Tasks',
      chat: 'Chat',
      ai: 'AI Platform',
      settings: 'Settings',
      admin: 'Admin',
      organization: 'Organization',
    },
    dashboard: {
      title: 'Dashboard',
      executiveStats: 'Executive Statistics',
      advancedAnalytics: 'Advanced Analytics',
      taskCenter: 'Task Center',
      notifications: 'Notifications',
      quickActions: 'Quick Actions',
      aiInsights: 'AI Insights',
    },
    tasks: {
      title: 'Tasks',
      myTasks: 'My Tasks',
      newTask: 'New Task',
      editTask: 'Edit Task',
      deleteTask: 'Delete Task',
      search: 'Search tasks...',
      noTasks: 'No tasks found',
      status: 'Status',
      priority: 'Priority',
      assignee: 'Assignee',
      dueDate: 'Due Date',
      overdue: 'Overdue',
      attachments: 'Attachments',
      comments: 'Comments',
    },
    ai: {
      platform: 'AI Platform',
      tools: 'AI Tools',
      settings: 'AI Settings',
      history: 'AI History',
      providers: 'Providers',
      templates: 'Templates',
    },
    settings: {
      title: 'Settings',
      profile: 'Profile',
      password: 'Password',
      organization: 'Organization',
      notifications: 'Notifications',
      sessions: 'Sessions',
    },
  },
};

let currentLang = localStorage.getItem(STORAGE_KEY) || 'en';

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
  }
}

export function getLanguage() {
  return currentLang;
}

export function getAvailableLanguages() {
  return Object.keys(translations);
}

export function t(key, fallback = key) {
  const keys = key.split('.');
  let val = translations[currentLang];
  for (const k of keys) {
    if (val && typeof val === 'object') val = val[k];
    else return fallback;
  }
  return typeof val === 'string' ? val : fallback;
}

export function addTranslation(lang, data) {
  if (!translations[lang]) translations[lang] = {};
  Object.assign(translations[lang], data);
}

// Expose for adding more translations at runtime
export { translations };

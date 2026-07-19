import { useState, useEffect } from 'react';
import {
  Bell, BellRing, BellOff, Mail, Moon, Sun, Save, Loader2,
  Check, X,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import { getPrefs, savePrefs, NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } from '../../services/notificationPreferencesService';
import { useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationPreferences({ onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getPrefs(user.id).then(data => {
      setPrefs(data);
      setLoading(false);
    });
  }, [user]);

  const toggleTypeChannel = (typeId, channel) => {
    setPrefs(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [typeId]: { ...prev.types[typeId], [channel]: !prev.types[typeId]?.[channel] },
      },
    }));
  };

  const toggleChannel = (channel) => {
    setPrefs(prev => ({
      ...prev,
      channels: { ...prev.channels, [channel]: !prev.channels[channel] },
    }));
  };

  const handleSave = async () => {
    if (!user || !prefs) return;
    setSaving(true);
    setError('');
    const result = await savePrefs(user.id, prefs);
    if (result.error) setError(result.error);
    else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <Card variant="default" padding="p-5">
      <CardHeader title="Notification Preferences" subtitle="Control how and when you receive notifications"
        icon={Bell} color="primary" action={
          <button onClick={onClose || (() => navigate('/app/settings'))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all">
            <X size={16} />
          </button>
        }
      />

      {/* Channel Toggles */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Notification Channels</h4>
        <div className="flex gap-4">
          {NOTIFICATION_CHANNELS.map(ch => (
            <button key={ch} onClick={() => toggleChannel(ch)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                prefs?.channels?.[ch]
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              {ch === 'in_app' ? <Bell size={16} /> : <Mail size={16} />}
              {ch === 'in_app' ? 'In-App' : 'Email'}
              {prefs?.channels?.[ch] ? <Check size={14} className="text-blue-600 dark:text-blue-400" /> : <X size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Type Toggles */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Notification Types</h4>
        <div className="space-y-2">
          {NOTIFICATION_TYPES.map(nt => (
            <div key={nt.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{nt.label}</p>
                <p className="text-xs text-slate-400">{nt.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {NOTIFICATION_CHANNELS.map(ch => (
                  <button key={ch} onClick={() => toggleTypeChannel(nt.id, ch)}
                    disabled={!prefs?.channels?.[ch]}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      prefs?.types?.[nt.id]?.[ch]
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600/50'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {ch === 'in_app' ? 'App' : 'Email'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Quiet Hours</h4>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={prefs?.quietHours?.enabled || false}
              onChange={() => setPrefs(prev => ({ ...prev, quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled } }))}
              className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Enable quiet hours</span>
          </label>
          {prefs?.quietHours?.enabled && (
            <div className="flex items-center gap-2">
              <input type="time" value={prefs.quietHours.start || '22:00'}
                onChange={(e) => setPrefs(prev => ({ ...prev, quietHours: { ...prev.quietHours, start: e.target.value } }))}
                className="px-2 py-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded text-sm"
              />
              <span className="text-slate-400">to</span>
              <input type="time" value={prefs.quietHours.end || '07:00'}
                onChange={(e) => setPrefs(prev => ({ ...prev, quietHours: { ...prev.quietHours, end: e.target.value } }))}
                className="px-2 py-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50">
        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
      </button>
    </Card>
  );
}

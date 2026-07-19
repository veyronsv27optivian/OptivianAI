import { useState, useRef, useEffect } from 'react';
import {
  Settings as SettingsIcon, User, Building2, Key,
  Save, LogOut, Eye, EyeOff, Check, AlertCircle, Camera,
  Smartphone, Briefcase, Shield, Mail, Clock, History,
  Monitor, Globe, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  ShieldCheck, Bell, BellOff, MessageSquare, AtSign, CheckSquare,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getRoleInfo } from '../../services/auth/roles';
import { getLoginHistory, getLoginHistoryStats } from '../../services/loginHistoryService';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import MfaSetup from './MfaSetup';
import SessionsPage from './SessionsPage';

export default function Settings() {
  const { user, profile, signOut, isDevMode, updatePassword, updateProfile, uploadAvatar } = useAuth();
  const location = useLocation();
  const avatarInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Allow direct navigation: /app/settings/login-history → login-history tab
    if (location.pathname.includes('/login-history')) return 'login-history';
    return 'profile';
  });

  // Profile state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const toast = useToast();

  // Sync from profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '');
      setPhone(profile.phone || '');
      setDesignation(profile.designation || '');
      setAvatarUrl(profile.avatar_url || user?.user_metadata?.avatar_url || '');
    }
  }, [profile, user]);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await updatePassword({
        password: newPassword,
        metadata: { temp_password: false },
      });
      if (error) throw error;
      setPasswordSuccess('Password updated successfully!');
      toast({ type: 'success', title: 'Password updated', message: 'Your password has been changed successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
      toast({ type: 'error', title: 'Password failed', message: err.message || 'Failed to update password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaveError('');
    setSaving(true);
    try {
      const { error } = await updateProfile({
        full_name: fullName,
        phone,
        designation,
      });
      if (error) throw error;
      setSaved(true);
      toast({ type: 'success', title: 'Profile saved', message: 'Your profile has been updated successfully.' });
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile');
      toast({ type: 'error', title: 'Save failed', message: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { data, error } = await uploadAvatar(file);
      if (error) throw error;
      setAvatarUrl(data.url);
      toast({ type: 'success', title: 'Avatar updated', message: 'Profile picture changed successfully.' });
    } catch (err) {
      setSaveError(err.message || 'Failed to upload avatar');
      toast({ type: 'error', title: 'Upload failed', message: err.message || 'Failed to upload avatar' });
    }
    setUploadingAvatar(false);
    e.target.value = '';
  };

  const userRole = profile?.role || user?.user_metadata?.role || 'staff';
  const roleInfo = getRoleInfo(userRole);
  const displayName = profile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Password', icon: Key },
    { id: '2fa', label: 'Two-Factor Auth', icon: ShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'sessions', label: 'Sessions', icon: Monitor },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'login-history', label: 'Login History', icon: History },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar tabs */}
        <div className="lg:w-48 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={18} className={activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                {tab.label}
              </button>
            );
          })}
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6">
          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar section */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-700/50">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-lg object-cover ring-2 ring-slate-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-blue-600 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-slate-100">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                    title="Change photo"
                  >
                    {uploadingAvatar ? (
                      <div className="w-3 h-3 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                    ) : (
                      <Camera size={13} />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{displayName}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium ${roleInfo.bg} ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                    {isDevMode && (
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded font-medium">Dev Mode</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-slate-400 dark:text-slate-500" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-slate-400 dark:text-slate-500" />
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="e.g. Senior Developer"
                  />
                </div>
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">{saveError}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {saved ? 'Saved!' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Password Tab ── */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Change Password</h2>                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your password regularly to keep your account secure.</p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pr-12 pl-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      placeholder="At least 6 characters"
                      minLength={6}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pr-12 pl-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      placeholder="Re-enter new password"
                      minLength={6}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                    <p className="text-sm text-red-700">{passwordError}</p>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-700">{passwordSuccess}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordLoading || !newPassword || !confirmPassword || newPassword.length < 6}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key size={16} />
                      Update Password
                    </>
                  )}
                </button>
              </form>

              {/* Security info */}                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50">
                <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <Shield size={20} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Security Tips</h4>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      <li>• Use a unique password that you don't use elsewhere</li>
                      <li>• Combine uppercase, lowercase, numbers, and symbols</li>
                      <li>• Change your password every 90 days</li>
                      <li>• Enable two-factor authentication when available</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Organization Tab ── */}
          {activeTab === 'organization' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Organization Info</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your organization details and membership.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Role</label>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${roleInfo.bg} ${roleInfo.color}`}>
                    {roleInfo.label}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Provider</label>
                  <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-400 capitalize">
                    {profile?.provider || user?.app_metadata?.provider || 'email'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <Clock size={14} className="inline mr-1" />
                    Last Login
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-400">
                    {profile?.last_login ? new Date(profile.last_login).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <Mail size={14} className="inline mr-1" />
                    Member Since
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-slate-50 text-sm text-slate-600">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── 2FA Tab ── */}
          {activeTab === '2fa' && <MfaSetup />}

          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && <NotificationPreferences />}

          {/* ── Sessions Tab (Item 67) ── */}
          {activeTab === 'sessions' && <SessionsPage />}

          {/* ── Login History Tab ── */}
          {activeTab === 'login-history' && <LoginHistoryView userId={user?.id} />}
        </div>
      </div>
    </div>
  );
}

// ─── Notification Preferences Component (Item 54) ─────────────────
function NotificationPreferences() {
  const { user, updateProfile } = useAuth();
  const NOTIF_KEY = 'optivian_notification_prefs';

  const defaultPrefs = {
    email_notifications: true,
    in_app_notifications: true,
    task_assigned: true,
    task_due_soon: true,
    task_overdue: true,
    chat_messages: true,
    ai_reports: false,
    daily_digest: false,
    weekly_digest: false,
    mentions_only: false,
  };

  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIF_KEY);
      return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
    } catch {
      return defaultPrefs;
    }
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const togglePref = (key) => {
    setPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    const { error } = await updateProfile({ notification_preferences: prefs });
    if (!error) {
      setSaved(true);
      toast({ type: 'success', title: 'Preferences saved', message: 'Notification preferences updated.' });
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const toggleGroups = [
    {
      title: 'Delivery Method',
      items: [
        { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email', icon: Mail },
        { key: 'in_app_notifications', label: 'In-App Notifications', desc: 'Show notifications in the app', icon: Bell },
      ],
    },
    {
      title: 'Task Notifications',
      items: [
        { key: 'task_assigned', label: 'Task Assigned', desc: 'When a task is assigned to you', icon: CheckSquare },
        { key: 'task_due_soon', label: 'Due Date Reminders', desc: 'Reminders before a task is due', icon: Clock },
        { key: 'task_overdue', label: 'Overdue Alerts', desc: 'When a task becomes overdue', icon: AlertTriangle },
      ],
    },
    {
      title: 'Communication',
      items: [
        { key: 'chat_messages', label: 'Chat Messages', desc: 'New messages in conversations', icon: MessageSquare },
        { key: 'mentions_only', label: 'Mentions Only', desc: 'Only notify when you are @mentioned', icon: AtSign },
      ],
    },
    {
      title: 'AI & Reports',
      items: [
        { key: 'ai_reports', label: 'AI Report Ready', desc: 'When an AI analysis report is ready', icon: Shield },
        { key: 'daily_digest', label: 'Daily Digest Email', desc: 'Daily summary of tasks due, overdue, and unread messages', icon: Mail },
        { key: 'weekly_digest', label: 'Weekly Digest', desc: 'Weekly summary of activity', icon: RefreshCw },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notification Preferences</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Choose what notifications you receive and how.
        </p>
      </div>

      {toggleGroups.map((group) => (
        <div key={group.title}>
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            {group.title}
          </h3>
          <div className="space-y-2">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isOn = prefs[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => togglePref(item.key)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border transition-all ${
                    isOn
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    isOn ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${isOn ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{item.desc}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-all relative ${
                    isOn ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                      isOn ? 'left-[18px]' : 'left-0.5'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700/50">
        <button
          onClick={() => {
            setPrefs(defaultPrefs);
            localStorage.setItem(NOTIF_KEY, JSON.stringify(defaultPrefs));
          }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saved ? 'Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

// ─── Login History View Component ────────────────────────────────
function LoginHistoryView({ userId }) {
  const [loginHistory, setLoginHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0, uniqueProviders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const [history, historyStats] = await Promise.all([
        getLoginHistory(userId),
        getLoginHistoryStats(userId),
      ]);
      setLoginHistory(history);
      setStats(historyStats);
    } catch (err) {
      setError('Failed to load login history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userId]);

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const formatUserAgent = (ua) => {
    if (!ua) return 'Unknown device';
    // Extract browser name from user agent string
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Linux')) return 'Linux';
    return ua.length > 30 ? ua.substring(0, 30) + '...' : ua;
  };

  const providerColors = {
    email: { bg: 'bg-blue-100', text: 'text-blue-700' },
    google: { bg: 'bg-red-100', text: 'text-red-700' },
    github: { bg: 'bg-slate-100', text: 'text-slate-700' },

  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Login History</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Recent login attempts and activity for your account.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">Total Logins</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-emerald-700">{stats.successful}</p>
          <p className="text-xs text-emerald-600 mt-1">Successful</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
          <p className="text-xs text-red-600 mt-1">Failed</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-700">{stats.uniqueProviders.length}</p>
          <p className="text-xs text-blue-600 mt-1">Providers</p>
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Showing {loginHistory.length} of {stats.total} login events
        </p>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && loginHistory.length === 0 && (
        <div className="text-center py-12">
          <History size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No login history yet</p>
          <p className="text-sm text-slate-400 mt-1">Login events will appear here after you sign in.</p>
        </div>
      )}

      {/* Login history table */}
      {!loading && loginHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
            {/* Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
              <div className="sm:col-span-3">Date & Time</div>
              <div className="sm:col-span-2">Provider</div>
              <div className="sm:col-span-2">IP Address</div>
              <div className="sm:col-span-3">Device</div>
              <div className="sm:col-span-2 text-right">Status</div>
            </div>

            {loginHistory.map((entry) => {
              const providerStyle = providerColors[entry.provider] || { bg: 'bg-slate-100', text: 'text-slate-700' };
              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center"
                >
                  {/* Date & Time */}
                  <div className="sm:col-span-3">
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(entry.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Provider */}
                  <div className="sm:col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${providerStyle.bg} ${providerStyle.text}`}>
                      <Globe size={12} />
                      <span className="capitalize">{entry.provider}</span>
                    </span>
                  </div>

                  {/* IP Address */}
                  <div className="sm:col-span-2">
                    <p className="text-sm text-slate-700 font-mono text-xs">
                      {entry.ip_address || '—'}
                    </p>
                  </div>

                  {/* Device / User Agent */}
                  <div className="sm:col-span-3">
                    <p className="text-sm text-slate-700 truncate" title={entry.user_agent || ''}>
                      <Monitor size={14} className="inline mr-1 text-slate-400" />
                      {formatUserAgent(entry.user_agent)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-2 text-right">
                    {entry.success ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">
                        <CheckCircle size={12} />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2.5 py-1 rounded-lg font-medium" title={entry.failure_reason || ''}>
                        <XCircle size={12} />
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer note */}
      {!loading && loginHistory.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Login history is retained for 90 days. Contact your admin for older records.
        </p>
      )}
    </div>
  );
}

import { useState } from 'react';
import {
  Settings as SettingsIcon, User, Building2, Bell, Shield,
  Key, Save, LogOut, Eye, EyeOff, Check, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, signOut, isDevMode, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleLogout = async () => {
    await signOut();
    navigate('/onboarding');
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
      // In dev mode, we skip the current password check and just update
      const { error } = await updatePassword({
        password: newPassword,
        metadata: { temp_password: false },
      });
      if (error) throw error;
      setPasswordSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const userRole = user?.user_metadata?.role || 'staff';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Password', icon: Key },
    { id: 'organization', label: 'Organization', icon: Building2 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar tabs */}
        <div className="lg:w-48 space-y-1 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
          <div className="pt-4 mt-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/25">
                  {user?.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {user?.email?.split('@')[0] || 'User'}
                  </h2>
                  <p className="text-sm text-slate-400">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-medium ${
                      userRole === 'admin' ? 'text-blue-400 bg-blue-500/10' :
                      userRole === 'manager' ? 'text-violet-400 bg-violet-500/10' :
                      'text-emerald-400 bg-emerald-500/10'
                    }`}>
                      {userRole}
                    </span>
                    {isDevMode && (
                      <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-medium">Dev Mode</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    defaultValue={user?.email?.split('@')[0] || ''}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 text-sm"
                >
                  <Save size={16} />
                  {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Change Password</h2>
              <p className="text-sm text-slate-400">Update your password regularly to keep your account secure.</p>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key size={16} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all text-sm"
                      placeholder="At least 6 characters"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key size={16} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all text-sm"
                      placeholder="Re-enter new password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                    <p className="text-sm text-red-400">{passwordError}</p>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <p className="text-sm text-emerald-400">{passwordSuccess}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordLoading || !newPassword || !confirmPassword || newPassword.length < 6}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Organization Settings</h2>
              <p className="text-sm text-slate-400">Organization details and branding will be configurable here.</p>
              <div className="p-8 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                <Building2 size={36} className="text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Organization management coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

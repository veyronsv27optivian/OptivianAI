import { useState, useEffect, useRef } from 'react';
import {
  Building2, Save, X, Check, AlertCircle, Camera, Globe, MapPin,
  Users as UsersIcon, Clock, Hash, Link, Upload, Trash2,
  AlertTriangle, Plus,
} from 'lucide-react';

// Social brand icons — not available in lucide-react
function Instagram({ size = 24, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function Twitter({ size = 24, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4l16 16" />
      <path d="M20 4l-16 16" />
    </svg>
  );
}
function Linkedin({ size = 24, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
import { useAuth } from '../../services/AuthContext';
import { getOrganization, updateOrganization, deleteOrganization, createBranch, updateBranch, deleteBranch, getBranches } from '../../services/organizationService';

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Real Estate', 'Media & Entertainment', 'Energy', 'Agriculture',
  'Transportation', 'Hospitality', 'Consulting', 'Legal', 'Non-profit',
  'Government', 'Telecommunications', 'Other',
];

const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+',
];

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
  'Australia/Sydney', 'Pacific/Auckland',
];

export default function OrganizationProfile() {
  const { user, profile } = useAuth();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const logoInputRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    type: '',
    description: '',
    website: '',
    industry: '',
    companySize: '',
    timezone: 'UTC',
    address: '',
    logoUrl: '',
    instagram: '',
    twitter: '',
    telegram: '',
    linkedin: '',
  });

  // Branch form state
  const [branchForm, setBranchForm] = useState({
    name: '', address: '', city: '', state: '', country: '',
    phone: '', email: '', isHeadquarters: false,
  });

  const orgId = profile?.organization_id || user?.user_metadata?.organization_id;

  useEffect(() => {
    if (orgId) loadOrg();
    else setLoading(false);
  }, [orgId]);

  const loadOrg = async () => {
    setLoading(true);
    try {
      const data = await getOrganization(user, orgId);
      if (data) {
        setOrg(data);
        setForm({
          name: data.name || '',
          type: data.type || '',
          description: data.description || '',
          website: data.website || '',
          industry: data.industry || '',
          companySize: data.company_size || '',
          timezone: data.timezone || 'UTC',
          address: data.address || '',
          logoUrl: data.logo_url || '',
          instagram: data.socials?.instagram || '',
          twitter: data.socials?.twitter || '',
          telegram: data.socials?.telegram || '',
          linkedin: data.socials?.linkedin || '',
        });
      }
      const b = await getBranches(user, orgId);
      setBranches(b || []);
    } catch (err) {
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const { error: err } = await updateOrganization(user, orgId, form);
      if (err) throw new Error(err.message);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadOrg();
    } catch (err) {
      setError(err.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    setSaving(true);
    try {
      const { error: err } = await deleteOrganization(user, orgId);
      if (err) throw new Error(err.message);
      setShowDeleteConfirm(false);
      window.location.href = '/onboarding';
    } catch (err) {
      setError(err.message || 'Failed to delete organization');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { error: err } = await createBranch(user, orgId, branchForm);
      if (err) throw new Error(err.message);
      setShowBranchModal(false);
      setBranchForm({ name: '', address: '', city: '', state: '', country: '', phone: '', email: '', isHeadquarters: false });
      const b = await getBranches(user, orgId);
      setBranches(b || []);
    } catch (err) {
      setError(err.message || 'Failed to create branch');
    }
  };

  const handleDeleteBranch = async (branchId) => {
    if (!confirm('Remove this branch?')) return;
    const { error: err } = await deleteBranch(user, orgId, branchId);
    if (err) { setError(err.message); return; }
    const b = await getBranches(user, orgId);
    setBranches(b || []);
  };

  if (!loading && !orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No Organization Found</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-md text-center">
          You haven't created or joined an organization yet. Create one to manage your profile and settings.
        </p>
        <button
          onClick={() => window.location.href = '/create-organization'}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all"
        >
          Create Organization
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading organization...</p>
        </div>
      </div>
    );
  }

  const isOwner = org?.owner_id === user?.id;
  const isAdmin = ['super_admin', 'owner', 'administrator'].includes(profile?.role || 'staff');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Organization Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your organization details and settings</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <Check size={16} />
              Saved
            </span>
          )}
          {isOwner && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-all"
            >
              <Trash2 size={16} />
              Delete Org
            </button>
          )}
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
            Save Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700"><X size={16} /></button>
        </div>
      )}

      {/* Organization Info Card */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-700/50">
          <div className="relative shrink-0">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Org logo" className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-100" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {(org?.name || 'O').charAt(0).toUpperCase()}
              </div>
            )}
            {isAdmin && (
              <button
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
              >
                <Camera size={13} />
              </button>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setForm(prev => ({ ...prev, logoUrl: ev.target?.result }));
              reader.readAsDataURL(file);
              e.target.value = '';
            }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{org?.name || 'Organization'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{org?.type || 'No type specified'}</p>
            {org?.memberCount != null && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                <UsersIcon size={12} className="inline mr-1" />
                {org.memberCount} members · {org.activeMemberCount} active
              </p>
            )}
          </div>
        </div>

        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Organization Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!isAdmin} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Organization Type</label>
            <input type="text" value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!isAdmin} placeholder="e.g. Tech Startup" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Globe size={14} className="text-slate-400" /> Industry
            </label>
            <select value={form.industry} onChange={(e) => setForm(f => ({ ...f, industry: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!isAdmin}>
              <option value="">Select industry...</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UsersIcon size={14} className="text-slate-400" /> Company Size
            </label>
            <select value={form.companySize} onChange={(e) => setForm(f => ({ ...f, companySize: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!isAdmin}>
              {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" /> Time Zone
            </label>
            <select value={form.timezone} onChange={(e) => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!isAdmin}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-400" /> Address
            </label>
            <input type="text" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!isAdmin} placeholder="123 Main St, City, Country" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            disabled={!isAdmin} placeholder="Describe your organization..." />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Link size={14} className="text-slate-400" /> Website
          </label>
          <input type="text" value={form.website} onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={!isAdmin} placeholder="https://example.com" />
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Globe size={18} className="text-blue-600" />
          Social Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Instagram size={14} className="text-pink-500" /> Instagram
            </label>
            <input type="text" value={form.instagram} onChange={(e) => setForm(f => ({ ...f, instagram: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!isAdmin} placeholder="@yourcompany" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Twitter size={14} className="text-blue-400" /> Twitter / X
            </label>
            <input type="text" value={form.twitter} onChange={(e) => setForm(f => ({ ...f, twitter: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!isAdmin} placeholder="@yourcompany" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Hash size={14} className="text-sky-500" /> Telegram
            </label>
            <input type="text" value={form.telegram} onChange={(e) => setForm(f => ({ ...f, telegram: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!isAdmin} placeholder="@yourcompany" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Linkedin size={14} className="text-blue-700" /> LinkedIn
            </label>
            <input type="text" value={form.linkedin} onChange={(e) => setForm(f => ({ ...f, linkedin: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!isAdmin} placeholder="https://linkedin.com/company/yourcompany" />
          </div>
        </div>
      </div>

      {/* Branch Offices */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Building2 size={18} className="text-amber-600" />
            Branch Offices
          </h3>
          {isAdmin && (
            <button onClick={() => setShowBranchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-all">
              <Plus size={16} />
              Add Branch
            </button>
          )}
        </div>
        {branches.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No branch offices configured. Add your first branch.</p>
        ) : (
          <div className="space-y-2">
            {branches.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 dark:border-slate-700/30 hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">{b.name}</h4>
                    {b.is_headquarters && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">HQ</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {[b.address, b.city, b.state, b.country].filter(Boolean).join(', ') || 'No address'}
                  </p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDeleteBranch(b.id)}
                    className="p-1.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700/50">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Add Branch Office</h2>
              <button onClick={() => setShowBranchModal(false)} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddBranch} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch Name *</label>
                  <input type="text" required value={branchForm.name} onChange={(e) => setBranchForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. New York Office" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                  <input type="text" value={branchForm.address} onChange={(e) => setBranchForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                  <input type="text" value={branchForm.city} onChange={(e) => setBranchForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                  <input type="text" value={branchForm.state} onChange={(e) => setBranchForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
                  <input type="text" value={branchForm.country} onChange={(e) => setBranchForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                  <input type="tel" value={branchForm.phone} onChange={(e) => setBranchForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={branchForm.isHeadquarters} onChange={(e) => setBranchForm(f => ({ ...f, isHeadquarters: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">This is the headquarters</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowBranchModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 text-sm font-medium transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">
                  Add Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 rounded-lg shadow-lg">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete Organization?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
                This will permanently delete <strong>{org?.name}</strong> and all associated data.
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 text-sm font-medium transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all disabled:opacity-50">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete Organization'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

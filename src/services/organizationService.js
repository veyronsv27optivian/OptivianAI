/**
 * ─── Organization Service ─────────────────────────────────────────
 * Enterprise-grade organization management with:
 * - Full CRUD (create, read, update, delete)
 * - Branch office management
 * - Department & team management
 * - Activity logging
 * - Analytics snapshots
 * - Health scores
 * - Multi-org support
 * ================================================================
 * Follows the existing DEV_MODE + Supabase pattern used across
 * authService.js, taskService.js, chatService.js, etc.
 */

import { supabase } from './supabase';
import { createNotification } from './notificationService';

// ─── DEV_MODE Helpers ────────────────────────────────────────────
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '';
const DEV_ORGS_KEY = 'optivian_dev_orgs';
const DEV_PROFILES_KEY = 'optivian_dev_profiles';
const DEV_BRANCHES_KEY = 'optivian_dev_branches';
const DEV_DEPARTMENTS_KEY = 'optivian_dev_departments';
const DEV_TEAMS_KEY = 'optivian_dev_teams';
const DEV_ACTIVITY_KEY = 'optivian_dev_org_activity';

function devGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

function devSet(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── ───────────────────────────────────────────────────────────────────
//   ORGANIZATION CRUD
// ───────────────────────────────────────────────────────────────────────

/**
 * Get all organizations for the current user.
 * In production, this returns the user's own organization + any they belong to.
 */
export async function getOrganizations(user) {
  if (!user) return [];

  if (DEV_MODE) {
    const profiles = devGet(DEV_PROFILES_KEY);
    const myProfile = profiles.find(p => p.user_id === user.id);
    const orgs = devGet(DEV_ORGS_KEY);
    
    let accessible = [];
    if (myProfile?.organization_id) {
      const myOrg = orgs.find(o => o.id === myProfile.organization_id);
      if (myOrg) accessible.push(myOrg);
    }
    // Also include orgs the user owns
    const owned = orgs.filter(o => o.owner_id === user.id);
    for (const o of owned) {
      if (!accessible.find(a => a.id === o.id)) accessible.push(o);
    }
    return accessible;
  }

  try {
    // Get org user owns
    const { data: ownedOrgs } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)
      .is('deleted_at', null);

    // Get org user is a member of
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    let memberOrg = null;
    if (profile?.organization_id) {
      const { data: mo } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .is('deleted_at', null)
        .single();
      memberOrg = mo;
    }

    const all = [...(ownedOrgs || [])];
    if (memberOrg && !all.find(o => o.id === memberOrg.id)) {
      all.push(memberOrg);
    }
    return all;
  } catch (err) {
    console.error('Failed to fetch organizations:', err);
    return [];
  }
}

/**
 * Get a single organization by ID with full details.
 */
export async function getOrganization(user, orgId) {
  if (!user || !orgId) return null;

  if (DEV_MODE) {
    const orgs = devGet(DEV_ORGS_KEY);
    const org = orgs.find(o => o.id === orgId);
    if (!org) return null;

    // Enrich with stats
    const profiles = devGet(DEV_PROFILES_KEY);
    const members = profiles.filter(p => p.organization_id === orgId);
    const branches = devGet(DEV_BRANCHES_KEY).filter(b => b.organization_id === orgId);
    const departments = devGet(DEV_DEPARTMENTS_KEY).filter(d => d.organization_id === orgId);

    return {
      ...org,
      memberCount: members.length,
      activeMemberCount: members.filter(m => m.is_active && !m.is_suspended).length,
      branchCount: branches.length,
      departmentCount: departments.length,
      branches,
      departments,
    };
  }

  try {
    const { data: org } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_branches(*),
        organization_departments(*)
      `)
      .eq('id', orgId)
      .is('deleted_at', null)
      .single();

    if (!org) return null;

    // Enrich with counts
    const { count: memberCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    const { count: activeMemberCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .eq('is_suspended', false);

    return {
      ...org,
      memberCount: memberCount || 0,
      activeMemberCount: activeMemberCount || 0,
    };
  } catch (err) {
    console.error('Failed to fetch organization:', err);
    return null;
  }
}

/**
 * Create a new organization.
 */
export async function createOrganization(user, orgData) {
  if (!user) return { error: { message: 'Not authenticated.' } };

  if (DEV_MODE) {
    const orgs = devGet(DEV_ORGS_KEY);
    const profiles = devGet(DEV_PROFILES_KEY);

    const newOrg = {
      id: uid(),
      owner_id: user.id,
      name: orgData.name,
      type: orgData.type || '',
      description: orgData.description || '',
      explanation: orgData.explanation || '',
      website: orgData.website || '',
      industry: orgData.industry || '',
      company_size: orgData.companySize || '1-10',
      timezone: orgData.timezone || 'UTC',
      address: orgData.address || '',
      logo_url: orgData.logoUrl || '',
      socials: {
        instagram: orgData.instagram || '',
        twitter: orgData.twitter || '',
        telegram: orgData.telegram || '',
        linkedin: orgData.linkedin || '',
      },
      branches: orgData.branches || [],
      settings: {},
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    orgs.push(newOrg);
    devSet(DEV_ORGS_KEY, orgs);

    // Update creator's profile
    const myIdx = profiles.findIndex(p => p.user_id === user.id);
    if (myIdx !== -1) {
      profiles[myIdx].organization_id = newOrg.id;
      profiles[myIdx].role = 'owner';
      profiles[myIdx].updated_at = new Date().toISOString();
      devSet(DEV_PROFILES_KEY, profiles);
    }

    // Log activity
    logOrgActivity(newOrg.id, user, 'organization_created', 'organization', newOrg.id, { name: newOrg.name });

    return { data: newOrg, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        owner_id: user.id,
        name: orgData.name,
        type: orgData.type || '',
        description: orgData.description || '',
        explanation: orgData.explanation || '',
        website: orgData.website || '',
        industry: orgData.industry || '',
        company_size: orgData.companySize || '1-10',
        timezone: orgData.timezone || 'UTC',
        address: orgData.address || '',
        logo_url: orgData.logoUrl || '',
        socials: {
          instagram: orgData.instagram || '',
          twitter: orgData.twitter || '',
          telegram: orgData.telegram || '',
          linkedin: orgData.linkedin || '',
        },
      })
      .select()
      .single();

    if (error) return { error };

    // Update owner's profile
    await supabase
      .from('profiles')
      .update({ organization_id: data.id, role: 'owner', updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    // Log activity
    await supabase.rpc('log_org_activity', {
      p_organization_id: data.id,
      p_action: 'organization_created',
      p_resource_type: 'organization',
      p_resource_id: data.id,
      p_details: { name: data.name },
    });

    return { data, error: null };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Update an existing organization.
 */
export async function updateOrganization(user, orgId, updates) {
  if (!user) return { error: { message: 'Not authenticated.' } };

  if (DEV_MODE) {
    const orgs = devGet(DEV_ORGS_KEY);
    const idx = orgs.findIndex(o => o.id === orgId);
    if (idx === -1) return { error: { message: 'Organization not found.' } };

    // Map form field names to DB field names
    const mapped = {};
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.type !== undefined) mapped.type = updates.type;
    if (updates.description !== undefined) mapped.description = updates.description;
    if (updates.website !== undefined) mapped.website = updates.website;
    if (updates.industry !== undefined) mapped.industry = updates.industry;
    if (updates.companySize !== undefined) mapped.company_size = updates.companySize;
    if (updates.timezone !== undefined) mapped.timezone = updates.timezone;
    if (updates.address !== undefined) mapped.address = updates.address;
    if (updates.logoUrl !== undefined) mapped.logo_url = updates.logoUrl;
    if (updates.socials !== undefined) mapped.socials = updates.socials;
    if (updates.explanation !== undefined) mapped.explanation = updates.explanation;

    orgs[idx] = { ...orgs[idx], ...mapped, updated_at: new Date().toISOString() };
    devSet(DEV_ORGS_KEY, orgs);

    logOrgActivity(orgId, user, 'organization_updated', 'organization', orgId, { changes: Object.keys(mapped) });
    return { data: orgs[idx], error: null };
  }

  try {
    // Map form field names to DB field names
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.website !== undefined) dbUpdates.website = updates.website;
    if (updates.industry !== undefined) dbUpdates.industry = updates.industry;
    if (updates.companySize !== undefined) dbUpdates.company_size = updates.companySize;
    if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
    if (updates.socials !== undefined) dbUpdates.socials = updates.socials;
    if (updates.explanation !== undefined) dbUpdates.explanation = updates.explanation;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('organizations')
      .update(dbUpdates)
      .eq('id', orgId)
      .select()
      .single();

    if (error) return { error };

    await supabase.rpc('log_org_activity', {
      p_organization_id: orgId,
      p_action: 'organization_updated',
      p_resource_type: 'organization',
      p_resource_id: orgId,
      p_details: { changes: Object.keys(dbUpdates) },
    });

    return { data, error: null };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Soft-delete an organization.
 */
export async function deleteOrganization(user, orgId) {
  if (!user) return { error: { message: 'Not authenticated.' } };

  if (DEV_MODE) {
    const orgs = devGet(DEV_ORGS_KEY);
    const idx = orgs.findIndex(o => o.id === orgId);
    if (idx === -1) return { error: { message: 'Organization not found.' } };
    orgs[idx].deleted_at = new Date().toISOString();
    orgs[idx].is_active = false;
    devSet(DEV_ORGS_KEY, orgs);

    logOrgActivity(orgId, user, 'organization_deleted', 'organization', orgId, {});
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('organizations')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', orgId);

    if (error) return { error };

    await supabase.rpc('log_org_activity', {
      p_organization_id: orgId,
      p_action: 'organization_deleted',
      p_resource_type: 'organization',
      p_resource_id: orgId,
    });

    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

// ─── ───────────────────────────────────────────────────────────────────
//   BRANCH OFFICE MANAGEMENT
// ───────────────────────────────────────────────────────────────────────

export async function getBranches(user, orgId) {
  if (!user || !orgId) return [];
  if (DEV_MODE) {
    return devGet(DEV_BRANCHES_KEY).filter(b => b.organization_id === orgId);
  }
  try {
    const { data } = await supabase
      .from('organization_branches')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true });
    return data || [];
  } catch { return []; }
}

export async function createBranch(user, orgId, branchData) {
  if (!user) return { error: { message: 'Not authenticated.' } };
  if (DEV_MODE) {
    const branches = devGet(DEV_BRANCHES_KEY);
    const branch = {
      id: uid(),
      organization_id: orgId,
      name: branchData.name,
      address: branchData.address || '',
      city: branchData.city || '',
      state: branchData.state || '',
      country: branchData.country || '',
      phone: branchData.phone || '',
      email: branchData.email || '',
      is_headquarters: branchData.isHeadquarters || false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    branches.push(branch);
    devSet(DEV_BRANCHES_KEY, branches);
    logOrgActivity(orgId, user, 'branch_created', 'branch', branch.id, { name: branch.name });
    return { data: branch, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('organization_branches')
      .insert({
        organization_id: orgId,
        name: branchData.name,
        address: branchData.address,
        city: branchData.city,
        state: branchData.state,
        country: branchData.country,
        phone: branchData.phone,
        email: branchData.email,
        is_headquarters: branchData.isHeadquarters || false,
      })
      .select()
      .single();
    if (error) return { error };
    await supabase.rpc('log_org_activity', { p_organization_id: orgId, p_action: 'branch_created', p_resource_type: 'branch', p_resource_id: data.id, p_details: { name: data.name } });
    return { data, error: null };
  } catch (err) { return { error: err }; }
}

export async function updateBranch(user, orgId, branchId, updates) {
  if (!user) return { error: { message: 'Not authenticated.' } };
  if (DEV_MODE) {
    const branches = devGet(DEV_BRANCHES_KEY);
    const idx = branches.findIndex(b => b.id === branchId);
    if (idx === -1) return { error: { message: 'Branch not found.' } };
    branches[idx] = { ...branches[idx], ...updates, updated_at: new Date().toISOString() };
    devSet(DEV_BRANCHES_KEY, branches);
    logOrgActivity(orgId, user, 'branch_updated', 'branch', branchId, { changes: Object.keys(updates) });
    return { data: branches[idx], error: null };
  }
  try {
    const { data, error } = await supabase
      .from('organization_branches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', branchId)
      .select()
      .single();
    if (error) return { error };
    return { data, error: null };
  } catch (err) { return { error: err }; }
}

export async function deleteBranch(user, orgId, branchId) {
  if (!user) return { error: { message: 'Not authenticated.' } };
  if (DEV_MODE) {
    const branches = devGet(DEV_BRANCHES_KEY).filter(b => b.id !== branchId);
    devSet(DEV_BRANCHES_KEY, branches);
    logOrgActivity(orgId, user, 'branch_deleted', 'branch', branchId, {});
    return { error: null };
  }
  try {
    const { error } = await supabase.from('organization_branches').delete().eq('id', branchId);
    return { error };
  } catch (err) { return { error: err }; }
}

// ─── ───────────────────────────────────────────────────────────────────
//   DEPARTMENT & TEAM MANAGEMENT
// ───────────────────────────────────────────────────────────────────────

export async function getDepartments(user, orgId) {
  if (!user || !orgId) return [];
  if (DEV_MODE) return devGet(DEV_DEPARTMENTS_KEY).filter(d => d.organization_id === orgId);
  try {
    const { data } = await supabase
      .from('organization_departments')
      .select('*, organization_teams(*)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true });
    return data || [];
  } catch { return []; }
}

export async function createDepartment(user, orgId, deptData) {
  if (!user) return { error: { message: 'Not authenticated.' } };
  if (DEV_MODE) {
    const depts = devGet(DEV_DEPARTMENTS_KEY);
    const dept = { id: uid(), organization_id: orgId, ...deptData, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    depts.push(dept);
    devSet(DEV_DEPARTMENTS_KEY, depts);
    logOrgActivity(orgId, user, 'department_created', 'department', dept.id, { name: dept.name });
    return { data: dept, error: null };
  }
  try {
    const { data, error } = await supabase.from('organization_departments').insert({ organization_id: orgId, ...deptData }).select().single();
    if (error) return { error };
    return { data, error: null };
  } catch (err) { return { error: err }; }
}

export async function getTeams(user, orgId) {
  if (!user || !orgId) return [];
  if (DEV_MODE) return devGet(DEV_TEAMS_KEY).filter(t => t.organization_id === orgId);
  try {
    const { data } = await supabase.from('organization_teams').select('*').eq('organization_id', orgId).order('created_at');
    return data || [];
  } catch { return []; }
}

export async function createTeam(user, orgId, teamData) {
  if (!user) return { error: { message: 'Not authenticated.' } };
  if (DEV_MODE) {
    const teams = devGet(DEV_TEAMS_KEY);
    const team = { id: uid(), organization_id: orgId, ...teamData, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    teams.push(team);
    devSet(DEV_TEAMS_KEY, teams);
    logOrgActivity(orgId, user, 'team_created', 'team', team.id, { name: team.name });
    return { data: team, error: null };
  }
  try {
    const { data, error } = await supabase.from('organization_teams').insert({ organization_id: orgId, ...teamData }).select().single();
    if (error) return { error };
    return { data, error: null };
  } catch (err) { return { error: err }; }
}

// ─── ───────────────────────────────────────────────────────────────────
//   ORGANIZATION ANALYTICS
// ───────────────────────────────────────────────────────────────────────

export async function getOrgAnalytics(user, orgId) {
  if (!user || !orgId) return null;

  if (DEV_MODE) {
    const profiles = devGet(DEV_PROFILES_KEY).filter(p => p.organization_id === orgId);
    const depts = devGet(DEV_DEPARTMENTS_KEY).filter(d => d.organization_id === orgId);
    const activity = devGet(DEV_ACTIVITY_KEY).filter(a => a.organization_id === orgId);

    // Calculate metrics
    const totalStaff = profiles.length;
    const activeStaff = profiles.filter(p => p.is_active && !p.is_suspended).length;
    const onlineStaff = profiles.filter(p => {
      if (!p.last_seen) return false;
      return Date.now() - new Date(p.last_seen).getTime() < 300000;
    }).length;

    // Staff growth (mock data for chart)
    const staffGrowth = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      staffGrowth.push({
        month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: Math.max(0, totalStaff - Math.floor(Math.random() * 5)),
      });
    }

    // Department distribution
    const deptDistribution = {};
    profiles.forEach(p => {
      const dept = depts.find(d => d.id === p.department_id);
      const name = dept?.name || 'Unassigned';
      deptDistribution[name] = (deptDistribution[name] || 0) + 1;
    });

    // Role distribution
    const roleDistribution = {};
    profiles.forEach(p => {
      roleDistribution[p.role || 'staff'] = (roleDistribution[p.role || 'staff'] || 0) + 1;
    });

    // Activity heatmap (last 30 days)
    const activityHeatmap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      activityHeatmap[key] = activity.filter(a => a.created_at?.startsWith(key)).length;
    }

    return {
      totalStaff,
      activeStaff,
      onlineStaff,
      departmentCount: depts.length,
      staffGrowth,
      deptDistribution: Object.entries(deptDistribution).map(([name, count]) => ({ name, count })),
      roleDistribution: Object.entries(roleDistribution).map(([name, count]) => ({ name, count })),
      activityHeatmap,
      healthScore: calculateHealthScore({ totalStaff, activeStaff, activity, depts }),
    };
  }

  try {
    const { count: totalStaff } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId);
    const { count: activeStaff } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true).eq('is_suspended', false);
    const { count: deptCount } = await supabase.from('organization_departments').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true);
    const { data: deptData } = await supabase.from('organization_departments').select('id, name').eq('organization_id', orgId);
    const { data: profiles } = await supabase.from('profiles').select('role, department_id, last_seen').eq('organization_id', orgId);

    const onlineStaff = profiles?.filter(p => {
      if (!p.last_seen) return false;
      return new Date(p.last_seen) > new Date(Date.now() - 300000);
    }).length || 0;

    // Role distribution
    const roleDistribution = {};
    profiles?.forEach(p => {
      roleDistribution[p.role || 'staff'] = (roleDistribution[p.role || 'staff'] || 0) + 1;
    });

    // Department distribution
    const deptDistribution = {};
    profiles?.forEach(p => {
      const dept = deptData?.find(d => d.id === p.department_id);
      const name = dept?.name || 'Unassigned';
      deptDistribution[name] = (deptDistribution[name] || 0) + 1;
    });

    // Get health score from DB or calculate
    let healthScore = 0;
    try {
      const { data: score } = await supabase.rpc('calculate_org_health_score', { p_organization_id: orgId });
      healthScore = score || 0;
    } catch { /* ignore */ }

    return {
      totalStaff: totalStaff || 0,
      activeStaff: activeStaff || 0,
      onlineStaff,
      departmentCount: deptCount || 0,
      deptDistribution: Object.entries(deptDistribution).map(([name, count]) => ({ name, count })),
      roleDistribution: Object.entries(roleDistribution).map(([name, count]) => ({ name, count })),
      healthScore,
    };
  } catch (err) {
    console.error('Failed to fetch org analytics:', err);
    return null;
  }
}

/**
 * Get organization activity timeline.
 */
export async function getOrgActivity(user, orgId, limit = 50) {
  if (!user || !orgId) return [];

  if (DEV_MODE) {
    const profiles = devGet(DEV_PROFILES_KEY);
    return devGet(DEV_ACTIVITY_KEY)
      .filter(a => a.organization_id === orgId)
      .slice(-limit)
      .reverse()
      .map(a => ({
        ...a,
        actor_name: profiles.find(p => p.id === a.actor_id)?.full_name || 'System',
      }));
  }

  try {
    const { data } = await supabase
      .from('organization_activity_logs')
      .select('*, profiles!actor_id(full_name, avatar_url)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data || []).map(a => ({
      ...a,
      actor_name: a.profiles?.full_name || 'System',
    }));
  } catch { return []; }
}

/**
 * Log an organization activity.
 */
export async function logOrgActivity(orgId, user, action, resourceType, resourceId, details = {}) {
  if (DEV_MODE) {
    const activity = devGet(DEV_ACTIVITY_KEY);
    const profiles = devGet(DEV_PROFILES_KEY);
    const actor = profiles.find(p => p.user_id === user?.id);
    activity.push({
      id: uid(),
      organization_id: orgId,
      actor_id: actor?.id || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      severity: 'info',
      created_at: new Date().toISOString(),
    });
    devSet(DEV_ACTIVITY_KEY, activity);
    return;
  }
  try {
    await supabase.rpc('log_org_activity', {
      p_organization_id: orgId,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: details,
    });
  } catch { /* ignore */ }
}

// ─── ───────────────────────────────────────────────────────────────────
//   HEALTH SCORE CALCULATOR (DEV_MODE)
// ───────────────────────────────────────────────────────────────────────

function calculateHealthScore(data) {
  const { totalStaff, activeStaff, activity, depts } = data;
  let score = 0;

  // Staff health (30 pts)
  if (totalStaff > 0) {
    score += Math.min(15, (activeStaff / totalStaff) * 15);
    score += Math.min(15, totalStaff * 0.5);
  }

  // Activity health (40 pts)
  const recentActivity = activity.filter(a => {
    return a.created_at && new Date(a.created_at) > new Date(Date.now() - 30 * 86400000);
  }).length;
  score += Math.min(40, recentActivity * 0.3);

  // Structure health (30 pts)
  score += Math.min(30, depts.length * 5);

  return Math.round(Math.max(0, Math.min(100, score)));
}

// ─── ───────────────────────────────────────────────────────────────────
//   ORGANIZATION SETTINGS
// ───────────────────────────────────────────────────────────────────────

export async function updateOrgSettings(user, orgId, settings) {
  if (!user) return { error: { message: 'Not authenticated.' } };

  if (DEV_MODE) {
    const orgs = devGet(DEV_ORGS_KEY);
    const idx = orgs.findIndex(o => o.id === orgId);
    if (idx === -1) return { error: { message: 'Organization not found.' } };
    orgs[idx].settings = { ...orgs[idx].settings, ...settings };
    orgs[idx].updated_at = new Date().toISOString();
    devSet(DEV_ORGS_KEY, orgs);
    return { data: orgs[idx], error: null };
  }

  try {
    const { data: org } = await supabase.from('organizations').select('settings').eq('id', orgId).single();
    const merged = { ...(org?.settings || {}), ...settings };
    const { data, error } = await supabase.from('organizations').update({ settings: merged, updated_at: new Date().toISOString() }).eq('id', orgId).select().single();
    if (error) return { error };
    return { data, error: null };
  } catch (err) { return { error: err }; }
}

export default {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getDepartments,
  createDepartment,
  getTeams,
  createTeam,
  getOrgAnalytics,
  getOrgActivity,
  logOrgActivity,
  updateOrgSettings,
};

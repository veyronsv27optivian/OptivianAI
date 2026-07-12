/**
 * ─── Email OTP Service for 2FA ──────────────────────────────────
 * Handles sending and verifying 6-digit OTP codes via email.
 *
 * In production: Uses Supabase Edge Function (send-otp) to send the email.
 * In DEV_MODE: Shows the code in the UI for testing.
 *
 * Flow:
 *   1. User enables "Email 2FA" in Settings → profile.mfa_email_enabled = true
 *   2. On login, if enabled → sendOtp() generates code, stores hash in DB, emails it
 *   3. User enters code → verifyOtp() checks the hash
 */

import { supabase } from './supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '';

/**
 * Generate a SHA-256 hash of the code (for secure storage/comparison).
 */
async function hashCode(code, userId) {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + userId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Send an OTP code to the user's email.
 *
 * @param {string} email - User's email address.
 * @param {string} userId - User's auth ID.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendOtp(email, userId) {
  if (!email || !userId) {
    throw new Error('Email and userId are required');
  }

  if (DEV_MODE) {
    // DEV_MODE: Generate code, store in localStorage, return it for display
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await hashCode(code, userId);

    const otpRecord = {
      id: crypto.randomUUID(),
      user_id: userId,
      code_hash: hashed,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      attempts: 0,
      max_attempts: 3,
      is_used: false,
      created_at: new Date().toISOString(),
    };

    // Store in localStorage for verification
    const records = JSON.parse(localStorage.getItem('optivian_dev_otps') || '[]');
    records.push(otpRecord);
    localStorage.setItem('optivian_dev_otps', JSON.stringify(records));

    // Store the plain code for the UI to display (DEV_MODE only!)
    localStorage.setItem('optivian_dev_last_otp', code);

    return { success: true, message: `[DEV MODE] Your code is: ${code}` };
  }

  // Production: Call the Supabase Edge Function
  const { data: { session } } = await supabase.auth.getSession();
  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`;

  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify({ email, userId }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to send OTP');
  }

  return result;
}

/**
 * Verify an OTP code entered by the user.
 *
 * @param {string} userId - User's auth ID.
 * @param {string} code - The 6-digit code entered by the user.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyOtp(userId, code) {
  if (!userId || !code || code.length !== 6) {
    throw new Error('Invalid verification code');
  }

  if (DEV_MODE) {
    const records = JSON.parse(localStorage.getItem('optivian_dev_otps') || '[]');

    // Find the latest unexpired, unused OTP for this user
    const now = new Date();
    const otpRecord = records
      .filter(r => r.user_id === userId && !r.is_used && new Date(r.expires_at) > now)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    if (!otpRecord) {
      throw new Error('No valid OTP found. Please request a new code.');
    }

    // Check attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      throw new Error('Too many failed attempts. Please request a new code.');
    }

    // Verify
    const hashed = await hashCode(code, userId);
    if (hashed !== otpRecord.code_hash) {
      // Increment attempts
      otpRecord.attempts += 1;
      const idx = records.findIndex(r => r.id === otpRecord.id);
      if (idx >= 0) {
        records[idx] = otpRecord;
        localStorage.setItem('optivian_dev_otps', JSON.stringify(records));
      }
      throw new Error(`Invalid code. ${otpRecord.max_attempts - otpRecord.attempts} attempts remaining.`);
    }

    // Mark as used
    otpRecord.is_used = true;
    otpRecord.verified_at = new Date().toISOString();
    const idx = records.findIndex(r => r.id === otpRecord.id);
    if (idx >= 0) {
      records[idx] = otpRecord;
      localStorage.setItem('optivian_dev_otps', JSON.stringify(records));
    }

    localStorage.removeItem('optivian_dev_last_otp');
    return { success: true, message: 'Verified successfully' };
  }

  // Production: Verify through Supabase
  const hashed = await hashCode(code, userId);
  const now = new Date().toISOString();

  // Find the matching OTP
  const { data: otpRecords, error: findError } = await supabase
    .from('mfa_otps')
    .select('*')
    .eq('user_id', userId)
    .eq('is_used', false)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1);

  if (findError) throw findError;
  if (!otpRecords || otpRecords.length === 0) {
    throw new Error('No valid OTP found. Please request a new code.');
  }

  const otpRecord = otpRecords[0];

  // Check attempts
  if (otpRecord.attempts >= otpRecord.max_attempts) {
    throw new Error('Too many failed attempts. Please request a new code.');
  }

  // Verify hash
  if (hashed !== otpRecord.code_hash) {
    await supabase
      .from('mfa_otps')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id);
    const remaining = otpRecord.max_attempts - otpRecord.attempts - 1;
    throw new Error(`Invalid code. ${Math.max(0, remaining)} attempts remaining.`);
  }

  // Success — mark as used
  await supabase
    .from('mfa_otps')
    .update({ is_used: true, verified_at: now })
    .eq('id', otpRecord.id);

  return { success: true, message: 'Verified successfully' };
}

/**
 * Check if the user has email 2FA enabled.
 */
export async function isEmailMfaEnabled(userId) {
  if (!userId) return false;

  if (DEV_MODE) {
    const profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.mfa_email_enabled === true;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('mfa_email_enabled')
    .eq('user_id', userId)
    .single();

  if (error || !data) return false;
  return data.mfa_email_enabled === true;
}

/**
 * Toggle email 2FA on/off.
 */
export async function toggleEmailMfa(userId, enable) {
  if (!userId) return { error: 'Not authenticated' };

  if (DEV_MODE) {
    const profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
    const idx = profiles.findIndex(p => p.user_id === userId);
    if (idx >= 0) {
      profiles[idx].mfa_email_enabled = enable;
      localStorage.setItem('optivian_dev_profiles', JSON.stringify(profiles));
    }
    return { success: true };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ mfa_email_enabled: enable })
    .eq('user_id', userId);

  if (error) return { error: error.message };
  return { success: true };
}

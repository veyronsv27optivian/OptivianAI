/**
 * ─── Device Fingerprint Service ──────────────────────────────────
 * Generates a unique browser fingerprint and manages trusted devices
 * for skipping 2FA on known devices.
 *
 * The fingerprint is a hash of browser properties that, combined,
 * are reasonably unique per device/browser profile.
 *
 * Trusted device records are stored in localStorage with a 30-day
 * expiry and are scoped per user ID.
 */

const TRUSTED_PREFIX = 'optivian_trusted_device_';
const TRUSTED_EXPIRY_DAYS = 30;

/**
 * Generate a device fingerprint from browser properties.
 * Uses navigator, screen, and timezone info to create a semi-unique ID.
 *
 * @returns {string} A SHA-256 hex hash representing the device
 */
export async function generateFingerprint() {
  const components = [
    navigator.userAgent || '',
    navigator.language || '',
    navigator.platform || '',
    navigator.hardwareConcurrency || '',
    screen.width || '',
    screen.height || '',
    screen.colorDepth || '',
    screen.pixelDepth || '',
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    navigator.deviceMemory || '',
  ];

  const raw = components.join('|||');

  // SHA-256 hash using SubtleCrypto
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/**
 * Check if the current device is trusted for a given user.
 *
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function isDeviceTrusted(userId) {
  if (!userId) return false;

  try {
    const fingerprint = await generateFingerprint();
    const key = `${TRUSTED_PREFIX}${userId}`;
    const stored = JSON.parse(localStorage.getItem(key) || '{}');

    // No trusted devices stored
    if (!stored.devices || !Array.isArray(stored.devices)) return false;

    const device = stored.devices.find(d => d.fingerprint === fingerprint);
    if (!device) return false;

    // Check expiry
    if (device.expiresAt && Date.now() > device.expiresAt) {
      // Remove expired device
      stored.devices = stored.devices.filter(d => d.fingerprint !== fingerprint);
      localStorage.setItem(key, JSON.stringify(stored));
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Register the current device as trusted for a user.
 * Devices automatically expire after TRUSTED_EXPIRY_DAYS.
 *
 * @param {string} userId
 * @param {object} [meta={}] - Optional metadata (e.g., { label: 'Work Laptop' })
 * @returns {Promise<{success: boolean}>}
 */
export async function trustCurrentDevice(userId, meta = {}) {
  if (!userId) return { success: false };

  try {
    const fingerprint = await generateFingerprint();
    const key = `${TRUSTED_PREFIX}${userId}`;
    const stored = JSON.parse(localStorage.getItem(key) || '{}');

    if (!stored.devices) stored.devices = [];

    // Remove existing entry for this fingerprint
    stored.devices = stored.devices.filter(d => d.fingerprint !== fingerprint);

    // Add new entry with 30-day expiry
    stored.devices.push({
      fingerprint,
      label: meta.label || getDefaultDeviceLabel(),
      trustedAt: Date.now(),
      expiresAt: Date.now() + TRUSTED_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      userAgent: navigator.userAgent?.slice(0, 100),
    });

    localStorage.setItem(key, JSON.stringify(stored));
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Remove the current device from the trusted list for a user.
 *
 * @param {string} userId
 * @returns {Promise<{success: boolean}>}
 */
export async function untrustCurrentDevice(userId) {
  if (!userId) return { success: false };

  try {
    const fingerprint = await generateFingerprint();
    const key = `${TRUSTED_PREFIX}${userId}`;
    const stored = JSON.parse(localStorage.getItem(key) || '{}');

    if (stored.devices) {
      stored.devices = stored.devices.filter(d => d.fingerprint !== fingerprint);
      localStorage.setItem(key, JSON.stringify(stored));
    }

    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Get all trusted devices for a user (for display in Settings).
 *
 * @param {string} userId
 * @returns {Promise<Array<object>>}
 */
export async function getTrustedDevices(userId) {
  if (!userId) return [];

  try {
    const key = `${TRUSTED_PREFIX}${userId}`;
    const stored = JSON.parse(localStorage.getItem(key) || '{}');

    if (!stored.devices || !Array.isArray(stored.devices)) return [];

    // Filter out expired devices
    const now = Date.now();
    stored.devices = stored.devices.filter(d => d.expiresAt && now < d.expiresAt);
    localStorage.setItem(key, JSON.stringify(stored));

    return stored.devices.map((d, i) => ({
      id: i + 1,
      fingerprint: d.fingerprint?.slice(0, 12) + '...',
      label: d.label || 'Unknown Device',
      trustedAt: new Date(d.trustedAt).toLocaleDateString(),
      expiresAt: new Date(d.expiresAt).toLocaleDateString(),
      userAgent: d.userAgent || '',
    }));
  } catch {
    return [];
  }
}

/**
 * Remove a specific trusted device by its fingerprint (partial match).
 *
 * @param {string} userId
 * @param {string} fingerprintPrefix - First 12+ chars of fingerprint
 * @returns {Promise<{success: boolean}>}
 */
export async function removeTrustedDevice(userId, fingerprintPrefix) {
  if (!userId || !fingerprintPrefix) return { success: false };

  try {
    const key = `${TRUSTED_PREFIX}${userId}`;
    const stored = JSON.parse(localStorage.getItem(key) || '{}');

    if (stored.devices) {
      stored.devices = stored.devices.filter(
        d => !d.fingerprint?.startsWith(fingerprintPrefix)
      );
      localStorage.setItem(key, JSON.stringify(stored));
    }

    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Get a human-readable label for the current device.
 */
function getDefaultDeviceLabel() {
  const ua = navigator.userAgent || '';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Mac OS')) return 'Mac';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android Device';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Device';
  return 'Unknown Device';
}

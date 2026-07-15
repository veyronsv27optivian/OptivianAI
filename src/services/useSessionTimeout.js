/**
 * ─── Session Timeout Hook (Item 66) ──────────────────────────────
 * Detects user idle time and triggers auto-logout after a configurable
 * period. Tracks mouse movement, keyboard input, and touch events.
 *
 * The SessionTimeoutModal component is in ../components/ui/SessionTimeoutModal.jsx
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const DEFAULT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 60 * 1000; // Warn 1 minute before timeout
const STORAGE_KEY = 'optivian_session_timeout';
const LAST_ACTIVITY_KEY = 'optivian_last_activity';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'mousemove'];

/**
 * Hook that monitors user activity and auto-logs out after inactivity.
 *
 * @param {object} options
 * @param {number} [options.timeoutMs=1800000] - Idle timeout in ms (default 30 min).
 * @param {boolean} [options.enabled=true] - Whether to enable timeout monitoring.
 * @returns {{ idleTimer: number, showWarning: boolean, resetTimer: () => void, setTimeoutDuration: (ms: number) => void }}
 */
export function useSessionTimeout({ timeoutMs = DEFAULT_TIMEOUT, enabled = true } = {}) {
  const { user, signOut } = useAuth();
  const [idleTimer, setIdleTimer] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [timeoutDuration, setTimeoutDuration] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY)) || timeoutMs;
    } catch {
      return timeoutMs;
    }
  });

  const warningTimeoutRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const tickRef = useRef(null);

  // Save timeout duration to localStorage
  const handleSetTimeoutDuration = useCallback((ms) => {
    setTimeoutDuration(ms);
    try {
      localStorage.setItem(STORAGE_KEY, ms.toString());
    } catch {}
  }, []);

  // Reset the idle timer
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleTimer(0);
    setShowWarning(false);

    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
  }, []);

  // Track activity events
  useEffect(() => {
    if (!enabled || !user) return;

    const handleActivity = () => {
      resetTimer();
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      } catch {}
    };

    // Throttle mousemove since it fires frequently
    let throttleTimer = null;
    const throttledActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        handleActivity();
        throttleTimer = null;
      }, 1000);
    };

    for (const event of ACTIVITY_EVENTS) {
      if (event === 'mousemove') {
        window.addEventListener(event, throttledActivity, { passive: true });
      } else {
        window.addEventListener(event, handleActivity, { passive: true });
      }
    }

    // Tick every second to update the timer display
    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      setIdleTimer(elapsed);
    }, 1000);

    // Set warning timeout
    const warnMs = timeoutDuration - WARNING_BEFORE;
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
    }, warnMs);

    // Set logout timeout
    logoutTimeoutRef.current = setTimeout(async () => {
      await signOut();
      window.location.hash = '/onboarding';
    }, timeoutDuration);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        if (event === 'mousemove') {
          window.removeEventListener(event, throttledActivity);
        } else {
          window.removeEventListener(event, handleActivity);
        }
      }
      if (tickRef.current) clearInterval(tickRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [enabled, user, timeoutDuration, resetTimer, signOut]);

  return {
    idleTimer,
    showWarning,
    resetTimer,
    setTimeoutDuration: handleSetTimeoutDuration,
    timeoutDuration,
  };
}

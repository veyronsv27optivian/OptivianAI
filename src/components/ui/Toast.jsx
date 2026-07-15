import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Toast Context ─────────────────────────────────────────────
const ToastContext = createContext(null);

const TOAST_DURATION = 4000;
const TOAST_TYPES = {
  success: { icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-900/20 backdrop-blur-sm', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: AlertCircle, bg: 'bg-red-50 dark:bg-red-900/20 backdrop-blur-sm', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300', iconColor: 'text-red-600 dark:text-red-400' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-900/20 backdrop-blur-sm', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', iconColor: 'text-amber-600 dark:text-amber-400' },
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/20 backdrop-blur-sm', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', iconColor: 'text-blue-600 dark:text-blue-400' },
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const addToast = useCallback(({ type = 'success', title, message, duration = TOAST_DURATION }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, title, message }]);
    timersRef.current[id] = setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast container — fixed to bottom-right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => {
            const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
            const Icon = config.icon;
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-glass-lg ${config.bg} ${config.border}`}
              >
                <div className={`p-1 rounded-lg shrink-0 ${config.iconColor}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  {toast.title && (
                    <p className={`text-sm font-semibold ${config.text}`}>{toast.title}</p>
                  )}
                  {toast.message && (
                    <p className={`text-xs mt-0.5 ${config.text} opacity-90`}>{toast.message}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 ${config.text}`}
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * useToast — returns a function to show toasts.
 *
 * Usage:
 *   const toast = useToast();
 *   toast({ type: 'success', title: 'Saved!', message: 'Profile updated successfully.' });
 *   toast({ type: 'error', title: 'Failed', message: 'Something went wrong.' });
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export default ToastProvider;

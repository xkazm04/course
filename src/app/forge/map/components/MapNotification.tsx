'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, AlertCircle, X, Sparkles } from 'lucide-react';

export type NotificationType = 'loading' | 'success' | 'error' | 'info';

export interface MapNotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 for persistent
}

interface MapNotificationProps {
  notification: MapNotificationData | null;
  onDismiss?: () => void;
}

const typeStyles = {
  loading: {
    bg: 'bg-[var(--forge-bg-elevated)]',
    border: 'border-[var(--ember)]',
    icon: Loader2,
    iconClass: 'text-[var(--ember)] animate-spin',
  },
  success: {
    bg: 'bg-[var(--forge-success)]/10',
    border: 'border-[var(--forge-success)]',
    icon: CheckCircle,
    iconClass: 'text-[var(--forge-success)]',
  },
  error: {
    bg: 'bg-[var(--forge-error)]/10',
    border: 'border-[var(--forge-error)]',
    icon: AlertCircle,
    iconClass: 'text-[var(--forge-error)]',
  },
  info: {
    bg: 'bg-[var(--forge-info)]/10',
    border: 'border-[var(--forge-info)]',
    icon: Sparkles,
    iconClass: 'text-[var(--forge-info)]',
  },
};

export function MapNotification({ notification, onDismiss }: MapNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);

      // Auto-dismiss after duration (if not persistent)
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          setVisible(false);
          setTimeout(() => onDismiss?.(), 300);
        }, notification.duration);
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  const style = typeStyles[notification.type];
  const Icon = style.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl
              border ${style.border} ${style.bg}
              backdrop-blur-sm shadow-lg
              min-w-[280px] max-w-[400px]
            `}
          >
            <Icon size={20} className={style.iconClass} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{notification.title}</p>
              {notification.message && (
                <p className="text-xs text-[var(--forge-text-secondary)] mt-0.5 truncate">
                  {notification.message}
                </p>
              )}
            </div>

            {notification.type !== 'loading' && onDismiss && (
              <button
                onClick={() => {
                  setVisible(false);
                  setTimeout(() => onDismiss(), 300);
                }}
                className="p-1 rounded-lg text-[var(--forge-text-muted)] hover:text-white hover:bg-[var(--forge-bg-workshop)] transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing notifications
export function useMapNotification() {
  const [notification, setNotification] = useState<MapNotificationData | null>(null);

  const show = (data: Omit<MapNotificationData, 'id'>) => {
    setNotification({
      ...data,
      id: `notification-${Date.now()}`,
    });
  };

  const dismiss = () => {
    setNotification(null);
  };

  const showLoading = (title: string, message?: string) => {
    show({ type: 'loading', title, message, duration: 0 });
  };

  const showSuccess = (title: string, message?: string, duration = 4000) => {
    show({ type: 'success', title, message, duration });
  };

  const showError = (title: string, message?: string, duration = 6000) => {
    show({ type: 'error', title, message, duration });
  };

  const showInfo = (title: string, message?: string, duration = 4000) => {
    show({ type: 'info', title, message, duration });
  };

  return {
    notification,
    show,
    dismiss,
    showLoading,
    showSuccess,
    showError,
    showInfo,
  };
}

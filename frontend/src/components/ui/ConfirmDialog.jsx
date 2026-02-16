import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  loading = false
}) => {
  const variantStyles = {
    danger: {
      icon: Trash2,
      iconColor: 'text-red-500',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      borderColor: 'border-red-200 dark:border-red-900'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
      borderColor: 'border-yellow-200 dark:border-yellow-900'
    },
    info: {
      icon: AlertTriangle,
      iconColor: 'text-blue-500',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      borderColor: 'border-blue-200 dark:border-blue-900'
    }
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border-2 ${style.borderColor}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Icon */}
              <div className="flex items-start gap-4 p-6 border-b border-gray-200 dark:border-slate-700">
                <div className={`p-3 rounded-full bg-gray-100 dark:bg-slate-700 ${style.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {message}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  disabled={loading}
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-6">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-white ${style.buttonBg} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;

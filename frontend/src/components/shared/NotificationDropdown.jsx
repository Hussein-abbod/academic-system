import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, CreditCard, UserCheck, BookOpen, X } from 'lucide-react';
import api from '../../utils/api';

const typeConfig = {
    payment: {
        icon: CreditCard,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
    },
    attendance: {
        icon: UserCheck,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    enrollment: {
        icon: BookOpen,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
};

function timeAgo(isoString) {
    if (!isoString) return '';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const NotificationDropdown = () => {
    const [open, setOpen] = useState(false);
    const [dismissed, setDismissed] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dismissed_notifications') || '[]'); }
        catch { return []; }
    });
    const dropdownRef = useRef(null);

    const { data: all = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications');
            return res.data;
        },
        refetchInterval: 60000, // refresh every 60s
        staleTime: 30000,
    });

    // Filter out dismissed
    const notifications = all.filter(n => !dismissed.includes(n.id));
    const count = notifications.length;

    const dismiss = (id, e) => {
        e.stopPropagation();
        const next = [...dismissed, id];
        setDismissed(next);
        localStorage.setItem('dismissed_notifications', JSON.stringify(next));
    };

    const dismissAll = () => {
        const next = [...dismissed, ...notifications.map(n => n.id)];
        setDismissed(next);
        localStorage.setItem('dismissed_notifications', JSON.stringify(next));
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-gray-700 transition-colors relative"
                title="Notifications"
            >
                <Bell size={20} />
                {count > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-0.5 border border-white dark:border-gray-800">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                            <Bell size={16} /> Notifications
                            {count > 0 && (
                                <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {count}
                                </span>
                            )}
                        </h3>
                        {count > 0 && (
                            <button
                                onClick={dismissAll}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Bell size={32} className="mb-2 opacity-30" />
                                <p className="text-sm">No new notifications</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const cfg = typeConfig[n.type] || typeConfig.enrollment;
                                const Icon = cfg.icon;
                                return (
                                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${cfg.bg}`}>
                                            <Icon size={15} className={cfg.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{n.title}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.time)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => dismiss(n.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all flex-shrink-0"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;

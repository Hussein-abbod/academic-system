import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../utils/api';
import {
    User,
    Phone,
    Mail,
    Shield,
    Lock,
    Save,
    Eye,
    EyeOff,
    CheckCircle,
} from 'lucide-react';

const Profile = () => {
    const { user, login, logout } = useAuth();

    const [form, setForm] = useState({
        full_name: user?.full_name || '',
        phone_number: user?.phone_number || '',
    });

    const [pwForm, setPwForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    // Update profile info mutation
    const profileMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.patch('/auth/profile', data);
            return res.data;
        },
        onSuccess: (updatedUser) => {
            // Update localStorage so the navbar reflects new name
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Force a page reload to refresh AuthContext from localStorage
            window.location.reload();
            toast.success('Profile updated successfully!');
        },
        onError: (err) => {
            const msg = err?.response?.data?.detail;
            toast.error(typeof msg === 'string' ? msg : 'Failed to update profile.');
        },
    });

    // Change password mutation (separate call for clarity)
    const passwordMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.patch('/auth/profile', data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Password changed! Please log in again.');
            setPwForm({ current_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => {
                logout();
                window.location.href = '/login';
            }, 1500);
        },
        onError: (err) => {
            const msg = err?.response?.data?.detail;
            toast.error(typeof msg === 'string' ? msg : 'Failed to change password.');
        },
    });

    const handleProfileSave = (e) => {
        e.preventDefault();
        profileMutation.mutate({
            full_name: form.full_name.trim(),
            phone_number: form.phone_number.trim() || null,
        });
    };

    const handlePasswordSave = (e) => {
        e.preventDefault();
        if (pwForm.new_password !== pwForm.confirm_password) {
            toast.error('New passwords do not match.');
            return;
        }
        if (pwForm.new_password.length < 3) {
            toast.error('New password must be at least 3 characters.');
            return;
        }
        passwordMutation.mutate({
            current_password: pwForm.current_password,
            new_password: pwForm.new_password,
        });
    };

    const roleColors = {
        ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        TEACHER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        STUDENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>

            {/* Avatar & Identity Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
                    {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{user?.full_name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Mail size={14} /> {user?.email}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${roleColors[user?.role] || 'bg-gray-100 text-gray-700'}`}>
                            <Shield size={11} /> {user?.role}
                        </span>
                        {user?.is_active && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle size={11} /> Active
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Profile Info */}
            <form
                onSubmit={handleProfileSave}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-4"
            >
                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <User size={18} /> Personal Information
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        required
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                    </label>
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="tel"
                            value={form.phone_number}
                            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                            placeholder="e.g. +1 555 000 0000"
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact an admin if needed.</p>
                </div>

                <button
                    type="submit"
                    disabled={profileMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={16} />
                    {profileMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
            </form>

            {/* Change Password */}
            <form
                onSubmit={handlePasswordSave}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-4"
            >
                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Lock size={18} /> Change Password
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                    </label>
                    <div className="relative">
                        <input
                            type={showCurrentPw ? 'text' : 'password'}
                            required
                            value={pwForm.current_password}
                            onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showNewPw ? 'text' : 'password'}
                            required
                            value={pwForm.new_password}
                            onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        required
                        value={pwForm.confirm_password}
                        onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={passwordMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Lock size={16} />
                    {passwordMutation.isPending ? 'Changing…' : 'Change Password'}
                </button>
            </form>
        </div>
    );
};

export default Profile;

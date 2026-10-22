import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Flame,
    Pin,
    Tag,
    RefreshCw,
    Sparkles,
    Layers,
    ListFilter,
    PieChart as PieIcon,
    AlertCircle,
    FolderKanban
} from 'lucide-react';
import { getDashboardAnalytics } from '../services/api';

export default function Dashboard({ onBack }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/signin');
        } else {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                const uid = parsedUser.id || parsedUser._id || parsedUser.userId;
                if (uid) {
                    loadDashboardData(uid);
                } else {
                    setError("User identifier not found in session. Please sign in again.");
                    setLoading(false);
                }
            } catch (e) {
                navigate('/signin');
            }
        }
    }, [navigate]);

    const loadDashboardData = async (userId, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const data = await getDashboardAnalytics(userId);
            setAnalytics(data);
        } catch (err) {
            setError(err.message || 'Failed to connect to backend aggregation service.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const summary = analytics?.summary || {
        totalNotes: 0,
        completedNotes: 0,
        pendingNotes: 0,
        pinnedNotes: 0,
        highPriorityPending: 0,
        completionRate: 0.0
    };

    const categories = analytics?.categories || [];
    const priorities = analytics?.priorities || [];
    const topTags = analytics?.topTags || [];
    const colorDist = analytics?.colorDistribution || [];
    const recentActivity = analytics?.recentActivity || [];

    return (
        <div className="min-h-screen bg-zinc-50/70 pb-20 pt-6 font-sans text-zinc-900">
            <div className="mx-auto max-w-6xl px-6">

                {/* Top Navigation & Header */}
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/workspace')}
                            className="group flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:bg-zinc-50 cursor-pointer"
                            title="Back to Workspace"
                        >
                            <ArrowLeft className="h-5 w-5 text-zinc-600 transition group-hover:-translate-x-0.5" />
                        </button>

                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                                    Analytics Dashboard
                                </h1>
                                {user && (
                                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                                        {user.name}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Aggregated insights powered by MongoDB multi-stage pipelines
                            </p>
                        </div>
                    </div>

                    {/* Header Controls */}
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => user && loadDashboardData(user.id, true)}
                            disabled={refreshing}
                            className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 cursor-pointer disabled:opacity-50"
                            title="Refresh database aggregations"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
                            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={() => user && loadDashboardData(user.id)}
                            className="text-xs font-semibold underline hover:no-underline cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
                        <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent"></div>
                        <p className="mt-4 text-sm font-semibold text-zinc-700">Loading your analytics...</p>
                        <p className="text-xs text-zinc-400">Executing MongoDB aggregation pipelines</p>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* 1. Executive KPI Cards */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">

                            {/* Total Notes */}
                            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-500">Total Notes</span>
                                    <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
                                        <Layers className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-zinc-900">{summary.totalNotes}</span>
                                    <span className="text-[11px] text-zinc-400 font-medium">records</span>
                                </div>
                            </div>

                            {/* Completed Notes */}
                            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-500">Completed</span>
                                    <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-emerald-600">{summary.completedNotes}</span>
                                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                        {summary.completionRate}%
                                    </span>
                                </div>
                            </div>

                            {/* Pending Notes */}
                            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-500">Pending</span>
                                    <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-amber-600">{summary.pendingNotes}</span>
                                    <span className="text-[11px] text-zinc-400 font-medium">to-do</span>
                                </div>
                            </div>

                            {/* Completion Rate */}
                            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-500">Efficiency</span>
                                    <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                                        <PieIcon className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-blue-600">{summary.completionRate}</span>
                                    <span className="text-xs font-bold text-blue-600">%</span>
                                </div>
                            </div>

                            {/* Urgent Pending */}
                            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-500">Urgent Pending</span>
                                    <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
                                        <Flame className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-rose-600">{summary.highPriorityPending}</span>
                                    <span className="text-[11px] text-zinc-400 font-medium">high prio</span>
                                </div>
                            </div>

                            {/* Pinned Notes */}
                            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs transition hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-500">Pinned Notes</span>
                                    <div className="rounded-lg bg-purple-50 p-1.5 text-purple-600">
                                        <Pin className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-purple-600">{summary.pinnedNotes}</span>
                                    <span className="text-[11px] text-zinc-400 font-medium">starred</span>
                                </div>
                            </div>

                        </div>

                        {/* 2. Category Breakdown & Priority Severity Grid */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

                            {/* Category Aggregation Cards (7 cols) */}
                            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs lg:col-span-7">
                                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
                                            <FolderKanban className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-zinc-900">Notes by Category</h2>
                                            <p className="text-xs text-zinc-500">Aggregated task volume and progress per category</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                        {categories.length} Categories
                                    </span>
                                </div>

                                <div className="mt-4 space-y-4">
                                    {categories.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-zinc-400">
                                            No categorized notes yet. Create notes in your Workspace to view category insights.
                                        </div>
                                    ) : (
                                        categories.map((cat) => {
                                            const progressPct = cat.totalNotes > 0
                                                ? Math.round((cat.completedNotes / cat.totalNotes) * 100)
                                                : 0;

                                            return (
                                                <div key={cat.category} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 transition hover:bg-zinc-50">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-zinc-900">{cat.category}</span>
                                                            <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                                                                {cat.totalNotes} note{cat.totalNotes === 1 ? '' : 's'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] font-medium">
                                                            <span className="text-emerald-700 font-semibold">{cat.completedNotes} Done</span>
                                                            <span className="text-zinc-300">•</span>
                                                            <span className="text-amber-700 font-semibold">{cat.pendingNotes} Pending</span>
                                                            <span className="text-zinc-300">•</span>
                                                            <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-bold text-indigo-700">
                                                                {cat.completionRate}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                                                            style={{ width: `${progressPct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Priority Matrix Grid (5 cols) */}
                            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs lg:col-span-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
                                                <ListFilter className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-bold text-zinc-900">Priority Distribution</h2>
                                                <p className="text-xs text-zinc-500">Workload grouped by urgency level</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Priority Cards */}
                                    <div className="mt-4 space-y-3">
                                        {priorities.map((prio) => {
                                            const isHigh = prio.priority === 'high';
                                            const isMed = prio.priority === 'medium';

                                            const colorClasses = isHigh
                                                ? 'border-red-200 bg-red-50/40 text-red-950'
                                                : isMed
                                                ? 'border-amber-200 bg-amber-50/40 text-amber-950'
                                                : 'border-emerald-200 bg-emerald-50/40 text-emerald-950';

                                            const badgeColor = isHigh
                                                ? 'bg-red-500'
                                                : isMed
                                                ? 'bg-amber-500'
                                                : 'bg-emerald-500';

                                            return (
                                                <div key={prio.priority} className={`rounded-xl border p-3.5 transition ${colorClasses}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-2.5 w-2.5 rounded-full ${badgeColor}`} />
                                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                                {prio.priority} Priority
                                                            </span>
                                                        </div>
                                                        <span className="text-base font-extrabold">{prio.totalNotes}</span>
                                                    </div>

                                                    <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-zinc-600">
                                                        <span>Completed: <strong className="text-emerald-700">{prio.completedNotes}</strong></span>
                                                        <span>Pending: <strong className="text-amber-700">{prio.pendingNotes}</strong></span>
                                                        <span>Rate: <strong className="text-indigo-700">{prio.completionRate}%</strong></span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Task Resolution Progress Meter */}
                                <div className="mt-6 rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-zinc-600">Overall Task Resolution:</span>
                                        <span className="text-indigo-600 font-bold">{summary.completionRate}% completed</span>
                                    </div>
                                    <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                                        <div
                                            className="bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${summary.completionRate}%` }}
                                            title={`Completed: ${summary.completedNotes}`}
                                        />
                                        <div
                                            className="bg-amber-400 transition-all duration-500"
                                            style={{ width: `${100 - summary.completionRate}%` }}
                                            title={`Pending: ${summary.pendingNotes}`}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* 3. Tag Cloud, Color Distribution & Recent Records */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

                            {/* Tag Frequency ($unwind) */}
                            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs lg:col-span-4">
                                <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
                                    <div className="rounded-lg bg-pink-50 p-1.5 text-pink-600">
                                        <Tag className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-zinc-900">Tag Cloud</h2>
                                        <p className="text-xs text-zinc-500">Most frequently used tags</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {topTags.length === 0 ? (
                                        <p className="text-xs text-zinc-400 py-6 text-center w-full">
                                            No tags found. Add tags to your notes in the Workspace.
                                        </p>
                                    ) : (
                                        topTags.map((t) => (
                                            <span
                                                key={t.tag}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition"
                                            >
                                                <span>#{t.tag}</span>
                                                <span className="rounded-full bg-zinc-200 px-1.5 py-0.2 text-[10px] font-bold text-zinc-800">
                                                    {t.count}
                                                </span>
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Color Distribution */}
                            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs lg:col-span-3">
                                <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
                                    <div className="rounded-lg bg-violet-50 p-1.5 text-violet-600">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-zinc-900">Color Palette</h2>
                                        <p className="text-xs text-zinc-500">Theme usage distribution</p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    {colorDist.length === 0 ? (
                                        <p className="text-xs text-zinc-400 py-6 text-center">No color metrics</p>
                                    ) : (
                                        colorDist.map((c) => (
                                            <div key={c.color} className="flex items-center justify-between text-xs py-1">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-xs"
                                                        style={{ backgroundColor: c.color }}
                                                    />
                                                    <span className="capitalize font-semibold text-zinc-700">{c.color}</span>
                                                </div>
                                                <span className="font-bold text-zinc-900">{c.count} note{c.count === 1 ? '' : 's'}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs lg:col-span-5">
                                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-lg bg-teal-50 p-1.5 text-teal-600">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-zinc-900">Recent Records</h2>
                                            <p className="text-xs text-zinc-500">Latest modified sticky notes</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2.5">
                                    {recentActivity.length === 0 ? (
                                        <p className="text-xs text-zinc-400 py-6 text-center">No notes created yet</p>
                                    ) : (
                                        recentActivity.map((note) => (
                                            <div
                                                key={note.id}
                                                className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-2.5 text-xs transition hover:bg-zinc-50"
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span
                                                        className="h-2 w-2 rounded-full shrink-0"
                                                        style={{ backgroundColor: note.color }}
                                                    />
                                                    <span className="font-semibold text-zinc-900 truncate max-w-[150px]">
                                                        {note.title}
                                                    </span>
                                                    <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                                                        {note.category}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                                                    <span className={`px-1.5 py-0.5 rounded font-semibold ${
                                                        note.status === 'completed'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {note.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}

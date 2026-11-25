import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Pin,
    Tag,
    RefreshCw,
    Sparkles,
    Layers,
    Search,
    LayoutGrid,
    CheckSquare,
    Circle,
    Palette,
    Code2,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Filter,
    BarChart2
} from 'lucide-react';
import { getDashboardAnalytics, getNotes } from '../services/api';
import StickyNote from '../components/StickyNote';
import AIChatBot from '../components/AIChatBot';

// Helper: Contrast detection for text on custom hex
function isDarkColor(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return false;
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 140;
}

export default function Dashboard({ onBack }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Gallery Filter States
    const [gallerySearch, setGallerySearch] = useState('');
    const [activeFilterView, setActiveFilterView] = useState('ALL'); // 'ALL' | 'TASKS' | 'NOTES'
    const [activeTagFilter, setActiveTagFilter] = useState('ALL');
    const [activeColorFilter, setActiveColorFilter] = useState('ALL');
    const [showVivaPipelines, setShowVivaPipelines] = useState(false);

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
                    loadAllDashboardData(uid);
                } else {
                    setError("User identifier not found in session. Please sign in again.");
                    setLoading(false);
                }
            } catch {
                navigate('/signin');
            }
        }
    }, [navigate]);

    const loadAllDashboardData = async (userId, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const [analyticsData, notesData] = await Promise.all([
                getDashboardAnalytics(userId),
                getNotes(userId)
            ]);
            setAnalytics(analyticsData);
            setNotes(Array.isArray(notesData) ? notesData : []);
        } catch (err) {
            setError(err.message || 'Failed to connect to backend aggregation service.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const summary = analytics?.summary || {
        totalNotes: notes.length,
        completedNotes: notes.filter(n => n.isTask && (n.status || '').toLowerCase() === 'completed').length,
        pendingNotes: notes.filter(n => n.isTask && (n.status || '').toLowerCase() !== 'completed').length,
        pinnedNotes: notes.filter(n => n.isPinned).length,
        completionRate: 0.0
    };

    const topTags = analytics?.topTags || [];
    const colorDist = analytics?.colorDistribution || [];

    // Filter notes for the Gallery View
    const filteredGalleryNotes = notes.filter(note => {
        const query = (gallerySearch || '').toLowerCase();
        const matchesQuery = !query ||
            (note.title || '').toLowerCase().includes(query) ||
            (note.content || '').toLowerCase().includes(query) ||
            (note.tags || []).some(t => (t || '').toLowerCase().includes(query));

        let matchesView = true;
        if (activeFilterView === 'TASKS') matchesView = Boolean(note.isTask);
        else if (activeFilterView === 'NOTES') matchesView = !note.isTask;

        let matchesTag = true;
        if (activeTagFilter !== 'ALL') {
            matchesTag = (note.tags || []).some(t => t.toLowerCase() === activeTagFilter.toLowerCase());
        }

        let matchesColor = true;
        if (activeColorFilter !== 'ALL') {
            matchesColor = (note.color || '').toLowerCase() === activeColorFilter.toLowerCase();
        }

        return matchesQuery && matchesView && matchesTag && matchesColor;
    });

    // Pinned notes bubble to top
    const sortedGalleryNotes = [...filteredGalleryNotes].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    const totalTaskNotes = notes.filter(n => n.isTask).length;
    const completedTaskNotes = notes.filter(n => n.isTask && (n.status || '').toLowerCase() === 'completed').length;
    const pendingTaskNotes = totalTaskNotes - completedTaskNotes;
    const taskRate = totalTaskNotes > 0 ? Math.round((completedTaskNotes / totalTaskNotes) * 100) : 0;

    return (
        <div className="min-h-screen bg-zinc-50/70 pb-24 pt-6 font-sans text-zinc-900 select-none">
            <div className="mx-auto max-w-[1680px] w-full px-2 sm:px-4 md:px-6">

                {/* Top Navigation & Header */}
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/workspace')}
                            className="group flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-2xs transition hover:bg-zinc-50 cursor-pointer"
                            title="Back to Workspace"
                        >
                            <ArrowLeft className="h-5 w-5 text-zinc-600 transition group-hover:-translate-x-0.5" />
                        </button>

                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                                    Gallery & Analytics
                                </h1>
                                {user && (
                                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                                        Hi, {user.name}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Visual Gallery View, color spectrums, tag clusters & MongoDB aggregation insights
                            </p>
                        </div>
                    </div>

                    {/* Header Controls */}
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setShowVivaPipelines(!showVivaPipelines)}
                            className="flex h-9 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 text-xs font-semibold text-indigo-700 shadow-2xs transition hover:bg-indigo-100 cursor-pointer"
                            title="Toggle MongoDB Viva Aggregation Pipelines"
                        >
                            <Code2 className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Viva Pipelines</span>
                            {showVivaPipelines ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>

                        <button
                            type="button"
                            onClick={() => user && loadAllDashboardData(user.id, true)}
                            disabled={refreshing}
                            className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 cursor-pointer disabled:opacity-50"
                            title="Refresh database aggregations"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
                            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-600 flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={() => user && loadAllDashboardData(user.id)}
                            className="text-xs font-semibold underline hover:no-underline cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Viva Defense Aggregation Pipelines Accordion */}
                {showVivaPipelines && (
                    <div className="mb-6 rounded-2xl border border-indigo-100 bg-white p-5 shadow-xs animate-fadeIn">
                        <div className="flex items-center justify-between pb-3 border-b border-indigo-50">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
                                    <Code2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900">MongoDB Aggregation Pipeline Architecture (Viva Guide)</h3>
                                    <p className="text-xs text-zinc-500">Real PyMongo multi-stage operators driving this Gallery & Analytics Dashboard</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                            <div className="bg-zinc-900 text-zinc-200 p-3.5 rounded-xl font-mono space-y-1.5">
                                <span className="text-indigo-400 font-bold block">// 1. Executive Summary ($group)</span>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                    pipeline = [<br/>
                                    &nbsp;&nbsp;&#123;"$match": &#123;"userId": user_id&#125;&#125;,<br/>
                                    &nbsp;&nbsp;&#123;"$group": &#123;<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;"total": &#123;"$sum": 1&#125;,<br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;"completed": &#123;"$sum": &#123;"$cond": [...]&#125;&#125;<br/>
                                    &nbsp;&nbsp;&#125;&#125;<br/>
                                    ]
                                </p>
                            </div>

                            <div className="bg-zinc-900 text-zinc-200 p-3.5 rounded-xl font-mono space-y-1.5">
                                <span className="text-pink-400 font-bold block">// 2. Tag Vocabulary ($unwind)</span>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                    pipeline = [<br/>
                                    &nbsp;&nbsp;&#123;"$unwind": "$tags"&#125;,<br/>
                                    &nbsp;&nbsp;&#123;"$group": &#123;"_id": "$tags", "count": &#123;"$sum": 1&#125;&#125;&#125;,<br/>
                                    &nbsp;&nbsp;&#123;"$sort": &#123;"count": -1&#125;&#125;,<br/>
                                    &nbsp;&nbsp;&#123;"$limit": 10&#125;<br/>
                                    ]
                                </p>
                            </div>

                            <div className="bg-zinc-900 text-zinc-200 p-3.5 rounded-xl font-mono space-y-1.5">
                                <span className="text-emerald-400 font-bold block">// 3. Hex Spectrum Palette ($group)</span>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                    pipeline = [<br/>
                                    &nbsp;&nbsp;&#123;"$match": &#123;"userId": user_id&#125;&#125;,<br/>
                                    &nbsp;&nbsp;&#123;"$group": &#123;"_id": "$color", "count": &#123;"$sum": 1&#125;&#125;&#125;,<br/>
                                    &nbsp;&nbsp;&#123;"$project": &#123;"color": "$_id", "count": 1&#125;&#125;,<br/>
                                    &nbsp;&nbsp;&#123;"$sort": &#123;"count": -1&#125;&#125;<br/>
                                    ]
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 1. Executive Gallery KPI Strip */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 mb-6">
                    {/* Total Notes */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-500">Gallery Items</span>
                            <div className="rounded-lg bg-indigo-50 p-1 text-indigo-600">
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-zinc-900">{notes.length}</span>
                            <span className="text-[10px] text-zinc-400">cards</span>
                        </div>
                    </div>

                    {/* Task Execution */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-500">Task Completion</span>
                            <div className="rounded-lg bg-emerald-50 p-1 text-emerald-600">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-emerald-600">{taskRate}%</span>
                            <span className="text-[10px] text-zinc-400">({completedTaskNotes}/{totalTaskNotes})</span>
                        </div>
                    </div>

                    {/* Pending Tasks */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-500">Pending Tasks</span>
                            <div className="rounded-lg bg-amber-50 p-1 text-amber-600">
                                <Clock className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-amber-600">{pendingTaskNotes}</span>
                            <span className="text-[10px] text-zinc-400">active</span>
                        </div>
                    </div>

                    {/* Color Palette Depth */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-500">Color Palette</span>
                            <div className="rounded-lg bg-violet-50 p-1 text-violet-600">
                                <Palette className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-violet-600">{colorDist.length}</span>
                            <span className="text-[10px] text-zinc-400">hex shades</span>
                        </div>
                    </div>

                    {/* Pinned Notes */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-500">Pinned Spotlight</span>
                            <div className="rounded-lg bg-rose-50 p-1 text-rose-600">
                                <Pin className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-rose-600">{summary.pinnedNotes}</span>
                            <span className="text-[10px] text-zinc-400">starred</span>
                        </div>
                    </div>
                </div>

                {/* 2. Color Spectrum & Tag Knowledge Clusters Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                    {/* Visual Color Spectrum Swatches (5 cols) */}
                    <div className="md:col-span-6 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                            <div className="flex items-center gap-1.5">
                                <Palette className="h-4 w-4 text-violet-600" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                                    Color Spectrum Palette ({colorDist.length})
                                </h3>
                            </div>
                            {activeColorFilter !== 'ALL' && (
                                <button
                                    onClick={() => setActiveColorFilter('ALL')}
                                    className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                                >
                                    Reset Color Filter
                                </button>
                            )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {colorDist.length === 0 ? (
                                <span className="text-xs text-zinc-400 italic">No colors detected yet.</span>
                            ) : (
                                colorDist.map((c) => {
                                    const isSelected = activeColorFilter.toLowerCase() === c.color.toLowerCase();
                                    const isDark = isDarkColor(c.color);
                                    return (
                                        <button
                                            key={c.color}
                                            type="button"
                                            onClick={() => setActiveColorFilter(isSelected ? 'ALL' : c.color)}
                                            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                                                isSelected
                                                    ? 'ring-2 ring-indigo-500 ring-offset-1 border-indigo-300'
                                                    : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                                            }`}
                                            title={`Filter gallery by ${c.color} (${c.count} notes)`}
                                        >
                                            <span
                                                className="h-4 w-4 rounded-full border border-black/15 shadow-inner shrink-0"
                                                style={{ backgroundColor: c.color }}
                                            />
                                            <span className="text-[11px] font-mono font-bold uppercase text-zinc-800">
                                                {c.color}
                                            </span>
                                            <span className="text-[10px] font-semibold text-zinc-500 bg-white px-1.5 py-0.2 rounded-full border border-zinc-200">
                                                {c.count}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Tag Knowledge Clusters (6 cols) */}
                    <div className="md:col-span-6 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                            <div className="flex items-center gap-1.5">
                                <Tag className="h-4 w-4 text-pink-600" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                                    Tag Knowledge Clusters ({topTags.length})
                                </h3>
                            </div>
                            {activeTagFilter !== 'ALL' && (
                                <button
                                    onClick={() => setActiveTagFilter('ALL')}
                                    className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                                >
                                    Reset Tag Filter
                                </button>
                            )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {topTags.length === 0 ? (
                                <span className="text-xs text-zinc-400 italic">No tags found. Add tags in Workspace.</span>
                            ) : (
                                topTags.map((t) => {
                                    const isSelected = activeTagFilter.toLowerCase() === t.tag.toLowerCase();
                                    return (
                                        <button
                                            key={t.tag}
                                            type="button"
                                            onClick={() => setActiveTagFilter(isSelected ? 'ALL' : t.tag)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer shadow-2xs ${
                                                isSelected
                                                    ? 'bg-zinc-900 text-white'
                                                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                            }`}
                                            title={`Filter gallery by #${t.tag}`}
                                        >
                                            <span>#{t.tag}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                                isSelected ? 'bg-white/20 text-white' : 'bg-white text-zinc-800'
                                            }`}>
                                                {t.count}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. The Visual Gallery Showcase Section */}
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                    
                    {/* Gallery Filter & Search Toolbar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 text-xs">
                        
                        {/* Left: View Filter Modes */}
                        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                            <span className="flex items-center gap-1 font-semibold text-zinc-400 text-[11px] shrink-0">
                                <Filter className="h-3 w-3" /> Show:
                            </span>

                            <div className="flex items-center rounded-xl bg-zinc-100 p-0.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveFilterView('ALL')}
                                    className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                                        activeFilterView === 'ALL'
                                            ? 'bg-white text-zinc-900 shadow-2xs'
                                            : 'text-zinc-600 hover:text-zinc-900'
                                    }`}
                                >
                                    All ({notes.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveFilterView('TASKS')}
                                    className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                                        activeFilterView === 'TASKS'
                                            ? 'bg-white text-zinc-900 shadow-2xs'
                                            : 'text-zinc-600 hover:text-zinc-900'
                                    }`}
                                >
                                    <CheckSquare className="h-3 w-3 text-indigo-600" />
                                    <span>Tasks ({totalTaskNotes})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveFilterView('NOTES')}
                                    className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                                        activeFilterView === 'NOTES'
                                            ? 'bg-white text-zinc-900 shadow-2xs'
                                            : 'text-zinc-600 hover:text-zinc-900'
                                    }`}
                                >
                                    Notes ({notes.length - totalTaskNotes})
                                </button>
                            </div>

                            {/* Active Tag or Color indicator pill */}
                            {(activeTagFilter !== 'ALL' || activeColorFilter !== 'ALL') && (
                                <div className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-xl text-indigo-700 text-[11px] font-semibold shrink-0">
                                    <span>Filtered by:</span>
                                    {activeTagFilter !== 'ALL' && <span>#{activeTagFilter}</span>}
                                    {activeColorFilter !== 'ALL' && <span className="uppercase font-mono">{activeColorFilter}</span>}
                                    <button
                                        onClick={() => {
                                            setActiveTagFilter('ALL');
                                            setActiveColorFilter('ALL');
                                        }}
                                        className="ml-1 text-indigo-900 font-bold hover:underline cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right: Quick Search in Gallery */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Filter gallery notes..."
                                value={gallerySearch}
                                onChange={(e) => setGallerySearch(e.target.value)}
                                className="w-full h-8.5 rounded-xl border border-zinc-200 bg-zinc-50/70 py-1 pl-8.5 pr-3 text-xs text-zinc-800 placeholder-zinc-400 outline-none transition focus:bg-white focus:border-indigo-500 shadow-2xs"
                            />
                        </div>
                    </div>

                    {/* 6-Column Gallery Grid */}
                    {sortedGalleryNotes.length === 0 ? (
                        <div className="py-20 text-center text-zinc-400">
                            <LayoutGrid className="h-10 w-10 mx-auto opacity-30 mb-2" />
                            <p className="text-sm font-bold text-zinc-700">No notes match current gallery filters</p>
                            <p className="text-xs text-zinc-400 mt-0.5">Try resetting tag, color, or search filters above.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-6 gap-2.5 sm:gap-3">
                            {sortedGalleryNotes.map(note => (
                                <StickyNote
                                    key={note.id}
                                    id={note.id}
                                    title={note.title}
                                    content={note.content}
                                    color={note.color}
                                    tags={note.tags}
                                    isTask={note.isTask}
                                    status={note.status}
                                    isPinned={note.isPinned}
                                    updatedAt={note.updatedAt}
                                    mode="display"
                                />
                            ))}
                        </div>
                    )}

                </div>

            </div>

            {/* Local AI Floating Chatbot */}
            <AIChatBot user={user} />
        </div>
    );
}

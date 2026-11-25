import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    ArrowLeft,
    FileText,
    X,
    Loader2,
    Sparkles,
    BarChart3,
    Filter,
    CheckCircle2,
    Clock,
    Tag,
    Pin,
    CheckSquare,
    Square,
    Check,
    Palette,
    Code2,
    ChevronDown,
    ChevronUp,
    LayoutGrid,
    Flame
} from 'lucide-react';
import StickyNote from '../components/StickyNote';
import AIChatBot from '../components/AIChatBot';
import { getNotes, createNote, updateNote, deleteNote, getDashboardAnalytics } from '../services/api';

// 12 curated pastel sticky note colors for a clean linear palette
const COLORS = [
    { name: 'yellow', bg: '#fef08a', text: '#713f12' },
    { name: 'amber', bg: '#fed7aa', text: '#7c2d12' },
    { name: 'emerald', bg: '#bbf7d0', text: '#064e3b' },
    { name: 'rose', bg: '#fecdd3', text: '#881337' },
    { name: 'purple', bg: '#e9d5ff', text: '#581c87' },
    { name: 'cyan', bg: '#cffafe', text: '#164e63' },
    { name: 'blue', bg: '#bfdbfe', text: '#1e3a8a' },
    { name: 'indigo', bg: '#e0e7ff', text: '#312e81' },
    { name: 'lime', bg: '#d9f99d', text: '#365314' },
    { name: 'pink', bg: '#fbcfe8', text: '#701a75' },
    { name: 'violet', bg: '#ddd6fe', text: '#4c1d95' },
    { name: 'red', bg: '#fecaca', text: '#7f1d1d' },
];

// Helper: HSL Hue to Hex Pastel
function hueToHex(h, s = 85, l = 82) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Helper: Hex to Hue
function hexToHue(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return 55;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
        const d = max - min;
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return Math.round(h * 360);
}

// Helper: Resolve color name or hex
function resolveColorHex(colorStr) {
    if (!colorStr) return '#fef08a';
    if (colorStr.startsWith('#')) return colorStr;
    const match = COLORS.find(c => c.name.toLowerCase() === colorStr.toLowerCase());
    return match ? match.bg : '#fef08a';
}

// Helper: Contrast detection for text
function isDarkColor(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return false;
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 140;
}

const POPULAR_PRESET_TAGS = [
    'Travel',
    'Food',
    'Places',
    'Ideas',
    'Work',
    'Study',
    'Personal',
    'Urgent',
    'Finance',
    'Wishlist'
];

export default function Workspace({ onBack }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [notes, setNotes] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedView, setSelectedView] = useState('ALL'); // 'ALL' | 'TASKS' | 'NOTES'
    const [selectedTaskStatus, setSelectedTaskStatus] = useState('ALL'); // 'ALL' | 'pending' | 'completed'
    const [selectedTag, setSelectedTag] = useState('ALL');
    const [selectedColor, setSelectedColor] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Single-page Analytics Dashboard Toggles
    const [showAnalyticsSection, setShowAnalyticsSection] = useState(true);
    const [showVivaPipelines, setShowVivaPipelines] = useState(false);

    // Modal state for Creating / Editing Note
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [customTagInput, setCustomTagInput] = useState('');
    const [modalHue, setModalHue] = useState(55);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        color: '#fef08a',
        tags: [],
        isTask: false,
        status: 'pending',
        isPinned: false
    });

    // Check authentication and load notes + analytics
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
                    fetchUserNotes(uid);
                } else {
                    navigate('/signin');
                }
            } catch {
                navigate('/signin');
            }
        }
    }, [navigate]);

    const fetchUserNotes = async (userId, isSilent = false) => {
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            const [fetchedNotes, fetchedAnalytics] = await Promise.all([
                getNotes(userId),
                getDashboardAnalytics(userId).catch(() => null)
            ]);
            setNotes(Array.isArray(fetchedNotes) ? fetchedNotes : []);
            if (fetchedAnalytics) setAnalytics(fetchedAnalytics);
        } catch (err) {
            setError(err.message || 'Failed to retrieve your notes.');
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingNote(null);
        setCustomTagInput('');
        setModalHue(55);
        setFormData({
            title: '',
            content: '',
            color: '#fef08a',
            tags: [],
            isTask: false,
            status: 'pending',
            isPinned: false
        });
        setIsModalOpen(true);
    };

    const openEditModal = (note) => {
        setEditingNote(note);
        setCustomTagInput('');
        const noteHex = resolveColorHex(note.color);
        setModalHue(hexToHue(noteHex));
        setFormData({
            title: note.title || '',
            content: note.content || '',
            color: noteHex,
            tags: Array.isArray(note.tags) ? [...note.tags] : [],
            isTask: Boolean(note.isTask),
            status: note.status || 'pending',
            isPinned: Boolean(note.isPinned)
        });
        setIsModalOpen(true);
    };

    const handleToggleTag = (tag) => {
        const cleanTag = tag.trim().replace(/^#/, '');
        if (!cleanTag) return;
        setFormData(prev => {
            const exists = prev.tags.some(t => t.toLowerCase() === cleanTag.toLowerCase());
            if (exists) {
                return { ...prev, tags: prev.tags.filter(t => t.toLowerCase() !== cleanTag.toLowerCase()) };
            } else {
                return { ...prev, tags: [...prev.tags, cleanTag] };
            }
        });
    };

    const handleAddCustomTag = (e) => {
        e?.preventDefault();
        const cleanTag = customTagInput.trim().replace(/^#/, '');
        if (!cleanTag) return;
        if (!formData.tags.some(t => t.toLowerCase() === cleanTag.toLowerCase())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, cleanTag] }));
        }
        setCustomTagInput('');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const uid = user?.id || user?._id || user?.userId;
        if (!uid) return;

        setError(null);
        const notePayload = {
            title: formData.title.trim() || 'Untitled Note',
            content: formData.content.trim(),
            color: formData.color,
            tags: formData.tags,
            isTask: formData.isTask,
            status: formData.isTask ? (formData.status || 'pending') : 'pending',
            isPinned: formData.isPinned,
            category: 'General',
            priority: 'medium',
            userId: uid
        };

        try {
            if (editingNote) {
                const updated = await updateNote(editingNote.id, notePayload);
                setNotes(prev => prev.map(n => n.id === editingNote.id ? updated : n));
            } else {
                const created = await createNote(notePayload);
                setNotes(prev => [created, ...prev.filter(n => n.id !== created.id)]);
                if (searchQuery) setSearchQuery('');
            }
            setIsModalOpen(false);
            fetchUserNotes(uid, true);
        } catch (err) {
            setError(err.message || 'Failed to save note.');
        }
    };

    const handleDelete = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;

        const uid = user?.id || user?._id || user?.userId;
        setError(null);
        setNotes(prev => prev.filter(n => n.id !== noteId));

        try {
            await deleteNote(noteId);
            if (uid) fetchUserNotes(uid, true);
        } catch (err) {
            setError(err.message || 'Failed to delete note.');
            if (uid) fetchUserNotes(uid);
        }
    };

    const handleTogglePin = async (note) => {
        const uid = user?.id || user?._id || user?.userId;
        const updatedPinned = !note.isPinned;

        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, isPinned: updatedPinned } : n));

        try {
            const updated = await updateNote(note.id, { isPinned: updatedPinned });
            setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
            if (uid) fetchUserNotes(uid, true);
        } catch (err) {
            setError(err.message || 'Failed to update pin status.');
            if (uid) fetchUserNotes(uid);
        }
    };

    const handleToggleStatus = async (note) => {
        const uid = user?.id || user?._id || user?.userId;
        const nextStatus = (note.status || '').toLowerCase() === 'completed' ? 'pending' : 'completed';

        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, status: nextStatus } : n));

        try {
            const updated = await updateNote(note.id, { status: nextStatus, isTask: true });
            setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
            if (uid) fetchUserNotes(uid, true);
        } catch (err) {
            setError(err.message || 'Failed to update task status.');
            if (uid) fetchUserNotes(uid);
        }
    };

    const handleUpdateNoteColor = async (noteId, newColor) => {
        const uid = user?.id || user?._id || user?.userId;
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, color: newColor } : n));
        try {
            const updated = await updateNote(noteId, { color: newColor });
            setNotes(prev => prev.map(n => n.id === noteId ? updated : n));
            if (uid) fetchUserNotes(uid, true);
        } catch (err) {
            console.error('Failed to update note color:', err);
        }
    };

    // Calculate real-time dynamic analytics directly from notes state
    const totalNotesCount = notes.length;
    const taskNotes = notes.filter(n => n.isTask);
    const completedTasksCount = taskNotes.filter(n => (n.status || '').toLowerCase() === 'completed').length;
    const pendingTasksCount = taskNotes.length - completedTasksCount;
    const completionRate = taskNotes.length > 0 ? Math.round((completedTasksCount / taskNotes.length) * 100) : 0;
    const pinnedNotesCount = notes.filter(n => n.isPinned).length;

    // Dynamic Color Spectrum distribution
    const colorFrequencyMap = {};
    notes.forEach(n => {
        const c = (n.color || '#fef08a').toLowerCase();
        colorFrequencyMap[c] = (colorFrequencyMap[c] || 0) + 1;
    });
    const dynamicColorList = Object.entries(colorFrequencyMap)
        .map(([hex, count]) => ({ hex, count }))
        .sort((a, b) => b.count - a.count);

    // Dynamic Tag Vocabulary distribution
    const tagFrequencyMap = {};
    notes.forEach(n => {
        (n.tags || []).forEach(t => {
            const clean = t.trim().replace(/^#/, '');
            if (clean) tagFrequencyMap[clean] = (tagFrequencyMap[clean] || 0) + 1;
        });
    });
    const dynamicTagList = Object.entries(tagFrequencyMap)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

    // Filter notes
    const filteredNotes = notes.filter(note => {
        const query = (searchQuery || '').toLowerCase();
        const matchesTitle = (note.title || '').toLowerCase().includes(query);
        const matchesContent = (note.content || '').toLowerCase().includes(query);
        const matchesTags = (note.tags || []).some(tag => (tag || '').toLowerCase().includes(query));
        const matchesSearch = !query || matchesTitle || matchesContent || matchesTags;

        // View Type Filter (All, Tasks, Notes)
        let matchesView = true;
        if (selectedView === 'TASKS') {
            matchesView = Boolean(note.isTask);
            if (selectedTaskStatus !== 'ALL') {
                matchesView = matchesView && (note.status || 'pending').toLowerCase() === selectedTaskStatus.toLowerCase();
            }
        } else if (selectedView === 'NOTES') {
            matchesView = !note.isTask;
        }

        // Tag Filter
        const matchesTag = selectedTag === 'ALL' || (note.tags || []).some(t => t.toLowerCase() === selectedTag.toLowerCase());

        // Color Filter
        const matchesColor = selectedColor === 'ALL' || (note.color || '').toLowerCase() === selectedColor.toLowerCase();

        return matchesSearch && matchesView && matchesTag && matchesColor;
    });

    // Pinned notes bubble to top
    const sortedNotes = [...filteredNotes].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    // Resolve modal color
    const resolvedModalHex = resolveColorHex(formData.color);
    const isModalDark = isDarkColor(resolvedModalHex);
    const modalTextColor = isModalDark ? '#ffffff' : '#18181b';

    return (
        <div className="min-h-screen bg-zinc-50/70 pb-24 pt-4 sm:pt-6 font-sans select-none text-zinc-900">
            <div className="mx-auto max-w-[1720px] w-full px-2.5 sm:px-4 md:px-6">

                {/* Header Navigation & Unified Top Bar */}
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="group flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-2xs transition hover:bg-zinc-50 cursor-pointer"
                            title="Back to Landing"
                        >
                            <ArrowLeft className="h-4 w-4 text-zinc-600 transition group-hover:-translate-x-0.5" />
                        </button>

                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                                    Your Workspace
                                </h1>
                                {user && (
                                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                                        Hi, {user.name}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-zinc-500">
                                Sticky notes pinboard, color spectrums & MongoDB aggregation analytics
                            </p>
                        </div>
                    </div>

                    {/* Header Controls: Search, Analytics Toggle, Viva, and Add Note */}
                    <div className="flex items-center flex-wrap gap-2">
                        {/* Live Search */}
                        <div className="relative flex-1 sm:w-64 min-w-[200px]">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search title, content, or #tag..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9 rounded-xl border border-zinc-200 bg-white py-1.5 pl-8.5 pr-3 text-xs text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 shadow-2xs"
                            />
                        </div>

                        {/* Analytics Strip Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowAnalyticsSection(!showAnalyticsSection)}
                            className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition cursor-pointer shadow-2xs ${
                                showAnalyticsSection
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                            }`}
                            title="Toggle Analytics & Palette Strip"
                        >
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>Analytics</span>
                            {showAnalyticsSection ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>

                        {/* Code Viva Pipelines Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowVivaPipelines(!showVivaPipelines)}
                            className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 shadow-2xs transition hover:bg-zinc-50 cursor-pointer"
                            title="MongoDB Pipelines for Professor Viva"
                        >
                            <Code2 className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="hidden sm:inline">Viva Code</span>
                        </button>

                        {/* Primary Add Sticky Note Button */}
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-3.5 text-xs font-semibold text-white shadow-2xs shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-indigo-600 cursor-pointer active:scale-95"
                        >
                            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>New Note</span>
                        </button>
                    </div>
                </div>

                {/* Integrated Analytics & Visual Palette Dashboard Section (Single Page View) */}
                {showAnalyticsSection && (
                    <div className="mb-4 rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3.5 animate-fadeIn">
                        
                        {/* 1. Executive Analytics KPI Strip */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                            {/* Total Notes */}
                            <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-2.5">
                                <div className="flex items-center justify-between text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                                    <span>Total Notes</span>
                                    <LayoutGrid className="h-3 w-3 text-indigo-600" />
                                </div>
                                <div className="mt-1 flex items-baseline gap-1">
                                    <span className="text-lg font-extrabold text-zinc-900">{totalNotesCount}</span>
                                    <span className="text-[10px] text-zinc-400">cards</span>
                                </div>
                            </div>

                            {/* Task Resolution Meter */}
                            <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-2.5">
                                <div className="flex items-center justify-between text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                                    <span>Tasks Done</span>
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                </div>
                                <div className="mt-1 flex items-baseline gap-1.5">
                                    <span className="text-lg font-extrabold text-emerald-600">{completionRate}%</span>
                                    <span className="text-[10px] text-zinc-500 font-semibold">({completedTasksCount}/{taskNotes.length})</span>
                                </div>
                            </div>

                            {/* Pending Tasks */}
                            <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-2.5">
                                <div className="flex items-center justify-between text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                                    <span>Pending</span>
                                    <Clock className="h-3 w-3 text-amber-600" />
                                </div>
                                <div className="mt-1 flex items-baseline gap-1">
                                    <span className="text-lg font-extrabold text-amber-600">{pendingTasksCount}</span>
                                    <span className="text-[10px] text-zinc-400">tasks</span>
                                </div>
                            </div>

                            {/* Color Spectrum Palette Depth */}
                            <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-2.5">
                                <div className="flex items-center justify-between text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                                    <span>Hex Colors</span>
                                    <Palette className="h-3 w-3 text-violet-600" />
                                </div>
                                <div className="mt-1 flex items-baseline gap-1">
                                    <span className="text-lg font-extrabold text-violet-600">{dynamicColorList.length}</span>
                                    <span className="text-[10px] text-zinc-400">shades</span>
                                </div>
                            </div>

                            {/* Pinned Spotlight */}
                            <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-2.5 col-span-2 sm:col-span-1">
                                <div className="flex items-center justify-between text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                                    <span>Pinned</span>
                                    <Pin className="h-3 w-3 text-rose-600" />
                                </div>
                                <div className="mt-1 flex items-baseline gap-1">
                                    <span className="text-lg font-extrabold text-rose-600">{pinnedNotesCount}</span>
                                    <span className="text-[10px] text-zinc-400">starred</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Color Spectrum Palette & Tag Knowledge Clusters (Clickable Filters) */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-zinc-100">
                            
                            {/* Color Palette Swatches (Click to Filter) */}
                            <div className="md:col-span-6 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                                        <Palette className="h-3 w-3 text-violet-600" />
                                        <span>Color Spectrum Swatches (Click to filter)</span>
                                    </span>
                                    {selectedColor !== 'ALL' && (
                                        <button
                                            onClick={() => setSelectedColor('ALL')}
                                            className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {dynamicColorList.length === 0 ? (
                                        <span className="text-[11px] text-zinc-400 italic">No notes created yet.</span>
                                    ) : (
                                        dynamicColorList.map((c) => {
                                            const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                                            return (
                                                <button
                                                    key={c.hex}
                                                    type="button"
                                                    onClick={() => setSelectedColor(isSelected ? 'ALL' : c.hex)}
                                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer ${
                                                        isSelected
                                                            ? 'ring-2 ring-indigo-500 ring-offset-1 border-indigo-400 bg-indigo-50/50'
                                                            : 'border-zinc-200 hover:border-zinc-300 bg-white shadow-2xs'
                                                    }`}
                                                    title={`Filter workspace by ${c.hex} (${c.count} notes)`}
                                                >
                                                    <span
                                                        className="h-3 w-3 rounded-full border border-black/15 shadow-2xs"
                                                        style={{ backgroundColor: c.hex }}
                                                    />
                                                    <span className="uppercase text-zinc-700">{c.hex}</span>
                                                    <span className="text-[9px] bg-zinc-100 px-1 rounded text-zinc-500">{c.count}</span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Tag Knowledge Clusters (Click to Filter) */}
                            <div className="md:col-span-6 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                                        <Tag className="h-3 w-3 text-pink-600" />
                                        <span>Tag Knowledge Clusters (Click to filter)</span>
                                    </span>
                                    {selectedTag !== 'ALL' && (
                                        <button
                                            onClick={() => setSelectedTag('ALL')}
                                            className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {dynamicTagList.length === 0 ? (
                                        <span className="text-[11px] text-zinc-400 italic">No tags added yet.</span>
                                    ) : (
                                        dynamicTagList.slice(0, 10).map((t) => {
                                            const isSelected = selectedTag.toLowerCase() === t.tag.toLowerCase();
                                            return (
                                                <button
                                                    key={t.tag}
                                                    type="button"
                                                    onClick={() => setSelectedTag(isSelected ? 'ALL' : t.tag)}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-zinc-900 text-white shadow-2xs'
                                                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                                    }`}
                                                    title={`Filter workspace by #${t.tag}`}
                                                >
                                                    <span>#{t.tag}</span>
                                                    <span className={`text-[9px] font-bold px-1 rounded-full ${
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

                    </div>
                )}

                {/* MongoDB Viva Aggregation Defense Pipelines Accordion */}
                {showVivaPipelines && (
                    <div className="mb-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs animate-fadeIn">
                        <div className="flex items-center justify-between pb-2 border-b border-indigo-50 text-xs">
                            <div className="flex items-center gap-2">
                                <Code2 className="h-4 w-4 text-indigo-600" />
                                <span className="font-bold text-zinc-900">MongoDB Multi-Stage Pipelines (Viva Defense Reference)</span>
                            </div>
                            <button
                                onClick={() => setShowVivaPipelines(false)}
                                className="text-zinc-400 hover:text-zinc-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs font-mono">
                            <div className="bg-zinc-950 text-zinc-200 p-3 rounded-xl space-y-1">
                                <span className="text-indigo-400 font-bold block text-[11px]">// 1. Summary ($group)</span>
                                <p className="text-[10px] text-zinc-400 leading-relaxed">
                                    [<br/>
                                    &nbsp;&#123;"$match": &#123;"userId": user_id&#125;&#125;,<br/>
                                    &nbsp;&#123;"$group": &#123;<br/>
                                    &nbsp;&nbsp;&nbsp;"totalNotes": &#123;"$sum": 1&#125;,<br/>
                                    &nbsp;&nbsp;&nbsp;"completed": &#123;"$sum": &#123;"$cond": [...]&#125;&#125;<br/>
                                    &nbsp;&#125;&#125;<br/>
                                    ]
                                </p>
                            </div>
                            <div className="bg-zinc-950 text-zinc-200 p-3 rounded-xl space-y-1">
                                <span className="text-pink-400 font-bold block text-[11px]">// 2. Tags Vocabulary ($unwind)</span>
                                <p className="text-[10px] text-zinc-400 leading-relaxed">
                                    [<br/>
                                    &nbsp;&#123;"$unwind": "$tags"&#125;,<br/>
                                    &nbsp;&#123;"$group": &#123;"_id": "$tags", "count": &#123;"$sum": 1&#125;&#125;&#125;,<br/>
                                    &nbsp;&#123;"$sort": &#123;"count": -1&#125;&#125;,<br/>
                                    &nbsp;&#123;"$limit": 10&#125;<br/>
                                    ]
                                </p>
                            </div>
                            <div className="bg-zinc-950 text-zinc-200 p-3 rounded-xl space-y-1">
                                <span className="text-emerald-400 font-bold block text-[11px]">// 3. Hex Color Spectrum ($group)</span>
                                <p className="text-[10px] text-zinc-400 leading-relaxed">
                                    [<br/>
                                    &nbsp;&#123;"$match": &#123;"userId": user_id&#125;&#125;,<br/>
                                    &nbsp;&#123;"$group": &#123;"_id": "$color", "count": &#123;"$sum": 1&#125;&#125;&#125;,<br/>
                                    &nbsp;&#123;"$sort": &#123;"count": -1&#125;&#125;<br/>
                                    ]
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Workspace Filter Toolbar: View Mode & Active Filter Badges */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-zinc-200/80 bg-white p-2.5 shadow-2xs text-xs">
                    
                    {/* View Mode Pills (All, Tasks, Regular Notes) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                        <span className="flex items-center gap-1 font-semibold text-zinc-400 text-[11px] shrink-0 mr-1">
                            <Filter className="h-3 w-3" /> View:
                        </span>

                        <div className="flex items-center rounded-lg bg-zinc-100 p-0.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => setSelectedView('ALL')}
                                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                                    selectedView === 'ALL'
                                        ? 'bg-white text-zinc-900 shadow-2xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                All Notes ({notes.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedView('TASKS')}
                                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                                    selectedView === 'TASKS'
                                        ? 'bg-white text-zinc-900 shadow-2xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                <CheckSquare className="h-3 w-3 text-indigo-600" />
                                <span>Tasks ({taskNotes.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedView('NOTES')}
                                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                                    selectedView === 'NOTES'
                                        ? 'bg-white text-zinc-900 shadow-2xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Regular Notes ({notes.length - taskNotes.length})
                            </button>
                        </div>

                        {/* Task Status sub-filters */}
                        {selectedView === 'TASKS' && (
                            <div className="flex items-center gap-1 bg-indigo-50 p-0.5 rounded-lg border border-indigo-100 text-[10px] animate-fadeIn ml-1">
                                {['ALL', 'pending', 'completed'].map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setSelectedTaskStatus(st)}
                                        className={`px-2 py-0.5 rounded-md font-semibold transition capitalize cursor-pointer ${
                                            selectedTaskStatus === st
                                                ? 'bg-white text-indigo-900 shadow-2xs'
                                                : 'text-indigo-600 hover:text-indigo-900'
                                        }`}
                                    >
                                        {st === 'ALL' ? 'All' : st}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active Filter Indicators (Tag or Color) */}
                    {(selectedTag !== 'ALL' || selectedColor !== 'ALL') && (
                        <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg text-indigo-800 text-[11px] font-semibold">
                            <span>Filtering by:</span>
                            {selectedTag !== 'ALL' && <span className="bg-white px-1.5 py-0.2 rounded border border-indigo-200">#{selectedTag}</span>}
                            {selectedColor !== 'ALL' && (
                                <span className="inline-flex items-center gap-1 bg-white px-1.5 py-0.2 rounded border border-indigo-200 font-mono uppercase">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedColor }} />
                                    {selectedColor}
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSelectedTag('ALL');
                                    setSelectedColor('ALL');
                                }}
                                className="ml-1 text-indigo-950 font-bold hover:underline cursor-pointer"
                            >
                                Clear All
                            </button>
                        </div>
                    )}

                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex justify-between items-center">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 cursor-pointer">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {/* 6-Column Main Workspace Grid (Enforced 6 items per row on desktop) */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        <span className="mt-4 text-xs font-semibold">Loading your sticky notes...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6 gap-2.5 sm:gap-3">

                        {/* Add Sticky Note Card Trigger */}
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 hover:border-indigo-500 hover:bg-white transition-all duration-300 aspect-square min-h-[155px] p-2.5 cursor-pointer bg-white/50 group rounded-sm shadow-2xs hover:shadow-md"
                        >
                            <div className="rounded-xl bg-zinc-100 p-2 group-hover:bg-indigo-50 transition duration-300 shadow-2xs">
                                <Plus className="h-4 w-4 text-zinc-500 group-hover:text-indigo-600 transition duration-300 group-hover:scale-110" />
                            </div>
                            <span className="mt-2 text-[13px] sm:text-[14.5px] font-bold text-zinc-800 group-hover:text-indigo-600 transition">
                                Add Note
                            </span>
                            <span className="text-[10px] text-zinc-400 mt-0.5 text-center px-1">Write ideas & to-dos</span>
                        </button>

                        {/* Notes Cards (6 per row, compact size with preserved legible text) */}
                        {sortedNotes.map(note => (
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
                                mode="workspace"
                                onEdit={() => openEditModal(note)}
                                onDelete={() => handleDelete(note.id)}
                                onPin={() => handleTogglePin(note)}
                                onToggleStatus={() => handleToggleStatus(note)}
                                onUpdateColor={(newHex) => handleUpdateNoteColor(note.id, newHex)}
                            />
                        ))}

                    </div>
                )}

                {/* Empty State Banner */}
                {!loading && sortedNotes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400">
                        <FileText className="h-10 w-10 opacity-30 mb-2" />
                        <h3 className="text-sm font-bold text-zinc-700">No notes match current filters</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">Try resetting your filters or click "+ New Note" to add one.</p>
                    </div>
                )}
            </div>

            {/* Sticky Note Creation & Editing Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 sm:p-6 backdrop-blur-xs overflow-y-auto">
                    <div
                        className="w-full max-w-[480px] scale-100 transform rounded-sm p-5 sm:p-6 shadow-2xl transition-all my-8 border border-black/10 relative flex flex-col justify-between"
                        style={{
                            backgroundColor: resolvedModalHex,
                            color: modalTextColor
                        }}
                    >
                        <form onSubmit={handleFormSubmit} className="space-y-3.5">
                            
                            {/* Modal Header: Task Toggle, Pin & Close */}
                            <div className="flex items-center justify-between pb-2 border-b border-black/10 text-xs">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, isTask: !prev.isTask }))}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer shadow-2xs ${
                                            formData.isTask
                                                ? 'bg-zinc-900 text-white'
                                                : 'bg-black/10 text-zinc-800 hover:bg-black/15'
                                        }`}
                                    >
                                        {formData.isTask ? (
                                            <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                                        ) : (
                                            <Square className="h-3.5 w-3.5 opacity-60" />
                                        )}
                                        <span>Task / To-Do</span>
                                    </button>

                                    {formData.isTask && (
                                        <div className="inline-flex items-center bg-black/10 p-0.5 rounded-full text-[11px] font-semibold">
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, status: 'pending' }))}
                                                className={`px-2 py-0.5 rounded-full transition cursor-pointer ${
                                                    formData.status === 'pending'
                                                        ? 'bg-white text-zinc-900 shadow-2xs'
                                                        : 'opacity-70 hover:opacity-100'
                                                }`}
                                            >
                                                Pending
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, status: 'completed' }))}
                                                className={`px-2 py-0.5 rounded-full transition cursor-pointer ${
                                                    formData.status === 'completed'
                                                        ? 'bg-emerald-700 text-white shadow-2xs'
                                                        : 'opacity-70 hover:opacity-100'
                                                }`}
                                            >
                                                Done ✓
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, isPinned: !prev.isPinned }))}
                                        className={`p-1.5 rounded-lg hover:bg-black/10 transition cursor-pointer ${
                                            formData.isPinned ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                                        }`}
                                        title={formData.isPinned ? "Pinned to top" : "Pin note"}
                                    >
                                        <Pin className={`h-4 w-4 transition-transform ${
                                            formData.isPinned
                                                ? 'fill-red-500 text-red-600 rotate-45 scale-110'
                                                : 'text-zinc-800 rotate-0'
                                        }`} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-1 rounded-lg text-zinc-800 hover:bg-black/10 transition cursor-pointer"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Note Title */}
                            <div>
                                <input
                                    type="text"
                                    placeholder="Note Title (e.g. Travel Plan, Food Spot...)"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full bg-transparent text-lg sm:text-xl font-bold font-handwriting placeholder-black/35 outline-none border-b border-black/10 focus:border-black/30 pb-1"
                                    required
                                    autoFocus
                                />
                            </div>

                            {/* Note Content */}
                            <div>
                                <textarea
                                    rows={4}
                                    placeholder="Write your note content here..."
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    className="w-full bg-transparent text-sm sm:text-base leading-relaxed font-handwriting placeholder-black/35 outline-none resize-none min-h-[110px]"
                                />
                            </div>

                            {/* Tags Selection */}
                            <div className="pt-2 border-t border-black/10 space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60">
                                    Tags (Choose multiple or type custom)
                                </label>

                                <div className="flex flex-wrap gap-1 items-center min-h-[24px]">
                                    {formData.tags.length === 0 ? (
                                        <span className="text-[11px] opacity-50 italic">No tags selected yet. Click below.</span>
                                    ) : (
                                        formData.tags.map((t, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/15 text-zinc-950 border border-black/10 shadow-2xs"
                                            >
                                                <span>#{t}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleTag(t)}
                                                    className="hover:text-red-700 ml-0.5 cursor-pointer font-bold"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-1 pt-0.5">
                                    {POPULAR_PRESET_TAGS.map(pt => {
                                        const isSelected = formData.tags.some(t => t.toLowerCase() === pt.toLowerCase());
                                        return (
                                            <button
                                                key={pt}
                                                type="button"
                                                onClick={() => handleToggleTag(pt)}
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-zinc-900 text-white shadow-2xs'
                                                        : 'bg-black/10 text-zinc-800 hover:bg-black/20'
                                                }`}
                                            >
                                                #{pt}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-2 pt-0.5">
                                    <input
                                        type="text"
                                        placeholder="Add custom tag and press Enter..."
                                        value={customTagInput}
                                        onChange={(e) => setCustomTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddCustomTag();
                                            }
                                        }}
                                        className="w-full rounded-xl bg-black/10 px-3 py-1.5 text-xs text-zinc-900 placeholder-black/40 outline-none focus:bg-black/15 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomTag}
                                        disabled={!customTagInput.trim()}
                                        className="rounded-xl bg-black/15 hover:bg-black/25 px-3 py-1.5 text-xs font-bold transition disabled:opacity-30 cursor-pointer"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>

                            {/* Hex Color & Spectrum Slider */}
                            <div className="pt-2 border-t border-black/10 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60">
                                        Sticky Note Theme Color
                                    </label>
                                    <span className="text-[10px] font-mono font-bold opacity-75 uppercase">
                                        {resolvedModalHex}
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={modalHue}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setModalHue(val);
                                        const generatedHex = hueToHex(val);
                                        setFormData(prev => ({ ...prev, color: generatedHex }));
                                    }}
                                    className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none border border-black/15 shadow-inner"
                                    style={{
                                        background: 'linear-gradient(to right, #ff0000 0%, #ff8000 12.5%, #ffff00 25%, #00ff00 37.5%, #00ffff 50%, #007fff 62.5%, #0000ff 75%, #7f00ff 87.5%, #ff00ff 93.75%, #ff0000 100%)'
                                    }}
                                />

                                <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                                    <div className="flex items-center gap-1.5 bg-black/10 rounded-xl px-2.5 py-1">
                                        <span className="text-xs font-mono font-bold opacity-60">Hex:</span>
                                        <input
                                            type="text"
                                            maxLength={7}
                                            value={formData.color.startsWith('#') ? formData.color : resolvedModalHex}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData(prev => ({ ...prev, color: val }));
                                                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                                    setModalHue(hexToHue(val));
                                                }
                                            }}
                                            className="w-20 bg-transparent text-xs font-mono font-bold uppercase outline-none"
                                            placeholder="#FEF08A"
                                        />
                                        <label className="relative cursor-pointer flex items-center justify-center">
                                            <input
                                                type="color"
                                                value={resolvedModalHex}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData(prev => ({ ...prev, color: val }));
                                                    setModalHue(hexToHue(val));
                                                }}
                                                className="w-5 h-5 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                                                title="Open Color Wheel"
                                            />
                                        </label>
                                    </div>

                                    {/* Pastel Quick Dots */}
                                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                                        {COLORS.slice(0, 7).map(c => (
                                            <button
                                                key={c.name}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, color: c.bg }));
                                                    setModalHue(hexToHue(c.bg));
                                                }}
                                                className="h-5 w-5 rounded-full border border-black/15 shadow-2xs transition hover:scale-110 cursor-pointer"
                                                style={{ backgroundColor: c.bg }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-black/10 hover:bg-black/15 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black transition shadow-md cursor-pointer"
                                >
                                    {editingNote ? 'Save Changes' : 'Pin Sticky Note'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* Local AI Floating Chatbot */}
            <AIChatBot user={user} />
        </div>
    );
}

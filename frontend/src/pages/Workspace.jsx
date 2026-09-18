import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ArrowLeft, FileText, Pin, Trash2, Edit3, LogOut, X, Loader2, Sparkles } from 'lucide-react';
import StickyNote from '../components/StickyNote';
import { getNotes, createNote, updateNote, deleteNote } from '../services/api';

const COLORS = [
    { name: 'amber', bg: '#fef08a', text: '#78350f' },
    { name: 'indigo', bg: '#e0e7ff', text: '#1e1b4b' },
    { name: 'emerald', bg: '#bbf7d0', text: '#064e3b' },
    { name: 'rose', bg: '#fecdd3', text: '#4c0519' },
    { name: 'purple', bg: '#e9d5ff', text: '#3b0764' },
    { name: 'cyan', bg: '#cffafe', text: '#083344' },
    { name: 'orange', bg: '#fed7aa', text: '#431407' },
    { name: 'blue', bg: '#bfdbfe', text: '#172554' },
    { name: 'lime', bg: '#d9f99d', text: '#1a2e05' },
    { name: 'pink', bg: '#fbcfe8', text: '#4a044e' },
    { name: 'violet', bg: '#ddd6fe', text: '#2e1065' },
    { name: 'red', bg: '#fecaca', text: '#450a0a' },
    { name: 'yellow', bg: '#fef08a', text: '#422006' }
];

export default function Workspace({ onBack }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [notes, setNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null); // null means creating
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        color: 'amber',
        tags: ''
    });

    // Check authentication and load notes
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/signin');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchUserNotes(parsedUser.id);
        }
    }, [navigate]);

    const fetchUserNotes = async (userId) => {
        setLoading(true);
        setError(null);
        try {
            const fetchedNotes = await getNotes(userId);
            setNotes(fetchedNotes);
        } catch (err) {
            setError(err.message || 'Failed to retrieve your notes.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/signin');
    };

    const openCreateModal = () => {
        setEditingNote(null);
        setFormData({
            title: '',
            content: '',
            color: 'amber',
            tags: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (note) => {
        setEditingNote(note);
        setFormData({
            title: note.title,
            content: note.content,
            color: note.color,
            tags: note.tags.join(', ')
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setError(null);
        const tagsArray = formData.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');

        const notePayload = {
            title: formData.title.trim() || 'Untitled Note',
            content: formData.content.trim(),
            color: formData.color,
            tags: tagsArray,
            isPinned: editingNote ? editingNote.isPinned : false,
            userId: user.id
        };

        try {
            if (editingNote) {
                const updated = await updateNote(editingNote.id, notePayload);
                setNotes(prev => prev.map(n => n.id === editingNote.id ? updated : n));
            } else {
                const created = await createNote(notePayload);
                setNotes(prev => [created, ...prev]);
            }
            setIsModalOpen(false);
        } catch (err) {
            setError(err.message || 'Failed to save the note.');
        }
    };

    const handleDelete = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;

        setError(null);
        try {
            await deleteNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            setError(err.message || 'Failed to delete the note.');
        }
    };

    const handleTogglePin = async (note) => {
        setError(null);
        const updatedPinned = !note.isPinned;
        
        // Optimistic State Update
        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, isPinned: updatedPinned } : n));

        try {
            await updateNote(note.id, { isPinned: updatedPinned });
        } catch (err) {
            setError(err.message || 'Failed to update pin status.');
            // Revert state on failure
            fetchUserNotes(user.id);
        }
    };

    // Filter notes
    const filteredNotes = notes.filter(note => {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        const matchesTags = note.tags.some(tag => tag.toLowerCase().includes(query));
        return matchesTitle || matchesContent || matchesTags;
    });

    // Pinned notes bubble to top, secondary sort is by updatedAt descending
    const sortedNotes = [...filteredNotes].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    return (
        <div className="min-h-screen bg-zinc-50/50 pb-20 pt-6 font-sans">
            <div className="mx-auto max-w-6xl px-6">

                {/* Header Navigation & Dashboard Branding */}
                <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-6">
                        {/* Back navigation button */}
                        <button
                            type="button"
                            onClick={onBack}
                            className="group flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:bg-zinc-50 cursor-pointer"
                            title="Back to Landing"
                        >
                            <ArrowLeft className="h-5 w-5 text-zinc-600 transition group-hover:-translate-x-0.5" />
                        </button>
                        
                        {/* Title text */}
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Your Workspace</h1>
                                {user && (
                                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                                        Hi, {user.name}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">Manage and organize your secure records</p>
                        </div>
                    </div>

                    {/* Header Action Controls */}
                    <div className="flex items-center gap-3">
                        {/* Search Input Bar */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search title, content, tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                            />
                        </div>

                        {/* Logout Button */}
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 cursor-pointer active:scale-95"
                            title="Log Out"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Log Out</span>
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex justify-between items-center">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Main Workspace Layout */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        <span className="mt-4 text-sm font-medium">Loading your workspace...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        
                        {/* Trigger Note Creation Button */}
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 hover:border-indigo-500 hover:bg-white transition-all duration-300 aspect-square p-6 cursor-pointer bg-white/40 group rounded-sm shadow-sm hover:shadow-md"
                        >
                            <div className="rounded-2xl bg-zinc-100 p-4 group-hover:bg-indigo-50 transition duration-300 shadow-xs">
                                <Plus className="h-7 w-7 text-zinc-500 group-hover:text-indigo-600 transition duration-300 group-hover:scale-110" />
                            </div>
                            <span className="mt-4 text-sm font-semibold text-zinc-700 group-hover:text-indigo-600 transition">
                                Add Sticky Note
                            </span>
                            <span className="text-xs text-zinc-400 mt-1">Write down your ideas instantly</span>
                        </button>

                        {/* Interactive Notes Grid */}
                        {sortedNotes.map(note => (
                            <StickyNote
                                key={note.id}
                                title={note.title}
                                content={note.content}
                                color={note.color}
                                tags={note.tags}
                                isPinned={note.isPinned}
                                updatedAt={note.updatedAt}
                                mode="workspace"
                                onEdit={() => openEditModal(note)}
                                onDelete={() => handleDelete(note.id)}
                                onPin={() => handleTogglePin(note)}
                            />
                        ))}

                    </div>
                )}

                {/* Empty State Banner (if no notes match search query) */}
                {!loading && sortedNotes.length === 0 && searchQuery && (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400">
                        <FileText className="h-12 w-12 opacity-50 mb-3" />
                        <h3 className="text-base font-semibold text-zinc-700">No matching notes</h3>
                        <p className="text-xs mt-1">Try searching another keyword or create a new note.</p>
                    </div>
                )}
            </div>

            {/* Note Creation / Editing Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 p-6 backdrop-blur-sm">
                    <div className="w-full max-w-[480px] scale-100 transform rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xl transition-all">
                        
                        {/* Modal Header */}
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-zinc-950">
                                {editingNote ? 'Edit Sticky Note' : 'Create Sticky Note'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            
                            {/* Title Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                                    Note Title
                                </label>
                                <input
                                    type="text"
                                    placeholder="Quick thought..."
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                                    required
                                />
                            </div>

                            {/* Content Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                                    Note Body Content
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Start writing ideas here..."
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none"
                                    required
                                />
                            </div>

                            {/* Tag Input Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                                    Tags (Comma-separated)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ideas, Task, Design"
                                    value={formData.tags}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                                />
                            </div>

                            {/* Color Palette Selector */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                    Sticky Note Theme Color
                                </label>
                                <div className="flex flex-wrap gap-2.5">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c.name}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, color: c.name }))}
                                            className={`h-7 w-7 rounded-full border transition cursor-pointer relative ${
                                                formData.color === c.name 
                                                    ? 'border-zinc-950 scale-110 shadow-sm ring-2 ring-zinc-950/20' 
                                                    : 'border-zinc-200 hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: c.bg }}
                                            title={c.name}
                                        >
                                            {formData.color === c.name && (
                                                <div 
                                                    className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                                                    style={{ color: c.text }}
                                                >
                                                    ✓
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Form Submit buttons */}
                            <div className="pt-2 flex justify-end gap-2.5 text-sm font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-indigo-600 px-5 py-2 text-white shadow-md shadow-indigo-600/15 hover:bg-indigo-500 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    <span>{editingNote ? 'Save Changes' : 'Create Note'}</span>
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

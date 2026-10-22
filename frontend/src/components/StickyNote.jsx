import React from 'react';
import { Pin, Trash2, Edit3, Tag, CheckCircle2, Circle, AlertCircle, Bookmark } from 'lucide-react';

// Color themes metadata for visual mapping, coordinating tags and text contrast
const THEMES = {
    amber: { bg: '#fef08a', text: 'text-amber-955', tag: 'bg-amber-100/90 text-amber-900 border-amber-300' },
    indigo: { bg: '#e0e7ff', text: 'text-indigo-950', tag: 'bg-indigo-100/90 text-indigo-900 border-indigo-300' },
    emerald: { bg: '#bbf7d0', text: 'text-emerald-955', tag: 'bg-emerald-100/90 text-emerald-900 border-emerald-300' },
    rose: { bg: '#fecdd3', text: 'text-rose-950', tag: 'bg-rose-100/90 text-rose-900 border-rose-300' },
    purple: { bg: '#e9d5ff', text: 'text-purple-950', tag: 'bg-purple-100/90 text-purple-900 border-purple-300' },
    cyan: { bg: '#cffafe', text: 'text-cyan-950', tag: 'bg-cyan-100/90 text-cyan-900 border-cyan-300' },
    orange: { bg: '#fed7aa', text: 'text-orange-950', tag: 'bg-orange-100/90 text-orange-900 border-orange-300' },
    blue: { bg: '#bfdbfe', text: 'text-blue-955', tag: 'bg-blue-100/90 text-blue-900 border-blue-300' },
    lime: { bg: '#d9f99d', text: 'text-lime-950', tag: 'bg-lime-100/90 text-lime-900 border-lime-300' },
    pink: { bg: '#fbcfe8', text: 'text-pink-950', tag: 'bg-pink-100/90 text-pink-900 border-pink-300' },
    violet: { bg: '#ddd6fe', text: 'text-violet-950', tag: 'bg-violet-100/90 text-violet-900 border-violet-300' },
    red: { bg: '#fecaca', text: 'text-red-950', tag: 'bg-red-100/90 text-red-900 border-red-300' },
    yellow: { bg: '#fef08a', text: 'text-yellow-950', tag: 'bg-yellow-100/90 text-yellow-950 border-yellow-300' },
};

const PRIORITY_STYLES = {
    high: { bg: 'bg-red-500/15 text-red-800 border-red-300', dot: 'bg-red-500', label: 'High' },
    medium: { bg: 'bg-amber-500/15 text-amber-900 border-amber-300', dot: 'bg-amber-500', label: 'Medium' },
    low: { bg: 'bg-emerald-500/15 text-emerald-900 border-emerald-300', dot: 'bg-emerald-500', label: 'Low' },
};

/**
 * StickyNote Component
 * 
 * A UI sticky note component modeling a real-world paper note with
 * categories, priorities, completion status, tags, and action controls.
 * 
 * @param {object} props
 * @param {string} props.title - Title header of the note.
 * @param {string} props.content - Text body content of the note.
 * @param {string} props.color - Theme name corresponding to the color palette object.
 * @param {string[]} props.tags - List of categories/labels displayed at the footer.
 * @param {string} [props.category] - Note category (Work, Personal, Study, etc.).
 * @param {string} [props.priority] - Note priority ('high', 'medium', 'low').
 * @param {string} [props.status] - Note status ('pending', 'completed').
 * @param {boolean} props.isPinned - Renders a pin icon and affects grid sorting.
 * @param {string} props.updatedAt - Date string of the last modification.
 * @param {'display'|'workspace'} props.mode - Interaction level.
 * @param {function} [props.onEdit] - Edit callback.
 * @param {function} [props.onDelete] - Delete callback.
 * @param {function} [props.onPin] - Pin status toggler callback.
 * @param {function} [props.onToggleStatus] - Status toggler callback.
 * @param {string} [props.className] - Additional Tailwind classes.
 */
export default function StickyNote({
    title = 'Draft Note',
    content = '',
    color = 'amber',
    tags = [],
    category = 'General',
    priority = 'medium',
    status = 'pending',
    isPinned = false,
    updatedAt = '',
    mode = 'display',
    onEdit,
    onDelete,
    onPin,
    onToggleStatus,
    className = ''
}) {
    const isInteractive = mode === 'workspace';
    const isCompleted = (status || '').toLowerCase() === 'completed';

    // Resolve theme variables
    const isPredefined = color in THEMES;
    const theme = isPredefined
        ? THEMES[color]
        : {
            bg: color,
            text: 'text-zinc-900',
            tag: 'bg-white/50 text-zinc-800 border-zinc-300/50'
        };

    const priorityKey = (priority || 'medium').toLowerCase();
    const priorityMeta = PRIORITY_STYLES[priorityKey] || PRIORITY_STYLES.medium;

    return (
        <div
            className={`group relative flex flex-col justify-between p-5 sm:p-6 transition-all duration-300 rounded-sm shadow-md shadow-black/5 hover:shadow-xl hover:shadow-black/10 border border-black/5 aspect-square ${theme.text} ${isInteractive ? 'hover:-translate-y-1.5' : ''
                } ${isCompleted ? 'opacity-90' : ''} ${className}`}
            style={{
                backgroundColor: theme.bg
            }}
        >

            {/* Top Meta Bar: Category, Priority Badge, Status Toggle, and Pin */}
            <div className="relative z-10 flex items-center justify-between gap-1.5 pb-1 border-b border-black/10 text-xs">
                {/* Left: Category & Priority */}
                <div className="flex items-center gap-1.5 overflow-hidden">
                    {category && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/10 text-[10px] font-semibold tracking-wide text-zinc-900">
                            <Bookmark className="h-2.5 w-2.5 opacity-70" />
                            <span className="truncate max-w-[80px]">{category}</span>
                        </span>
                    )}

                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${priorityMeta.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${priorityMeta.dot}`} />
                        <span>{priorityMeta.label}</span>
                    </span>
                </div>

                {/* Right: Completion status toggle & Pin */}
                <div className="flex items-center gap-1 shrink-0">
                    {isInteractive && onToggleStatus ? (
                        <button
                            type="button"
                            onClick={onToggleStatus}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition text-[10px] font-medium cursor-pointer ${
                                isCompleted
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-black/5 hover:bg-black/15 text-zinc-800'
                            }`}
                            title={isCompleted ? "Completed - click to mark Pending" : "Pending - click to mark Completed"}
                        >
                            {isCompleted ? (
                                <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Done</span>
                                </>
                            ) : (
                                <>
                                    <Circle className="h-3 w-3 text-zinc-500" />
                                    <span>Pending</span>
                                </>
                            )}
                        </button>
                    ) : isCompleted ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                        </span>
                    ) : null}

                    {isInteractive ? (
                        <button
                            type="button"
                            onClick={onPin}
                            className={`p-1 transition rounded hover:bg-black/10 cursor-pointer ${
                                isPinned ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                            }`}
                            title={isPinned ? "Unpin Note" : "Pin Note to Top"}
                        >
                            <Pin className={`h-3.5 w-3.5 transition-transform ${
                                isPinned 
                                    ? 'fill-red-500 text-red-600 drop-shadow-xs rotate-45 scale-110' 
                                    : 'text-zinc-600 rotate-0'
                            }`} />
                        </button>
                    ) : isPinned ? (
                        <div className="p-1" title="Pinned Note">
                            <Pin className="h-3.5 w-3.5 fill-red-500 text-red-600 drop-shadow-xs rotate-45" />
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Note Title */}
            <div className="relative z-10 pt-2 flex items-start justify-between gap-2 min-h-[2rem]">
                <h3 className={`text-xl sm:text-2xl font-bold tracking-tight line-clamp-2 leading-tight text-zinc-950 font-handwriting ${
                    isCompleted ? 'line-through decoration-zinc-500/60 opacity-80' : ''
                }`}>
                    {title}
                </h3>
            </div>

            {/* Note Content Body */}
            <p className={`relative z-10 mt-1.5 text-base sm:text-lg leading-snug text-zinc-900/85 line-clamp-5 font-handwriting flex-1 ${
                isCompleted ? 'opacity-75' : ''
            }`}>
                {content}
            </p>

            {/* Footer Area: Tags & Action Controls */}
            <div className="relative z-10 mt-3 pt-2 border-t border-black/10 flex items-center justify-between gap-2 text-xs">
                {/* Tags List */}
                <div className="flex flex-wrap gap-1 items-center overflow-hidden">
                    {tags.map((tag, idx) => (
                        <span
                            key={idx}
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${theme.tag}`}
                        >
                            <Tag className="h-2 w-2 opacity-70" />
                            {tag}
                        </span>
                    ))}
                    {updatedAt && (
                        <span className="text-[10px] opacity-60 ml-0.5 font-mono">
                            {updatedAt}
                        </span>
                    )}
                </div>

                {/* Workspace Action Buttons */}
                {isInteractive && (
                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={onEdit}
                                className="p-1.5 rounded-lg hover:bg-black/10 text-black/70 hover:text-black transition cursor-pointer"
                                title="Edit Note"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                            </button>
                        )}

                        {onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-700 transition cursor-pointer"
                                title="Delete Note"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

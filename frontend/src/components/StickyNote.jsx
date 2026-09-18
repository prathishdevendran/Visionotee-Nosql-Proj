import React from 'react';
import { Pin, Lock, Trash2, Edit3, Tag } from 'lucide-react';

// Color themes metadata for visual mapping, coordinating tags and text contrast
const THEMES = {
    amber: { bg: '#fef08a', text: 'text-amber-955', tag: 'bg-amber-100 text-amber-900 border-amber-300' },
    indigo: { bg: '#e0e7ff', text: 'text-indigo-950', tag: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
    emerald: { bg: '#bbf7d0', text: 'text-emerald-955', tag: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    rose: { bg: '#fecdd3', text: 'text-rose-950', tag: 'bg-rose-100 text-rose-900 border-rose-300' },
    purple: { bg: '#e9d5ff', text: 'text-purple-950', tag: 'bg-purple-100 text-purple-900 border-purple-300' },
    cyan: { bg: '#cffafe', text: 'text-cyan-950', tag: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
    orange: { bg: '#fed7aa', text: 'text-orange-950', tag: 'bg-orange-100 text-orange-900 border-orange-300' },
    blue: { bg: '#bfdbfe', text: 'text-blue-955', tag: 'bg-blue-100 text-blue-900 border-blue-300' },
    lime: { bg: '#d9f99d', text: 'text-lime-950', tag: 'bg-lime-100 text-lime-900 border-lime-300' },
    pink: { bg: '#fbcfe8', text: 'text-pink-950', tag: 'bg-pink-100 text-pink-900 border-pink-300' },
    violet: { bg: '#ddd6fe', text: 'text-violet-950', tag: 'bg-violet-100 text-violet-900 border-violet-300' },
    red: { bg: '#fecaca', text: 'text-red-950', tag: 'bg-red-100 text-red-900 border-red-300' },
    yellow: { bg: '#fef08a', text: 'text-yellow-950', tag: 'bg-yellow-100 text-yellow-950 border-yellow-300' },
};

/**
 * StickyNote Component
 * 
 * A UI sticky note component that models a real-world paper note.
 * Supports light shadows, dynamic themes, tags, status badges (encryption/pin),
 * and action controls for workspace dashboards.
 * 
 * @param {object} props
 * @param {string} props.title - Title header of the note.
 * @param {string} props.content - Text body content of the note.
 * @param {string} props.color - Theme name corresponding to the color palette object.
 * @param {string[]} props.tags - List of categories/labels displayed at the footer.
 * @param {boolean} props.isPinned - Renders a pin icon and affects grid sorting.
 * @param {boolean} props.isEncrypted - Displays a client-side encryption indicator.
 * @param {string} props.updatedAt - Date string of the last modification.
 * @param {'display'|'workspace'} props.mode - Interaction level: 'display' is passive, 'workspace' enables hover actions (edit/delete/encrypt).
 * @param {function} [props.onEdit] - Edit callback (workspace mode only).
 * @param {function} [props.onDelete] - Delete callback (workspace mode only).
 * @param {function} [props.onPin] - Pin status toggler callback (workspace mode only).
 * @param {function} [props.onToggleEncrypt] - Encryption status toggler callback (workspace mode only).
 * @param {string} [props.className] - Additional Tailwind classes for layout overrides.
 */
export default function StickyNote({
    title = 'Draft Note',
    content = '',
    color = 'amber',
    tags = [],
    isPinned = false,
    updatedAt = '',
    mode = 'display',
    onEdit,
    onDelete,
    onPin,
    onToggleEncrypt,
    className = ''
}) {
    // Flag checking if actions (like delete/edit) are available
    const isInteractive = mode === 'workspace';

    // Resolve theme variables. Custom colors are supported if passed as hex codes
    const isPredefined = color in THEMES;
    const theme = isPredefined
        ? THEMES[color]
        : {
            bg: color,
            text: 'text-zinc-900',
            tag: 'bg-white/40 text-zinc-800 border-zinc-300/40'
        };

    return (
        <div
            className={`group relative flex flex-col justify-between p-5 sm:p-6 transition-all duration-300 rounded-sm shadow-md shadow-black/5 hover:shadow-xl hover:shadow-black/10 border border-black/5 aspect-square ${theme.text} ${isInteractive ? 'hover:-translate-y-1.5' : ''
                } ${className}`}
            style={{
                backgroundColor: theme.bg
            }}
        >

            {/* Top Header Bar */}
            <div className="relative z-10 flex items-start justify-between gap-2.5 min-h-[2.25rem]">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight line-clamp-2 leading-tight text-zinc-950 font-handwriting">
                    {title}
                </h3>

                {/* Status Badges & Pin */}
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    {isPinned && (
                        <button
                            type="button"
                            disabled={!isInteractive}
                            onClick={isInteractive ? onPin : undefined}
                            className={`p-1 transition rounded ${isInteractive ? 'hover:bg-black/10 cursor-pointer' : 'cursor-default'
                                }`}
                            title="Pinned Note"
                        >
                            <Pin className="h-4 w-4 fill-red-500 text-red-600 drop-shadow-xs rotate-45" />
                        </button>
                    )}
                </div>
            </div>

            {/* Note Content Body */}
            <p className="relative z-10 mt-2.5 text-base sm:text-lg leading-snug text-zinc-900/85 line-clamp-5 font-handwriting flex-1">
                {content}
            </p>

            {/* Footer Area: Tags & Action Controls */}
            <div className="relative z-10 mt-4 pt-2.5 border-t border-black/10 flex items-center justify-between gap-2 text-xs">
                {/* Tags List */}
                <div className="flex flex-wrap gap-1.5 items-center overflow-hidden">
                    {tags.map((tag, idx) => (
                        <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${theme.tag}`}
                        >
                            <Tag className="h-2.5 w-2.5 opacity-70" />
                            {tag}
                        </span>
                    ))}
                    {updatedAt && (
                        <span className="text-[10px] opacity-60 ml-0.5 font-mono">
                            {updatedAt}
                        </span>
                    )}
                </div>

                {/* Workspace Action Buttons (shown only on card hover) */}
                {isInteractive && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={onEdit}
                                className="p-1.5 rounded-lg hover:bg-black/10 text-black/60 hover:text-black/80 transition"
                                title="Edit Note"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                            </button>
                        )}

                        {onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-700 transition"
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

import React, { useState, useRef, useEffect } from 'react';
import { Pin, Trash2, Edit3, Tag, CheckCircle2, Circle, Palette, Check, Hash } from 'lucide-react';

// Preset color map
const PRESET_COLORS = [
    { name: 'yellow', hex: '#fef08a' },
    { name: 'amber', hex: '#fed7aa' },
    { name: 'emerald', hex: '#bbf7d0' },
    { name: 'rose', hex: '#fecdd3' },
    { name: 'purple', hex: '#e9d5ff' },
    { name: 'cyan', hex: '#cffafe' },
    { name: 'blue', hex: '#bfdbfe' },
    { name: 'lime', hex: '#d9f99d' },
    { name: 'pink', hex: '#fbcfe8' },
    { name: 'violet', hex: '#ddd6fe' },
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

// Helper: Contrast detection for text
function isDarkColor(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return false;
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 140;
}

/**
 * StickyNote Component
 * 
 * Compact 4-column layout note:
 * - Reduced text and padding (scaled proportionally for 4 per row)
 * - Task toggle option (Pending / Done)
 * - In-place hexadecimal color slider popover with live hue gradient
 * - Pin, Edit, Delete
 */
export default function StickyNote({
    id,
    title = 'Draft Note',
    content = '',
    color = '#fef08a',
    tags = [],
    isTask = false,
    status = 'pending',
    isPinned = false,
    mode = 'workspace',
    onEdit,
    onDelete,
    onPin,
    onToggleStatus,
    onUpdateColor,
    className = ''
}) {
    const isInteractive = mode === 'workspace';
    const isCompleted = isTask && (status || '').toLowerCase() === 'completed';

    // Normalize color to Hex
    const resolvedHex = color && color.startsWith('#')
        ? color
        : (PRESET_COLORS.find(c => c.name.toLowerCase() === (color || '').toLowerCase())?.hex || '#fef08a');

    const isDark = isDarkColor(resolvedHex);
    const textColor = isDark ? 'text-white' : 'text-zinc-950';
    const subTextColor = isDark ? 'text-white/80' : 'text-zinc-900/85';
    const tagBorderColor = isDark ? 'bg-white/15 text-white border-white/20' : 'bg-black/10 text-zinc-900 border-black/10';

    // Color picker popover state on the card
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentHex, setCurrentHex] = useState(resolvedHex);
    const [hue, setHue] = useState(() => hexToHue(resolvedHex));
    const popoverRef = useRef(null);

    useEffect(() => {
        setCurrentHex(resolvedHex);
        setHue(hexToHue(resolvedHex));
    }, [resolvedHex]);

    // Close color popover on outside click
    useEffect(() => {
        if (!showColorPicker) return;
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setShowColorPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColorPicker]);

    const handleHueChange = (e) => {
        const h = parseInt(e.target.value, 10);
        setHue(h);
        const newHex = hueToHex(h);
        setCurrentHex(newHex);
        if (onUpdateColor) onUpdateColor(newHex);
    };

    const handleHexInputChange = (e) => {
        let val = e.target.value;
        if (!val.startsWith('#')) val = '#' + val;
        setCurrentHex(val);
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            setHue(hexToHue(val));
            if (onUpdateColor) onUpdateColor(val);
        }
    };

    const handleDirectColor = (hexValue) => {
        setCurrentHex(hexValue);
        setHue(hexToHue(hexValue));
        if (onUpdateColor) onUpdateColor(hexValue);
    };

    return (
        <div
            className={`group relative flex flex-col justify-between p-2.5 sm:p-3 transition-all duration-200 rounded-sm shadow-xs hover:shadow-lg border border-black/5 aspect-square ${textColor} ${
                isInteractive ? 'hover:-translate-y-1' : ''
            } ${isCompleted ? 'opacity-85' : ''} ${className}`}
            style={{
                backgroundColor: resolvedHex
            }}
        >
            {/* Top Bar: Task Status Pill, Color Swatch Quick Action & Pin Icon */}
            <div className="relative z-10 flex items-center justify-between gap-1 pb-1 border-b border-black/10 text-[10px]">
                {/* Left: Task Toggle Pill */}
                <div className="flex items-center gap-1 overflow-hidden">
                    {isTask ? (
                        isInteractive && onToggleStatus ? (
                            <button
                                type="button"
                                onClick={onToggleStatus}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full transition text-[9px] sm:text-[10px] font-semibold cursor-pointer shadow-2xs ${
                                    isCompleted
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-black/10 hover:bg-black/20 text-zinc-900'
                                }`}
                                title={isCompleted ? "Completed task - click to mark pending" : "Pending task - click to mark completed"}
                            >
                                {isCompleted ? (
                                    <>
                                        <CheckCircle2 className="h-2.5 w-2.5 stroke-[2.5]" />
                                        <span>Done</span>
                                    </>
                                ) : (
                                    <>
                                        <Circle className="h-2.5 w-2.5 text-zinc-600 stroke-[2.5]" />
                                        <span>Pending</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold ${
                                isCompleted ? 'bg-emerald-700 text-white' : 'bg-black/10 text-zinc-900'
                            }`}>
                                {isCompleted ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />}
                                <span>{isCompleted ? 'Done' : 'Pending'}</span>
                            </span>
                        )
                    ) : (
                        <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider opacity-45 font-mono">
                            Note
                        </span>
                    )}
                </div>

                {/* Right: Color Hex Trigger & Pin Toggle */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* In-place Hex color button in top-bar */}
                    {isInteractive && onUpdateColor && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="p-0.5 rounded hover:bg-black/10 transition cursor-pointer flex items-center gap-0.5 opacity-60 hover:opacity-100"
                                title={`Theme: ${resolvedHex} - Click to open Color Slider`}
                            >
                                <span
                                    className="h-2.5 w-2.5 rounded-full border border-black/25 shadow-2xs"
                                    style={{ backgroundColor: resolvedHex }}
                                />
                            </button>
                        </div>
                    )}

                    {isInteractive ? (
                        <button
                            type="button"
                            onClick={onPin}
                            className={`p-0.5 transition rounded hover:bg-black/10 cursor-pointer ${
                                isPinned ? 'opacity-100' : 'opacity-35 hover:opacity-100'
                            }`}
                            title={isPinned ? "Unpin Note" : "Pin Note to Top"}
                        >
                            <Pin className={`h-3 w-3 transition-transform ${
                                isPinned 
                                    ? 'fill-red-500 text-red-600 drop-shadow-xs rotate-45 scale-110' 
                                    : 'text-zinc-700 rotate-0'
                            }`} />
                        </button>
                    ) : isPinned ? (
                        <div className="p-0.5" title="Pinned Note">
                            <Pin className="h-3 w-3 fill-red-500 text-red-600 drop-shadow-xs rotate-45" />
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Note Title (+20% font size: 14.5px mobile / 17px desktop) */}
            <div className="relative z-10 pt-1 flex items-start justify-between gap-1 min-h-[1.6rem]">
                <h3 className={`text-[14.5px] sm:text-[17px] font-bold tracking-tight line-clamp-2 leading-snug font-handwriting ${
                    isCompleted ? 'line-through decoration-zinc-600/60 opacity-75' : ''
                }`}>
                    {title}
                </h3>
            </div>

            {/* Note Content Body (+20% font size: 13px mobile / 14.5px desktop) */}
            <p className={`relative z-10 mt-1 text-[13px] sm:text-[14.5px] leading-relaxed line-clamp-3 sm:line-clamp-4 font-handwriting flex-1 ${subTextColor} ${
                isCompleted ? 'opacity-70' : ''
            }`}>
                {content}
            </p>

            {/* Footer Area: Multiple Tags & Action Buttons */}
            <div className="relative z-10 mt-1.5 pt-1 border-t border-black/10 flex items-center justify-between gap-1 text-[11px]">
                {/* Multiple Tags Display (+25% tag font size: 10px mobile / 11px desktop) */}
                <div className="flex flex-wrap gap-1 items-center overflow-hidden flex-1 max-h-[1.9rem]">
                    {tags && tags.length > 0 ? (
                        tags.map((tag, idx) => (
                            <span
                                key={idx}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border ${tagBorderColor}`}
                            >
                                <Tag className="h-2.5 w-2.5 opacity-60" />
                                <span>#{tag.replace(/^#/, '')}</span>
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] opacity-35 italic">No tags</span>
                    )}
                </div>

                {/* Workspace Action Buttons */}
                {isInteractive && (
                    <div className="flex items-center gap-0.5 opacity-75 sm:group-hover:opacity-100 transition-opacity shrink-0">
                        {/* Quick Color Picker Trigger */}
                        {onUpdateColor && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="p-1 rounded-md hover:bg-black/10 transition cursor-pointer text-zinc-800"
                                    title="Choose Hex Color / Slider"
                                >
                                    <Palette className="h-3 w-3 opacity-70 hover:opacity-100" />
                                </button>

                                {/* Color Slider Popover on the Sticky Note matching user's spectrum slider */}
                                {showColorPicker && (
                                    <div
                                        ref={popoverRef}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 bottom-7 z-50 w-64 rounded-xl bg-white p-3 shadow-2xl border border-zinc-200 text-zinc-900 animate-fadeIn"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                                Hex Color Slider
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase">
                                                    {currentHex}
                                                </span>
                                                <div
                                                    className="h-3.5 w-7 rounded border border-black/15 shadow-2xs"
                                                    style={{ backgroundColor: currentHex }}
                                                />
                                            </div>
                                        </div>

                                        {/* Spectrum Gradient Slider Bar matching user's Image 2 */}
                                        <div className="mb-2.5">
                                            <input
                                                type="range"
                                                min="0"
                                                max="360"
                                                value={hue}
                                                onChange={handleHueChange}
                                                className="w-full h-3 rounded-md appearance-none cursor-pointer outline-none shadow-inner"
                                                style={{
                                                    background: 'linear-gradient(to right, #ff0000 0%, #ff8000 12.5%, #ffff00 25%, #00ff00 37.5%, #00ffff 50%, #007fff 62.5%, #0000ff 75%, #7f00ff 87.5%, #ff00ff 93.75%, #ff0000 100%)'
                                                }}
                                            />
                                        </div>

                                        {/* Hex Value Input & Native Picker */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="relative flex-1 flex items-center">
                                                <Hash className="absolute left-2 h-3 w-3 text-zinc-400" />
                                                <input
                                                    type="text"
                                                    value={currentHex.replace('#', '')}
                                                    onChange={handleHexInputChange}
                                                    maxLength="6"
                                                    placeholder="FEF08A"
                                                    className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 uppercase focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <input
                                                type="color"
                                                value={currentHex.startsWith('#') && currentHex.length === 7 ? currentHex : '#fef08a'}
                                                onChange={(e) => handleDirectColor(e.target.value)}
                                                className="h-7 w-7 rounded-lg border border-zinc-200 cursor-pointer p-0.5 bg-white"
                                                title="Open Color Wheel"
                                            />
                                        </div>

                                        {/* Quick Pastel Presets */}
                                        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-zinc-100">
                                            {PRESET_COLORS.slice(0, 8).map((p) => (
                                                <button
                                                    key={p.name}
                                                    type="button"
                                                    onClick={() => handleDirectColor(p.hex)}
                                                    className="h-4 w-4 rounded-full border border-black/10 transition hover:scale-110"
                                                    style={{ backgroundColor: p.hex }}
                                                    title={p.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {onEdit && (
                            <button
                                type="button"
                                onClick={onEdit}
                                className="p-1 rounded-md hover:bg-black/10 text-black/70 hover:text-black transition cursor-pointer"
                                title="Edit Note"
                            >
                                <Edit3 className="h-3 w-3" />
                            </button>
                        )}

                        {onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="p-1 rounded-md hover:bg-rose-500/20 text-rose-800 transition cursor-pointer"
                                title="Delete Note"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

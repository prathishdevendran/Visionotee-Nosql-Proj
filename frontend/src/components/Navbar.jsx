import React from 'react';
import { Rocket, User, LogOut } from 'lucide-react';

/**
 * Navbar Component
 * 
 * Renders the global fixed top header navigation menu.
 * Links are designed as playful floating sticky notes that scale and rotate on hover.
 * Includes a CTA button to navigate to the SignIn screen or user workspace if authenticated.
 * 
 * @param {object} props
 * @param {object} [props.user] - Currently logged-in user session object.
 * @param {function} props.onGetStarted - Callback triggered when clicking the "Get Started" / "User Name" CTA button.
 * @param {function} [props.onLogout] - Callback triggered when clicking the logout button.
 * @param {function} [props.onOpenWorkspace] - Callback to open the workspace.
 */
export default function Navbar({ user, onGetStarted, onLogout, onOpenWorkspace }) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-[var(--border-color)] bg-[var(--nav-bg)] text-[var(--text-color)] backdrop-blur-md transition-colors duration-150">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">

                {/* Brand Logo & Name */}
                <a href="#home" className="flex items-center gap-2 group cursor-pointer select-none">
                    <img
                        src="/visionate logo.png"
                        alt="Visionote Logo"
                        className="w-8 h-8 object-contain rotate-[-2deg] group-hover:rotate-[4deg] group-hover:scale-105 active:scale-95 transition-transform duration-200 ease-out drop-shadow-xs will-change-transform"
                    />
                    <span className="text-xl font-bold tracking-tight text-[var(--text-color)]" style={{ fontFamily: "var(--font-brand)" }}>
                        Visionote
                    </span>
                </a>

                {/* Navigation Links (Hidden on mobile viewports) */}
                <nav className="hidden items-center gap-2.5 text-sm font-medium md:flex">
                    {/* Home Link: styled as a yellow sticky note */}
                    <a
                        href="#home"
                        style={{ backgroundColor: '#fef08a' }}
                        className="relative flex items-center justify-center px-4 h-9 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-[transform,box-shadow] duration-200 ease-out select-none text-amber-950 font-handwriting border border-black/5 rounded-sm will-change-transform"
                    >
                        <span className="text-base capitalize">Home</span>
                    </a>

                    {/* Product Link: styled as a cyan sticky note */}
                    <a
                        href="#product"
                        style={{ backgroundColor: '#cffafe' }}
                        className="relative flex items-center justify-center px-4 h-9 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-[transform,box-shadow] duration-200 ease-out select-none text-cyan-950 font-handwriting border border-black/5 rounded-sm will-change-transform"
                    >
                        <span className="text-base capitalize">Product</span>
                    </a>

                    {/* About Link: styled as an emerald sticky note */}
                    <a
                        href="#about"
                        style={{ backgroundColor: '#bbf7d0' }}
                        className="relative flex items-center justify-center px-4 h-9 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-[transform,box-shadow] duration-200 ease-out select-none text-emerald-950 font-handwriting border border-black/5 rounded-sm will-change-transform"
                    >
                        <span className="text-base capitalize">About</span>
                    </a>

                    {/* Contact Link: styled as a rose sticky note */}
                    <a
                        href="#contact"
                        style={{ backgroundColor: '#fecdd3' }}
                        className="relative flex items-center justify-center px-4 h-9 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-[transform,box-shadow] duration-200 ease-out select-none text-rose-950 font-handwriting border border-black/5 rounded-sm will-change-transform"
                    >
                        <span className="text-base capitalize">Contact</span>
                    </a>
                </nav>

                {/* Call To Action button / Signed-in user display */}
                <div className="flex items-center gap-2">
                    {user ? (
                        <>
                            <button
                                type="button"
                                onClick={onOpenWorkspace || onGetStarted}
                                style={{ backgroundColor: '#e0e7ff' }}
                                className="relative flex items-center justify-center gap-1.5 px-3.5 h-9 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-[transform,box-shadow] duration-200 ease-out cursor-pointer select-none text-indigo-950 font-handwriting border border-black/5 rounded-sm will-change-transform"
                                title="Open Workspace"
                            >
                                <User className="h-3.5 w-3.5 text-indigo-700 drop-shadow-xs" />
                                <span className="text-base font-semibold capitalize max-w-[140px] truncate">{user.name}</span>
                            </button>

                            {onLogout && (
                                <button
                                    type="button"
                                    onClick={onLogout}
                                    style={{ backgroundColor: '#fee2e2' }}
                                    className="relative flex items-center justify-center px-2.5 h-9 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-[transform,box-shadow] duration-200 ease-out cursor-pointer select-none text-red-950 border border-black/5 rounded-sm will-change-transform"
                                    title="Sign Out"
                                >
                                    <LogOut className="h-4 w-4 text-red-600" />
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onGetStarted}
                            style={{ backgroundColor: '#e0e7ff' }}
                            className="relative flex items-center justify-center gap-1.5 px-3.5 h-9 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-[transform,box-shadow] duration-200 ease-out cursor-pointer select-none text-indigo-950 font-handwriting border border-black/5 rounded-sm will-change-transform"
                        >
                            <Rocket className="h-3.5 w-3.5 fill-red-500 text-red-600 drop-shadow-xs rotate-35" />
                            <span className="text-base capitalize">Get Started</span>
                        </button>
                    )}
                </div>

            </div>
        </header>
    );
}


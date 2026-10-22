import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User, Sparkles } from 'lucide-react';
import StickyNote from '../components/StickyNote';
import { signup, signin } from '../services/api';

/**
 * SignIn Component
 * 
 * Renders the user authentication portal (overlay view).
 * Supports toggling between standard Sign-In and Account Registration modes.
 * Displays interactive background floating sticky notes conveying security & privacy info.
 * 
 * @param {object} props
 * @param {function} props.onBack - Callback triggered when the user clicks the back navigation button.
 */
export default function SignIn({ onBack, onLoginSuccess }) {
    const navigate = useNavigate();

    // Mode switcher state: true means Registration, false means Login
    const [isRegister, setIsRegister] = useState(false);
    
    // Password visibility toggle state
    const [showPassword, setShowPassword] = useState(false);
    
    // Auth input data fields
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    /**
     * Input fields state synchronizer
     */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /**
     * Form submit handler
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isRegister) {
                await signup(formData.name, formData.email, formData.password);
                setIsRegister(false);
                setFormData({ name: '', email: formData.email, password: '' });
                setError("Account created successfully! Please sign in.");
            } else {
                const data = await signin(formData.email, formData.password);
                localStorage.setItem('user', JSON.stringify(data.user));
                if (onLoginSuccess) {
                    onLoginSuccess(data.user);
                }
                navigate('/workspace');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50/40 via-white to-zinc-100/40 px-6 py-12">

            {/* Background Decorative Element 1: Floating Amber Note (Left Column) */}
            <div className="pointer-events-none absolute -left-12 top-1/4 hidden rotate-[-8deg] opacity-70 md:block lg:left-12 xl:left-24">
                <div className="w-60 shadow-xl transition-all duration-500 hover:rotate-[-4deg] hover:scale-105 pointer-events-auto">
                    <StickyNote
                        mode="display"
                        title="Security Checkpoint"
                        content="Your notes are secure with zero-knowledge end-to-end encryption."
                        color="amber"
                        tags={["Security", "Privacy"]}
                    />
                </div>
            </div>

            {/* Background Decorative Element 2: Floating Cyan Note (Right Column) */}
            <div className="pointer-events-none absolute -right-12 bottom-1/4 hidden rotate-[6deg] opacity-70 md:block lg:right-12 xl:right-24">
                <div className="w-60 shadow-xl transition-all duration-500 hover:rotate-[2deg] hover:scale-105 pointer-events-auto">
                    <StickyNote
                        mode="display"
                        title="Organize Seamlessly"
                        content="Group notes dynamically with categories, search keywords, and links."
                        color="cyan"
                        tags={["Searchable", "Local-First"]}
                    />
                </div>
            </div>

            {/* Back Navigation Button */}
            <div className="absolute top-6 left-6 z-20">
                <button
                    type="button"
                    onClick={onBack}
                    className="group flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-zinc-50 hover:border-zinc-300/80 cursor-pointer active:scale-95"
                    title="Back to home"
                >
                    <ArrowLeft className="h-5 w-5 text-zinc-600 transition group-hover:-translate-x-0.5" />
                </button>
            </div>

            {/* Center Authentication Card Container */}
            <div className="relative z-10 w-full max-w-[440px]">

                {/* Top glow ambient effect shadow */}
                <div className="absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl"></div>

                <div className="w-full rounded-3xl border border-zinc-200/80 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">

                    {/* Header Branding */}
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-2 mb-3">
                            <img
                                src="/visionate logo.png"
                                alt="Visionote Logo"
                                className="h-9 w-auto object-contain drop-shadow-xs"
                            />
                            <span className="text-2xl font-bold tracking-tight text-zinc-900" style={{ fontFamily: "var(--font-brand)" }}>
                                Visionote
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                            {isRegister ? 'Create an account' : 'Welcome back'}
                        </h2>
                        <p className="mt-1.5 text-sm text-zinc-500 font-normal">
                            {isRegister
                                ? 'Start organizing your thoughts today.'
                                : 'Sign in to access your secure workspace.'}
                        </p>
                    </div>

                    {/* Form Controls */}
                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        {error && (
                            <div className={`rounded-xl p-3 text-xs border ${error.includes("successfully") ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                                {error}
                            </div>
                        )}

                        {/* Full Name Field (Only shown during Account Registration) */}
                        {isRegister && (
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <User className="h-4 w-4 text-zinc-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        className="block w-full rounded-xl border border-zinc-200 bg-white/50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition duration-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Mail className="h-4 w-4 text-zinc-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="you@example.com"
                                    className="block w-full rounded-xl border border-zinc-200 bg-white/50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition duration-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                    Password
                                </label>
                                {!isRegister && (
                                    <a href="#forgot" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                        Forgot?
                                    </a>
                                )}
                            </div>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="h-4 w-4 text-zinc-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    className="block w-full rounded-xl border border-zinc-200 bg-white/50 py-2.5 pl-10 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition duration-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                                    required
                                />
                                {/* Show/Hide password toggler button */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Terms and Conditions checkbox (Only shown during Account Registration) */}
                        {isRegister && (
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                    required
                                />
                                <label htmlFor="terms" className="text-xs text-zinc-500 leading-normal">
                                    I agree to the <a href="#terms" className="font-medium text-indigo-600 hover:underline">Terms of Service</a> and <a href="#privacy" className="font-medium text-indigo-600 hover:underline">Privacy Policy</a>.
                                </label>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 transition-all duration-300 hover:bg-indigo-500 hover:shadow-indigo-600/20 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span>Processing...</span>
                            ) : isRegister ? (
                                <>
                                    <Sparkles className="h-4 w-4 transition duration-300 group-hover:rotate-12" />
                                    <span>Create Account</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    {/* Mode Toggle Footer Button link */}
                    <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
                        <p className="text-sm text-zinc-500">
                            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(!isRegister);
                                    setFormData({ name: '', email: '', password: '' });
                                }}
                                className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer transition-colors"
                            >
                                {isRegister ? 'Sign In' : 'Register now'}
                            </button>
                        </p>
                    </div>

                </div>

            </div>

        </div>
    );
}

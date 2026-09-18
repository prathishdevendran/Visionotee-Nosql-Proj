import React, { useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SubHero from './components/SubHero';
import Workspace from './pages/Workspace';
import SignIn from './pages/SignIn';

/**
 * LandingPage Component
 * 
 * Layout component representing the application's landing page.
 * Includes horizontal slide transitions for moving between the main landing route and the sign-in modal.
 * 
 * @param {object} props
 * @param {boolean} props.isSignIn - Controls the horizontal layout slide position.
 * @param {object} props.landingStyle - Inline CSS colors styles containing scroll-interpolated variables.
 * @param {function} props.navigate - React Router navigation helper function.
 */
function LandingPage({ isSignIn, landingStyle, navigate }) {
    return (
        <div className="min-h-screen overflow-x-hidden relative">
            {/* Landing Page Slider Wrapper (slides to the left when showing Sign In) */}
            <div
                style={{
                    ...landingStyle,
                    transform: isSignIn ? 'translate3d(-100vw, 0, 0)' : 'translate3d(0, 0, 0)',
                }}
                className="min-h-screen transition-transform duration-700 ease-in-out relative"
            >
                <Navbar onGetStarted={() => navigate('/signin')} />
                <main>
                    <Hero />
                    <SubHero onExplore={() => navigate('/workspace')} />
                </main>
            </div>

            {/* SignIn Page Slider Wrapper (slides into view from the right) */}
            <div
                className="fixed inset-0 z-40 transition-all duration-700 ease-in-out"
                style={{
                    transform: isSignIn ? 'translate3d(0, 0, 0)' : 'translate3d(100vw, 0, 0)',
                    visibility: isSignIn ? 'visible' : 'hidden'
                }}
            >
                <SignIn onBack={() => navigate('/')} />
            </div>
        </div>
    );
}

/**
 * App Root Component
 * 
 * Configures routing, document layouts, and high-performance scroll-driven themes.
 * Calculates dynamic RGB color styles as you scroll down the page.
 */
export default function App() {
    const location = useLocation();
    const navigate = useNavigate();

    // appRef allows directly writing CSS Custom Properties to the DOM,
    // avoiding React re-renders on scroll which would otherwise lag note layouts.
    const appRef = useRef(null);

    // Boolean check to verify active route is part of the landing flow
    const isLandingRoute = location.pathname === '/' || location.pathname === '/signin';

    // Manages body overflow style to prevent secondary scrollbars during fullscreen modal slides
    useEffect(() => {
        if (isLandingRoute) {
            document.body.style.overflow = location.pathname === '/' ? '' : 'hidden';
        } else {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [location.pathname, isLandingRoute]);

    // Track scroll events and directly update CSS variables for light-to-dark theme transitions.
    useEffect(() => {
        if (!isLandingRoute) return;

        const handleScroll = () => {
            const appEl = appRef.current;
            if (!appEl) return;

            const totalHeight = window.innerHeight || 800;
            const currentScroll = window.scrollY;

            // Map scroll scrollY coordinate to progress factor [0, 1] over 1 full screen height
            const progress = Math.min(1, Math.max(0, currentScroll / totalHeight));

            // Linear theme interpolation math:
            // Background Color goes from White (255,255,255) to warm tinted background (255,250,230)
            const bgR = Math.round(255 - (255 - 255) * progress);
            const bgG = Math.round(255 - (255 - 250) * progress);
            const bgB = Math.round(255 - (255 - 230) * progress);

            // Text Color goes from Slate-900 (24,24,27) to Slate-100 (244,244,245) - corrected values
            const textR = Math.round(24 + (244 - 255) * progress);
            const textG = Math.round(24 + (244 - 255) * progress);
            const textB = Math.round(27 + (245 - 255) * progress);

            // Muted Text Color
            const textMutedR = Math.round(82 + (161 - 82) * progress);
            const textMutedG = Math.round(82 + (161 - 82) * progress);
            const textMutedB = Math.round(91 + (170 - 91) * progress);

            // Borders Color & opacity
            const borderR = Math.round(228 - (228 - 63) * progress);
            const borderG = Math.round(228 - (228 - 63) * progress);
            const borderB = Math.round(231 - (231 - 70) * progress);
            const borderA = (0.8 - (0.8 - 0.4) * progress).toFixed(2);

            const navR = bgR;
            const navG = bgG;
            const navB = bgB;

            // Direct CSS variables updates without triggering any React state re-renders
            appEl.style.setProperty('--bg-color', `rgb(${bgR}, ${bgG}, ${bgB})`);
            appEl.style.setProperty('--text-color', `rgb(${textR}, ${textG}, ${textB})`);
            appEl.style.setProperty('--text-muted', `rgb(${textMutedR}, ${textMutedG}, ${textMutedB})`);
            appEl.style.setProperty('--border-color', `rgba(${borderR}, ${borderG}, ${borderB}, ${borderA})`);
            appEl.style.setProperty('--nav-bg', `rgba(${navR}, ${navG}, ${navB}, 0.75)`);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isLandingRoute]);

    // Static landing styles using CSS Custom Property variables with native white fallbacks
    const landingStyle = {
        backgroundColor: 'var(--bg-color, rgb(255, 255, 255))',
        color: 'var(--text-color, rgb(24, 24, 27))',
    };

    return (
        <div ref={appRef} className="min-h-screen antialiased selection:bg-indigo-500 selection:text-white select-none">
            <Routes>
                {/* Landing page main entry route */}
                <Route
                    path="/"
                    element={
                        <LandingPage isSignIn={false} landingStyle={landingStyle} navigate={navigate} />
                    }
                />
                {/* Landing page showing Sign In modal route */}
                <Route
                    path="/signin"
                    element={
                        <LandingPage isSignIn={true} landingStyle={landingStyle} navigate={navigate} />
                    }
                />
                {/* User sticky notes workspace dashboard route */}
                <Route
                    path="/workspace"
                    element={
                        <Workspace onBack={() => navigate('/')} />
                    }
                />
                {/* Wildcard fallback redirection */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}
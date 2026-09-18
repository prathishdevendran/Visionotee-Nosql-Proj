import React, { useEffect, useRef } from 'react';

/**
 * Hero Component
 * 
 * Renders the top fold (above-the-fold) value proposition of the landing page.
 * Implements high-performance parallax scroll transitions using CSS variables:
 * - The main heading and description shrink (scale) and fade out on scroll.
 * - The brand logo translates (diagonally shifts right and up) and fades out on scroll.
 */
export default function Hero() {
    // heroRef points to the main <section> element, hosting our CSS variables
    const heroRef = useRef(null);

    // Scroll listener updates CSS variables on the section node for GPU-bound rendering
    useEffect(() => {
        const handleScroll = () => {
            const section = heroRef.current;
            if (!section) return;
            const viewportHeight = window.innerHeight || 800;
            const currentScroll = window.scrollY;

            // Map scroll scrollY to a factor of [0, 1] relative to viewport height
            const progress = Math.min(1, Math.max(0, currentScroll / viewportHeight));
            section.style.setProperty('--hero-progress', progress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initialize variables

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Text transition styles: fades opacity and scales text down on scroll
    const scrollStyle = {
        transform: 'scale(calc(1 - var(--hero-progress, 0) * 0.1))',
        transition: 'transform 0.1s ease-out',
    };

    // Rocket/logo transition styles: shifts right and up while fading out
    const logoScrollStyle = {

        transform: 'scale(calc(1 - var(--hero-progress, 0) * -0.8)) translate(calc(var(--hero-progress, 0) * 100px), calc(var(--hero-progress, 0) * -120px))',
        transition: 'transform 0.1s ease-out',
    };

    /**
     * Programmatically performs a smooth scroll transition down to the product showcase.
     */
    const handleScrollDown = () => {
        const subHero = document.getElementById('sub-hero');
        if (!subHero) return;
        subHero.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section ref={heroRef} id="home" className="relative flex flex-col justify-center items-center h-[calc(100vh-3.5rem)] min-h-[560px] max-h-[850px] overflow-hidden px-4 pt-14 pb-4" >
            {/* Background paper-around decorative layer covering the entire Hero section */}
            <div
                className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-5"
                style={{ backgroundImage: 'url("/paper-around.png")' }}
            />

            {/* Embedded styles for CSS micro-animations */}
            <style>{`
                /* Slow bouncing animation for the scroll indicator */
                @keyframes slow-bounce {
                    0%, 100% {
                        transform: translateY(-8px);
                        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
                    }
                    50% {
                        transform: translateY(0px);
                        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
                    }
                }
                .animate-slow-bounce {
                    animation: slow-bounce 3s infinite;
                }  
                /* Slow rotating animation for the background ring */
                @keyframes spin-slow{
                    from{
                        transform: rotate(0deg);
                    }
                    to{
                        transform: rotate(360deg);
                    }
                }
                .animate-spin-slow{
                    animation: spin-slow 4s ease-in-out infinite;
                }
            `}</style>

            <div className="relative z-10 mx-auto max-w-4xl text-center flex-1 flex flex-col justify-center items-center py-2 sm:py-4">

                {/* Pill Badge */}
                <div 
                    style={scrollStyle}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 bg-white/75 shadow-xs text-[11px] font-semibold text-zinc-700 mb-3.5 backdrop-blur-sm tracking-wide uppercase font-mono"
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Visual Sticky Notes &bull; Instant Recall</span>
                </div>

                {/* Main Heading / Value Prop */}
                <h1
                    style={scrollStyle}
                    className="relative z-20 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]"
                >
                    <span className="block text-zinc-900">Your thoughts, organized.</span>
                    <span className="block mt-2 text-indigo-700">
                        Searchable at the speed of thought.
                    </span>
                </h1>

                {/* Subtitle */}
                <p
                    style={scrollStyle}
                    className="relative z-20 mx-auto mt-3 max-w-xl text-sm sm:text-base md:text-lg text-zinc-600 font-medium leading-relaxed"
                >
                    A tactile, modern sticky-notes workspace for thinkers, creators, and doers.
                </p>

                {/* Logo & Interactive Arch Container */}
                <div
                    style={logoScrollStyle}
                    className="relative z-10 mt-6 flex flex-col items-center justify-center"
                >
                    <div className="relative flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44">
                        {/* Rotating background arch graphic */}
                        <img
                            src="/paper.png"
                            alt="Sticky Arch"
                            className="absolute inset-0 w-full h-full object-contain animate-spin-slow opacity-80 pointer-events-none"
                        />
                        {/* Bouncing scroll indicator button carrying logo */}
                        <button
                            type="button"
                            onClick={handleScrollDown}
                            className="z-10 flex items-center justify-center rounded-full transition-all duration-300 animate-slow-bounce cursor-pointer hover:scale-105 active:scale-95"
                            aria-label="Scroll Down to Explore"
                        >
                            {/* Brand Logo Centered */}
                            <img
                                src="/visionate logo.png"
                                alt="Visionote Logo"
                                className="h-18 sm:h-22 w-auto object-contain drop-shadow-md"
                            />
                        </button>
                    </div>

                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase mt-1 select-none">
                        scroll or click to explore
                    </span>
                </div>

            </div>
        </section>
    );
}
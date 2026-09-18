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
     * Uses quadratic easing animation frames to prevent standard jumpy browser scrolls.
     */
    const handleScrollDown = () => {
        const subHero = document.getElementById('sub-hero');
        if (!subHero) return;

        // Calculate absolute destination height coordinates
        const targetY = subHero.getBoundingClientRect().top + window.pageYOffset;
        const startY = window.pageYOffset || document.documentElement.scrollTop;
        const difference = targetY - startY;
        const duration = 1000; // Animation window duration in ms
        let startTime = null;

        // Quadratic ease-in-out formula
        const easeInOutQuad = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        };

        // requestAnimationFrame animation handler loop
        const animateScroll = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = easeInOutQuad(timeElapsed, startY, difference, duration);

            window.scrollTo(0, run);

            if (timeElapsed < duration) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    };

    return (
        <section ref={heroRef} id="home" className="relative flex flex-col justify-center items-center min-h-screen overflow-hidden px-6 pb-16 pt-24" >
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
                        transform: translateY(-10px);
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

            <div className="top-20 relative z-10 mx-auto max-w-5xl text-center flex-1 flex flex-col justify-center items-center">

                {/* Main Heading / Value Prop */}
                <h1
                    style={{ ...scrollStyle, fontFamily: "'Great Vibes', cursive" }}
                    className="z-9 text-4xl font-bold tracking-tight text-[var(--text-color)] sm:text-5xl md:text-7xl"
                >
                    <span className="block mb-1">Your thoughts, organized.</span>
                    <span className="text-[#1e1a4d] block">Searchable at the speed of thought.</span>
                </h1>

                {/* Subtitle */}
                <p
                    style={{ ...scrollStyle, fontFamily: "'Great Vibes', cursive" }}
                    className="mx-auto mt-10 font-bold max-w-2xl text-base text-[var(--text-muted)] sm:text-4xl"
                >
                    A modern sticky-notes platform
                </p>

                {/* Logo & Loading Arch Container */}
                <div
                    style={logoScrollStyle}
                    className='relative top-15 flex items-center justify-center w-[200px] h-[400px] -mt-25 mb-8'
                >
                    {/* Rotating background arch graphic */}
                    <img
                        src='/paper.png'
                        alt="Sticky Arch"
                        className="absolute inset-0 w-full h-full object-contain animate-spin-slow"
                    />
                    {/* Bouncing scroll indicator button carrying logo */}
                    <button
                        type="button"
                        onClick={handleScrollDown}
                        className="z-10 flex items-center justify-center rounded-full transition-all duration-300 animate-slow-bounce cursor-pointer"
                        aria-label="Scroll Down"
                    >
                        {/* Smaller Brand Logo Centered */}
                        <img
                            src="/visionate logo.png"
                            alt="visionate logo"
                            className='relative h-[150px] w-auto object-contain'
                        />
                    </button>
                </div>

            </div>
        </section >
    );
}
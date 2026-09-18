import React, { useState, useEffect, useRef } from 'react';
import { Pin } from 'lucide-react';
import StickyNote from './StickyNote';

// 16 Predefined coordinate offsets (expressed in viewport vh/vw units) 
// symmetrically distributed across the viewport to frame the center "Try Now" button.
const FIXED_POSITIONS = [
    // Far Left Column (safely inset with margin from screen edge)
    { top: 7, left: 8 },
    { top: 28, left: 7 },
    { top: 50, left: 8 },
    { top: 71, left: 7 },

    // Mid Left Column
    { top: 12, left: 24 },
    { top: 34, left: 23 },
    { top: 58, left: 24 },

    // Far Right Column (matching right-hand margin)
    { top: 7, left: 76 },
    { top: 28, left: 77 },
    { top: 50, left: 76 },
    { top: 71, left: 77 },

    // Mid Right Column
    { top: 12, left: 60 },
    { top: 34, left: 61 },
    { top: 58, left: 60 },

    // Center Top & Bottom Anchors
    { top: 5, left: 42 },
    { top: 70, left: 42 },
];

// Content metadata list with curated randomized color distribution
const INITIAL_NOTES = [
    // Far Left Column
    {
        title: "Security",
        content: "Zero-knowledge encryption ensures your data remains completely private.",
        color: "cyan"
    },
    {
        title: "Local-First",
        content: "Access your notes anytime, anywhere. Fully functional offline.",
        color: "lime"
    },
    {
        title: "Semantic Search",
        content: "Search by meaning and concept, not just exact keywords.",
        color: "purple"
    },
    {
        title: "Markdown Support",
        content: "Write cleanly using standard formatting you already know.",
        color: "orange"
    },

    // Mid Left Column
    {
        title: "Custom Tags",
        content: "Organize note boards dynamically with custom categorized tags.",
        color: "rose"
    },
    {
        title: "Quick Sync",
        content: "Synchronize across devices with end-to-end encryption active.",
        color: "blue"
    },
    {
        title: "Graph View",
        content: "Visualize how your thoughts link together in a network.",
        color: "emerald"
    },

    // Far Right Column
    {
        title: "Dark Mode",
        content: "Sleek eye-friendly interface designed for late night sessions.",
        color: "indigo"
    },
    {
        title: "Export PDF",
        content: "Export note boards to beautifully formatted PDF documents.",
        color: "amber"
    },
    {
        title: "Keyboard Shortcuts",
        content: "Navigate and manage boards instantly without touch.",
        color: "purple"
    },
    {
        title: "Collaboration",
        content: "Securely share encrypted workspaces with trusted peers.",
        color: "rose"
    },

    // Mid Right Column
    {
        title: "OCR Scanner",
        content: "Convert handwritten image uploads into editable text notes.",
        color: "lime"
    },
    {
        title: "Audio Transcripts",
        content: "Record voice memos and generate automatic smart tags.",
        color: "pink"
    },
    {
        title: "Daily Journal",
        content: "A dedicated space for reflective daily habits and logs.",
        color: "cyan"
    },

    // Center Top & Bottom Anchors
    {
        title: "Key Note",
        content: "Ideas to Future",
        color: "amber"
    },
    {
        title: "Welcome",
        content: "Restore note checkpoints from previous edits easily.",
        color: "violet"
    }
];

/**
 * SubHero Component
 * 
 * Renders the secondary fold (features board) of the landing page.
 * Distributes features as sticky notes randomly floating in coordinates around the viewport.
 * 
 * Performance Optimization:
 * Opacity and scale are linked to scroll progress via a CSS Custom Property `--subhero-progress`.
 * Updates are done directly on `subHeroRef.current` without calling React state hooks, preventing
 * laggy re-renders of the 16 StickyNote elements.
 * 
 * @param {object} props
 * @param {function} props.onExplore - Navigates user to workspace upon vacuum animation completion.
 */
export default function SubHero({ onExplore }) {
    const [notes, setNotes] = useState([]);

    // isSucking triggers a vacuum visual effect that pulls all notes to the center button before transitioning
    const [isSucking, setIsSucking] = useState(false);

    // Target reference to write styling custom variables directly on DOM
    const subHeroRef = useRef(null);

    // Initialize placement coordinate values on load
    useEffect(() => {
        const placedNotes = INITIAL_NOTES.map((note, index) => {
            const position = FIXED_POSITIONS[index] || { top: 50, left: 50 };
            // Add subtle random-looking rotation (-2.5deg to 2.5deg) for authentic layout
            const rotate = (index % 3 - 1) * 2.5;

            // Compute distance from center (50vw, 50vh) for organic cascading vacuum vortex
            const dx = position.left - 50;
            const dy = position.top - 50;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Stagger delay from 0.05s (closest) to ~0.9s (outermost) so notes get sucked organically
            const delay = Number(((dist / 48) * 0.65 + (index % 4) * 0.08).toFixed(2));
            const spinDeg = (index % 2 === 0 ? 1 : -1) * (540 + (index % 3) * 180);

            return {
                ...note,
                topVal: position.top,
                leftVal: position.left,
                top: `${position.top}vh`,
                left: `${position.left}vw`,
                rotate: `${rotate}deg`,
                delay,
                spinDeg
            };
        });

        setNotes(placedNotes);
    }, []);

    // Sets custom CSS progress variable on scroll, avoiding React re-rendering
    useEffect(() => {
        const handleScroll = () => {
            const element = subHeroRef.current;
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // Opacity starts at 0% when the section top enters the screen,
            // and reaches 100% when the section top has filled 60% of the screen height.
            const startScroll = viewportHeight;
            const endScroll = viewportHeight * 0.4;

            const progress = (startScroll - rect.top) / (startScroll - endScroll);
            const clampedProgress = Math.max(0, Math.min(1, progress));
            element.style.setProperty('--subhero-progress', clampedProgress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initialize states

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    /**
     * Sucking vacuum animation handler:
     * Pulls notes smoothly in a cascading vortex to the center button before transitioning.
     */
    const handleExploreClick = () => {
        setIsSucking(true);
        // Delay navigation until all staggered notes and the center button vanish into the center
        setTimeout(() => {
            if (onExplore) {
                onExplore();
            }
            setIsSucking(false);
        }, 2200);
    };

    return (
        <section
            ref={subHeroRef}
            id="sub-hero"
            className="relative flex items-center justify-center min-h-[calc(100vh)] overflow-hidden bg-transparent"
            style={{
                opacity: 'var(--subhero-progress, 0)',
                transition: 'opacity 0.2s ease-out'
            }}
        >
            <style>{`
                /* Slow float bobbing animation for the floating cards */
                @keyframes float-bob {
                    0%, 100% {
                        transform: translate3d(0, -10px, 0);
                    }
                    50% {
                        transform: translate3d(0, 25px, 0);
                    }
                }
                .animate-float-bob {
                    animation: float-bob 15s ease-in-out infinite;
                    will-change: transform;
                }
                /* Hover scaling controls */
                .note-hover-wrapper {
                    position: relative;
                    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    transform: scale(1);
                    cursor: pointer;
                }
                .note-hover-wrapper:hover {
                    opacity: 1;
                    transform: scale(1.1) rotate(2.5deg) ;
                }
                /* Yellow Note Box 3D perspective and Flap Tearing Animations */
                .cardboard-box {
                    perspective: 1000px;
                    transform-style: preserve-3d;
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
                }
                .cardboard-box:hover:not(.is-torn) {
                    transform: scale(1.08) rotate(1.5deg);
                }
                .cardboard-box:active:not(.is-torn) {
                    transform: scale(0.96);
                }

                /* Flap Tearing Mechanics */
                .box-flap-top {
                    transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.6s ease;
                    transform-origin: top center;
                }
                .box-flap-bottom {
                    transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.6s ease;
                    transform-origin: bottom center;
                }
                .cardboard-box.is-torn .box-flap-top {
                    transform: rotateX(130deg) translateY(-10px);
                    opacity: 0.9;
                }
                .cardboard-box.is-torn .box-flap-bottom {
                    transform: rotateX(-130deg) translateY(10px);
                    opacity: 0.9;
                }

                /* Tear seam animation */
                .tear-strip {
                    transition: all 0.35s ease-out;
                }
                .cardboard-box.is-torn .tear-strip {
                    opacity: 0;
                    transform: translateY(-50%) scaleX(0);
                }

                /* Center box swallow & vanish pulse after packing notes */
                .cardboard-box.is-torn {
                    animation: box-swallow-pulse 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                @keyframes box-swallow-pulse {
                    0% {
                        transform: scale(1) rotate(0deg);
                    }
                    8% {
                        transform: scale(1.1) rotate(-3deg);
                    }
                    70% {
                        transform: scale(1.05) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(0) rotate(20deg);
                        opacity: 0;
                        pointer-events: none;
                    }
                }
            `}</style>

            {/* Background Decorative Floating Sticky Notes (Layered ABOVE the box during animation) */}
            <div className={`pointer-events-none absolute inset-0 overflow-hidden ${isSucking ? 'z-30' : 'z-10'}`}>
                {notes.map((note, idx) => {
                    // noteStyle resolves to:
                    // - vacuum animation coordinates if isSucking is active
                    // - scroll-driven scaling (calc using --subhero-progress CSS variable) under normal scroll
                    const noteStyle = isSucking ? {
                        top: note.top,
                        left: note.left,
                        transform: `translate3d(calc(50vw - ${note.leftVal}vw - 120px), calc(50vh - ${note.topVal}vh - 120px), 0) scale(0) rotate(${note.spinDeg}deg)`,
                        opacity: 0,
                        transition: 'transform 1.3s cubic-bezier(0.5, 0, 0.2, 1), opacity 1.1s cubic-bezier(0.5, 0, 0.2, 1)',
                        transitionDelay: `${note.delay}s`,
                        willChange: 'transform, opacity'
                    } : {
                        top: note.top,
                        left: note.left,
                        transform: `translate3d(0, 0, 0) scale(calc(0.55 + var(--subhero-progress, 0) * 0.45)) rotate(${note.rotate || '0deg'})`,
                        opacity: 1,
                        transition: 'transform 0.1s ease-out, opacity 0.2s ease-out',
                        willChange: 'transform, opacity' // Hardware-accelerate this layer
                    };

                    return (
                        <div
                            key={idx}
                            className="absolute w-56 sm:w-60 z-30 hover:z-50"
                            style={noteStyle}
                        >
                            <div className={isSucking ? '' : 'animate-float-bob'} style={{ animationDelay: `${idx * -1.5}s` }}>
                                <div className="pointer-events-auto note-hover-wrapper">
                                    <StickyNote
                                        mode="display"
                                        title={note.title}
                                        content={note.content}
                                        color={note.color}
                                        tags={note.tags}
                                        isPinned={false}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Center Yellow Box Button (Tears open and swallows notes inside) */}
            <div className="relative z-10">
                <button
                    type="button"
                    onClick={handleExploreClick}
                    disabled={isSucking}
                    aria-label="Try Now"
                    className={`cardboard-box group relative flex flex-col items-center justify-between w-36 h-36 sm:w-40 sm:h-40 rounded-sm shadow-xl cursor-pointer select-none border border-amber-300/80 overflow-visible ${
                        isSucking ? 'is-torn pointer-events-none' : ''
                    }`}
                    style={{
                        backgroundColor: '#fef08a',
                        boxShadow: '0 15px 30px -5px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
                    }}
                >
                    {/* Inside box void revealed when torn open */}
                    <div 
                        className="absolute inset-1.5 rounded-xs flex items-center justify-center overflow-hidden border border-black"
                        style={{ backgroundColor: '#000000', boxShadow: 'inset 0 4px 16px rgba(0,0,0,1)' }}
                    />

                    {/* Top Flap */}
                    <div 
                        className="box-flap-top absolute inset-x-0 top-0 h-1/2 rounded-t-sm origin-top border-b border-amber-300/60 flex items-end justify-center pb-1 z-10"
                        style={{
                            backgroundColor: '#fef08a'
                        }}
                    >
                        <span className="text-3xl font-handwriting tracking-tight text-amber-950 font-bold select-none">
                            Try
                        </span>
                    </div>

                    {/* Bottom Flap */}
                    <div 
                        className="box-flap-bottom absolute inset-x-0 bottom-0 h-1/2 rounded-b-sm origin-bottom border-t border-amber-300/60 flex items-start justify-center pt-1 z-10"
                        style={{
                            backgroundColor: '#fef08a'
                        }}
                    >
                        <span className="text-3xl font-handwriting tracking-tight text-amber-950 font-bold select-none">
                            Now
                        </span>
                    </div>

                    {/* Center Subtle Tear Seam */}
                    <div className="tear-strip absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 border-t border-dashed border-amber-500/50 z-20 pointer-events-none" />
                </button>
            </div>

        </section>
    );
}

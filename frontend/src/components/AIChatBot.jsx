import React, { useState, useEffect, useRef } from 'react';
import {
    Bot,
    Sparkles,
    Send,
    X,
    Minimize2,
    Maximize2,
    RotateCcw,
    ShieldCheck,
    Loader2,
    FileText,
    ChevronDown,
    Zap
} from 'lucide-react';
import { chatWithAI, getAIStatus } from '../services/api';

const PROMPT_SUGGESTIONS = [
    { label: "Urgent Tasks", prompt: "What are my urgent and high-priority pending tasks?" },
    { label: "Summarize Notes", prompt: "Give me a brief summary of all my saved notes." },
    { label: "Study Topics", prompt: "What topics or study notes do I have for my exam?" },
    { label: "Ideas & Planning", prompt: "List all my ideas and suggest what I should do next." }
];

export default function AIChatBot({ user, onSelectNote }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "👋 Hi! I'm your **Visionote AI Assistant**, powered by local **Llama 3.2** via Ollama.\n\nAll your notes and queries are processed **100% on this computer**—no cloud, zero data tracking. Ask me anything about your notes!",
            citations: []
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiStatus, setAiStatus] = useState({ online: true, model: 'llama3.2:latest', provider: 'Ollama' });
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [messages, isOpen, isMinimized]);

    // Check Ollama status periodically when opened
    useEffect(() => {
        if (isOpen) {
            getAIStatus()
                .then(status => setAiStatus(status))
                .catch(() => setAiStatus({ online: false, model: 'llama3.2', provider: 'Ollama' }));
        }
    }, [isOpen]);

    const handleSendMessage = async (textToSend) => {
        const queryText = (textToSend || inputValue).trim();
        if (!queryText || loading) return;

        const userId = user?.id || user?._id || user?.userId;
        if (!userId) {
            setMessages(prev => [
                ...prev,
                { role: 'user', content: queryText },
                { role: 'assistant', content: "⚠️ Please sign in to search and chat with your personal notes.", citations: [] }
            ]);
            setInputValue('');
            return;
        }

        const newMessages = [
            ...messages,
            { role: 'user', content: queryText }
        ];

        setMessages(newMessages);
        setInputValue('');
        setLoading(true);

        try {
            // Build conversation history (excluding the first welcome message)
            const history = newMessages
                .slice(1, -1)
                .map(m => ({ role: m.role, content: m.content }));

            const response = await chatWithAI(userId, queryText, history);

            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: response.reply || "I couldn't generate a response.",
                    citations: response.relevantNotes || []
                }
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: `⚠️ Error contacting local AI service: ${err.message || 'Make sure Ollama is running (`ollama run llama3.2:latest`)'}.`,
                    citations: []
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: "Chat cleared! What would you like to explore in your notes?",
                citations: []
            }
        ]);
    };

    // Render formatted markdown text simply without heavy dependencies
    const renderContent = (content) => {
        // Simple line parser with bold and code format
        const lines = content.split('\n');
        return lines.map((line, i) => {
            // Handle bullet items
            let isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim());
            let cleanLine = line;

            // Highlight [Note: ...] citations
            const parts = cleanLine.split(/(\[Note:.*?\]|\*\*.*?\*\*|`.*?`)/g);

            return (
                <div key={i} className={`${isBullet ? 'pl-2 my-0.5' : 'my-1'} leading-relaxed`}>
                    {parts.map((part, pIdx) => {
                        if (part.startsWith('[Note:') && part.endsWith(']')) {
                            return (
                                <span
                                    key={pIdx}
                                    className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold text-[11px] border border-indigo-200"
                                >
                                    <FileText className="w-3 h-3 inline" />
                                    {part.slice(1, -1)}
                                </span>
                            );
                        } else if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={pIdx} className="font-bold text-zinc-900">{part.slice(2, -2)}</strong>;
                        } else if (part.startsWith('`') && part.endsWith('`')) {
                            return <code key={pIdx} className="px-1 py-0.5 bg-zinc-100 text-pink-600 rounded font-mono text-[11px]">{part.slice(1, -1)}</code>;
                        }
                        return part;
                    })}
                </div>
            );
        });
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 select-text">
            {/* 1. Closed State: Floating Action Pill */}
            {!isOpen && (
                <button
                    onClick={() => { setIsOpen(true); setIsMinimized(false); }}
                    className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-4 py-3 text-white shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-105 hover:shadow-indigo-600/50 cursor-pointer"
                    title="Open Visionote AI Assistant"
                >
                    <div className="relative">
                        <Bot className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                    </div>
                    <span className="text-xs font-bold tracking-wide">Visionote AI</span>
                    <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">Local</span>
                </button>
            )}

            {/* 2. Minimized Bar */}
            {isOpen && isMinimized && (
                <div
                    onClick={() => setIsMinimized(false)}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-900 px-4 py-3 text-white shadow-2xl cursor-pointer hover:bg-zinc-800 transition w-72"
                >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                        <Bot className="h-4 w-4 text-indigo-400" />
                        <span>Visionote AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                            className="p-1 hover:bg-white/10 rounded"
                            title="Expand"
                        >
                            <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                            className="p-1 hover:bg-white/10 rounded"
                            title="Close"
                        >
                            <X className="h-3.5 w-3.5 text-zinc-400" />
                        </button>
                    </div>
                </div>
            )}

            {/* 3. Open State: Full Chatbot Modal */}
            {isOpen && !isMinimized && (
                <div className="flex flex-col rounded-3xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-900/20 transition-all duration-200 overflow-hidden w-[92vw] sm:w-[430px] h-[580px] max-h-[85vh]">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-zinc-900 via-zinc-800 to-indigo-950 px-4 py-3.5 text-white">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/80 text-white shadow-sm">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold tracking-tight">Visionote AI</h3>
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Llama 3.2
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                                    <span>100% Local & Private • Zero Cloud Leakage</span>
                                </div>
                            </div>
                        </div>

                        {/* Window Controls */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleClearChat}
                                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                                title="Clear conversation"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                                title="Minimize"
                            >
                                <Minimize2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                                title="Close"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50/60 text-xs">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-xs'
                                            : 'bg-white text-zinc-800 border border-zinc-200/80 rounded-bl-xs'
                                    }`}
                                >
                                    {renderContent(msg.content)}
                                </div>

                                {/* Citations / Relevant Notes Pills */}
                                {msg.citations && msg.citations.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1 max-w-[85%]">
                                        <span className="text-[10px] font-semibold text-zinc-400 mr-1 self-center">
                                            Referenced:
                                        </span>
                                        {msg.citations.map((c, cIdx) => (
                                            <span
                                                key={cIdx}
                                                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition"
                                                title={`Category: ${c.category} | Priority: ${c.priority} | Status: ${c.status}`}
                                            >
                                                <span
                                                    className="h-1.5 w-1.5 rounded-full"
                                                    style={{ backgroundColor: c.color || '#f59e0b' }}
                                                />
                                                <span className="truncate max-w-[120px]">{c.title}</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {loading && (
                            <div className="flex items-center gap-2 text-zinc-500 bg-white border border-zinc-200/80 rounded-2xl rounded-bl-xs p-3 max-w-[85%] shadow-xs">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-600 shrink-0" />
                                <span className="text-[11px] font-medium animate-pulse">
                                    Llama 3.2 is reading your notes and reasoning...
                                </span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompt Suggestion Pills */}
                    <div className="px-3 pt-2 pb-1 border-t border-zinc-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <Zap className="h-3 w-3 text-amber-500 shrink-0 ml-1" />
                        {PROMPT_SUGGESTIONS.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSendMessage(item.prompt)}
                                disabled={loading}
                                className="whitespace-nowrap rounded-lg border border-zinc-200/80 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition cursor-pointer disabled:opacity-50"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-3 bg-white border-t border-zinc-100">
                        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-1.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask anything about your notes..."
                                disabled={loading}
                                className="w-full bg-transparent text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={() => handleSendMessage()}
                                disabled={!inputValue.trim() || loading}
                                className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 cursor-pointer shrink-0"
                            >
                                <Send className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400 px-1">
                            <span>Press <strong>Enter</strong> to send</span>
                            <span>Semantic Search + Ollama RAG</span>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

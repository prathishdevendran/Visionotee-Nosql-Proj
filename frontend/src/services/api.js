const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
const BASE_URL = rawApiUrl.replace(/\/+$/, "");

async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
    }
    // Handle status 200/201/etc. If the response content is empty, return empty object
    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

export async function signup(name, email, password) {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(response);
}

export async function signin(email, password) {
    const response = await fetch(`${BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
}

export async function getNotes(userId) {
    const response = await fetch(`${BASE_URL}/notes?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
}

export async function createNote(noteData) {
    const response = await fetch(`${BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
    });
    return handleResponse(response);
}

export async function updateNote(noteId, updateData) {
    const response = await fetch(`${BASE_URL}/notes/${encodeURIComponent(noteId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
    });
    return handleResponse(response);
}

export async function deleteNote(noteId) {
    const response = await fetch(`${BASE_URL}/notes/${encodeURIComponent(noteId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
}

/**
 * Fetch consolidated aggregation metrics calculated directly via PyMongo aggregation pipelines.
 */
export async function getDashboardAnalytics(userId) {
    const response = await fetch(`${BASE_URL}/analytics/dashboard?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
}

/**
 * Fetch MongoDB aggregation pipelines, stage explanations, and live outputs for viva defense.
 */
export async function getVivaQueries(userId) {
    const response = await fetch(`${BASE_URL}/analytics/viva-queries?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
}

/**
 * Check local Ollama AI status and model reachability.
 */
export async function getAIStatus() {
    const response = await fetch(`${BASE_URL}/ai/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
}

/**
 * Chat with personal notes using local Ollama RAG (100% private & offline).
 */
export async function chatWithAI(userId, message, conversationHistory = []) {
    const response = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message, conversationHistory }),
    });
    return handleResponse(response);
}

/**
 * Execute vector/relevance semantic search over user's notes.
 */
export async function semanticSearchAI(userId, query) {
    const response = await fetch(`${BASE_URL}/ai/search?userId=${encodeURIComponent(userId)}&q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
}

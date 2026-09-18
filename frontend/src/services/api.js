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

// frontend/lib/api.js

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// 統一在這裡加上 /api/v1
const API_PREFIX = "/api/v1";

async function request(path, { method = "GET", body, token } = {}) {
    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let errText = "Request failed";
        try {
            const data = await res.json();
            errText = data.detail || JSON.stringify(data);
        } catch {
            errText = res.statusText;
        }
        throw new Error(errText);
    }

    if (res.status === 204) return null;
    return res.json();
}

export const api = {
    login: (email, password) =>
        request("/auth/login", {
            method: "POST",
            body: { email, password },
        }),

    get: (path, token) => request(path, { method: "GET", token }),
    post: (path, body, token) => request(path, { method: "POST", body, token }),
    patch: (path, body, token) =>
        request(path, { method: "PATCH", body, token }),
};

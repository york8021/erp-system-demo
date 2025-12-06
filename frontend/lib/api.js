// frontend/lib/api.js

// 後端 API base URL
// ★ 正式環境請在 .env.production 裡設定 NEXT_PUBLIC_API_BASE_URL
// ★ 開發環境請在 .env.development 或 .env.local 裡設定
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// 共用 request helper
async function request(path, { method = "GET", body, token } = {}) {
    const url = `${BASE_URL}${path}`;

    const headers = {};
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // 嘗試解析 JSON，如果不是 JSON 也不要整個 crash
    let data;
    const text = await res.text();
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!res.ok) {
        // 後端如果有回 message 就丟 message，沒有就丟 status
        const msg =
            (data && (data.detail || data.message)) ||
            text ||
            `Request failed with status ${res.status}`;
        throw new Error(msg);
    }

    return data;
}

// 舊版寫法會用到的物件：api
// 讓任何地方的 api.login(...) / api.get(...) / api.post(...) 都能正常工作
export const api = {
    // 給舊版 login 頁面使用：api.login(email, password)
    async login(email, password) {
        return request("/api/v1/auth/login", {
            method: "POST",
            body: { email, password },
        });
    },

    // 給一般 GET 用
    async get(path, token) {
        return request(`/api/v1${path}`, {
            method: "GET",
            token,
        });
    },

    // 給一般 POST 用
    async post(path, body, token) {
        return request(`/api/v1${path}`, {
            method: "POST",
            body,
            token,
        });
    },
};

// 新版 helper，如果你之後要在其他地方直接 import 也可以用
export async function apiLogin(email, password) {
    return api.login(email, password);
}

export async function apiGet(path, token) {
    return api.get(path, token);
}

export async function apiPost(path, body, token) {
    return api.post(path, body, token);
}

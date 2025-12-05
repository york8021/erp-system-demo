const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

export const api = {
    async get(path, token) {
        const res = await fetch(`${BASE_URL}${path}`, {
            headers: token
                ? { Authorization: `Bearer ${token}` }
                : undefined,
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    },

    async post(path, body, token) {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    },
};

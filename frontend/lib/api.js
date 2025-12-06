async function request(path, { method = "GET", body, token } = {}) {
    // 正確拼接 URL：避免 "8000login" 這種錯誤
    const url = `${BASE_URL}/${path.replace(/^\//, "")}`;

    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    const text = await res.text();
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!res.ok) {
        const msg =
            (data && (data.detail || data.message)) ||
            text ||
            `Request failed with status ${res.status}`;
        throw new Error(msg);
    }

    return data;
}

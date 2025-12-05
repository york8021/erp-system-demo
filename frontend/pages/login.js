// frontend/pages/login.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { apiLogin } from "../lib/api";

export default function Login({ token }) {
    const [email, setEmail] = useState("admin@example.com");
    const [password, setPassword] = useState("admin12345");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (token) {
            router.replace("/dashboard");
        }
    }, [token, router]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await apiLogin(email, password);
            const accessToken = data.access_token;
            if (typeof window !== "undefined") {
                window.localStorage.setItem("token", accessToken);
                if (window.__setToken) window.__setToken(accessToken);
            }
            router.replace("/dashboard");
        } catch (err) {
            console.error(err);
            setError(err.message || "登入失敗");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    width: 320,
                    padding: 24,
                    borderRadius: 8,
                    background: "#fff",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
            >
                <h1 style={{ marginBottom: 16, fontSize: 22 }}>ERP 登入</h1>
                <div style={{ fontSize: 12, marginBottom: 12, color: "#6b7280" }}>
                    預設管理員：admin@example.com / admin12345
                </div>

                <label style={{ fontSize: 13 }}>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                        width: "100%",
                        padding: 8,
                        marginBottom: 8,
                        borderRadius: 4,
                        border: "1px solid #d1d5db",
                    }}
                />

                <label style={{ fontSize: 13 }}>密碼</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                        width: "100%",
                        padding: 8,
                        marginBottom: 8,
                        borderRadius: 4,
                        border: "1px solid #d1d5db",
                    }}
                />

                {error && (
                    <div style={{ color: "red", marginBottom: 8, fontSize: 13 }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: 8,
                        marginTop: 4,
                        borderRadius: 4,
                        border: "none",
                        background: "#2563eb",
                        color: "#fff",
                        cursor: "pointer",
                    }}
                >
                    {loading ? "登入中…" : "登入"}
                </button>
            </form>
        </div>
    );
}

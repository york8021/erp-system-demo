// frontend/pages/login.jsx
import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "../lib/api";
import { useAuth } from "./_app";

export default function LoginPage() {
    const router = useRouter();
    const { login, user } = useAuth();

    const [email, setEmail] = useState("admin@example.com");
    const [password, setPassword] = useState("admin123");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // 如果已登入就直接帶去 dashboard
    if (user) {
        if (typeof window !== "undefined") {
            router.replace("/dashboard");
        }
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await api.login(email, password);
            // 後端回傳 { access_token, user: {...} }
            login({ token: res.access_token, user: res.user });
            router.push("/dashboard");
        } catch (err) {
            setError(err.message || "登入失敗");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    "radial-gradient(circle at top left,#E6F3FF 0,#F5F7FB 45%,#ffffff 100%)",
                padding: "16px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    borderRadius: "18px",
                    background: "#ffffff",
                    padding: "24px 24px 20px",
                    boxShadow: "0 20px 45px rgba(15,23,42,0.12)",
                    border: "1px solid #E5E7EB",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background:
                                "radial-gradient(circle at 30% 0,#ffffff 0,#66B3FF 40%,#1F74C9 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 18,
                            color: "#0F172A",
                            marginRight: 10,
                        }}
                    >
                        E
                    </div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>ERP System</div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>
                            使用管理員帳號登入系統
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 12 }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: 13,
                                marginBottom: 4,
                                color: "#374151",
                            }}
                        >
                            帳號（Email）
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: "100%",
                                borderRadius: 10,
                                border: "1px solid #D1D5DB",
                                padding: "8px 10px",
                                fontSize: 14,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: 13,
                                marginBottom: 4,
                                color: "#374151",
                            }}
                        >
                            密碼
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: "100%",
                                borderRadius: 10,
                                border: "1px solid #D1D5DB",
                                padding: "8px 10px",
                                fontSize: 14,
                            }}
                        />
                    </div>

                    {error && (
                        <div
                            style={{
                                marginBottom: 10,
                                fontSize: 12,
                                color: "#B91C1C",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: "100%",
                            marginTop: 4,
                            justifyContent: "center",
                            display: "inline-flex",
                            alignItems: "center",
                            textAlign: "center",
                        }}
                    >
                        {loading ? "登入中..." : "登入"}
                    </button>
                </form>

                <div
                    style={{
                        marginTop: 10,
                        fontSize: 11,
                        color: "#6B7280",
                        textAlign: "center",
                    }}
                >
                    預設帳號：admin@example.com / admin123
                </div>
            </div>
        </div>
    );
}

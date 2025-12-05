// frontend/pages/logs.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { useAuth } from "./_app";
import { api } from "../lib/api";

export default function LogsPage() {
    const router = useRouter();
    const { user, token } = useAuth();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [keyword, setKeyword] = useState("");
    const [moduleFilter, setModuleFilter] = useState("");
    const [userFilter, setUserFilter] = useState("");

    // 未登入就退回 login
    useEffect(() => {
        if (!user) {
            router.replace("/login");
        }
    }, [user, router]);

    useEffect(() => {
        if (!token) return;

        const fetchLogs = async () => {
            setLoading(true);
            setError("");
            try {
                // 後端 router prefix = "/log", get("/") → /api/v1/log/
                const data = await api.get("/log", token);
                setLogs(data);
            } catch (err) {
                setError(err.message || "載入系統日誌失敗");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [token]);

    if (!user) return null;

    const formatDateTime = (s) => {
        if (!s) return "";
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0"
        )}-${String(d.getDate()).padStart(2, "0")} ${String(
            d.getHours()
        ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    const modules = useMemo(() => {
        return Array.from(
            new Set(logs.map((l) => l.module).filter((m) => !!m))
        );
    }, [logs]);

    const users = useMemo(() => {
        return Array.from(
            new Set(logs.map((l) => l.user_email).filter((u) => !!u))
        );
    }, [logs]);

    const filteredLogs = useMemo(() => {
        let list = [...logs];

        if (moduleFilter) {
            list = list.filter((l) => l.module === moduleFilter);
        }

        if (userFilter) {
            list = list.filter((l) => l.user_email === userFilter);
        }

        if (keyword.trim()) {
            const kw = keyword.trim().toLowerCase();
            list = list.filter((l) => {
                return (
                    (l.action && l.action.toLowerCase().includes(kw)) ||
                    (l.details && l.details.toLowerCase().includes(kw)) ||
                    (l.module && l.module.toLowerCase().includes(kw)) ||
                    (l.user_email && l.user_email.toLowerCase().includes(kw)) ||
                    (String(l.ref_id || "") || "").toLowerCase().includes(kw)
                );
            });
        }

        // 依 timestamp desc 排序（後端應該已經排過，但這裡再保險一次）
        list.sort(
            (a, b) =>
                new Date(b.timestamp || 0).getTime() -
                new Date(a.timestamp || 0).getTime()
        );

        return list;
    }, [logs, moduleFilter, userFilter, keyword]);

    return (
        <Layout
            title="系統日誌"
            subtitle="追蹤誰在何時對系統做了哪些操作（Audit Log）"
        >
            {/* 篩選區 */}
            <div
                className="card"
                style={{ marginBottom: 16 }}
            >
                <div className="section-title">篩選條件</div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.4fr 1.2fr 1.2fr",
                        gap: 10,
                        alignItems: "center",
                    }}
                >
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: 12,
                                marginBottom: 4,
                                color: "#4B5563",
                            }}
                        >
                            關鍵字（Action / Details / User / Ref ID）
                        </label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="例如：Create Purchase Order / admin@example.com"
                            style={{
                                width: "100%",
                                borderRadius: 10,
                                border: "1px solid #D1D5DB",
                                padding: "6px 10px",
                                fontSize: 13,
                            }}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: 12,
                                marginBottom: 4,
                                color: "#4B5563",
                            }}
                        >
                            模組
                        </label>
                        <select
                            value={moduleFilter}
                            onChange={(e) => setModuleFilter(e.target.value)}
                            style={{
                                width: "100%",
                                borderRadius: 10,
                                border: "1px solid #D1D5DB",
                                padding: "6px 10px",
                                fontSize: 13,
                            }}
                        >
                            <option value="">全部</option>
                            {modules.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: 12,
                                marginBottom: 4,
                                color: "#4B5563",
                            }}
                        >
                            使用者
                        </label>
                        <select
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            style={{
                                width: "100%",
                                borderRadius: 10,
                                border: "1px solid #D1D5DB",
                                padding: "6px 10px",
                                fontSize: 13,
                            }}
                        >
                            <option value="">全部</option>
                            {users.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div
                        style={{
                            marginTop: 8,
                            fontSize: 12,
                            color: "#B91C1C",
                        }}
                    >
                        {error}
                    </div>
                )}
            </div>

            {/* 日誌列表 */}
            <div className="card">
                <div className="section-title">日誌記錄</div>
                <div
                    style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginBottom: 8,
                    }}
                >
                    顯示所有 AuditLog 記錄（預設由後端照時間倒序）。
                    包含：時間、使用者、模組、動作、參考 ID、詳細資訊。
                </div>

                {loading ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>載入中...</div>
                ) : filteredLogs.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>
                        沒有符合條件的日誌記錄。
                        {logs.length === 0 && "（或目前尚未產生任何日誌）"}
                    </div>
                ) : (
                    <div style={{ overflowX: "auto", maxHeight: 480 }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: 13,
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        textAlign: "left",
                                        borderBottom: "1px solid #E5E7EB",
                                        background: "#F9FAFB",
                                    }}
                                >
                                    <th style={{ padding: "8px 6px", width: 60 }}>ID</th>
                                    <th style={{ padding: "8px 6px", width: 160 }}>時間</th>
                                    <th style={{ padding: "8px 6px", width: 190 }}>使用者</th>
                                    <th style={{ padding: "8px 6px", width: 90 }}>模組</th>
                                    <th style={{ padding: "8px 6px", width: 180 }}>動作</th>
                                    <th style={{ padding: "8px 6px", width: 70 }}>Ref ID</th>
                                    <th style={{ padding: "8px 6px" }}>詳細資訊</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log) => (
                                    <tr
                                        key={log.id}
                                        style={{
                                            borderBottom: "1px solid #F3F4F6",
                                        }}
                                    >
                                        <td style={{ padding: "6px 6px", color: "#6B7280" }}>
                                            {log.id}
                                        </td>
                                        <td style={{ padding: "6px 6px", color: "#6B7280" }}>
                                            {formatDateTime(log.timestamp)}
                                        </td>
                                        <td style={{ padding: "6px 6px" }}>
                                            {log.user_email || "-"}
                                        </td>
                                        <td style={{ padding: "6px 6px" }}>
                                            {log.module || "-"}
                                        </td>
                                        <td style={{ padding: "6px 6px", fontWeight: 500 }}>
                                            {log.action || "-"}
                                        </td>
                                        <td style={{ padding: "6px 6px" }}>
                                            {log.ref_id ?? "-"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "6px 6px",
                                                fontSize: 12,
                                                color: "#4B5563",
                                                whiteSpace: "nowrap",
                                                textOverflow: "ellipsis",
                                                overflow: "hidden",
                                                maxWidth: 380,
                                            }}
                                            title={log.details || ""}
                                        >
                                            {log.details || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}

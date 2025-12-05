// frontend/pages/master/warehouses.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useAuth } from "../_app";
import { api } from "../../lib/api";

export default function WarehousesPage() {
    const router = useRouter();
    const { user, token } = useAuth();

    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [error, setError] = useState("");

    // 新增表單 state
    const [code, setCode] = useState("");
    const [name, setName] = useState("");

    // 未登入就退回 login
    useEffect(() => {
        if (!user) {
            router.replace("/login");
        }
    }, [user, router]);

    const fetchWarehouses = async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const data = await api.get("/master/warehouses", token);
            setWarehouses(data);
        } catch (err) {
            setError(err.message || "載入倉庫資料失敗");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchWarehouses();
        }
    }, [token]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!code.trim() || !name.trim()) {
            setError("請輸入倉庫代碼與名稱");
            return;
        }
        setLoadingCreate(true);
        setError("");
        try {
            await api.post(
                "/master/warehouses",
                {
                    code,
                    name,
                },
                token
            );
            setCode("");
            setName("");
            await fetchWarehouses();
        } catch (err) {
            setError(err.message || "新增倉庫失敗");
        } finally {
            setLoadingCreate(false);
        }
    };

    if (!user) return null;

    return (
        <Layout
            title="倉庫主檔"
            subtitle="維護倉庫資料，供庫存與進出貨流程使用"
        >
            {/* 新增倉庫區塊 */}
            <div
                className="card"
                style={{
                    marginBottom: 16,
                    borderColor: "#DBEAFE",
                    background: "linear-gradient(135deg,#F9FAFB,#E6F3FF)",
                }}
            >
                <div className="section-title">新增倉庫</div>
                <form
                    onSubmit={handleCreate}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 2fr auto",
                        gap: 10,
                        alignItems: "end",
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
                            倉庫代碼
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="例如：WH-01"
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
                            倉庫名稱
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：台北主倉 / 成品倉"
                            style={{
                                width: "100%",
                                borderRadius: 10,
                                border: "1px solid #D1D5DB",
                                padding: "6px 10px",
                                fontSize: 13,
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loadingCreate}
                            style={{ minWidth: 96 }}
                        >
                            {loadingCreate ? "新增中..." : "新增"}
                        </button>
                    </div>
                </form>

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

            {/* 倉庫列表 */}
            <div className="card">
                <div className="section-title">倉庫列表</div>
                {loading ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>載入中...</div>
                ) : warehouses.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>
                        目前尚無倉庫資料
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
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
                                    <th style={{ padding: "8px 6px", width: 80 }}>ID</th>
                                    <th style={{ padding: "8px 6px" }}>倉庫代碼</th>
                                    <th style={{ padding: "8px 6px" }}>倉庫名稱</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouses.map((w) => (
                                    <tr
                                        key={w.id}
                                        style={{
                                            borderBottom: "1px solid #F3F4F6",
                                        }}
                                    >
                                        <td style={{ padding: "6px 6px", color: "#6B7280" }}>
                                            {w.id}
                                        </td>
                                        <td style={{ padding: "6px 6px", fontWeight: 500 }}>
                                            {w.code}
                                        </td>
                                        <td style={{ padding: "6px 6px" }}>{w.name}</td>
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

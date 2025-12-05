// frontend/pages/master/customers.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useAuth } from "../_app";
import { api } from "../../lib/api";

export default function CustomersPage() {
    const router = useRouter();
    const { user, token } = useAuth();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [error, setError] = useState("");

    // 新增表單 state
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");

    // 未登入就退回 login
    useEffect(() => {
        if (!user) {
            router.replace("/login");
        }
    }, [user, router]);

    const fetchCustomers = async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const data = await api.get("/master/customers", token);
            setCustomers(data);
        } catch (err) {
            setError(err.message || "載入客戶資料失敗");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchCustomers();
        }
    }, [token]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("請輸入客戶名稱");
            return;
        }
        setLoadingCreate(true);
        setError("");
        try {
            await api.post(
                "/master/customers",
                {
                    name,
                    contact: contact || null,
                },
                token
            );
            setName("");
            setContact("");
            await fetchCustomers();
        } catch (err) {
            setError(err.message || "新增客戶失敗");
        } finally {
            setLoadingCreate(false);
        }
    };

    if (!user) return null;

    return (
        <Layout
            title="客戶主檔"
            subtitle="維護客戶基本資料，供銷售模組使用"
        >
            {/* 新增客戶區塊 */}
            <div
                className="card"
                style={{
                    marginBottom: 16,
                    borderColor: "#DBEAFE",
                    background: "linear-gradient(135deg,#F9FAFB,#E6F3FF)",
                }}
            >
                <div className="section-title">新增客戶</div>
                <form
                    onSubmit={handleCreate}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 2.5fr auto",
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
                            客戶名稱
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：台灣測試股份有限公司"
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
                            聯絡資訊（電話／Email／聯絡人）
                        </label>
                        <input
                            type="text"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            placeholder="例如：王小明 0912-345-678 / demo@example.com"
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

            {/* 客戶列表 */}
            <div className="card">
                <div className="section-title">客戶列表</div>
                {loading ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>載入中...</div>
                ) : customers.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>目前尚無客戶資料</div>
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
                                    <th style={{ padding: "8px 6px" }}>名稱</th>
                                    <th style={{ padding: "8px 6px" }}>聯絡資訊</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((c) => (
                                    <tr
                                        key={c.id}
                                        style={{
                                            borderBottom: "1px solid #F3F4F6",
                                        }}
                                    >
                                        <td style={{ padding: "6px 6px", color: "#6B7280" }}>
                                            {c.id}
                                        </td>
                                        <td style={{ padding: "6px 6px", fontWeight: 500 }}>
                                            {c.name}
                                        </td>
                                        <td style={{ padding: "6px 6px" }}>
                                            {c.contact || "-"}
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

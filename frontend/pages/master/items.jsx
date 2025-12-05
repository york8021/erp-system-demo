// frontend/pages/master/items.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useAuth } from "../_app";
import { api } from "../../lib/api";

export default function ItemsPage() {
    const router = useRouter();
    const { user, token } = useAuth();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [error, setError] = useState("");

    // 新增表單 state
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [unit, setUnit] = useState("pcs");

    // 未登入就退回 login
    useEffect(() => {
        if (!user) {
            router.replace("/login");
        }
    }, [user, router]);

    // 取得 Item 列表
    const fetchItems = async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const data = await api.get("/master/items", token);
            setItems(data);
        } catch (err) {
            setError(err.message || "載入品項失敗");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchItems();
        }
    }, [token]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!code.trim() || !name.trim()) {
            setError("請輸入品項代碼與名稱");
            return;
        }
        setLoadingCreate(true);
        setError("");
        try {
            await api.post(
                "/master/items",
                { code, name, unit: unit || "pcs" },
                token
            );
            setCode("");
            setName("");
            setUnit("pcs");
            await fetchItems();
        } catch (err) {
            setError(err.message || "新增品項失敗");
        } finally {
            setLoadingCreate(false);
        }
    };

    if (!user) return null;

    return (
        <Layout
            title="品項主檔"
            subtitle="管理 ERP 系統中的物料與品項"
        >
            {/* 新增區塊 */}
            <div
                className="card"
                style={{
                    marginBottom: 16,
                    borderColor: "#DBEAFE",
                    background: "linear-gradient(135deg,#F9FAFB,#E6F3FF)",
                }}
            >
                <div className="section-title">新增品項</div>
                <form
                    onSubmit={handleCreate}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.5fr 2fr 1fr auto",
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
                            品項代碼
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="例如：ITEM-001"
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
                            品項名稱
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：測試商品"
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
                            單位
                        </label>
                        <input
                            type="text"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            placeholder="pcs"
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

            {/* 列表區塊 */}
            <div className="card">
                <div className="section-title">品項列表</div>
                {loading ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>載入中...</div>
                ) : items.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>目前尚無品項</div>
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
                                    <th style={{ padding: "8px 6px" }}>品項代碼</th>
                                    <th style={{ padding: "8px 6px" }}>名稱</th>
                                    <th style={{ padding: "8px 6px", width: 80 }}>單位</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr
                                        key={item.id}
                                        style={{
                                            borderBottom: "1px solid #F3F4F6",
                                        }}
                                    >
                                        <td style={{ padding: "6px 6px", color: "#6B7280" }}>
                                            {item.id}
                                        </td>
                                        <td style={{ padding: "6px 6px", fontWeight: 500 }}>
                                            {item.code}
                                        </td>
                                        <td style={{ padding: "6px 6px" }}>{item.name}</td>
                                        <td style={{ padding: "6px 6px" }}>{item.unit}</td>
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

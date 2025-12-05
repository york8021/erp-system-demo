// frontend/pages/inventory.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { useAuth } from "./_app";
import { api } from "../lib/api";

export default function InventoryPage() {
    const router = useRouter();
    const { user, token } = useAuth();

    const [balances, setBalances] = useState([]);
    const [transactions, setTransactions] = useState([]);

    const [loadingBalances, setLoadingBalances] = useState(true);
    const [loadingTrx, setLoadingTrx] = useState(true);
    const [error, setError] = useState("");

    // 未登入就退回 login
    useEffect(() => {
        if (!user) {
            router.replace("/login");
        }
    }, [user, router]);

    const fetchBalances = async () => {
        if (!token) return;
        setLoadingBalances(true);
        setError("");
        try {
            const data = await api.get("/inventory/balances", token);
            setBalances(data);
        } catch (err) {
            setError(err.message || "載入庫存餘額失敗");
        } finally {
            setLoadingBalances(false);
        }
    };

    const fetchTransactions = async () => {
        if (!token) return;
        setLoadingTrx(true);
        try {
            const data = await api.get("/inventory/transactions", token);
            // 只顯示前 30 筆，避免太長
            setTransactions(data.slice(0, 30));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTrx(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchBalances();
            fetchTransactions();
        }
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

    return (
        <Layout
            title="庫存總覽"
            subtitle="查看各品項在各倉庫的即時庫存與交易紀錄"
        >
            {/* 庫存餘額區塊 */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="section-title">即時庫存餘額</div>
                <div
                    style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginBottom: 8,
                    }}
                >
                    來源：/api/v1/inventory/balances（由採購收貨、銷售出貨等交易自動更新）
                </div>

                {error && (
                    <div
                        style={{
                            marginBottom: 8,
                            fontSize: 12,
                            color: "#B91C1C",
                        }}
                    >
                        {error}
                    </div>
                )}

                {loadingBalances ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>載入中...</div>
                ) : balances.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>
                        目前尚無庫存資料，請先建立品項 / 倉庫，並透過採購或銷售模組產生交易。
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
                                    <th style={{ padding: "8px 6px", width: 80 }}>Item ID</th>
                                    <th style={{ padding: "8px 6px", width: 80 }}>Warehouse ID</th>
                                    <th style={{ padding: "8px 6px" }}>庫存數量</th>
                                </tr>
                            </thead>
                            <tbody>
                                {balances.map((b) => (
                                    <tr
                                        key={b.id}
                                        style={{
                                            borderBottom: "1px solid #F3F4F6",
                                        }}
                                    >
                                        <td style={{ padding: "6px 6px", color: "#6B7280" }}>
                                            {b.id}
                                        </td>
                                        <td style={{ padding: "6px 6px" }}>{b.item_id}</td>
                                        <td style={{ padding: "6px 6px" }}>{b.warehouse_id}</td>
                                        <td
                                            style={{
                                                padding: "6px 6px",
                                                fontWeight: 500,
                                                color:
                                                    b.qty_on_hand < 0
                                                        ? "#B91C1C"
                                                        : b.qty_on_hand === 0
                                                            ? "#6B7280"
                                                            : "#065F46",
                                            }}
                                        >
                                            {b.qty_on_hand}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 庫存交易紀錄區塊 */}
            <div className="card">
                <div className="section-title">最近庫存交易紀錄</div>
                <div
                    style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginBottom: 8,
                    }}
                >
                    來源：/api/v1/inventory/transactions（顯示最近 30 筆；qty &gt; 0 表示入庫，&lt; 0 表示出庫）
                </div>

                {loadingTrx ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>載入中...</div>
                ) : transactions.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>
                        目前尚無庫存交易紀錄。
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
                                    <th style={{ padding: "8px 6px", width: 80 }}>Item ID</th>
                                    <th style={{ padding: "8px 6px", width: 80 }}>Wh ID</th>
                                    <th style={{ padding: "8px 6px", width: 90 }}>數量</th>
                                    <th style={{ padding: "8px 6px", width: 90 }}>來源類型</th>
                                    <th style={{ padding: "8px 6px", width: 80 }}>來源 ID</th>
                                    <th style={{ padding: "8px 6px", width: 160 }}>時間</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t) => (
                                    <tr
                                        key={t.id}
                                        style={{
                                            borderBottom: "1px solid #F3F4F6",
                                        }}
                                    >
                                        <td style={{ padding: "6px 6px", color: "#6B7280" }}>
                                            {t.id}
                                        </td>
                                        <td style={{ padding: "6px 6px" }}>{t.item_id}</td>
                                        <td style={{ padding: "6px 6px" }}>{t.warehouse_id}</td>
                                        <td
                                            style={{
                                                padding: "6px 6px",
                                                fontWeight: 600,
                                                color:
                                                    t.qty > 0
                                                        ? "#065F46" // 入庫綠色
                                                        : t.qty < 0
                                                            ? "#B91C1C" // 出庫紅色
                                                            : "#374151",
                                            }}
                                        >
                                            {t.qty}
                                        </td>
                                        <td style={{ padding: "6px 6px" }}>
                                            {t.ref_type || "-"}
                                        </td>
                                        <td style={{ padding: "6px 6px" }}>
                                            {t.ref_id ?? "-"}
                                        </td>
                                        <td style={{ padding: "6px 6px", color: "#6B7280" }}>
                                            {formatDateTime(t.timestamp)}
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

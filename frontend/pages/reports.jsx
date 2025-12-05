// frontend/pages/reports.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { useAuth } from "./_app";
import { api } from "../lib/api";

export default function ReportsPage() {
    const router = useRouter();
    const { user, token } = useAuth();

    const [balances, setBalances] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [items, setItems] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 未登入就退回 login
    useEffect(() => {
        if (!user) {
            router.replace("/login");
        }
    }, [user, router]);

    // 讀取庫存與品項主檔
    useEffect(() => {
        if (!token) return;

        const fetchAll = async () => {
            setLoading(true);
            setError("");
            try {
                const [balancesData, trxData, itemsData] = await Promise.all([
                    api.get("/inventory/balances", token),
                    api.get("/inventory/transactions", token),
                    api.get("/master/items", token),
                ]);
                setBalances(balancesData);
                setTransactions(trxData);
                setItems(itemsData);
            } catch (err) {
                setError(err.message || "載入報表資料失敗");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [token]);

    if (!user) return null;

    // 取得 item id -> {code,name} 的 map
    const itemMap = useMemo(() => {
        const map = {};
        items.forEach((it) => {
            map[it.id] = {
                code: it.code,
                name: it.name,
            };
        });
        return map;
    }, [items]);

    // 整理庫存：以 item_id 聚合所有倉庫
    const aggregatedStock = useMemo(() => {
        const agg = {};
        balances.forEach((b) => {
            if (!agg[b.item_id]) {
                agg[b.item_id] = {
                    item_id: b.item_id,
                    totalQty: 0,
                };
            }
            agg[b.item_id].totalQty += b.qty_on_hand;
        });
        return Object.values(agg);
    }, [balances]);

    // 報表指標
    const summary = useMemo(() => {
        const totalSkus = aggregatedStock.length;
        const totalQty = aggregatedStock.reduce(
            (sum, row) => sum + (row.totalQty || 0),
            0
        );

        const warehouseCount = new Set(
            balances.map((b) => b.warehouse_id)
        ).size;

        const negativeCount = aggregatedStock.filter(
            (row) => row.totalQty < 0
        ).length;

        // 最近 7 天的庫存交易
        const now = new Date();
        const sevenDaysAgo = new Date(
            now.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        let inQty = 0;
        let outQty = 0;
        let count = 0;

        transactions.forEach((t) => {
            const dt = new Date(t.timestamp);
            if (Number.isNaN(dt.getTime())) return;
            if (dt >= sevenDaysAgo) {
                count += 1;
                if (t.qty > 0) inQty += t.qty;
                else if (t.qty < 0) outQty += -t.qty;
            }
        });

        return {
            totalSkus,
            totalQty,
            warehouseCount,
            negativeCount,
            last7Days: {
                inQty,
                outQty,
                count,
            },
        };
    }, [aggregatedStock, balances, transactions]);

    // Top 10 庫存最高品項
    const topItems = useMemo(() => {
        const list = [...aggregatedStock];
        list.sort((a, b) => (b.totalQty || 0) - (a.totalQty || 0));
        return list.slice(0, 10);
    }, [aggregatedStock]);

    const formatNumber = (n) => {
        if (typeof n !== "number") return n;
        return n.toLocaleString("zh-TW");
    };

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

    // 取最近 10 筆交易顯示在下方
    const latestTrx = useMemo(() => {
        const copy = [...transactions];
        // 後端已經照 timestamp desc 排過，如果不確定可以自己 sort 一次
        copy.sort(
            (a, b) =>
                new Date(b.timestamp || 0).getTime() -
                new Date(a.timestamp || 0).getTime()
        );
        return copy.slice(0, 10);
    }, [transactions]);

    return (
        <Layout
            title="報表總覽"
            subtitle="整合庫存與交易資料的簡易儀表板"
        >
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

            {/* 上排 summary cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
                    gap: 14,
                    marginBottom: 16,
                }}
            >
                <div className="card">
                    <div
                        style={{
                            fontSize: 12,
                            color: "#6B7280",
                            marginBottom: 4,
                        }}
                    >
                        有庫存紀錄的品項數
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>
                        {loading ? "…" : summary.totalSkus}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: "#9CA3AF",
                            marginTop: 4,
                        }}
                    >
                        從 /inventory/balances 聚合 item_id 而來
                    </div>
                </div>

                <div className="card">
                    <div
                        style={{
                            fontSize: 12,
                            color: "#6B7280",
                            marginBottom: 4,
                        }}
                    >
                        總庫存數量（所有倉合計）
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>
                        {loading ? "…" : formatNumber(summary.totalQty)}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: "#9CA3AF",
                            marginTop: 4,
                        }}
                    >
                        可搭配 item 單位一起說明
                    </div>
                </div>

                <div className="card">
                    <div
                        style={{
                            fontSize: 12,
                            color: "#6B7280",
                            marginBottom: 4,
                        }}
                    >
                        倉庫數量
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>
                        {loading ? "…" : summary.warehouseCount}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: "#9CA3AF",
                            marginTop: 4,
                        }}
                    >
                        依據 balances 中的 warehouse_id 數量
                    </div>
                </div>

                <div className="card">
                    <div
                        style={{
                            fontSize: 12,
                            color: "#6B7280",
                            marginBottom: 4,
                        }}
                    >
                        庫存為負的品項數
                    </div>
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 600,
                            color: summary.negativeCount > 0 ? "#B91C1C" : "#065F46",
                        }}
                    >
                        {loading ? "…" : summary.negativeCount}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: "#9CA3AF",
                            marginTop: 4,
                        }}
                    >
                        可能代表超賣或資料異常
                    </div>
                </div>
            </div>

            {/* 中間：Top Items */}
            <div
                className="card"
                style={{ marginBottom: 16 }}
            >
                <div className="section-title">庫存量最高的前 10 品項</div>
                <div
                    style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginBottom: 8,
                    }}
                >
                    依照所有倉庫加總後的 qty_on_hand 排序。
                </div>

                {loading ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>載入中...</div>
                ) : topItems.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>
                        目前尚無庫存資料。
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
                                    <th style={{ padding: "8px 6px", width: 80 }}>Item ID</th>
                                    <th style={{ padding: "8px 6px" }}>品項代碼</th>
                                    <th style={{ padding: "8px 6px" }}>品項名稱</th>
                                    <th style={{ padding: "8px 6px", width: 120 }}>總庫存數量</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topItems.map((row) => {
                                    const meta = itemMap[row.item_id] || {};
                                    return (
                                        <tr
                                            key={row.item_id}
                                            style={{
                                                borderBottom: "1px solid #F3F4F6",
                                            }}
                                        >
                                            <td style={{ padding: "6px 6px", color: "#6B7280" }}>
                                                {row.item_id}
                                            </td>
                                            <td style={{ padding: "6px 6px", fontWeight: 500 }}>
                                                {meta.code || "-"}
                                            </td>
                                            <td style={{ padding: "6px 6px" }}>
                                                {meta.name || "-"}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "6px 6px",
                                                    fontWeight: 600,
                                                    color:
                                                        row.totalQty < 0
                                                            ? "#B91C1C"
                                                            : row.totalQty === 0
                                                                ? "#6B7280"
                                                                : "#065F46",
                                                }}
                                            >
                                                {formatNumber(row.totalQty)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 下方：最近交易摘要 + 最近 10 筆 */}
            <div className="card">
                <div className="section-title">最近庫存活動</div>
                <div
                    style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginBottom: 8,
                    }}
                >
                    以下數據來自 /inventory/transactions，僅統計最近 7 天的交易量，
                    並列出最新 10 筆交易。
                </div>

                {/* 小 summary */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                        gap: 12,
                        marginBottom: 10,
                    }}
                >
                    <div
                        className="card"
                        style={{
                            boxShadow: "none",
                            borderColor: "#E5E7EB",
                            background: "#F9FAFB",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 12,
                                color: "#6B7280",
                                marginBottom: 4,
                            }}
                        >
                            最近 7 天入庫總量
                        </div>
                        <div
                            style={{
                                fontSize: 20,
                                fontWeight: 600,
                                color: "#065F46",
                            }}
                        >
                            {loading ? "…" : formatNumber(summary.last7Days.inQty)}
                        </div>
                    </div>

                    <div
                        className="card"
                        style={{
                            boxShadow: "none",
                            borderColor: "#E5E7EB",
                            background: "#FEF2F2",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 12,
                                color: "#991B1B",
                                marginBottom: 4,
                            }}
                        >
                            最近 7 天出庫總量
                        </div>
                        <div
                            style={{
                                fontSize: 20,
                                fontWeight: 600,
                                color: "#B91C1C",
                            }}
                        >
                            {loading ? "…" : formatNumber(summary.last7Days.outQty)}
                        </div>
                    </div>

                    <div
                        className="card"
                        style={{
                            boxShadow: "none",
                            borderColor: "#E5E7EB",
                            background: "#EFF6FF",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 12,
                                color: "#1D4ED8",
                                marginBottom: 4,
                            }}
                        >
                            最近 7 天交易筆數
                        </div>
                        <div
                            style={{
                                fontSize: 20,
                                fontWeight: 600,
                                color: "#1D4ED8",
                            }}
                        >
                            {loading ? "…" : summary.last7Days.count}
                        </div>
                    </div>
                </div>

                {/* 最新 10 筆交易列表 */}
                {loading ? (
                    <div style={{ fontSize: 13, color: "#6B7280" }}>載入中...</div>
                ) : latestTrx.length === 0 ? (
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
                                    <th style={{ padding: "8px 6px", width: 70 }}>ID</th>
                                    <th style={{ padding: "8px 6px", width: 80 }}>Item ID</th>
                                    <th style={{ padding: "8px 6px" }}>品項代碼/名稱</th>
                                    <th style={{ padding: "8px 6px", width: 80 }}>Wh ID</th>
                                    <th style={{ padding: "8px 6px", width: 90 }}>數量</th>
                                    <th style={{ padding: "8px 6px", width: 90 }}>來源類型</th>
                                    <th style={{ padding: "8px 6px", width: 80 }}>來源 ID</th>
                                    <th style={{ padding: "8px 6px", width: 160 }}>時間</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latestTrx.map((t) => {
                                    const meta = itemMap[t.item_id] || {};
                                    return (
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
                                            <td style={{ padding: "6px 6px" }}>
                                                {meta.code || "-"}{" "}
                                                {meta.name ? ` - ${meta.name}` : ""}
                                            </td>
                                            <td style={{ padding: "6px 6px" }}>
                                                {t.warehouse_id}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "6px 6px",
                                                    fontWeight: 600,
                                                    color:
                                                        t.qty > 0
                                                            ? "#065F46"
                                                            : t.qty < 0
                                                                ? "#B91C1C"
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}

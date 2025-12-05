// frontend/pages/inventory/transactions.js
import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { apiListTransactions } from "../../lib/api";

export default function TransactionsPage(props) {
    return (
        <ProtectedPage {...props}>
            <TxnInner {...props} />
        </ProtectedPage>
    );
}

function TxnInner({ token }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterItemId, setFilterItemId] = useState("");
    const [filterWhId, setFilterWhId] = useState("");
    const [filterType, setFilterType] = useState("");

    useEffect(() => {
        if (!token) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function load() {
        try {
            setLoading(true);
            const data = await apiListTransactions(token);
            setRows(data);
        } catch (err) {
            console.error(err);
            alert(err.message || "載入庫存交易失敗");
        } finally {
            setLoading(false);
        }
    }

    const filtered = rows.filter((r) => {
        if (filterItemId && String(r.item_id) !== filterItemId.trim()) return false;
        if (filterWhId && String(r.warehouse_id) !== filterWhId.trim()) return false;
        if (filterType && r.txn_type !== filterType) return false;
        return true;
    });

    return (
        <div>
            <h1 style={{ marginBottom: 16 }}>庫存交易明細</h1>

            <div
                style={{
                    marginBottom: 12,
                    padding: 12,
                    background: "#fff",
                    borderRadius: 8,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                <div>
                    <label style={{ fontSize: 13 }}>Item ID：</label>
                    <input
                        value={filterItemId}
                        onChange={(e) => setFilterItemId(e.target.value)}
                        style={{ width: 100, padding: 4 }}
                        placeholder="全部"
                    />
                </div>
                <div>
                    <label style={{ fontSize: 13 }}>Warehouse ID：</label>
                    <input
                        value={filterWhId}
                        onChange={(e) => setFilterWhId(e.target.value)}
                        style={{ width: 100, padding: 4 }}
                        placeholder="全部"
                    />
                </div>
                <div>
                    <label style={{ fontSize: 13 }}>類型：</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ padding: 4 }}
                    >
                        <option value="">全部</option>
                        <option value="RECEIPT">RECEIPT（入庫）</option>
                        <option value="ISSUE">ISSUE（出庫）</option>
                        <option value="ADJUST">ADJUST（調整）</option>
                    </select>
                </div>
                <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    style={{
                        padding: "6px 10px",
                        borderRadius: 4,
                        border: "none",
                        background: "#2563eb",
                        color: "#fff",
                        cursor: "pointer",
                    }}
                >
                    {loading ? "重新整理中…" : "重新整理"}
                </button>
            </div>

            <div
                style={{
                    background: "#fff",
                    borderRadius: 8,
                    padding: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 13,
                    }}
                >
                    <thead>
                        <tr>
                            <Th>ID</Th>
                            <Th>時間</Th>
                            <Th>類型</Th>
                            <Th>Item ID</Th>
                            <Th>Warehouse ID</Th>
                            <Th>數量</Th>
                            <Th>成本</Th>
                            <Th>來源類型</Th>
                            <Th>來源 ID</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((t) => (
                            <tr key={t.id}>
                                <Td>{t.id}</Td>
                                <Td>{formatDateTime(t.txn_time)}</Td>
                                <Td>{t.txn_type}</Td>
                                <Td>{t.item_id}</Td>
                                <Td>{t.warehouse_id}</Td>
                                <Td>{t.qty}</Td>
                                <Td>{t.unit_cost}</Td>
                                <Td>{t.ref_type || "-"}</Td>
                                <Td>{t.ref_id ?? "-"}</Td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <Td colSpan={9}>目前沒有符合條件的交易。</Td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Th(props) {
    return (
        <th
            {...props}
            style={{
                textAlign: "left",
                padding: 8,
                borderBottom: "1px solid #e5e7eb",
                background: "#f9fafb",
            }}
        />
    );
}

function Td(props) {
    return (
        <td
            {...props}
            style={{
                padding: 8,
                borderBottom: "1px solid #e5e7eb",
                whiteSpace: "nowrap",
            }}
        />
    );
}

function formatDateTime(s) {
    if (!s) return "";
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleString();
    } catch {
        return s;
    }
}

// frontend/pages/inventory/balances.js
import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { apiListBalances } from "../../lib/api";

export default function BalancesPage(props) {
    return (
        <ProtectedPage {...props}>
            <BalancesInner {...props} />
        </ProtectedPage>
    );
}

function BalancesInner({ token }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterItemId, setFilterItemId] = useState("");
    const [filterWhId, setFilterWhId] = useState("");

    useEffect(() => {
        if (!token) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function load() {
        try {
            setLoading(true);
            const data = await apiListBalances(token);
            setRows(data);
        } catch (err) {
            console.error(err);
            alert(err.message || "載入庫存結存失敗");
        } finally {
            setLoading(false);
        }
    }

    const filtered = rows.filter((r) => {
        if (filterItemId && String(r.item_id) !== filterItemId.trim()) return false;
        if (filterWhId && String(r.warehouse_id) !== filterWhId.trim()) return false;
        return true;
    });

    return (
        <div>
            <h1 style={{ marginBottom: 16 }}>庫存結存</h1>

            <div
                style={{
                    marginBottom: 12,
                    padding: 12,
                    background: "#fff",
                    borderRadius: 8,
                    display: "flex",
                    gap: 12,
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
                        fontSize: 14,
                    }}
                >
                    <thead>
                        <tr>
                            <Th>ID</Th>
                            <Th>Item ID</Th>
                            <Th>Warehouse ID</Th>
                            <Th>數量</Th>
                            <Th>平均成本</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r) => (
                            <tr key={r.id}>
                                <Td>{r.id}</Td>
                                <Td>{r.item_id}</Td>
                                <Td>{r.warehouse_id}</Td>
                                <Td>{r.qty}</Td>
                                <Td>{r.avg_cost}</Td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <Td colSpan={5}>目前沒有符合條件的結存。</Td>
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
            }}
        />
    );
}

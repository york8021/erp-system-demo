// frontend/pages/dashboard.js
import { useEffect, useState } from "react";
import ProtectedPage from "../components/ProtectedPage";
import {
    apiListBalances,
    apiListPO,
    apiListSO,
} from "../lib/api";

export default function DashboardPage(props) {
    return (
        <ProtectedPage {...props}>
            <DashboardInner {...props} />
        </ProtectedPage>
    );
}

function DashboardInner({ token, user }) {
    const [balances, setBalances] = useState([]);
    const [poList, setPoList] = useState([]);
    const [soList, setSoList] = useState([]);

    useEffect(() => {
        if (!token) return;
        async function load() {
            try {
                const [b, p, s] = await Promise.all([
                    apiListBalances(token),
                    apiListPO(token),
                    apiListSO(token),
                ]);
                setBalances(b);
                setPoList(p);
                setSoList(s);
            } catch (err) {
                console.error(err);
            }
        }
        load();
    }, [token]);

    const totalItems = balances.length;
    const totalPO = poList.length;
    const totalSO = soList.length;

    return (
        <div>
            <h1 style={{ marginBottom: 16 }}>儀表板</h1>

            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                <KpiCard label="庫存品項數" value={totalItems} />
                <KpiCard label="採購訂單數" value={totalPO} />
                <KpiCard label="銷售訂單數" value={totalSO} />
                <KpiCard label="登入角色" value={user?.role || "-"} />
            </div>

            <h2 style={{ marginBottom: 8, fontSize: 18 }}>最近庫存結存（前 10 筆）</h2>
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
                        {balances.slice(0, 10).map((b) => (
                            <tr key={b.id}>
                                <Td>{b.id}</Td>
                                <Td>{b.item_id}</Td>
                                <Td>{b.warehouse_id}</Td>
                                <Td>{b.qty}</Td>
                                <Td>{b.avg_cost}</Td>
                            </tr>
                        ))}
                        {balances.length === 0 && (
                            <tr>
                                <Td colSpan={5}>目前尚無庫存資料。</Td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function KpiCard({ label, value }) {
    return (
        <div
            style={{
                flex: "1 1 160px",
                padding: 16,
                borderRadius: 8,
                background: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
        >
            <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
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
            style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}
        />
    );
}

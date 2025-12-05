// frontend/pages/sales/sales-orders.js
import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import {
    apiListCustomers,
    apiListItems,
    apiListWarehouses,
    apiCreateSO,
    apiListSO,
    apiApproveSO,
} from "../../lib/api";

export default function SalesOrdersPage(props) {
    return (
        <ProtectedPage {...props}>
            <SoInner {...props} />
        </ProtectedPage>
    );
}

function SoInner({ token }) {
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [soList, setSoList] = useState([]);

    const [customerId, setCustomerId] = useState("");
    const [lines, setLines] = useState([
        { item_id: "", warehouse_id: "", qty: 1, unit_price: 0 },
    ]);

    const [error, setError] = useState(null);
    const [loadingInit, setLoadingInit] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [reloadingSO, setReloadingSO] = useState(false);

    useEffect(() => {
        if (!token) return;
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function init() {
        try {
            setLoadingInit(true);
            const [c, i, w, so] = await Promise.all([
                apiListCustomers(token),
                apiListItems(token),
                apiListWarehouses(token),
                apiListSO(token),
            ]);
            setCustomers(c);
            setItems(i);
            setWarehouses(w);
            setSoList(so);
        } catch (err) {
            console.error(err);
            setError(err.message || "載入銷售資料失敗");
        } finally {
            setLoadingInit(false);
        }
    }

    async function reloadSO() {
        try {
            setReloadingSO(true);
            const so = await apiListSO(token);
            setSoList(so);
        } catch (err) {
            console.error(err);
            alert(err.message || "重新載入銷售訂單失敗");
        } finally {
            setReloadingSO(false);
        }
    }

    function updateLine(idx, field, value) {
        setLines((prev) =>
            prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
        );
    }

    function addLine() {
        setLines((prev) => [
            ...prev,
            { item_id: "", warehouse_id: "", qty: 1, unit_price: 0 },
        ]);
    }

    function removeLine(idx) {
        setLines((prev) => prev.filter((_, i) => i !== idx));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        if (!customerId) {
            setError("請選擇客戶");
            return;
        }

        const validLines = lines.filter(
            (l) => l.item_id && l.warehouse_id && Number(l.qty) > 0
        );

        if (validLines.length === 0) {
            setError("請至少填寫一筆有效明細（品項、倉庫、數量）");
            return;
        }

        try {
            setSubmitting(true);
            const body = {
                customer_id: Number(customerId),
                lines: validLines.map((l) => ({
                    item_id: Number(l.item_id),
                    warehouse_id: Number(l.warehouse_id),
                    qty: Number(l.qty),
                    unit_price: Number(l.unit_price || 0),
                })),
            };
            await apiCreateSO(token, body);
            setCustomerId("");
            setLines([{ item_id: "", warehouse_id: "", qty: 1, unit_price: 0 }]);
            await reloadSO();
        } catch (err) {
            console.error(err);
            setError(err.message || "建立銷售訂單失敗");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleApprove(id) {
        try {
            await apiApproveSO(token, id);
            await reloadSO();
        } catch (err) {
            console.error(err);
            alert(err.message || "核准失敗");
        }
    }

    function customerLabelById(id) {
        const c = customers.find((x) => x.id === id);
        if (!c) return id;
        return `${c.code} - ${c.name}`;
    }

    return (
        <div>
            <h1 style={{ marginBottom: 16 }}>銷售訂單</h1>

            <section
                style={{
                    marginBottom: 16,
                    padding: 12,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <h2 style={{ marginBottom: 8, fontSize: 18 }}>新增銷售訂單</h2>

                {loadingInit ? (
                    <div>載入主檔資料中…</div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: 13 }}>客戶：</label>
                                <select
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value)}
                                    style={{ padding: 6, minWidth: 220 }}
                                >
                                    <option value="">請選擇客戶</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.code} - {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div
                                style={{
                                    marginTop: 8,
                                    marginBottom: 8,
                                    borderRadius: 6,
                                    overflow: "hidden",
                                    border: "1px solid #e5e7eb",
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
                                            <Th>品項</Th>
                                            <Th>倉庫</Th>
                                            <Th>數量</Th>
                                            <Th>單價</Th>
                                            <Th>操作</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((l, idx) => (
                                            <tr key={idx}>
                                                <Td>
                                                    <select
                                                        value={l.item_id}
                                                        onChange={(e) =>
                                                            updateLine(idx, "item_id", e.target.value)
                                                        }
                                                        style={{ padding: 4, minWidth: 200 }}
                                                    >
                                                        <option value="">選擇品項</option>
                                                        {items.map((i) => (
                                                            <option key={i.id} value={i.id}>
                                                                {i.sku} - {i.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </Td>
                                                <Td>
                                                    <select
                                                        value={l.warehouse_id}
                                                        onChange={(e) =>
                                                            updateLine(idx, "warehouse_id", e.target.value)
                                                        }
                                                        style={{ padding: 4, minWidth: 160 }}
                                                    >
                                                        <option value="">選擇倉庫</option>
                                                        {warehouses.map((w) => (
                                                            <option key={w.id} value={w.id}>
                                                                {w.code} - {w.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={l.qty}
                                                        onChange={(e) =>
                                                            updateLine(idx, "qty", e.target.value)
                                                        }
                                                        style={{ width: 80, padding: 4 }}
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={l.unit_price}
                                                        onChange={(e) =>
                                                            updateLine(idx, "unit_price", e.target.value)
                                                        }
                                                        style={{ width: 100, padding: 4 }}
                                                    />
                                                </Td>
                                                <Td>
                                                    {lines.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLine(idx)}
                                                            style={{
                                                                padding: "4px 8px",
                                                                borderRadius: 4,
                                                                border: "none",
                                                                background: "#ef4444",
                                                                color: "#fff",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            刪除
                                                        </button>
                                                    )}
                                                </Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                type="button"
                                onClick={addLine}
                                style={{
                                    padding: "6px 10px",
                                    marginRight: 8,
                                    borderRadius: 4,
                                    border: "1px solid #d1d5db",
                                    background: "#f9fafb",
                                    cursor: "pointer",
                                }}
                            >
                                新增明細列
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: 4,
                                    border: "none",
                                    background: "#2563eb",
                                    color: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                {submitting ? "送出中…" : "建立銷售訂單"}
                            </button>
                        </form>
                        {error && (
                            <div style={{ marginTop: 8, color: "red" }}>{error}</div>
                        )}
                    </>
                )}
            </section>

            <section
                style={{
                    padding: 12,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <div
                    style={{
                        marginBottom: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <h2 style={{ fontSize: 18 }}>銷售訂單列表</h2>
                    <button
                        type="button"
                        onClick={reloadSO}
                        disabled={reloadingSO}
                        style={{
                            padding: "4px 10px",
                            borderRadius: 4,
                            border: "1px solid #d1d5db",
                            background: "#f9fafb",
                            cursor: "pointer",
                        }}
                    >
                        {reloadingSO ? "重新整理中…" : "重新整理"}
                    </button>
                </div>

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
                            <Th>單號</Th>
                            <Th>客戶</Th>
                            <Th>狀態</Th>
                            <Th>建立日期</Th>
                            <Th>操作</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {soList.map((s) => (
                            <tr key={s.id}>
                                <Td>{s.id}</Td>
                                <Td>{s.so_number}</Td>
                                <Td>{customerLabelById(s.customer_id)}</Td>
                                <Td>{s.status}</Td>
                                <Td>{formatDateTime(s.order_date)}</Td>
                                <Td>
                                    {s.status === "draft" && (
                                        <button
                                            type="button"
                                            onClick={() => handleApprove(s.id)}
                                            style={{
                                                padding: "4px 8px",
                                                borderRadius: 4,
                                                border: "none",
                                                background: "#10b981",
                                                color: "#fff",
                                                cursor: "pointer",
                                            }}
                                        >
                                            核准
                                        </button>
                                    )}
                                </Td>
                            </tr>
                        ))}
                        {soList.length === 0 && (
                            <tr>
                                <Td colSpan={6}>目前尚無銷售訂單。</Td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
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

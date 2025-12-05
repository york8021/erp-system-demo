// frontend/pages/sales/shipments.js
import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import {
    apiListItems,
    apiListWarehouses,
    apiListSO,
    apiCreateShipment,
    apiListShipments,
    apiPostShipment,
} from "../../lib/api";

export default function ShipmentsPage(props) {
    return (
        <ProtectedPage {...props}>
            <ShipInner {...props} />
        </ProtectedPage>
    );
}

function ShipInner({ token }) {
    const [items, setItems] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [soList, setSoList] = useState([]);
    const [shipmentList, setShipmentList] = useState([]);

    const [soId, setSoId] = useState("");
    const [lines, setLines] = useState([{ item_id: "", warehouse_id: "", qty: 1 }]);

    const [error, setError] = useState(null);
    const [loadingInit, setLoadingInit] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [reloadingShp, setReloadingShp] = useState(false);

    useEffect(() => {
        if (!token) return;
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function init() {
        try {
            setLoadingInit(true);
            const [i, w, so, shps] = await Promise.all([
                apiListItems(token),
                apiListWarehouses(token),
                apiListSO(token),
                apiListShipments(token),
            ]);
            setItems(i);
            setWarehouses(w);
            setSoList(so);
            setShipmentList(shps);
        } catch (err) {
            console.error(err);
            setError(err.message || "載入出貨資料失敗");
        } finally {
            setLoadingInit(false);
        }
    }

    async function reloadShipments() {
        try {
            setReloadingShp(true);
            const shps = await apiListShipments(token);
            setShipmentList(shps);
        } catch (err) {
            console.error(err);
            alert(err.message || "重新載入出貨單失敗");
        } finally {
            setReloadingShp(false);
        }
    }

    function updateLine(idx, field, value) {
        setLines((prev) =>
            prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
        );
    }

    function addLine() {
        setLines((prev) => [...prev, { item_id: "", warehouse_id: "", qty: 1 }]);
    }

    function removeLine(idx) {
        setLines((prev) => prev.filter((_, i) => i !== idx));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

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
                so_id: soId ? Number(soId) : null,
                lines: validLines.map((l) => ({
                    item_id: Number(l.item_id),
                    warehouse_id: Number(l.warehouse_id),
                    qty: Number(l.qty),
                })),
            };
            await apiCreateShipment(token, body);
            setSoId("");
            setLines([{ item_id: "", warehouse_id: "", qty: 1 }]);
            await reloadShipments();
        } catch (err) {
            console.error(err);
            setError(err.message || "建立出貨單失敗");
        } finally {
            setSubmitting(false);
        }
    }

    async function handlePost(id) {
        if (!window.confirm("確定要過帳這張出貨單？會扣除庫存。")) return;
        try {
            await apiPostShipment(token, id);
            await reloadShipments();
        } catch (err) {
            console.error(err);
            alert(err.message || "過帳失敗");
        }
    }

    function soLabelById(id) {
        const s = soList.find((x) => x.id === id);
        if (!s) return id ?? "";
        return `${s.so_number} (customer_id=${s.customer_id})`;
    }

    return (
        <div>
            <h1 style={{ marginBottom: 16 }}>出貨單</h1>

            <section
                style={{
                    marginBottom: 16,
                    padding: 12,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <h2 style={{ marginBottom: 8, fontSize: 18 }}>新增出貨單</h2>

                {loadingInit ? (
                    <div>載入主檔資料中…</div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: 13 }}>來源銷售訂單（選填）：</label>
                                <select
                                    value={soId}
                                    onChange={(e) => setSoId(e.target.value)}
                                    style={{ padding: 6, minWidth: 260 }}
                                >
                                    <option value="">不指定</option>
                                    {soList.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.so_number}（customer_id={s.customer_id}）
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
                                {submitting ? "送出中…" : "建立出貨單"}
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
                    <h2 style={{ fontSize: 18 }}>出貨單列表</h2>
                    <button
                        type="button"
                        onClick={reloadShipments}
                        disabled={reloadingShp}
                        style={{
                            padding: "4px 10px",
                            borderRadius: 4,
                            border: "1px solid #d1d5db",
                            background: "#f9fafb",
                            cursor: "pointer",
                        }}
                    >
                        {reloadingShp ? "重新整理中…" : "重新整理"}
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
                            <Th>來源 SO</Th>
                            <Th>狀態</Th>
                            <Th>出貨日期</Th>
                            <Th>操作</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipmentList.map((s) => (
                            <tr key={s.id}>
                                <Td>{s.id}</Td>
                                <Td>{s.shipment_number}</Td>
                                <Td>{s.so_id ? soLabelById(s.so_id) : "-"}</Td>
                                <Td>{s.status}</Td>
                                <Td>{formatDateTime(s.ship_date)}</Td>
                                <Td>
                                    {s.status === "draft" && (
                                        <button
                                            type="button"
                                            onClick={() => handlePost(s.id)}
                                            style={{
                                                padding: "4px 8px",
                                                borderRadius: 4,
                                                border: "none",
                                                background: "#10b981",
                                                color: "#fff",
                                                cursor: "pointer",
                                            }}
                                        >
                                            過帳
                                        </button>
                                    )}
                                </Td>
                            </tr>
                        ))}
                        {shipmentList.length === 0 && (
                            <tr>
                                <Td colSpan={6}>目前尚無出貨單。</Td>
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

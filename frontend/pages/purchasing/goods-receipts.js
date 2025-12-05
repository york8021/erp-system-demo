// frontend/pages/purchasing/goods-receipts.js
import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import {
    apiListItems,
    apiListWarehouses,
    apiListPO,
    apiCreateGR,
    apiListGR,
    apiPostGR,
} from "../../lib/api";

export default function GoodsReceiptsPage(props) {
    return (
        <ProtectedPage {...props}>
            <GrInner {...props} />
        </ProtectedPage>
    );
}

function GrInner({ token }) {
    const [items, setItems] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [poList, setPoList] = useState([]);
    const [grList, setGrList] = useState([]);

    const [poId, setPoId] = useState(""); // 可選：掛哪張 PO
    const [lines, setLines] = useState([
        { item_id: "", warehouse_id: "", qty: 1, unit_cost: 0 },
    ]);

    const [error, setError] = useState(null);
    const [loadingInit, setLoadingInit] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [reloadingGR, setReloadingGR] = useState(false);

    useEffect(() => {
        if (!token) return;
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function init() {
        try {
            setLoadingInit(true);
            const [i, w, po, gr] = await Promise.all([
                apiListItems(token),
                apiListWarehouses(token),
                apiListPO(token),
                apiListGR(token),
            ]);
            setItems(i);
            setWarehouses(w);
            setPoList(po);
            setGrList(gr);
        } catch (err) {
            console.error(err);
            setError(err.message || "載入收貨資料失敗");
        } finally {
            setLoadingInit(false);
        }
    }

    async function reloadGR() {
        try {
            setReloadingGR(true);
            const gr = await apiListGR(token);
            setGrList(gr);
        } catch (err) {
            console.error(err);
            alert(err.message || "重新載入收貨單失敗");
        } finally {
            setReloadingGR(false);
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
            { item_id: "", warehouse_id: "", qty: 1, unit_cost: 0 },
        ]);
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
            setError("請至少填寫一筆有效的明細（品項、倉庫與數量）");
            return;
        }

        try {
            setSubmitting(true);
            const body = {
                po_id: poId ? Number(poId) : null,
                lines: validLines.map((l) => ({
                    item_id: Number(l.item_id),
                    warehouse_id: Number(l.warehouse_id),
                    qty: Number(l.qty),
                    unit_cost: Number(l.unit_cost || 0),
                })),
            };
            await apiCreateGR(token, body);
            setPoId("");
            setLines([{ item_id: "", warehouse_id: "", qty: 1, unit_cost: 0 }]);
            await reloadGR();
        } catch (err) {
            console.error(err);
            setError(err.message || "建立收貨單失敗");
        } finally {
            setSubmitting(false);
        }
    }

    async function handlePost(id) {
        if (!window.confirm("確定要過帳這張收貨單？過帳後會更新庫存。")) return;
        try {
            await apiPostGR(token, id);
            await reloadGR();
        } catch (err) {
            console.error(err);
            alert(err.message || "過帳失敗");
        }
    }

    function poLabelById(id) {
        const p = poList.find((x) => x.id === id);
        if (!p) return id ?? "";
        return `${p.po_number} (vendor_id=${p.vendor_id})`;
    }

    return (
        <div>
            <h1 style={{ marginBottom: 16 }}>收貨單</h1>

            {/* 建立 GR */}
            <section
                style={{
                    marginBottom: 16,
                    padding: 12,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <h2 style={{ marginBottom: 8, fontSize: 18 }}>新增收貨單</h2>

                {loadingInit ? (
                    <div>載入主檔資料中…</div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: 13 }}>來源採購單（選填）：</label>
                                <select
                                    value={poId}
                                    onChange={(e) => setPoId(e.target.value)}
                                    style={{ padding: 6, minWidth: 260 }}
                                >
                                    <option value="">不指定</option>
                                    {poList.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.po_number}（vendor_id={p.vendor_id}）
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
                                            <Th>單位成本</Th>
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
                                                        value={l.unit_cost}
                                                        onChange={(e) =>
                                                            updateLine(idx, "unit_cost", e.target.value)
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
                                {submitting ? "送出中…" : "建立收貨單"}
                            </button>
                        </form>
                        {error && (
                            <div style={{ marginTop: 8, color: "red" }}>{error}</div>
                        )}
                    </>
                )}
            </section>

            {/* GR 列表 */}
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
                    <h2 style={{ fontSize: 18 }}>收貨單列表</h2>
                    <button
                        type="button"
                        onClick={reloadGR}
                        disabled={reloadingGR}
                        style={{
                            padding: "4px 10px",
                            borderRadius: 4,
                            border: "1px solid #d1d5db",
                            background: "#f9fafb",
                            cursor: "pointer",
                        }}
                    >
                        {reloadingGR ? "重新整理中…" : "重新整理"}
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
                            <Th>來源 PO</Th>
                            <Th>狀態</Th>
                            <Th>收貨日期</Th>
                            <Th>操作</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {grList.map((g) => (
                            <tr key={g.id}>
                                <Td>{g.id}</Td>
                                <Td>{g.gr_number}</Td>
                                <Td>{g.po_id ? poLabelById(g.po_id) : "-"}</Td>
                                <Td>{g.status}</Td>
                                <Td>{formatDateTime(g.receipt_date)}</Td>
                                <Td>
                                    {g.status === "draft" && (
                                        <button
                                            type="button"
                                            onClick={() => handlePost(g.id)}
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
                        {grList.length === 0 && (
                            <tr>
                                <Td colSpan={6}>目前尚無收貨單。</Td>
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

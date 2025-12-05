// frontend/pages/purchasing.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { useAuth } from "./_app";
import { api } from "../lib/api";

export default function PurchasingPage() {
    const router = useRouter();
    const { user, token } = useAuth();

    const [vendors, setVendors] = useState([]);
    const [items, setItems] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [loadingMaster, setLoadingMaster] = useState(true);
    const [errorMaster, setErrorMaster] = useState("");

    // 建立 PO 的 state
    const [poVendorId, setPoVendorId] = useState("");
    const [poLines, setPoLines] = useState([{ item_id: "", qty: "" }]);
    const [creatingPO, setCreatingPO] = useState(false);
    const [poResult, setPoResult] = useState(null);

    // 建立 GR 的 state
    const [grPoId, setGrPoId] = useState("");
    const [grWarehouseId, setGrWarehouseId] = useState("");
    const [grLines, setGrLines] = useState([{ item_id: "", qty: "" }]);
    const [creatingGR, setCreatingGR] = useState(false);
    const [grResult, setGrResult] = useState(null);
    const [error, setError] = useState("");

    // 未登入就退回 login
    useEffect(() => {
        if (!user) {
            router.replace("/login");
        }
    }, [user, router]);

    // 載入 Vendor / Item / Warehouse 主檔
    const fetchMaster = async () => {
        if (!token) return;
        setLoadingMaster(true);
        setErrorMaster("");
        try {
            const [vendorsData, itemsData, warehousesData] = await Promise.all([
                api.get("/master/vendors", token),
                api.get("/master/items", token),
                api.get("/master/warehouses", token),
            ]);
            setVendors(vendorsData);
            setItems(itemsData);
            setWarehouses(warehousesData);
        } catch (err) {
            setErrorMaster(err.message || "載入主檔資料失敗");
        } finally {
            setLoadingMaster(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchMaster();
        }
    }, [token]);

    if (!user) return null;

    // ------- 共用的小 helper -------

    const updatePoLine = (index, field, value) => {
        setPoLines((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const addPoLine = () => {
        setPoLines((prev) => [...prev, { item_id: "", qty: "" }]);
    };

    const removePoLine = (index) => {
        setPoLines((prev) => prev.filter((_, i) => i !== index));
    };

    const updateGrLine = (index, field, value) => {
        setGrLines((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const addGrLine = () => {
        setGrLines((prev) => [...prev, { item_id: "", qty: "" }]);
    };

    const removeGrLine = (index) => {
        setGrLines((prev) => prev.filter((_, i) => i !== index));
    };

    // ------- 建立 PO -------

    const handleCreatePO = async (e) => {
        e.preventDefault();
        setError("");
        setPoResult(null);

        if (!poVendorId) {
            setError("請選擇供應商");
            return;
        }

        const validLines = poLines
            .map((l) => ({
                item_id: l.item_id ? Number(l.item_id) : null,
                qty: l.qty ? Number(l.qty) : null,
            }))
            .filter((l) => l.item_id && l.qty && l.qty > 0);

        if (validLines.length === 0) {
            setError("請至少輸入一筆有效的品項與數量");
            return;
        }

        setCreatingPO(true);
        try {
            const res = await api.post(
                "/purchasing/po",
                {
                    vendor_id: Number(poVendorId),
                    lines: validLines,
                },
                token
            );
            setPoResult(res);
            // reset lines
            setPoLines([{ item_id: "", qty: "" }]);
        } catch (err) {
            setError(err.message || "建立採購單失敗");
        } finally {
            setCreatingPO(false);
        }
    };

    // ------- 建立 GR -------

    const handleCreateGR = async (e) => {
        e.preventDefault();
        setError("");
        setGrResult(null);

        if (!grPoId) {
            setError("請輸入或選擇欲收貨之 PO 編號（ID）");
            return;
        }
        if (!grWarehouseId) {
            setError("請選擇收貨倉庫");
            return;
        }

        const validLines = grLines
            .map((l) => ({
                item_id: l.item_id ? Number(l.item_id) : null,
                qty: l.qty ? Number(l.qty) : null,
            }))
            .filter((l) => l.item_id && l.qty && l.qty > 0);

        if (validLines.length === 0) {
            setError("請至少輸入一筆收貨的品項與數量");
            return;
        }

        setCreatingGR(true);
        try {
            const res = await api.post(
                "/purchasing/gr",
                {
                    po_id: Number(grPoId),
                    warehouse_id: Number(grWarehouseId),
                    lines: validLines,
                },
                token
            );
            setGrResult(res);
            setGrLines([{ item_id: "", qty: "" }]);
            // 收貨後可以順便刷新庫存頁看到效果
        } catch (err) {
            setError(err.message || "建立收貨單失敗");
        } finally {
            setCreatingGR(false);
        }
    };

    const findVendorName = (id) =>
        vendors.find((v) => v.id === id)?.name || "";

    const findWarehouseName = (id) =>
        warehouses.find((w) => w.id === id)?.name || "";

    // ------- 畫面 -------

    return (
        <Layout
            title="採購作業"
            subtitle="建立採購訂單（PO）與收貨（GR），自動更新庫存"
        >
            {errorMaster && (
                <div
                    style={{
                        marginBottom: 10,
                        fontSize: 12,
                        color: "#B91C1C",
                    }}
                >
                    主檔載入失敗：{errorMaster}
                </div>
            )}

            {/* 建立採購單 PO */}
            <div
                className="card"
                style={{
                    marginBottom: 16,
                    borderColor: "#DBEAFE",
                    background: "linear-gradient(135deg,#F9FAFB,#E6F3FF)",
                }}
            >
                <div className="section-title">建立採購訂單（PO）</div>
                <div
                    style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginBottom: 8,
                    }}
                >
                    先選擇供應商，再為本張訂單新增多筆品項與數量。
                </div>

                <form onSubmit={handleCreatePO}>
                    {/* 供應商選擇 */}
                    <div
                        style={{
                            marginBottom: 10,
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        <div style={{ flex: 1.5 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: 12,
                                    marginBottom: 4,
                                    color: "#4B5563",
                                }}
                            >
                                供應商
                            </label>
                            <select
                                value={poVendorId}
                                onChange={(e) => setPoVendorId(e.target.value)}
                                style={{
                                    width: "100%",
                                    borderRadius: 10,
                                    border: "1px solid #D1D5DB",
                                    padding: "6px 10px",
                                    fontSize: 13,
                                }}
                            >
                                <option value="">請選擇供應商</option>
                                {vendors.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name || `#${v.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 明細輸入 */}
                    <div
                        style={{
                            borderRadius: 12,
                            border: "1px solid #E5E7EB",
                            padding: 10,
                            background: "#FFFFFFAA",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 12,
                                color: "#6B7280",
                                marginBottom: 6,
                            }}
                        >
                            採購明細
                        </div>
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
                                        <th style={{ padding: "6px 6px" }}>品項</th>
                                        <th style={{ padding: "6px 6px", width: 120 }}>數量</th>
                                        <th style={{ padding: "6px 6px", width: 60 }}>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {poLines.map((line, idx) => (
                                        <tr
                                            key={idx}
                                            style={{
                                                borderBottom: "1px solid #F3F4F6",
                                            }}
                                        >
                                            <td style={{ padding: "6px 6px" }}>
                                                <select
                                                    value={line.item_id}
                                                    onChange={(e) =>
                                                        updatePoLine(idx, "item_id", e.target.value)
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        borderRadius: 8,
                                                        border: "1px solid #D1D5DB",
                                                        padding: "4px 8px",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    <option value="">選擇品項</option>
                                                    {items.map((it) => (
                                                        <option key={it.id} value={it.id}>
                                                            {it.code} - {it.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ padding: "6px 6px" }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={line.qty}
                                                    onChange={(e) =>
                                                        updatePoLine(idx, "qty", e.target.value)
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        borderRadius: 8,
                                                        border: "1px solid #D1D5DB",
                                                        padding: "4px 8px",
                                                        fontSize: 13,
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: "6px 6px" }}>
                                                {poLines.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removePoLine(idx)}
                                                        style={{
                                                            border: "none",
                                                            background: "transparent",
                                                            fontSize: 12,
                                                            color: "#9CA3AF",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        刪除
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div
                            style={{
                                marginTop: 8,
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 8,
                                alignItems: "center",
                            }}
                        >
                            <button
                                type="button"
                                onClick={addPoLine}
                                style={{
                                    borderRadius: 999,
                                    border: "1px dashed #93C5FD",
                                    padding: "4px 10px",
                                    fontSize: 12,
                                    background: "#EFF6FF",
                                    color: "#1D4ED8",
                                    cursor: "pointer",
                                }}
                            >
                                + 新增一行明細
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={creatingPO || loadingMaster}
                                style={{ minWidth: 120 }}
                            >
                                {creatingPO ? "建立中..." : "建立採購單"}
                            </button>
                        </div>
                    </div>
                </form>

                {poResult && (
                    <div
                        style={{
                            marginTop: 8,
                            fontSize: 12,
                            color: "#065F46",
                        }}
                    >
                        已建立採購單：ID {poResult.id}（供應商{" "}
                        {findVendorName(poResult.vendor_id) || poResult.vendor_id}）
                    </div>
                )}
            </div>

            {/* 建立收貨 GR */}
            <div className="card">
                <div className="section-title">建立收貨單（GR）</div>
                <div
                    style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginBottom: 8,
                    }}
                >
                    請輸入已建立的 PO 編號（ID），選擇倉庫後輸入本次收貨品項與數量。
                    <br />
                    成功後會自動寫入庫存交易與庫存餘額，你可以到「庫存總覽」頁面確認。
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

                <form onSubmit={handleCreateGR}>
                    <div
                        style={{
                            marginBottom: 10,
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: 12,
                                    marginBottom: 4,
                                    color: "#4B5563",
                                }}
                            >
                                採購單編號（PO ID）
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={grPoId}
                                onChange={(e) => setGrPoId(e.target.value)}
                                placeholder="例如：1"
                                style={{
                                    width: "100%",
                                    borderRadius: 10,
                                    border: "1px solid #D1D5DB",
                                    padding: "6px 10px",
                                    fontSize: 13,
                                }}
                            />
                        </div>

                        <div style={{ flex: 1 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: 12,
                                    marginBottom: 4,
                                    color: "#4B5563",
                                }}
                            >
                                收貨倉庫
                            </label>
                            <select
                                value={grWarehouseId}
                                onChange={(e) => setGrWarehouseId(e.target.value)}
                                style={{
                                    width: "100%",
                                    borderRadius: 10,
                                    border: "1px solid #D1D5DB",
                                    padding: "6px 10px",
                                    fontSize: 13,
                                }}
                            >
                                <option value="">請選擇倉庫</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.code} - {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* GR 明細輸入 */}
                    <div
                        style={{
                            borderRadius: 12,
                            border: "1px solid #E5E7EB",
                            padding: 10,
                            background: "#FFFFFFAA",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 12,
                                color: "#6B7280",
                                marginBottom: 6,
                            }}
                        >
                            收貨明細
                        </div>
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
                                        <th style={{ padding: "6px 6px" }}>品項</th>
                                        <th style={{ padding: "6px 6px", width: 120 }}>收貨數量</th>
                                        <th style={{ padding: "6px 6px", width: 60 }}>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grLines.map((line, idx) => (
                                        <tr
                                            key={idx}
                                            style={{
                                                borderBottom: "1px solid #F3F4F6",
                                            }}
                                        >
                                            <td style={{ padding: "6px 6px" }}>
                                                <select
                                                    value={line.item_id}
                                                    onChange={(e) =>
                                                        updateGrLine(idx, "item_id", e.target.value)
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        borderRadius: 8,
                                                        border: "1px solid #D1D5DB",
                                                        padding: "4px 8px",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    <option value="">選擇品項</option>
                                                    {items.map((it) => (
                                                        <option key={it.id} value={it.id}>
                                                            {it.code} - {it.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ padding: "6px 6px" }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={line.qty}
                                                    onChange={(e) =>
                                                        updateGrLine(idx, "qty", e.target.value)
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        borderRadius: 8,
                                                        border: "1px solid #D1D5DB",
                                                        padding: "4px 8px",
                                                        fontSize: 13,
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: "6px 6px" }}>
                                                {grLines.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeGrLine(idx)}
                                                        style={{
                                                            border: "none",
                                                            background: "transparent",
                                                            fontSize: 12,
                                                            color: "#9CA3AF",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        刪除
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div
                            style={{
                                marginTop: 8,
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 8,
                                alignItems: "center",
                            }}
                        >
                            <button
                                type="button"
                                onClick={addGrLine}
                                style={{
                                    borderRadius: 999,
                                    border: "1px dashed #93C5FD",
                                    padding: "4px 10px",
                                    fontSize: 12,
                                    background: "#EFF6FF",
                                    color: "#1D4ED8",
                                    cursor: "pointer",
                                }}
                            >
                                + 新增一行收貨明細
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={creatingGR || loadingMaster}
                                style={{ minWidth: 120 }}
                            >
                                {creatingGR ? "建立中..." : "建立收貨單"}
                            </button>
                        </div>
                    </div>
                </form>

                {grResult && (
                    <div
                        style={{
                            marginTop: 8,
                            fontSize: 12,
                            color: "#065F46",
                        }}
                    >
                        已建立收貨單：ID {grResult.id}（PO {grResult.po_id}，倉庫{" "}
                        {findWarehouseName(grResult.warehouse_id) ||
                            grResult.warehouse_id}
                        ）。
                    </div>
                )}
            </div>
        </Layout>
    );
}

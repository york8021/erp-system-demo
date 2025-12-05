// frontend/pages/sales.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { useAuth } from "./_app";
import { api } from "../lib/api";

export default function SalesPage() {
    const router = useRouter();
    const { user, token } = useAuth();

    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [loadingMaster, setLoadingMaster] = useState(true);
    const [errorMaster, setErrorMaster] = useState("");

    // 建立 SO 的 state
    const [soCustomerId, setSoCustomerId] = useState("");
    const [soLines, setSoLines] = useState([{ item_id: "", qty: "" }]);
    const [creatingSO, setCreatingSO] = useState(false);
    const [soResult, setSoResult] = useState(null);

    // 建立 Shipment 的 state
    const [shSoId, setShSoId] = useState("");
    const [shWarehouseId, setShWarehouseId] = useState("");
    const [shLines, setShLines] = useState([{ item_id: "", qty: "" }]);
    const [creatingShipment, setCreatingShipment] = useState(false);
    const [shResult, setShResult] = useState(null);

    const [error, setError] = useState("");

    // 未登入就退回 login
    useEffect(() => {
        if (!user) {
            router.replace("/login");
        }
    }, [user, router]);

    // 載入 Customer / Item / Warehouse 主檔
    const fetchMaster = async () => {
        if (!token) return;
        setLoadingMaster(true);
        setErrorMaster("");
        try {
            const [customersData, itemsData, warehousesData] = await Promise.all([
                api.get("/master/customers", token),
                api.get("/master/items", token),
                api.get("/master/warehouses", token),
            ]);
            setCustomers(customersData);
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

    // ------- 共用 helper：SO 明細 -------

    const updateSoLine = (index, field, value) => {
        setSoLines((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const addSoLine = () => {
        setSoLines((prev) => [...prev, { item_id: "", qty: "" }]);
    };

    const removeSoLine = (index) => {
        setSoLines((prev) => prev.filter((_, i) => i !== index));
    };

    // ------- 共用 helper：Shipment 明細 -------

    const updateShLine = (index, field, value) => {
        setShLines((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const addShLine = () => {
        setShLines((prev) => [...prev, { item_id: "", qty: "" }]);
    };

    const removeShLine = (index) => {
        setShLines((prev) => prev.filter((_, i) => i !== index));
    };

    // ------- 建立 SO -------

    const handleCreateSO = async (e) => {
        e.preventDefault();
        setError("");
        setSoResult(null);

        if (!soCustomerId) {
            setError("請選擇客戶");
            return;
        }

        const validLines = soLines
            .map((l) => ({
                item_id: l.item_id ? Number(l.item_id) : null,
                qty: l.qty ? Number(l.qty) : null,
            }))
            .filter((l) => l.item_id && l.qty && l.qty > 0);

        if (validLines.length === 0) {
            setError("請至少輸入一筆有效的品項與數量");
            return;
        }

        setCreatingSO(true);
        try {
            const res = await api.post(
                "/sales/so",
                {
                    customer_id: Number(soCustomerId),
                    lines: validLines,
                },
                token
            );
            setSoResult(res);
            setSoLines([{ item_id: "", qty: "" }]);
        } catch (err) {
            setError(err.message || "建立銷售訂單失敗");
        } finally {
            setCreatingSO(false);
        }
    };

    // ------- 建立 Shipment -------

    const handleCreateShipment = async (e) => {
        e.preventDefault();
        setError("");
        setShResult(null);

        if (!shSoId) {
            setError("請輸入欲出貨之 SO 編號（ID）");
            return;
        }
        if (!shWarehouseId) {
            setError("請選擇出貨倉庫");
            return;
        }

        const validLines = shLines
            .map((l) => ({
                item_id: l.item_id ? Number(l.item_id) : null,
                qty: l.qty ? Number(l.qty) : null,
            }))
            .filter((l) => l.item_id && l.qty && l.qty > 0);

        if (validLines.length === 0) {
            setError("請至少輸入一筆出貨的品項與數量");
            return;
        }

        setCreatingShipment(true);
        try {
            const res = await api.post(
                "/sales/shipment",
                {
                    so_id: Number(shSoId),
                    warehouse_id: Number(shWarehouseId),
                    lines: validLines,
                },
                token
            );
            setShResult(res);
            setShLines([{ item_id: "", qty: "" }]);
        } catch (err) {
            setError(err.message || "建立出貨單失敗");
        } finally {
            setCreatingShipment(false);
        }
    };

    const findCustomerName = (id) =>
        customers.find((c) => c.id === id)?.name || "";

    const findWarehouseName = (id) =>
        warehouses.find((w) => w.id === id)?.name || "";

    // ------- 畫面 -------

    return (
        <Layout
            title="銷售作業"
            subtitle="建立銷售訂單（SO）與出貨單（Shipment），自動扣減庫存"
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

            {/* 建立銷售訂單 SO */}
            <div
                className="card"
                style={{
                    marginBottom: 16,
                    borderColor: "#DBEAFE",
                    background: "linear-gradient(135deg,#F9FAFB,#E6F3FF)",
                }}
            >
                <div className="section-title">建立銷售訂單（SO）</div>
                <div
                    style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginBottom: 8,
                    }}
                >
                    先選擇客戶，再為本張訂單新增多筆品項與數量。
                </div>

                <form onSubmit={handleCreateSO}>
                    {/* 客戶選擇 */}
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
                                客戶
                            </label>
                            <select
                                value={soCustomerId}
                                onChange={(e) => setSoCustomerId(e.target.value)}
                                style={{
                                    width: "100%",
                                    borderRadius: 10,
                                    border: "1px solid #D1D5DB",
                                    padding: "6px 10px",
                                    fontSize: 13,
                                }}
                            >
                                <option value="">請選擇客戶</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name || `#${c.id}`}
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
                            銷售明細
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
                                    {soLines.map((line, idx) => (
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
                                                        updateSoLine(idx, "item_id", e.target.value)
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
                                                        updateSoLine(idx, "qty", e.target.value)
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
                                                {soLines.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSoLine(idx)}
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
                                onClick={addSoLine}
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
                                disabled={creatingSO || loadingMaster}
                                style={{ minWidth: 120 }}
                            >
                                {creatingSO ? "建立中..." : "建立銷售訂單"}
                            </button>
                        </div>
                    </div>
                </form>

                {soResult && (
                    <div
                        style={{
                            marginTop: 8,
                            fontSize: 12,
                            color: "#065F46",
                        }}
                    >
                        已建立銷售訂單：ID {soResult.id}（客戶{" "}
                        {findCustomerName(soResult.customer_id) ||
                            soResult.customer_id}
                        ）。
                    </div>
                )}
            </div>

            {/* 建立出貨單 Shipment */}
            <div className="card">
                <div className="section-title">建立出貨單（Shipment）</div>
                <div
                    style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginBottom: 8,
                    }}
                >
                    請輸入已建立的 SO 編號（ID），選擇出貨倉庫後輸入本次出貨品項與數量。
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

                <form onSubmit={handleCreateShipment}>
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
                                銷售訂單編號（SO ID）
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={shSoId}
                                onChange={(e) => setShSoId(e.target.value)}
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
                                出貨倉庫
                            </label>
                            <select
                                value={shWarehouseId}
                                onChange={(e) => setShWarehouseId(e.target.value)}
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

                    {/* Shipment 明細輸入 */}
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
                            出貨明細
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
                                        <th style={{ padding: "6px 6px", width: 120 }}>出貨數量</th>
                                        <th style={{ padding: "6px 6px", width: 60 }}>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shLines.map((line, idx) => (
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
                                                        updateShLine(idx, "item_id", e.target.value)
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
                                                        updateShLine(idx, "qty", e.target.value)
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
                                                {shLines.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeShLine(idx)}
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
                                onClick={addShLine}
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
                                + 新增一行出貨明細
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={creatingShipment || loadingMaster}
                                style={{ minWidth: 120 }}
                            >
                                {creatingShipment ? "建立中..." : "建立出貨單"}
                            </button>
                        </div>
                    </div>
                </form>

                {shResult && (
                    <div
                        style={{
                            marginTop: 8,
                            fontSize: 12,
                            color: "#065F46",
                        }}
                    >
                        已建立出貨單：ID {shResult.id}（SO {shResult.so_id}，倉庫{" "}
                        {findWarehouseName(shResult.warehouse_id) ||
                            shResult.warehouse_id}
                        ）。
                    </div>
                )}
            </div>
        </Layout>
    );
}

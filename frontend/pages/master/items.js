// frontend/pages/master/items.js
import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { apiListItems, apiCreateItem } from "../../lib/api";

export default function ItemsPage(props) {
    return (
        <ProtectedPage {...props}>
            <ItemsInner {...props} />
        </ProtectedPage>
    );
}

function ItemsInner({ token }) {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({ sku: "", name: "", uom: "PCS", cost_method: "moving_avg" });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    async function load() {
        try {
            setLoading(true);
            const data = await apiListItems(token);
            setItems(data);
        } catch (err) {
            console.error(err);
            setError(err.message || "載入品項失敗");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!token) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setCreating(true);
        try {
            await apiCreateItem(token, form);
            setForm({ sku: "", name: "", uom: "PCS", cost_method: "moving_avg" });
            await load();
        } catch (err) {
            setError(err.message || "新增品項失敗");
        } finally {
            setCreating(false);
        }
    }

    return (
        <div>
            <h1 style={{ marginBottom: 16 }}>品項主檔</h1>

            <section
                style={{
                    marginBottom: 16,
                    padding: 12,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <h2 style={{ marginBottom: 8, fontSize: 18 }}>新增品項</h2>
                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}
                >
                    <div>
                        <label style={{ fontSize: 13 }}>SKU</label>
                        <input
                            required
                            value={form.sku}
                            onChange={(e) => setForm({ ...form, sku: e.target.value })}
                            style={{ padding: 6, width: 140 }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 13 }}>名稱</label>
                        <input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            style={{ padding: 6, width: 200 }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 13 }}>單位</label>
                        <input
                            value={form.uom}
                            onChange={(e) => setForm({ ...form, uom: e.target.value })}
                            style={{ padding: 6, width: 80 }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 13 }}>成本法</label>
                        <select
                            value={form.cost_method}
                            onChange={(e) => setForm({ ...form, cost_method: e.target.value })}
                            style={{ padding: 6, width: 140 }}
                        >
                            <option value="moving_avg">移動平均</option>
                            <option value="standard">標準成本</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={creating}
                        style={{
                            padding: "8px 12px",
                            background: "#2563eb",
                            color: "#fff",
                            borderRadius: 4,
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        {creating ? "儲存中…" : "新增"}
                    </button>
                </form>
                {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
            </section>

            <section
                style={{
                    padding: 12,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <h2 style={{ marginBottom: 8, fontSize: 18 }}>品項列表</h2>
                {loading ? (
                    <div>載入中…</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                            <tr>
                                <Th>ID</Th>
                                <Th>SKU</Th>
                                <Th>名稱</Th>
                                <Th>單位</Th>
                                <Th>成本法</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((i) => (
                                <tr key={i.id}>
                                    <Td>{i.id}</Td>
                                    <Td>{i.sku}</Td>
                                    <Td>{i.name}</Td>
                                    <Td>{i.uom}</Td>
                                    <Td>{i.cost_method}</Td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <Td colSpan={5}>目前尚無品項資料。</Td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
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

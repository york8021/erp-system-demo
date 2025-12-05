// frontend/pages/master/customers.js
import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { apiListCustomers, apiCreateCustomer } from "../../lib/api";

export default function CustomersPage(props) {
    return (
        <ProtectedPage {...props}>
            <CustomersInner {...props} />
        </ProtectedPage>
    );
}

function CustomersInner({ token }) {
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState({
        code: "",
        name: "",
        tax_id: "",
        payment_term: "",
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    async function load() {
        try {
            setLoading(true);
            const data = await apiListCustomers(token);
            setRows(data);
        } catch (err) {
            console.error(err);
            setError(err.message || "載入客戶失敗");
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
            await apiCreateCustomer(token, {
                code: form.code,
                name: form.name,
                tax_id: form.tax_id || null,
                payment_term: form.payment_term || null,
            });
            setForm({ code: "", name: "", tax_id: "", payment_term: "" });
            await load();
        } catch (err) {
            setError(err.message || "新增客戶失敗");
        } finally {
            setCreating(false);
        }
    }

    return (
        <div>
            <h1 style={{ marginBottom: 16 }}>客戶主檔</h1>

            <section
                style={{
                    marginBottom: 16,
                    padding: 12,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <h2 style={{ marginBottom: 8, fontSize: 18 }}>新增客戶</h2>
                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}
                >
                    <div>
                        <label style={{ fontSize: 13 }}>代碼</label>
                        <input
                            required
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            style={{ padding: 6, width: 120 }}
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
                        <label style={{ fontSize: 13 }}>統一編號 / 稅號</label>
                        <input
                            value={form.tax_id}
                            onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                            style={{ padding: 6, width: 140 }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 13 }}>付款條件</label>
                        <input
                            value={form.payment_term}
                            onChange={(e) =>
                                setForm({ ...form, payment_term: e.target.value })
                            }
                            style={{ padding: 6, width: 140 }}
                        />
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
                <h2 style={{ marginBottom: 8, fontSize: 18 }}>客戶列表</h2>
                {loading ? (
                    <div>載入中…</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                            <tr>
                                <Th>ID</Th>
                                <Th>代碼</Th>
                                <Th>名稱</Th>
                                <Th>統編 / 稅號</Th>
                                <Th>付款條件</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((c) => (
                                <tr key={c.id}>
                                    <Td>{c.id}</Td>
                                    <Td>{c.code}</Td>
                                    <Td>{c.name}</Td>
                                    <Td>{c.tax_id || "-"}</Td>
                                    <Td>{c.payment_term || "-"}</Td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <Td colSpan={5}>目前尚無客戶資料。</Td>
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

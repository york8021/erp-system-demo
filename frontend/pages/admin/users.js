// frontend/pages/admin/users.js
import { useEffect, useState } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { apiListUsers, apiCreateUser } from "../../lib/api";

export default function UsersPage(props) {
    return (
        <ProtectedPage {...props}>
            <UsersInner {...props} />
        </ProtectedPage>
    );
}

function UsersInner({ token, user }) {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({
        email: "",
        full_name: "",
        role: "employee",
        password: "",
        is_active: true,
    });
    const [error, setError] = useState(null);
    const [loadingList, setLoadingList] = useState(false);
    const [creating, setCreating] = useState(false);

    // 只有 admin 應該看到這頁，這邊做一層保護（前端層，真正權限後端也會再檢查）
    const isAdmin = user?.role === "admin";

    useEffect(() => {
        if (!token || !isAdmin) return;
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isAdmin]);

    async function loadUsers() {
        try {
            setLoadingList(true);
            const data = await apiListUsers(token);
            setUsers(data);
        } catch (err) {
            console.error(err);
            setError(err.message || "載入使用者失敗");
        } finally {
            setLoadingList(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!isAdmin) return;

        setError(null);
        setCreating(true);
        try {
            await apiCreateUser(token, {
                email: form.email,
                full_name: form.full_name,
                role: form.role,
                password: form.password,
                is_active: form.is_active,
            });
            // 清空表單
            setForm({
                email: "",
                full_name: "",
                role: "employee",
                password: "",
                is_active: true,
            });
            await loadUsers();
        } catch (err) {
            setError(err.message || "建立使用者失敗");
        } finally {
            setCreating(false);
        }
    }

    if (!isAdmin) {
        return <div>只有系統管理員可以存取這個頁面。</div>;
    }

    return (
        <div>
            <h1 style={{ marginBottom: 16 }}>使用者管理</h1>

            <section
                style={{
                    marginBottom: 24,
                    padding: 16,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <h2 style={{ marginBottom: 12, fontSize: 18 }}>新增使用者</h2>
                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 12,
                    }}
                >
                    <div>
                        <label style={{ display: "block", fontSize: 13 }}>Email</label>
                        <input
                            required
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            style={{ width: "100%", padding: 6 }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 13 }}>姓名</label>
                        <input
                            required
                            value={form.full_name}
                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            style={{ width: "100%", padding: 6 }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 13 }}>角色</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            style={{ width: "100%", padding: 6 }}
                        >
                            <option value="employee">一般員工</option>
                            <option value="admin">系統管理員</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 13 }}>密碼</label>
                        <input
                            required
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            style={{ width: "100%", padding: 6 }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 13 }}>啟用</label>
                        <label style={{ fontSize: 14 }}>
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) =>
                                    setForm({ ...form, is_active: e.target.checked })
                                }
                                style={{ marginRight: 4 }}
                            />
                            帳號啟用中
                        </label>
                    </div>

                    <div style={{ alignSelf: "end" }}>
                        <button
                            type="submit"
                            disabled={creating}
                            style={{
                                padding: "8px 16px",
                                background: "#2563eb",
                                color: "#fff",
                                borderRadius: 4,
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            {creating ? "建立中…" : "建立使用者"}
                        </button>
                    </div>
                </form>
                {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
            </section>

            <section
                style={{
                    padding: 16,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <h2 style={{ marginBottom: 12, fontSize: 18 }}>使用者列表</h2>
                {loadingList ? (
                    <div>載入中…</div>
                ) : (
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
                                <Th>Email</Th>
                                <Th>姓名</Th>
                                <Th>角色</Th>
                                <Th>狀態</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <Td>{u.id}</Td>
                                    <Td>{u.email}</Td>
                                    <Td>{u.full_name}</Td>
                                    <Td>{u.role}</Td>
                                    <Td>{u.is_active ? "啟用" : "停用"}</Td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <Td colSpan={5}>目前尚無任何使用者。</Td>
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
            style={{
                padding: 8,
                borderBottom: "1px solid #e5e7eb",
            }}
        />
    );
}

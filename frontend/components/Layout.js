// frontend/components/Layout.js
import Link from "next/link";

export default function Layout({ user, onLogout, children }) {
    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
        >
            {/* 左側側邊欄 */}
            <aside
                style={{
                    width: 230,
                    background: "#111827",
                    color: "#e5e7eb",
                    padding: "16px 12px",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>ERP 系統</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>Demo / 開發環境</div>
                </div>

                {user && (
                    <div
                        style={{
                            marginBottom: 16,
                            padding: 8,
                            borderRadius: 6,
                            background: "rgba(31,41,55,0.9)",
                            fontSize: 12,
                        }}
                    >
                        <div style={{ fontWeight: 500 }}>{user.full_name}</div>
                        <div style={{ opacity: 0.8 }}>{user.email}</div>
                        <div style={{ marginTop: 4, opacity: 0.8 }}>角色：{user.role}</div>
                    </div>
                )}

                <nav style={{ flex: 1, fontSize: 14, overflowY: "auto" }}>
                    <Section title="總覽">
                        <NavLink href="/dashboard" label="儀表板" />
                    </Section>

                    <Section title="主檔">
                        <NavLink href="/master/items" label="品項主檔" />
                        <NavLink href="/master/customers" label="客戶主檔" />
                        <NavLink href="/master/vendors" label="供應商主檔" />
                        <NavLink href="/master/warehouses" label="倉庫主檔" />
                    </Section>

                    <Section title="採購">
                        <NavLink href="/purchasing/purchase-orders" label="採購訂單" />
                        <NavLink href="/purchasing/goods-receipts" label="收貨" />
                    </Section>

                    <Section title="銷售">
                        <NavLink href="/sales/sales-orders" label="銷售訂單" />
                        <NavLink href="/sales/shipments" label="出貨" />
                    </Section>

                    <Section title="庫存">
                        <NavLink href="/inventory/balances" label="庫存結存" />
                        <NavLink href="/inventory/transactions" label="庫存交易" />
                    </Section>

                    {user?.role === "admin" && (
                        <Section title="系統管理">
                            <NavLink href="/admin/users" label="使用者管理" />
                        </Section>
                    )}
                </nav>

                <button
                    type="button"
                    onClick={onLogout}
                    style={{
                        marginTop: 12,
                        padding: "8px 10px",
                        fontSize: 14,
                        borderRadius: 6,
                        border: "none",
                        cursor: "pointer",
                        background: "#ef4444",
                        color: "#f9fafb",
                    }}
                >
                    登出
                </button>
            </aside>

            {/* 右側主內容 */}
            <main
                style={{
                    flex: 1,
                    background: "#f3f4f6",
                    padding: 24,
                    overflowX: "auto",
                }}
            >
                {children}
            </main>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <div
                style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    opacity: 0.6,
                    marginBottom: 4,
                }}
            >
                {title}
            </div>
            <div>{children}</div>
        </div>
    );
}

function NavLink({ href, label }) {
    return (
        <div style={{ marginBottom: 4 }}>
            <Link
                href={href}
                style={{
                    display: "block",
                    padding: "6px 8px",
                    borderRadius: 4,
                    color: "#e5e7eb",
                    textDecoration: "none",
                }}
            >
                {label}
            </Link>
        </div>
    );
}

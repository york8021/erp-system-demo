// frontend/components/Layout.jsx
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../pages/_app";

const NAV_ITEMS = [
    { href: "/dashboard", label: "總覽 Dashboard" },
    { href: "/master/items", label: "主檔管理 - 商品" },
    { href: "/master/customers", label: "主檔管理 - 客戶" },
    { href: "/master/vendors", label: "主檔管理 - 供應商" },
    { href: "/master/warehouses", label: "主檔管理 - 倉庫" },
    { href: "/purchasing", label: "採購作業" },
    { href: "/sales", label: "銷售作業" },
    { href: "/inventory", label: "庫存查詢" },
    { href: "/reports", label: "報表中心" },
    { href: "/logs", label: "系統日誌" },
];

function Sidebar() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const initials =
        (user?.full_name || user?.email || "?").trim().charAt(0).toUpperCase() ||
        "?";

    return (
        <aside className="app-sidebar">
            {/* Logo 區 */}
            <div className="app-sidebar-header">
                <div className="app-logo-mark">E</div>
                <div className="app-logo-text">
                    <div className="app-logo-text-main">ERP System</div>
                    <div className="app-logo-text-sub">
                        FastAPI · Next.js · PostgreSQL
                    </div>
                </div>
            </div>

            {/* 導覽 */}
            <div className="app-sidebar-nav">
                <div className="app-nav-section-label">NAVIGATION</div>
                <ul className="app-nav-list">
                    {NAV_ITEMS.map((item) => {
                        const active = router.pathname.startsWith(item.href);
                        return (
                            <li key={item.href} className="app-nav-item">
                                <Link
                                    href={item.href}
                                    className={
                                        "app-nav-link" + (active ? " app-nav-link-active" : "")
                                    }
                                >
                                    <span className="app-nav-dot" />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* 左下角：登入使用者 */}
            {user && (
                <div className="app-sidebar-bottom">
                    <div className="app-user-card">
                        <div className="app-user-avatar">{initials}</div>
                        <div className="app-user-meta">
                            <div className="app-user-name">
                                {user.full_name || user.email}
                            </div>
                            <div className="app-user-role">
                                {user.role ? user.role.toUpperCase() : "USER"}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="app-user-logout-btn"
                            onClick={logout}
                        >
                            登出
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}

export default function Layout({ children, title, subtitle }) {
    return (
        <div className="app-root">
            <Sidebar />
            <main className="app-main">
                <div className="app-main-header">
                    <div>
                        <div className="app-main-title">{title || "ERP 系統"}</div>
                        {subtitle && (
                            <div className="app-main-subtitle">{subtitle}</div>
                        )}
                    </div>
                </div>
                <section className="app-main-inner">{children}</section>
            </main>
        </div>
    );
}

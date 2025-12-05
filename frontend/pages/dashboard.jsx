// frontend/pages/dashboard.jsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { useAuth } from "./_app";
import { api } from "../lib/api";

export default function DashboardPage() {
    const router = useRouter();
    const { user, token } = useAuth();

    // 未登入就丟回 /login
    useEffect(() => {
        if (!user) {
            router.replace("/login");
        }
    }, [user, router]);

    if (!user) return null;

    // 這裡之後可以用 useEffect 去 call /report API
    // 先做靜態卡片把版面撐起來

    return (
        <Layout
            title="Dashboard"
            subtitle="快速總覽你的 ERP 系統狀態"
        >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginBottom: 16 }}>
                <div className="card">
                    <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                        今日訂單數
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>12</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                        （之後可以接 /report/sales 資料）
                    </div>
                </div>
                <div className="card">
                    <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                        庫存總品項數
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>34</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                        可以從 /master/items 取得真實數量
                    </div>
                </div>
                <div className="card">
                    <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                        未結案採購單
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>5</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                        未來可接 /purchasing/po 狀態
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="section-title">系統說明</div>
                <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5 }}>
                    目前這個 ERP Demo 已經包含：
                </p>
                <ul style={{ fontSize: 13, color: "#4B5563", paddingLeft: 18 }}>
                    <li>User 登入與權限（JWT + RBAC）</li>
                    <li>Master 主檔（品項、客戶、供應商、倉庫）</li>
                    <li>Inventory 庫存交易與即時庫存</li>
                    <li>Purchasing 採購單 / 收貨</li>
                    <li>Sales 銷售單 / 出貨</li>
                    <li>Audit Log 操作日誌、報表 API</li>
                </ul>
            </div>
        </Layout>
    );
}

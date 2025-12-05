// frontend/components/ProtectedPage.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "./Layout";

/**
 * ProtectedPage 會：
 * 1. 檢查有沒有 token，沒有就導向 /login
 * 2. 套用 Layout，把 user 資訊和 logout 功能帶進去
 *
 * 使用方式：
 * export default function SomePage(props) {
 *   return (
 *     <ProtectedPage {...props}>
 *       <YourInnerPage {...props} />
 *     </ProtectedPage>
 *   )
 * }
 */
export default function ProtectedPage({
    token,
    user,
    setToken,
    setUser,
    children,
}) {
    const router = useRouter();

    useEffect(() => {
        if (!token) {
            router.push("/login");
        }
    }, [token, router]);

    if (!token) {
        // 避免在還沒重導時畫面閃爍
        return <div style={{ padding: 24 }}>請先登入系統…</div>;
    }

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem("token");
        }
        setToken?.(null);
        setUser?.(null);
        router.push("/login");
    };

    return (
        <Layout user={user} onLogout={handleLogout}>
            {children}
        </Layout>
    );
}

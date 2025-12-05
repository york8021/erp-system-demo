// frontend/pages/_app.js
import { useEffect, useState } from "react";
import { apiGetMe } from "../lib/api";

export default function MyApp({ Component, pageProps }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [booting, setBooting] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const t = window.localStorage.getItem("token");
        if (t) {
            setToken(t);
            apiGetMe(t)
                .then((u) => setUser(u))
                .catch(() => {
                    window.localStorage.removeItem("token");
                    setToken(null);
                    setUser(null);
                })
                .finally(() => setBooting(false));
        } else {
            setBooting(false);
        }

        // 給 login 頁面用的 callback
        window.__setToken = (newToken) => {
            if (!newToken) {
                setToken(null);
                setUser(null);
                return;
            }
            setToken(newToken);
            apiGetMe(newToken)
                .then((u) => setUser(u))
                .catch(() => {
                    setToken(null);
                    setUser(null);
                });
        };
    }, []);

    if (booting) {
        return <div style={{ padding: 24 }}>系統啟動中…</div>;
    }

    return (
        <Component
            {...pageProps}
            token={token}
            user={user}
            setToken={setToken}
            setUser={setUser}
        />
    );
}

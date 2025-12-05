// frontend/pages/_app.jsx
import { useEffect, useState, createContext, useContext } from "react";
import "../styles/globals.css";

export const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

function MyApp({ Component, pageProps }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // 從 localStorage 還原登入狀態（只在瀏覽器執行）
        if (typeof window !== "undefined") {
            const storedToken = window.localStorage.getItem("erp_token");
            const storedUser = window.localStorage.getItem("erp_user");
            if (storedToken && storedUser) {
                setToken(storedToken);
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    setUser(null);
                }
            }
            setHydrated(true);
        }
    }, []);

    const login = ({ token: newToken, user: newUser }) => {
        setToken(newToken);
        setUser(newUser);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("erp_token", newToken);
            window.localStorage.setItem("erp_user", JSON.stringify(newUser));
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        if (typeof window !== "undefined") {
            window.localStorage.removeItem("erp_token");
            window.localStorage.removeItem("erp_user");
        }
    };

    const value = { user, token, login, logout };

    // 避免 hydration mismatch
    if (!hydrated) {
        return null;
    }

    return (
        <AuthContext.Provider value={value}>
            <Component {...pageProps} />
        </AuthContext.Provider>
    );
}

export default MyApp;

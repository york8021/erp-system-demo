// frontend/pages/index.js
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home({ token }) {
    const router = useRouter();

    useEffect(() => {
        if (token) {
            router.replace("/dashboard");
        } else {
            router.replace("/login");
        }
    }, [token, router]);

    return null;
}

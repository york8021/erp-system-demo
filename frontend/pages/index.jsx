// frontend/pages/index.jsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "./_app";

export default function IndexPage() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            router.replace("/dashboard");
        } else {
            router.replace("/login");
        }
    }, [user, router]);

    return null;
}

import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { AuthContext } from "@/features/auth/auth";
import { clearSession, getSession, getSessionRevision, saveSession, subscribeToSession } from "@/lib/session";
import type { LoginResponse } from "@/lib/types";

export function AuthProvider({ children }: { children: ReactNode }) {
    const session = useSyncExternalStore(subscribeToSession, getSession);

    const latestLogin = useRef(0);

    async function login(email: string, password: string): Promise<void> {
        const attempt = ++latestLogin.current;
        const revision = getSessionRevision();
        const response = await apiFetch<LoginResponse>("/login_check", {
            session: null,
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        const value = {
            token: response.token,
            expiresAt: Date.now() + response.ttl * 1000,
            user: response.user,
        };
        if (attempt !== latestLogin.current || !saveSession(value, revision)) {
            throw new DOMException("Login attempt is no longer active.", "AbortError");
        }
    }

    function logout(): void {
        if (session !== null) {
            clearSession(session);
        }
    }

    return <AuthContext value={{ session, login, logout }}>{children}</AuthContext>;
}

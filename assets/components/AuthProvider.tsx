import { useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { AuthContext } from "@/lib/auth";
import { clearSession, loadSession, saveSession, type Session } from "@/lib/session";
import type { LoginResponse } from "@/lib/types";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(loadSession);

    async function login(email: string, password: string): Promise<void> {
        const response = await apiFetch<LoginResponse>("/login_check", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        const newSession = {
            token: response.token,
            expiresAt: Date.now() + response.ttl * 1000,
            user: response.user,
        };

        saveSession(newSession);
        setSession(newSession);
    }

    function logout(): void {
        clearSession();
        setSession(null);
    }

    return <AuthContext value={{ user: session?.user ?? null, login, logout }}>{children}</AuthContext>;
}

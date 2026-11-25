import { createContext, useContext } from "react";
import type { Session } from "@/lib/session";

export type Auth = {
    session: Session | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
};

export const AuthContext = createContext<Auth | null>(null);

export function useAuth(): Auth {
    const auth = useContext(AuthContext);
    if (auth === null) {
        throw new Error("useAuth must be used inside AuthProvider.");
    }

    return auth;
}

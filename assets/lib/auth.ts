import { createContext, useContext } from "react";
import type { CurrentUser } from "@/lib/types";

export type Auth = {
    user: CurrentUser | null;
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

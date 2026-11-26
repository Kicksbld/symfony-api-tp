import type { ReactNode } from "react";

export function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 bg-card/40 px-6 py-14 text-center">
            <p className="max-w-md text-balance text-muted-foreground">{message}</p>
            {children}
        </div>
    );
}

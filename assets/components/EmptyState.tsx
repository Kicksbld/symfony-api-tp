import type { ReactNode } from "react";

export function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            <p>{message}</p>
            {children}
        </div>
    );
}

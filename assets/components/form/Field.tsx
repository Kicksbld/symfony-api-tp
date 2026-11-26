import { cn } from "cn";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

type FieldProps = {
    id: string;
    label: string;
    hint?: string;
    error?: string;
    optional?: boolean;
    // Compteur affiché sous le champ quand il approche ou dépasse la limite de l'API.
    count?: { value: number; max: number };
    children: ReactNode;
};

export function Field({ id, label, hint, error, optional = false, count, children }: FieldProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={id} className="text-sm font-semibold">
                    {label}
                </Label>
                {optional && <span className="text-xs text-muted-foreground">Facultatif</span>}
            </div>
            {children}
            {(hint !== undefined || count !== undefined) && error === undefined && (
                <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                    {hint !== undefined && <p id={`${id}-hint`}>{hint}</p>}
                    {count !== undefined && (
                        <span aria-hidden="true" className={cn("ml-auto tabular-nums", count.value > count.max && "text-destructive")}>
                            {count.value.toLocaleString("fr-FR")} / {count.max.toLocaleString("fr-FR")}
                        </span>
                    )}
                </div>
            )}
            {error !== undefined && (
                <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}

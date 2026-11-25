import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
    id: string;
    label: string;
    hint?: string;
    type?: string;
    autoComplete: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
};

export function FormField({ id, label, hint, type = "text", autoComplete, value, error, onChange }: FormFieldProps) {
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type={type}
                autoComplete={autoComplete}
                required
                value={value}
                aria-invalid={error !== undefined}
                aria-describedby={describedBy}
                onChange={(event) => onChange(event.target.value)}
            />
            {hint && (
                <p id={hintId} className="text-sm text-muted-foreground">
                    {hint}
                </p>
            )}
            {error && (
                <p id={errorId} className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}

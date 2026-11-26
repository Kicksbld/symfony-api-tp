import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

export type Choice<T extends string> = { value: T; label: string; description: string; icon: LucideIcon };

type ChoiceCardsProps<T extends string> = {
    name: string;
    legend: string;
    choices: Choice<T>[];
    value: T;
    onChange: (value: T) => void;
};

// Choix exclusif présenté en cartes : chaque option explique ce qu'elle change.
export function ChoiceCards<T extends string>({ name, legend, choices, value, onChange }: ChoiceCardsProps<T>) {
    return (
        <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">{legend}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
                {choices.map(({ value: choice, label, description, icon: Icon }) => (
                    <label
                        key={choice}
                        className={cn(
                            "flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors duration-200 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                            value === choice ? "border-primary/60 bg-primary/10" : "border-white/10 bg-white/[0.03] hover:border-white/20",
                        )}
                    >
                        <input type="radio" name={name} value={choice} checked={value === choice} onChange={() => onChange(choice)} className="sr-only" />
                        <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", value === choice ? "text-primary" : "text-muted-foreground")} />
                        <span className="space-y-0.5">
                            <span className="block text-sm font-semibold">{label}</span>
                            <span className="block text-xs leading-snug text-muted-foreground">{description}</span>
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

import { cn } from "cn";
import { ChevronDown, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type FilterPopoverProps = {
    label: string;
    // Nom du choix en cours, affiché à la place du libellé quand le filtre est actif.
    value?: string;
    onClear?: () => void;
    disabled?: boolean;
    className?: string;
    contentClassName?: string;
    children: (close: () => void) => ReactNode;
};

export function FilterPopover({ label, value, onClear, disabled = false, className, contentClassName, children }: FilterPopoverProps) {
    const [open, setOpen] = useState(false);
    const active = value !== undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                disabled={disabled}
                aria-label={active ? `${label} : ${value}` : label}
                className={cn(
                    "inline-flex h-10 max-w-64 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50",
                    active
                        ? "border-primary/60 bg-primary/10 text-foreground hover:bg-primary/15"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground",
                    className,
                )}
            >
                <span className="truncate">{value ?? label}</span>
                <ChevronDown aria-hidden="true" className="size-4 shrink-0 opacity-70" />
            </PopoverTrigger>
            <PopoverContent align="start" className={cn("w-72 p-0", contentClassName)}>
                {children(() => setOpen(false))}
                {active && onClear !== undefined && (
                    <div className="border-t p-1">
                        <button
                            type="button"
                            onClick={() => {
                                onClear();
                                setOpen(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none"
                        >
                            <X aria-hidden="true" className="size-4" />
                            Retirer ce filtre
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

type FilterOption<T> = { value: T; label: string };

type OptionListProps<T> = {
    placeholder: string;
    emptyMessage: string;
    options: FilterOption<T>[];
    selected: T | null;
    onSelect: (value: T) => void;
};

// Liste de choix avec un champ qui la filtre pendant la frappe (genres, pays, plateformes).
export function OptionList<T extends string | number>({ placeholder, emptyMessage, options, selected, onSelect }: OptionListProps<T>) {
    return (
        <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                    {options.map((option) => (
                        <CommandItem key={option.value} value={option.label} data-checked={option.value === selected} onSelect={() => onSelect(option.value)}>
                            {option.label}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}

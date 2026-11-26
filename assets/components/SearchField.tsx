import { cn } from "cn";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

type SearchFieldProps = {
    // Terme actuellement appliqué, en général lu dans l'URL.
    value: string;
    // Appelé quand la frappe s'arrête, avec le terme sans espaces autour.
    onSearch: (term: string) => void;
    label: string;
    placeholder: string;
    maxLength: number;
    className?: string;
};

// Recherche pendant la frappe, sans bouton à valider.
export function SearchField({ value, onSearch, label, placeholder, maxLength, className }: SearchFieldProps) {
    const [term, setTerm] = useState(value);
    const [syncedValue, setSyncedValue] = useState(value);
    const debouncedTerm = useDebouncedValue(term.trim());

    // Le terme appliqué change sans nous (Précédent, lien, filtres effacés) : le champ le reprend. On compare sans les
    // espaces de fin pour ne pas effacer celui que l'on vient de taper entre deux mots.
    if (value !== syncedValue) {
        setSyncedValue(value);
        if (value !== term.trim()) {
            setTerm(value);
        }
    }

    // On attend que la frappe soit finie, c'est-à-dire que le terme retardé ait rattrapé le champ.
    useEffect(() => {
        if (debouncedTerm === term.trim() && debouncedTerm !== value) {
            onSearch(debouncedTerm);
        }
    }, [debouncedTerm, term, value, onSearch]);

    return (
        <div role="search" className={cn("relative min-w-0", className)}>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
                type="search"
                aria-label={label}
                value={term}
                maxLength={maxLength}
                placeholder={placeholder}
                onChange={(event) => setTerm(event.target.value)}
                className="h-11 w-full rounded-full border border-white/10 bg-white/5 pr-10 pl-11 text-base transition-colors outline-none placeholder:text-muted-foreground hover:border-white/20 focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
            />
            {term !== "" && (
                <button
                    type="button"
                    aria-label="Effacer la recherche"
                    onClick={() => setTerm("")}
                    className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                    <X aria-hidden="true" className="size-4" />
                </button>
            )}
        </div>
    );
}

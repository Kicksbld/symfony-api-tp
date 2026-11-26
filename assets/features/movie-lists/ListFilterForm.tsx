import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Link } from "react-router";
import { SearchField } from "@/components/SearchField";
import { Button } from "@/components/ui/button";
import { LIST_MEMBER_PATTERN, LIST_SORTS, MAX_LIST_SEARCH_LENGTH, listFilterParams, type ListFilters } from "@/features/movie-lists/list-search";
import { MoviePicker } from "@/features/movies/MoviePicker";
import { movieQuery } from "@/features/movies/queries";

const MEMBER_PATTERN = new RegExp(`^${LIST_MEMBER_PATTERN}$`);

type ListFilterFormProps = {
    filters: ListFilters;
    // Pendant la frappe, l'adresse est remplacée plutôt qu'empilée dans l'historique.
    onChange: (filters: ListFilters, options?: { replace: boolean }) => void;
};

export function ListFilterForm({ filters, onChange }: ListFilterFormProps) {
    const hasFilters = Object.keys(listFilterParams(filters)).length > 0;

    return (
        <div role="group" aria-label="Rechercher des listes" className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <SearchField
                    value={filters.q}
                    onSearch={(q) => onChange({ ...filters, q }, { replace: true })}
                    label="Nom de la liste"
                    placeholder="Rechercher une liste…"
                    maxLength={MAX_LIST_SEARCH_LENGTH}
                    className="flex-1 basis-64"
                />
                <SearchField
                    value={filters.user}
                    // Un pseudo incomplet ou invalide n'est pas envoyé : l'API le refuserait.
                    onSearch={(user) => {
                        if (user === "" || MEMBER_PATTERN.test(user)) {
                            onChange({ ...filters, user: user.toLowerCase() }, { replace: true });
                        }
                    }}
                    label="Pseudo de l'auteur (3 à 20 lettres, chiffres ou tirets bas)"
                    placeholder="Pseudo de l'auteur"
                    maxLength={20}
                    className="basis-56"
                />
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <div role="radiogroup" aria-label="Trier les listes" className="flex gap-0.5 rounded-full bg-white/5 p-1">
                    {LIST_SORTS.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={filters.sort === value}
                            onClick={() => onChange({ ...filters, sort: value })}
                            className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-checked:bg-foreground aria-checked:text-background"
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {filters.movie === null ? (
                    <MoviePicker selected={[]} disabled={false} onSelect={({ id }) => onChange({ ...filters, movie: id })} triggerLabel="Contenant un film" title="Filtrer par film" />
                ) : (
                    <SelectedMovie id={filters.movie} onRemove={() => onChange({ ...filters, movie: null })} />
                )}
                {hasFilters && (
                    <Button asChild variant="link" className="text-muted-foreground hover:text-foreground">
                        <Link to="/lists">Tout effacer</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

function SelectedMovie({ id, onRemove }: { id: number; onRemove: () => void }) {
    const { data: movie } = useQuery(movieQuery(id));
    const title = movie?.title ?? `Film n° ${id}`;

    return (
        <Button variant="ghost" className="h-10 rounded-full border border-primary/60 bg-primary/10 px-4 hover:bg-primary/15" onClick={onRemove} aria-label={`Retirer le filtre par film : ${title}`}>
            Contient « {title} »
            <X aria-hidden="true" />
        </Button>
    );
}

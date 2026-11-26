import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { ArrowDownUp, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { SearchField } from "@/components/SearchField";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FilterPopover, OptionList } from "@/features/movies/FilterPopover";
import {
    DECADES,
    MAX_TITLE_LENGTH,
    MOVIE_SORTS,
    activeFilters,
    findMovieSort,
    selectableYears,
    withDecade,
    type CatalogSearch,
} from "@/features/movies/catalog-search";
import { countryLabel, countryName } from "@/features/movies/regions";
import type { CatalogReferences } from "@/features/movies/useCatalogReferences";
import { PersonPhoto } from "@/features/people/PersonPhoto";
import { MAX_PERSON_NAME_LENGTH, peopleQuery } from "@/features/people/queries";
import { WATCH_REGIONS } from "@/lib/types";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

type ChangeSearch = (search: CatalogSearch, options?: { replace: boolean }) => void;

type CatalogFiltersProps = {
    search: CatalogSearch;
    references: CatalogReferences;
    onChange: ChangeSearch;
};

export function CatalogFilters({ search, references, onChange }: CatalogFiltersProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    // Le titre a son propre champ, le studio se règle depuis sa page : ils ne comptent pas dans le bouton du tiroir.
    const filterCount = activeFilters(search).filter((filter) => filter !== "q" && filter !== "company").length;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                {/* L'URL est remplacée pendant la frappe : pas une entrée d'historique par mot tapé. */}
                <SearchField
                    value={search.q}
                    onSearch={(q) => onChange({ ...search, q }, { replace: true })}
                    label="Rechercher un film par titre"
                    placeholder="Rechercher un film…"
                    maxLength={MAX_TITLE_LENGTH}
                    className="flex-1 basis-64"
                />
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="h-11 rounded-full px-4 md:hidden">
                            <SlidersHorizontal aria-hidden="true" />
                            Filtres
                            {filterCount > 0 && (
                                <span className="rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">{filterCount}</span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl p-6">
                        <SheetHeader className="p-0">
                            <SheetTitle className="text-xl font-bold">Filtres</SheetTitle>
                            <SheetDescription>Les résultats se mettent à jour à chaque choix.</SheetDescription>
                        </SheetHeader>
                        <FilterChips search={search} references={references} onChange={onChange} stacked />
                        <Button className="h-11 rounded-full" onClick={() => setSheetOpen(false)}>
                            Voir les films
                        </Button>
                    </SheetContent>
                </Sheet>
                <SortMenu search={search} onChange={onChange} />
            </div>
            <FilterChips search={search} references={references} onChange={onChange} className="hidden md:flex" />
        </div>
    );
}

function SortMenu({ search, onChange }: { search: CatalogSearch; onChange: ChangeSearch }) {
    const current = MOVIE_SORTS.find((sort) => sort.value === search.sort);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-11 rounded-full px-4 text-muted-foreground hover:text-foreground">
                    <ArrowDownUp aria-hidden="true" />
                    <span className="sr-only">Trier par :</span>
                    {current?.label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={search.sort} onValueChange={(value) => onChange({ ...search, sort: findMovieSort(value) ?? search.sort })}>
                    {MOVIE_SORTS.map((sort) => (
                        <DropdownMenuRadioItem key={sort.value} value={sort.value}>
                            {sort.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

type FilterChipsProps = CatalogFiltersProps & { stacked?: boolean; className?: string };

function FilterChips({ search, references, onChange, stacked = false, className }: FilterChipsProps) {
    // Dans le tiroir mobile, chaque pastille prend toute la largeur.
    const chipClassName = stacked ? "w-full max-w-none justify-between" : undefined;
    const genre = references.genres?.find((candidate) => candidate.id === search.genre);
    const country = references.countries?.find((candidate) => candidate.code === search.country);
    const provider = references.providers?.find((candidate) => candidate.id === search.provider);
    const period = search.year !== null ? String(search.year) : search.decade !== null ? `Années ${search.decade}` : undefined;

    return (
        <div role="group" aria-label="Filtres" className={cn(stacked ? "grid gap-2" : "flex flex-wrap items-center gap-2", className)}>
            <FilterPopover
                label="Genre"
                value={search.genre === null ? undefined : (genre?.name ?? "…")}
                onClear={() => onChange({ ...search, genre: null })}
                disabled={references.genres === undefined}
                className={chipClassName}
            >
                {(close) => (
                    <OptionList
                        placeholder="Chercher un genre"
                        emptyMessage="Aucun genre."
                        options={(references.genres ?? []).map(({ id, name }) => ({ value: id, label: name }))}
                        selected={search.genre}
                        onSelect={(value) => {
                            onChange({ ...search, genre: value });
                            close();
                        }}
                    />
                )}
            </FilterPopover>
            <FilterPopover
                label="Période"
                value={period}
                onClear={() => onChange(withDecade(search, null))}
                className={chipClassName}
                contentClassName="w-80 p-3"
            >
                {() => <PeriodPicker search={search} onChange={onChange} />}
            </FilterPopover>
            <FilterPopover
                label="Pays de production"
                value={search.country === null ? undefined : country === undefined ? "…" : countryLabel(country)}
                onClear={() => onChange({ ...search, country: null })}
                disabled={references.countries === undefined}
                className={chipClassName}
            >
                {(close) => (
                    <OptionList
                        placeholder="Chercher un pays"
                        emptyMessage="Aucun pays."
                        options={(references.countries ?? []).map((candidate) => ({ value: candidate.code, label: countryLabel(candidate) }))}
                        selected={search.country}
                        onSelect={(value) => {
                            onChange({ ...search, country: value });
                            close();
                        }}
                    />
                )}
            </FilterPopover>
            <FilterPopover
                label="Plateforme"
                value={search.provider === null ? undefined : `${provider?.name ?? "…"} (${search.region})`}
                onClear={() => onChange({ ...search, provider: null })}
                className={chipClassName}
            >
                {(close) => (
                    <>
                        <div role="radiogroup" aria-label="Pays de diffusion" className="flex gap-1 border-b p-2">
                            {WATCH_REGIONS.map((region) => (
                                <button
                                    key={region}
                                    type="button"
                                    role="radio"
                                    aria-checked={region === search.region}
                                    title={countryName(region)}
                                    onClick={() => onChange({ ...search, region })}
                                    className="flex-1 rounded-md py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-checked:bg-primary aria-checked:text-primary-foreground"
                                >
                                    {region}
                                </button>
                            ))}
                        </div>
                        <OptionList
                            placeholder={`Plateformes en ${countryName(search.region)}`}
                            emptyMessage="Aucune plateforme."
                            options={(references.providers ?? []).map(({ id, name }) => ({ value: id, label: name }))}
                            selected={search.provider}
                            onSelect={(value) => {
                                onChange({ ...search, provider: value });
                                close();
                            }}
                        />
                    </>
                )}
            </FilterPopover>
            <FilterPopover
                label="Personne"
                value={search.person === null ? undefined : (references.person?.name ?? "…")}
                onClear={() => onChange({ ...search, person: null })}
                className={chipClassName}
                contentClassName="w-80"
            >
                {(close) => (
                    <PersonSearch
                        onSelect={(person) => {
                            onChange({ ...search, person });
                            close();
                        }}
                    />
                )}
            </FilterPopover>
        </div>
    );
}

// Une décennie d'abord, puis éventuellement une année de cette décennie : on ne propose jamais une combinaison vide.
function PeriodPicker({ search, onChange }: { search: CatalogSearch; onChange: ChangeSearch }) {
    return (
        <div className="space-y-3">
            <p className="eyebrow">Décennie</p>
            <div className="grid grid-cols-4 gap-1">
                {DECADES.map((decade) => (
                    <PeriodButton key={decade} selected={search.decade === decade} onClick={() => onChange(withDecade(search, search.decade === decade ? null : decade))}>
                        {decade}
                    </PeriodButton>
                ))}
            </div>
            {search.decade !== null && (
                <>
                    <p className="eyebrow pt-1">Année</p>
                    <div className="grid grid-cols-5 gap-1">
                        {selectableYears(search.decade).map((year) => (
                            <PeriodButton key={year} selected={search.year === year} onClick={() => onChange({ ...search, year: search.year === year ? null : year })}>
                                {year}
                            </PeriodButton>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function PeriodButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: number }) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className="rounded-md py-1.5 text-sm font-medium tabular-nums text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
            {children}
        </button>
    );
}

// En dessous, la recherche renverrait presque toutes les personnes du catalogue.
const MIN_PERSON_NAME_LENGTH = 2;

function PersonSearch({ onSelect }: { onSelect: (personId: number) => void }) {
    const [name, setName] = useState("");
    const debouncedName = useDebouncedValue(name.trim());
    const searching = debouncedName.length >= MIN_PERSON_NAME_LENGTH;
    const { data, isFetching, isError } = useQuery({ ...peopleQuery(debouncedName, 1), enabled: searching });

    return (
        // Les résultats viennent déjà filtrés de l'API, cmdk ne doit pas les filtrer une seconde fois.
        <Command shouldFilter={false}>
            <CommandInput value={name} onValueChange={setName} maxLength={MAX_PERSON_NAME_LENGTH} placeholder="Acteur, réalisatrice, compositeur…" />
            <CommandList>
                {searching && <CommandEmpty>{isError ? "La recherche a échoué." : isFetching ? "Recherche en cours…" : "Aucune personne."}</CommandEmpty>}
                {!searching && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Tapez au moins 2 lettres.</p>}
                {searching && data !== undefined && (
                    <CommandGroup>
                        {data.items.map((person) => (
                            <CommandItem key={person.id} value={String(person.id)} onSelect={() => onSelect(person.id)} className="gap-3">
                                <PersonPhoto person={person} alt="" className="w-8 rounded" loading="lazy" />
                                {person.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </Command>
    );
}

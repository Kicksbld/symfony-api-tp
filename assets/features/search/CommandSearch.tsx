import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { Clapperboard, ListVideo, MessageSquareText, Search, UsersRound, UserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DEFAULT_CATALOG_SEARCH, catalogPath, catalogPathWith } from "@/features/movies/catalog-search";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { releaseYear } from "@/features/movies/format";
import { PersonPhoto } from "@/features/people/PersonPhoto";
import { searchSuggestionsQuery } from "@/features/search/queries";
import { UserAvatar } from "@/features/users/UserAvatar";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

// En dessous, presque tous les titres correspondent : la liste n'aiderait pas à choisir.
const MIN_TERM_LENGTH = 2;
const MAX_TERM_LENGTH = 100;

const BROWSE_LINKS = [
    { label: "Tous les films", path: catalogPath(DEFAULT_CATALOG_SEARCH), icon: Clapperboard },
    { label: "Personnes", path: "/people", icon: UserRound },
    { label: "Listes", path: "/lists", icon: ListVideo },
    { label: "Critiques", path: "/reviews", icon: MessageSquareText },
    { label: "Membres", path: "/users", icon: UsersRound },
];

export function CommandSearch({ className }: { className?: string }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        function toggleOnShortcut(event: KeyboardEvent): void {
            if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                setOpen((current) => !current);
            }
        }

        window.addEventListener("keydown", toggleOnShortcut);

        return () => window.removeEventListener("keydown", toggleOnShortcut);
    }, []);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Rechercher un film, une personne ou un membre"
                className={cn(
                    "flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 text-sm text-muted-foreground transition-colors hover:border-white/20 hover:bg-white/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    className,
                )}
            >
                <Search aria-hidden="true" className="size-4" />
                <span className="hidden flex-1 text-left xl:inline">Films, personnes, membres</span>
                <kbd className="hidden rounded border border-white/15 px-1.5 font-sans text-[0.7rem] xl:inline">Ctrl K</kbd>
            </button>
            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                title="Recherche"
                description="Rechercher un film, une personne ou un membre"
                className="sm:max-w-xl"
            >
                {/* Le panneau est recréé à chaque ouverture : la recherche repart d'un champ vide. */}
                {open && <SearchPanel onNavigate={() => setOpen(false)} />}
            </CommandDialog>
        </>
    );
}

function SearchPanel({ onNavigate }: { onNavigate: () => void }) {
    const navigate = useNavigate();
    const [term, setTerm] = useState("");
    const debouncedTerm = useDebouncedValue(term.trim());
    const searching = debouncedTerm.length >= MIN_TERM_LENGTH;
    const { data, isFetching, isError } = useQuery({ ...searchSuggestionsQuery(debouncedTerm), enabled: searching });

    function go(path: string): void {
        onNavigate();
        void navigate(path);
    }

    return (
        // Les résultats viennent déjà filtrés de l'API, cmdk ne doit pas les filtrer une seconde fois.
        <Command shouldFilter={false} className="bg-transparent">
            <CommandInput
                value={term}
                onValueChange={setTerm}
                maxLength={MAX_TERM_LENGTH}
                placeholder="Rechercher un film, une personne, un membre…"
                className="h-11 text-base"
            />
            <CommandList className="max-h-[min(28rem,60dvh)]">
                {!searching ? (
                    <CommandGroup heading="Parcourir">
                        {BROWSE_LINKS.map(({ label, path, icon: Icon }) => (
                            <CommandItem key={path} value={`browse-${path}`} onSelect={() => go(path)}>
                                <Icon aria-hidden="true" />
                                {label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ) : (
                    <>
                        <CommandEmpty>{emptyMessage(isFetching, isError)}</CommandEmpty>
                        {data !== undefined && data.movies.items.length > 0 && (
                            <CommandGroup heading="Films">
                                {data.movies.items.map((movie) => (
                                    <SuggestionItem key={movie.id} value={`movie-${movie.id}`} onSelect={() => go(`/movies/${movie.id}`)}>
                                        <MoviePoster movie={movie} alt="" className="w-8 rounded text-[0.5rem]" loading="lazy" />
                                        <span className="min-w-0 flex-1 truncate font-medium">{movie.title}</span>
                                        <span className="text-xs text-muted-foreground">{releaseYear(movie.releaseDate)}</span>
                                    </SuggestionItem>
                                ))}
                                {data.movies.total > data.movies.items.length && (
                                    <CommandItem value="all-movies" onSelect={() => go(catalogPathWith({ q: debouncedTerm }))} className="text-primary">
                                        <Search aria-hidden="true" />
                                        Voir les {data.movies.total.toLocaleString("fr-FR")} films pour « {debouncedTerm} »
                                    </CommandItem>
                                )}
                            </CommandGroup>
                        )}
                        {data !== undefined && data.people.items.length > 0 && (
                            <CommandGroup heading="Personnes">
                                {data.people.items.map((person) => (
                                    <SuggestionItem key={person.id} value={`person-${person.id}`} onSelect={() => go(`/people/${person.id}`)}>
                                        <PersonPhoto person={person} alt="" className="w-8 rounded" loading="lazy" />
                                        <span className="truncate font-medium">{person.name}</span>
                                    </SuggestionItem>
                                ))}
                            </CommandGroup>
                        )}
                        {data !== undefined && data.members.items.length > 0 && (
                            <CommandGroup heading="Membres">
                                {data.members.items.map((member) => (
                                    <SuggestionItem
                                        key={member.id}
                                        value={`member-${member.id}`}
                                        onSelect={() => go(`/users/${encodeURIComponent(member.username)}`)}
                                    >
                                        <UserAvatar username={member.username} className="size-8 text-xs" />
                                        <span className="truncate font-medium">{member.username}</span>
                                    </SuggestionItem>
                                ))}
                            </CommandGroup>
                        )}
                    </>
                )}
            </CommandList>
        </Command>
    );
}

function SuggestionItem({ value, onSelect, children }: { value: string; onSelect: () => void; children: ReactNode }) {
    return (
        <CommandItem value={value} onSelect={onSelect} className="gap-3 py-1.5">
            {children}
        </CommandItem>
    );
}

function emptyMessage(isFetching: boolean, isError: boolean): string {
    if (isError) {
        return "La recherche a échoué, réessayez.";
    }

    return isFetching ? "Recherche en cours…" : "Aucun résultat.";
}

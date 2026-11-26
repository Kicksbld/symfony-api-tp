import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MoviePicker } from "@/features/movies/MoviePicker";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { releaseYear } from "@/features/movies/format";
import { favoritesError } from "@/features/users/profile-editing";
import type { MovieSummary } from "@/lib/types";

const MAX_FAVORITES = 4;

type FavoriteMoviesFormProps = {
    favorites: MovieSummary[];
    saving: boolean;
    onSave: (movies: number[]) => Promise<unknown>;
};

export function FavoriteMoviesForm({ favorites, saving, onSave }: FavoriteMoviesFormProps) {
    const [draft, setDraft] = useState<MovieSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const movies = draft ?? favorites;
    const dirty = movies.length !== favorites.length || movies.some((movie, index) => movie.id !== favorites[index]?.id);

    function change(next: MovieSummary[]): void {
        setDraft(next);
        setError(null);
        setSaved(false);
    }

    function add(movie: MovieSummary): void {
        if (!saving && movies.length < MAX_FAVORITES && !movies.some(({ id }) => id === movie.id)) {
            change([...movies, movie]);
        }
    }

    function move(index: number, offset: number): void {
        const next = [...movies];
        const destination = index + offset;
        [next[index], next[destination]] = [next[destination], next[index]];
        change(next);
    }

    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        if (saving || !dirty) {
            return;
        }
        setError(null);
        setSaved(false);

        try {
            await onSave(movies.map(({ id }) => id));
            setDraft(null);
            setSaved(true);
        } catch (error) {
            setError(favoritesError(error));
        }
    }

    return (
        <section aria-labelledby="favorite-movies-title" className="space-y-4">
            <div className="space-y-1">
                <h2 id="favorite-movies-title" className="text-2xl font-bold">Films favoris</h2>
                <p className="text-sm text-muted-foreground">
                    Choisissez jusqu'à {MAX_FAVORITES} films. Ils apparaîtront dans cet ordre sur votre profil.
                </p>
            </div>
            <MoviePicker selected={movies} disabled={saving || movies.length >= MAX_FAVORITES} onSelect={add} />
            <form aria-labelledby="favorite-movies-title" onSubmit={submit}>
                <fieldset disabled={saving} className="space-y-4">
                    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                    {movies.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun film favori sélectionné.</p>
                    ) : (
                        <ol className="list-decimal space-y-2 pl-6 marker:text-sm marker:text-muted-foreground">
                            {movies.map((movie, index) => {
                                const year = releaseYear(movie.releaseDate);

                                return (
                                    <li key={movie.id}>
                                        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                                            <MoviePoster movie={movie} alt="" className="w-8 shrink-0 overflow-hidden rounded text-[0.5rem]" loading="lazy" />
                                            <p className="min-w-0 flex-1 text-sm font-medium">{movie.title}{year && ` (${year})`}</p>
                                            <div className="flex shrink-0">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-10"
                                                    disabled={index === 0}
                                                    aria-label={`Monter ${movie.title}`}
                                                    title={`Monter ${movie.title}`}
                                                    onClick={() => move(index, -1)}
                                                >
                                                    <ArrowUp aria-hidden="true" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-10"
                                                    disabled={index === movies.length - 1}
                                                    aria-label={`Descendre ${movie.title}`}
                                                    title={`Descendre ${movie.title}`}
                                                    onClick={() => move(index, 1)}
                                                >
                                                    <ArrowDown aria-hidden="true" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-10"
                                                    aria-label={`Retirer ${movie.title}`}
                                                    title={`Retirer ${movie.title}`}
                                                    onClick={() => change(movies.filter(({ id }) => id !== movie.id))}
                                                >
                                                    <X aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" disabled={!dirty}>Enregistrer les favoris</Button>
                        <span role="status" className="text-sm text-muted-foreground">{saved && "Films favoris enregistrés."}</span>
                    </div>
                </fieldset>
            </form>
        </section>
    );
}

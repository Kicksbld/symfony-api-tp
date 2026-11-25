import { Search } from "lucide-react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { PaginatedList } from "@/components/PaginatedList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersonCard } from "@/features/people/PersonCard";
import { MAX_PERSON_NAME_LENGTH, peopleQuery } from "@/features/people/queries";
import { pageSearch, parsePage } from "@/lib/pagination";

export function PeoplePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const rawName = searchParams.get("q") ?? "";
    const name = rawName.trim();
    const page = parsePage(searchParams);

    // On nettoie l'adresse (lien modifié à la main) plutôt que d'envoyer une requête que l'API refuserait en 422.
    if (page === null || name !== rawName || name.length > MAX_PERSON_NAME_LENGTH) {
        const validName = name.length > MAX_PERSON_NAME_LENGTH ? "" : name;

        return <Navigate to={pageSearch(1, validName === "" ? {} : { q: validName })} replace />;
    }

    function submitName(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q");
        const nextName = typeof value === "string" ? value.trim() : "";
        void navigate(pageSearch(1, nextName === "" ? {} : { q: nextName }));
    }

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-semibold">Personnes</h1>
            {/* La clé recrée le champ quand l'adresse change (Précédent) : un nom tapé mais pas validé disparaît. */}
            <form key={name} role="search" onSubmit={submitName} className="flex max-w-xl items-end gap-2">
                <div className="flex-1 space-y-1.5">
                    <Label htmlFor="people-name">Nom</Label>
                    <Input
                        id="people-name"
                        name="q"
                        type="search"
                        defaultValue={name}
                        maxLength={MAX_PERSON_NAME_LENGTH}
                        placeholder="Rechercher un acteur, une réalisatrice…"
                    />
                </div>
                <Button type="submit" variant="outline" size="icon" aria-label="Rechercher">
                    <Search aria-hidden="true" />
                </Button>
            </form>
            {name === "" ? (
                <EmptyState message="Tapez un nom pour retrouver les films d'une personne, devant ou derrière la caméra." />
            ) : (
                <PaginatedList
                    query={peopleQuery(name, page)}
                    page={page}
                    pathForPage={(nextPage) => pageSearch(nextPage, { q: name })}
                    label="Pagination des personnes"
                    emptyMessage={`Aucune personne ne correspond à « ${name} ».`}
                    errorMessage="Impossible de charger les personnes."
                >
                    {(people, total) => (
                        <>
                            <p role="status" className="text-sm text-muted-foreground">
                                {total.toLocaleString("fr-FR")} {total > 1 ? "personnes" : "personne"}
                            </p>
                            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                                {people.map((person) => (
                                    <li key={person.id}>
                                        <PersonCard person={person} />
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </PaginatedList>
            )}
        </section>
    );
}

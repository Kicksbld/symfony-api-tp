import { Navigate, useNavigate, useSearchParams } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PaginatedList } from "@/components/PaginatedList";
import { SearchField } from "@/components/SearchField";
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

    function search(nextName: string): void {
        void navigate(pageSearch(1, nextName === "" ? {} : { q: nextName }), { replace: true });
    }

    return (
        <section className="space-y-8">
            <PageHeader eyebrow="Devant et derrière la caméra" title="Personnes" />
            <SearchField
                value={name}
                onSearch={search}
                label="Rechercher une personne par son nom"
                placeholder="Rechercher un acteur, une réalisatrice…"
                maxLength={MAX_PERSON_NAME_LENGTH}
                className="max-w-xl"
            />
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
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
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

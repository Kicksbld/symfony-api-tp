import { useQuery } from "@tanstack/react-query";
import { companyQuery } from "@/features/companies/queries";
import { withoutFilter, type CatalogFilter, type CatalogSearch } from "@/features/movies/catalog-search";
import { countriesQuery, genresQuery, watchProvidersQuery } from "@/features/movies/queries";
import { personQuery } from "@/features/people/queries";
import { ApiError } from "@/lib/api";
import type { Company, Country, Genre, PersonSummary, WatchProvider } from "@/lib/types";

export type CatalogCorrection = {
    search: CatalogSearch;
    // Identifiant inconnu dans l'URL (lien modifié à la main, fiche supprimée).
    invalidParams: boolean;
    // La plateforme n'a aucun film du catalogue dans le nouveau pays de diffusion.
    unavailableProvider: boolean;
};

export type CatalogReferences = {
    genres: Genre[] | undefined;
    countries: Country[] | undefined;
    providers: WatchProvider[] | undefined;
    person: PersonSummary | undefined;
    company: Company | undefined;
    error: Error | null;
    retry: () => void;
    retrying: boolean;
    isChecking: boolean;
    correction: CatalogCorrection | null;
};

/**
 * Charge les référentiels qui remplissent les filtres et donnent un nom aux identifiants de l'URL. Un identifiant
 * inconnu donne une correction de l'URL plutôt qu'une page « aucun film » sans explication.
 */
export function useCatalogReferences(search: CatalogSearch): CatalogReferences {
    const genres = useQuery(genresQuery());
    const countries = useQuery(countriesQuery());
    const providers = useQuery(watchProvidersQuery(search.region));
    // Sans filtre, la requête est désactivée : l'identifiant 0 n'est jamais envoyé.
    const person = useQuery({ ...personQuery(search.person ?? 0), enabled: search.person !== null });
    const company = useQuery({ ...companyQuery(search.company ?? 0), enabled: search.company !== null });

    const unknownFilters: CatalogFilter[] = [];
    if (search.genre !== null && genres.data?.some((genre) => genre.id === search.genre) === false) {
        unknownFilters.push("genre");
    }
    if (search.country !== null && countries.data?.some((country) => country.code === search.country) === false) {
        unknownFilters.push("country");
    }
    if (search.person !== null && isNotFound(person.error)) {
        unknownFilters.push("person");
    }
    if (search.company !== null && isNotFound(company.error)) {
        unknownFilters.push("company");
    }
    const unavailableProvider = search.provider !== null && providers.data?.some((provider) => provider.id === search.provider) === false;
    const removedFilters: CatalogFilter[] = unavailableProvider ? [...unknownFilters, "provider"] : unknownFilters;

    // Tant qu'un critère n'est pas vérifié, la recherche attend : on n'affiche pas « aucun film » juste avant de corriger l'URL.
    const isChecking =
        (search.genre !== null && genres.isPending) ||
        (search.country !== null && countries.isPending) ||
        (search.provider !== null && providers.isPending) ||
        (search.person !== null && person.isPending) ||
        (search.company !== null && company.isPending);

    // Une fiche introuvable est corrigée dans l'URL, ce n'est pas une erreur à afficher.
    const failedQueries = [genres, countries, providers, person, company].filter((query) => query.error !== null && !isNotFound(query.error));

    return {
        genres: genres.data,
        countries: countries.data,
        providers: providers.data,
        person: person.data,
        company: company.data,
        error: failedQueries[0]?.error ?? null,
        retry: () => failedQueries.forEach((query) => void query.refetch()),
        retrying: failedQueries.some((query) => query.isFetching),
        isChecking,
        correction:
            removedFilters.length === 0
                ? null
                : {
                      search: removedFilters.reduce(withoutFilter, search),
                      invalidParams: unknownFilters.length > 0,
                      unavailableProvider,
                  },
    };
}

function isNotFound(error: Error | null): boolean {
    return error instanceof ApiError && error.status === 404;
}

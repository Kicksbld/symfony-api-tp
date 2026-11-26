import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { QueryError } from "@/components/QueryError";
import { SectionSkeleton } from "@/components/SectionSkeleton";
import { movieWatchProvidersQuery } from "@/features/movies/queries";
import { countryName } from "@/features/movies/regions";
import { DEFAULT_WATCH_REGION, WATCH_REGIONS, type WatchProvider, type WatchProvidersByType, type WatchRegion } from "@/lib/types";

const OFFER_TYPES: { type: keyof WatchProvidersByType; label: string }[] = [
    { type: "flatrate", label: "Abonnement" },
    { type: "rent", label: "Location" },
    { type: "buy", label: "Achat" },
];

export function WatchProviders({ movieId }: { movieId: number }) {
    const [region, setRegion] = useState<WatchRegion>(DEFAULT_WATCH_REGION);
    const { data: providers, error, isFetching, isPlaceholderData, refetch } = useQuery(movieWatchProvidersQuery(movieId, region));

    return (
        <section className="space-y-3" aria-labelledby="watch-providers-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="watch-providers-title" className="eyebrow">
                    Où regarder
                </h2>
                <div role="radiogroup" aria-label="Pays de diffusion" className="flex gap-0.5 rounded-full bg-white/5 p-0.5">
                    {WATCH_REGIONS.map((code) => (
                        <button
                            key={code}
                            type="button"
                            role="radio"
                            aria-checked={code === region}
                            aria-label={countryName(code)}
                            title={countryName(code)}
                            onClick={() => setRegion(code)}
                            className="rounded-full px-2 py-1 text-[0.7rem] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-checked:bg-primary aria-checked:text-primary-foreground"
                        >
                            {code}
                        </button>
                    ))}
                </div>
            </div>
            {error !== null && (
                <QueryError message="Impossible de charger les plateformes." error={error} onRetry={() => void refetch()} retrying={isFetching} />
            )}
            {providers === undefined ? (
                error === null && <SectionSkeleton label="Chargement des plateformes…" className="h-16 w-full" />
            ) : (
                <div className="transition-opacity aria-busy:opacity-60" aria-busy={isPlaceholderData}>
                    <ProviderOffers providers={providers} regionLabel={countryName(region)} />
                </div>
            )}
        </section>
    );
}

function ProviderOffers({ providers, regionLabel }: { providers: WatchProvidersByType; regionLabel: string }) {
    const offers = OFFER_TYPES.filter(({ type }) => providers[type].length > 0);

    if (offers.length === 0) {
        return <p className="text-sm text-muted-foreground">Aucune offre connue pour ce film ({regionLabel}).</p>;
    }

    return (
        <dl className="space-y-3">
            {offers.map(({ type, label }) => (
                <div key={type} className="space-y-1.5">
                    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                    <dd>
                        <ul className="flex flex-wrap gap-2">
                            {providers[type].map((provider) => (
                                <ProviderBadge key={provider.id} provider={provider} />
                            ))}
                        </ul>
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function ProviderBadge({ provider }: { provider: WatchProvider }) {
    return (
        <li className="flex items-center gap-2 rounded-full bg-white/5 py-1 pr-3 pl-1 text-sm">
            {provider.logoUrl !== null && <img src={provider.logoUrl} alt="" className="size-7 rounded-full" loading="lazy" />}
            {provider.name}
        </li>
    );
}

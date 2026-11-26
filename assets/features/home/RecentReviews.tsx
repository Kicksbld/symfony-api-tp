import { useQuery } from "@tanstack/react-query";
import { SectionHeader } from "@/components/SectionHeader";
import { useAuth } from "@/features/auth/auth";
import { RowSkeleton } from "@/features/home/RowSkeleton";
import { ReviewTeaser } from "@/features/log-entries/ReviewTeaser";
import { reviewsPath, reviewsQuery } from "@/features/log-entries/reviews";

const REVIEW_COUNT = 6;

export function RecentReviews() {
    const { session } = useAuth();
    const { data, isPending } = useQuery(reviewsQuery({}, 1, session));

    if (isPending) {
        return <RowSkeleton label="Chargement des critiques…" count={3} className="h-40" />;
    }
    if (data === undefined || data.items.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="home-reviews" className="space-y-5">
            <SectionHeader id="home-reviews" title="Critiques récentes" link={{ to: reviewsPath(), label: "Toutes les critiques" }} />
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.items.slice(0, REVIEW_COUNT).map((entry) => (
                    <li key={entry.id}>
                        <ReviewTeaser entry={entry} />
                    </li>
                ))}
            </ul>
        </section>
    );
}

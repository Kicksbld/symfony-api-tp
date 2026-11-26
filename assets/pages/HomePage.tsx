import { useAuth } from "@/features/auth/auth";
import { FeedRow } from "@/features/home/FeedRow";
import { GenreTiles } from "@/features/home/GenreTiles";
import { HeroCarousel } from "@/features/home/HeroCarousel";
import { MovieRow } from "@/features/home/MovieRow";
import { PopularLists } from "@/features/home/PopularLists";
import { RecentReviews } from "@/features/home/RecentReviews";

export function HomePage() {
    const { session } = useAuth();

    return (
        <>
            <h1 className="sr-only">Letterboxd, votre journal de cinéma</h1>
            <HeroCarousel />
            <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6">
                {session !== null && <FeedRow key={session.cacheId} session={session} />}
                <MovieRow id="home-trending" title="Top 10 de la semaine" sort="trending" ranked />
                <RecentReviews />
                <MovieRow id="home-popular" title="Populaires" sort="popular" />
                <GenreTiles />
                <PopularLists />
                <MovieRow id="home-top-rated" title="Les mieux notés" sort="rating" />
            </div>
        </>
    );
}

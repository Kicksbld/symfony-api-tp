import type { MovieSummary, UserSummary } from "@/lib/types";

export type MovieList = {
    id: number;
    user: UserSummary;
    name: string;
    description: string | null;
    public: boolean;
    ranked: boolean;
    previewMovies: MovieSummary[];
    itemCount: number;
    likeCount: number;
    likedByMe: boolean;
};

export type MovieListItem = {
    id: number;
    movie: MovieSummary;
    position: number;
    note: string | null;
};

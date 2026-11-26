import type { MovieSummary, UserSummary } from "@/lib/types";

export type MovieList = {
    id: number;
    user: UserSummary;
    name: string;
    description: string | null;
    public: boolean;
    ranked: boolean;
    itemCount: number;
    likeCount: number;
    likedByMe: boolean;
};

export type ListComment = {
    id: number;
    user: UserSummary;
    content: string;
    createdAt: string;
    updatedAt: string;
};

export type MovieListItem = {
    id: number;
    movie: MovieSummary;
    position: number;
    note: string | null;
};

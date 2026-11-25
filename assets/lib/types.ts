export type Paginated<T> = {
    items: T[];
    total: number;
    lastPage: number;
};

export type MovieSummary = {
    id: number;
    title: string;
    originalTitle: string;
    releaseDate: string | null;
    averageRating: number | null;
    posterUrl: string | null;
};

export type CurrentUser = {
    id: number;
    username: string;
    email: string;
};

export type LoginResponse = {
    token: string;
    ttl: number;
    user: CurrentUser;
};

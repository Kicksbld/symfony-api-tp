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

export type Genre = {
    id: number;
    name: string;
};

export type PersonSummary = {
    id: number;
    name: string;
    profileUrl: string | null;
};

export type CastCredit = {
    person: PersonSummary;
    character: string | null;
};

export type CrewCredit = {
    person: PersonSummary;
    job: string;
    department: string;
};

export type MovieDetail = MovieSummary & {
    overview: string | null;
    runtime: number | null;
    ratingCount: number;
    genres: Genre[];
    cast: CastCredit[];
    crew: CrewCredit[];
};

export type MovieRelationship = {
    watched: boolean;
    liked: boolean;
    rating: number | null;
    inWatchlist: boolean;
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

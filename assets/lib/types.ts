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

export type Company = {
    id: number;
    name: string;
    logoUrl: string | null;
};

export type Country = {
    code: string;
    name: string;
};

export type MovieDetail = MovieSummary & {
    overview: string | null;
    runtime: number | null;
    genres: Genre[];
    countries: Country[];
    companies: Company[];
    cast: CastCredit[];
    crew: CrewCredit[];
};

// crew range les films par poste TMDB : { "Director": [...], "Writer": [...] }.
export type PersonDetail = PersonSummary & {
    cast: { movie: MovieSummary; character: string | null }[];
    crew: Record<string, MovieSummary[]>;
};

export type RatingDistribution = {
    histogram: { rating: number; count: number }[];
    count: number;
    average: number | null;
};

export const WATCH_REGIONS = ["FR", "BE", "CH", "CA", "US"] as const;

export type WatchRegion = (typeof WATCH_REGIONS)[number];

export const DEFAULT_WATCH_REGION: WatchRegion = "FR";

export type WatchProvider = {
    id: number;
    name: string;
    logoUrl: string | null;
};

// Les clés reprennent celles de TMDB : flatrate correspond à l'abonnement.
export type WatchProvidersByType = Record<"flatrate" | "rent" | "buy", WatchProvider[]>;

export type MovieRelationship = {
    watched: boolean;
    liked: boolean;
    rating: number | null;
    inWatchlist: boolean;
};

export type LoginResponse = {
    token: string;
    ttl: number;
    user: CurrentUser;
};

export type UserSummary = {
    id: number;
    username: string;
};

export type UserProfile = UserSummary & {
    bio: string | null;
    favorites: MovieSummary[];
    watchedCount: number;
    followersCount: number;
    followingCount: number;
};

export type PublicProfile = UserProfile & { followedByMe: boolean };

export type CurrentUser = UserProfile & { email: string };

export type LogEntry = {
    id: number;
    user: UserSummary;
    movie: MovieSummary;
    watchedOn: string | null;
    rating: number | null;
    liked: boolean;
    rewatch: boolean;
    review: string | null;
    containsSpoilers: boolean;
    createdAt: string;
    likeCount: number;
    commentCount: number;
};

export type MovieRelationshipItem = MovieRelationship & {
    movie: MovieSummary;
};

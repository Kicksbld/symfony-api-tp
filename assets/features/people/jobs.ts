import type { MovieSummary, PersonDetail } from "@/lib/types";

// TMDB ne donne de poste qu'à l'équipe, l'API utilise ce nom pour les films où la personne joue.
export const ACTOR_JOB = "Actor";

// Postes importés depuis TMDB, en anglais. Un poste absent de la liste garde son nom TMDB.
const JOB_LABELS: Record<string, string> = {
    [ACTOR_JOB]: "Interprétation",
    Director: "Réalisation",
    Screenplay: "Scénario",
    Writer: "Écriture",
    "Director of Photography": "Image",
    "Original Music Composer": "Musique",
    Editor: "Montage",
};

export type PersonJob = {
    job: string;
    label: string;
    movieCount: number;
};

export function jobLabel(job: string): string {
    return JOB_LABELS[job] ?? job;
}

// Un acteur peut avoir deux rôles dans le même film : on compte les films, pas les crédits.
function countMovies(movies: MovieSummary[]): number {
    return new Set(movies.map((movie) => movie.id)).size;
}

export function personJobs(person: PersonDetail): PersonJob[] {
    const castMovies = person.cast.map((credit) => credit.movie);
    const jobs = castMovies.length > 0 ? [{ job: ACTOR_JOB, movies: castMovies }] : [];
    jobs.push(...Object.entries(person.crew).map(([job, movies]) => ({ job, movies })));

    return jobs.map(({ job, movies }) => ({ job, label: jobLabel(job), movieCount: countMovies(movies) }));
}

export function personMovieCount(person: PersonDetail): number {
    return countMovies([...person.cast.map((credit) => credit.movie), ...Object.values(person.crew).flat()]);
}

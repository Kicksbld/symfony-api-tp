import { PersonLink } from "@/features/people/PersonLink";
import { PersonPhoto } from "@/features/people/PersonPhoto";
import type { PersonSummary } from "@/lib/types";

export function PersonCard({ person }: { person: PersonSummary }) {
    return (
        <PersonLink personId={person.id} className="group block rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
            <div className="overflow-hidden rounded-lg ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-primary/70">
                {/* Le nom est écrit sous la photo, le répéter dans le nom du lien n'apporte rien. */}
                <PersonPhoto person={person} alt="" className="transition duration-500 group-hover:scale-105" loading="lazy" />
            </div>
            <p className="mt-2.5 line-clamp-2 text-sm font-semibold transition-colors group-hover:text-primary">{person.name}</p>
        </PersonLink>
    );
}

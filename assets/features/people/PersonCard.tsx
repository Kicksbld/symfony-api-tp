import { Card, CardContent } from "@/components/ui/card";
import { PersonLink } from "@/features/people/PersonLink";
import { PersonPhoto } from "@/features/people/PersonPhoto";
import type { PersonSummary } from "@/lib/types";

export function PersonCard({ person }: { person: PersonSummary }) {
    return (
        <PersonLink personId={person.id} className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
            <Card className="gap-0 overflow-hidden py-0 transition-colors hover:bg-muted">
                {/* Le nom est écrit sous la photo, le répéter dans le nom du lien n'apporte rien. */}
                <PersonPhoto person={person} alt="" loading="lazy" />
                <CardContent className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">{person.name}</p>
                </CardContent>
            </Card>
        </PersonLink>
    );
}

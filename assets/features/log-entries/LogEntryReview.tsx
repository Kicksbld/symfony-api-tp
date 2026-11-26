import { EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Le texte d'une critique à spoilers n'est pas dans la page tant que le lecteur ne l'a pas demandé.
export function LogEntryReview({ review, containsSpoilers }: { review: string; containsSpoilers: boolean }) {
    const [revealed, setRevealed] = useState(false);

    if (containsSpoilers && !revealed) {
        return (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                    <EyeOff aria-hidden="true" className="size-4" />
                    Cette critique contient des spoilers.
                </span>
                <Button variant="outline" size="sm" onClick={() => setRevealed(true)}>
                    Afficher la critique
                </Button>
            </div>
        );
    }

    return <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-line">{review}</p>;
}

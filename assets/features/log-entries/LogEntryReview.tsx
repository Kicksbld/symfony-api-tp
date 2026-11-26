import { EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Le texte d'une critique à spoilers n'est pas dans la page tant que le lecteur ne l'a pas demandé.
export function LogEntryReview({ review, containsSpoilers }: { review: string; containsSpoilers: boolean }) {
    const [revealed, setRevealed] = useState(false);

    if (containsSpoilers && !revealed) {
        return (
            <div className="relative overflow-hidden rounded-xl bg-white/[0.03] p-4">
                {/* Fausses lignes floutées : la forme d'un texte, sans le texte lui-même. */}
                <div aria-hidden="true" className="space-y-2 blur-[3px]">
                    <div className="h-3 w-11/12 rounded bg-foreground/20" />
                    <div className="h-3 w-4/5 rounded bg-foreground/20" />
                    <div className="h-3 w-2/3 rounded bg-foreground/20" />
                </div>
                <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-3 bg-background/30 text-sm">
                    <span className="inline-flex items-center gap-2 font-medium">
                        <EyeOff aria-hidden="true" className="size-4" />
                        Cette critique contient des spoilers.
                    </span>
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => setRevealed(true)}>
                        Afficher la critique
                    </Button>
                </div>
            </div>
        );
    }

    return <p className="leading-relaxed wrap-break-word whitespace-pre-line text-foreground/85">{review}</p>;
}

import { MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { logEntryViewKeys, type PublicLogEntry } from "@/features/log-entries/reviews";
import { LikeButton } from "@/features/social/LikeButton";
import type { LogEntry } from "@/lib/types";
import { TEXT_LINK_CLASS_NAME } from "@/lib/utils";

export function LogEntryLikeButton({ entry }: { entry: PublicLogEntry }) {
    return (
        <LikeButton
            target={entry}
            title={`le visionnage de « ${entry.movie.title} » par ${entry.user.username}`}
            path={`/log-entries/${entry.id}/like`}
            viewsFor={(viewer) => logEntryViewKeys(entry.id, viewer)}
        />
    );
}

export function LogEntryLink({ entry, showCount = false }: { entry: LogEntry; showCount?: boolean }) {
    return (
        <div className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Link to={`/log-entries/${entry.id}`} className={TEXT_LINK_CLASS_NAME}>
                Voir le détail
                <span className="sr-only"> du visionnage de {entry.movie.title} par {entry.user.username}</span>
            </Link>
            {showCount && (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <MessageCircle aria-hidden="true" className="size-4" />
                    {entry.commentCount} {entry.commentCount === 1 ? "commentaire" : "commentaires"}
                </span>
            )}
        </div>
    );
}

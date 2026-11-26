import { listDetailKey, listDirectoryKey } from "@/features/movie-lists/queries";
import { profileListsKey } from "@/features/users/queries";
import type { Session } from "@/lib/session";

export function listViewKeys(id: number, author: string, viewer: Session | null) {
    return {
        detail: listDetailKey(id, viewer),
        collections: [listDirectoryKey(viewer), profileListsKey(author, viewer)],
    };
}

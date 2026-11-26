import { listViewKeys } from "@/features/movie-lists/list-view-keys";
import type { MovieList } from "@/features/movie-lists/types";
import { LikeButton } from "@/features/social/LikeButton";

export function ListLikeButton({ list }: { list: MovieList }) {
    return (
        <LikeButton
            target={list}
            title={`la liste « ${list.name} »`}
            path={`/lists/${list.id}/like`}
            viewsFor={(viewer) => listViewKeys(list.id, list.user.username, viewer)}
        />
    );
}

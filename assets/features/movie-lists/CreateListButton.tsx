import { useNavigate } from "react-router";
import { ListFormButton } from "@/features/movie-lists/ListFormButton";
import type { Session } from "@/lib/session";

export function CreateListButton({ session }: { session: Session }) {
    const navigate = useNavigate();

    return <ListFormButton key={session.cacheId} session={session} onSaved={(list) => void navigate(`/lists/${list.id}`)} />;
}

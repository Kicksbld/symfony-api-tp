import { Link } from "react-router";
import type { UserSummary } from "@/lib/types";

export function MemberResults({ members }: { members: UserSummary[] }) {
    return (
        <ul className="max-w-xl divide-y rounded-lg border">
            {members.map(({ id, username }) => (
                <li key={id}>
                    <Link
                        to={`/users/${encodeURIComponent(username)}`}
                        className="block rounded-md px-4 py-3 font-medium hover:bg-muted hover:underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    >
                        {username}
                    </Link>
                </li>
            ))}
        </ul>
    );
}

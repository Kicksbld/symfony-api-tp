import { cn } from "cn";

// Les membres n'ont pas de photo : la couleur vient du pseudo pour qu'un même membre la garde partout.
const AVATAR_COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

type UserAvatarProps = {
    username: string;
    className?: string;
};

export function UserAvatar({ username, className }: UserAvatarProps) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold text-black uppercase select-none",
                avatarColor(username),
                className,
            )}
        >
            {username.slice(0, 2)}
        </span>
    );
}

function avatarColor(username: string): string {
    let hash = 0;
    for (const character of username) {
        hash = (hash * 31 + character.charCodeAt(0)) % AVATAR_COLORS.length;
    }

    return AVATAR_COLORS[hash];
}

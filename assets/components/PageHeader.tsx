import type { ReactNode } from "react";

type PageHeaderProps = {
    eyebrow?: string;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="max-w-3xl space-y-2">
                {eyebrow !== undefined && <p className="eyebrow">{eyebrow}</p>}
                <h1 className="text-4xl font-extrabold wrap-break-word sm:text-5xl">{title}</h1>
                {description !== undefined && <p className="text-muted-foreground">{description}</p>}
            </div>
            {children}
        </header>
    );
}

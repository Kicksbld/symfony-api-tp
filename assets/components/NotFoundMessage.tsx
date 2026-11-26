import { Link, type To } from "react-router";
import { Button } from "@/components/ui/button";

type NotFoundMessageProps = {
    title: string;
    message?: string;
    action: { to: To; label: string };
};

export function NotFoundMessage({ title, message, action }: NotFoundMessageProps) {
    return (
        <section className="flex flex-col items-center gap-4 py-20 text-center">
            <p aria-hidden="true" className="font-heading text-8xl font-extrabold tracking-tighter text-primary/20">
                404
            </p>
            <h1 className="text-4xl font-extrabold">{title}</h1>
            {message !== undefined && <p className="max-w-md text-muted-foreground">{message}</p>}
            <Button asChild variant="outline" className="h-11 rounded-full px-5">
                <Link to={action.to}>{action.label}</Link>
            </Button>
        </section>
    );
}

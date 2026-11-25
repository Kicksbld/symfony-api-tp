import { Skeleton } from "@/components/ui/skeleton";

export function SectionSkeleton({ label, className }: { label: string; className: string }) {
    return (
        <div aria-busy="true">
            <p role="status" className="sr-only">
                {label}
            </p>
            <Skeleton className={className} aria-hidden="true" />
        </div>
    );
}

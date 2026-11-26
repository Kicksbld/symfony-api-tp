import { Skeleton } from "@/components/ui/skeleton";

export function RowSkeleton({ label, count = 6, className = "aspect-[2/3]" }: { label: string; count?: number; className?: string }) {
    return (
        <div className="space-y-5" aria-busy="true">
            <p role="status" className="sr-only">
                {label}
            </p>
            <Skeleton className="h-8 w-56" aria-hidden="true" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6" aria-hidden="true">
                {Array.from({ length: count }, (_, index) => (
                    <Skeleton key={index} className={className} />
                ))}
            </div>
        </div>
    );
}

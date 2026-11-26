import type { ReactNode } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { SectionHeader } from "@/components/SectionHeader";
import type { To } from "react-router";

type ContentRowProps<T> = {
    id: string;
    eyebrow?: string;
    title: ReactNode;
    link?: { to: To; label: string };
    items: T[];
    itemKey: (item: T) => string | number;
    itemClassName: string;
    renderItem: (item: T) => ReactNode;
};

// Rangée horizontale de l'accueil : on fait défiler au doigt, à la souris ou avec les flèches de l'en-tête.
export function ContentRow<T>({ id, eyebrow, title, link, items, itemKey, itemClassName, renderItem }: ContentRowProps<T>) {
    return (
        <section aria-labelledby={id}>
            <Carousel opts={{ align: "start", dragFree: true }} className="space-y-5">
                <SectionHeader id={id} eyebrow={eyebrow} title={title} link={link}>
                    <div className="hidden gap-2 sm:flex">
                        <CarouselPrevious className="static size-9 translate-none" />
                        <CarouselNext className="static size-9 translate-none" />
                    </div>
                </SectionHeader>
                <CarouselContent>
                    {items.map((item) => (
                        <CarouselItem key={itemKey(item)} className={itemClassName}>
                            {renderItem(item)}
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>
    );
}

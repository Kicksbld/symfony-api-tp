import type { ComponentProps } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { formatRating } from "@/features/movies/format";

const RATING_CHOICES = Array.from({ length: 10 }, (_, index) => (index + 1) / 2);

export function RatingSelect(props: Omit<ComponentProps<typeof NativeSelect>, "children">) {
    return (
        <NativeSelect {...props}>
            <option value="">Pas de note</option>
            {RATING_CHOICES.map((rating) => (
                <option key={rating} value={rating}>
                    {formatRating(rating)}
                </option>
            ))}
        </NativeSelect>
    );
}

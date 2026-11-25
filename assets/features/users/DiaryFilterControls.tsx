import { useId } from "react";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DIARY_MAX_YEAR, DIARY_MIN_YEAR, type DiaryFilters } from "@/features/users/diary-search";

const MONTH_FORMAT = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" });
const MONTH_LABELS = Array.from({ length: 12 }, (_, index) => MONTH_FORMAT.format(new Date(Date.UTC(2020, index, 1))));

export function DiaryFilterControls({ filters, onChange }: { filters: DiaryFilters; onChange: (filters: DiaryFilters) => void }) {
    const id = useId();
    const lastYear = Math.min(DIARY_MAX_YEAR, Math.max(new Date().getFullYear(), filters.year ?? DIARY_MIN_YEAR));
    const years = Array.from({ length: lastYear - DIARY_MIN_YEAR + 1 }, (_, index) => lastYear - index);

    return (
        <div role="group" aria-label="Filtres du journal" className="flex flex-wrap gap-3">
            <div className="space-y-1.5">
                <Label htmlFor={`${id}-year`}>Année</Label>
                <NativeSelect
                    id={`${id}-year`}
                    className="[&_select]:h-11"
                    value={filters.year ?? ""}
                    onChange={(event) => {
                        const year = event.target.value === "" ? null : Number(event.target.value);
                        onChange({ year, month: year === null ? null : filters.month });
                    }}
                >
                    <option value="">Toutes les années</option>
                    {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </NativeSelect>
            </div>
            {filters.year !== null && (
                <div className="space-y-1.5">
                    <Label htmlFor={`${id}-month`}>Mois</Label>
                    <NativeSelect
                        id={`${id}-month`}
                        className="[&_select]:h-11"
                        value={filters.month ?? ""}
                        onChange={(event) => onChange({ ...filters, month: event.target.value === "" ? null : Number(event.target.value) })}
                    >
                        <option value="">Tous les mois</option>
                        {MONTH_LABELS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
                    </NativeSelect>
                </div>
            )}
        </div>
    );
}

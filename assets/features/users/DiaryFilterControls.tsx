import { FilterPopover, OptionList } from "@/features/movies/FilterPopover";
import { DIARY_MAX_YEAR, DIARY_MIN_YEAR, type DiaryFilters } from "@/features/users/diary-search";

const MONTH_FORMAT = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" });
const MONTHS = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: MONTH_FORMAT.format(new Date(Date.UTC(2020, index, 1))) }));

export function DiaryFilterControls({ filters, onChange }: { filters: DiaryFilters; onChange: (filters: DiaryFilters) => void }) {
    const lastYear = Math.min(DIARY_MAX_YEAR, Math.max(new Date().getFullYear(), filters.year ?? DIARY_MIN_YEAR));
    const years = Array.from({ length: lastYear - DIARY_MIN_YEAR + 1 }, (_, index) => lastYear - index);

    return (
        <div role="group" aria-label="Filtres du journal" className="flex flex-wrap gap-2">
            <FilterPopover label="Année" value={filters.year === null ? undefined : String(filters.year)} onClear={() => onChange({ year: null, month: null })}>
                {(close) => (
                    <OptionList
                        placeholder="Chercher une année"
                        emptyMessage="Aucune année."
                        options={years.map((year) => ({ value: year, label: String(year) }))}
                        selected={filters.year}
                        onSelect={(year) => {
                            onChange({ ...filters, year });
                            close();
                        }}
                    />
                )}
            </FilterPopover>
            {/* Le mois n'a de sens qu'avec une année, comme dans l'API. */}
            {filters.year !== null && (
                <FilterPopover
                    label="Mois"
                    value={MONTHS.find((month) => month.value === filters.month)?.label}
                    onClear={() => onChange({ ...filters, month: null })}
                >
                    {(close) => (
                        <OptionList
                            placeholder="Chercher un mois"
                            emptyMessage="Aucun mois."
                            options={MONTHS}
                            selected={filters.month}
                            onSelect={(month) => {
                                onChange({ ...filters, month });
                                close();
                            }}
                        />
                    )}
                </FilterPopover>
            )}
        </div>
    );
}
